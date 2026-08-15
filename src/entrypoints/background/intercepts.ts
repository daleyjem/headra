import type { BackgroundFetchParams } from "@/types";
import { type BackgroundIntercept } from "@/types";
import { logger } from "@/util/logger";
import { DEBUGGER_VERSION, RequestMethods } from "@/config/constants";
import { setFailure } from "./shared";
import { getDomainsArray, matchesDomainPattern, matchesPattern } from "./utils";

let currentTabId: number | null = null;
let currentIntercepts: BackgroundIntercept[] = [];
let currentError = "";

const getCurrentTab = async () => {
  const tabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (tabs.length === 0) return;

  return tabs[0];
};

const handleFetchEvent = async (
  source: Browser.debugger.DebuggerSession,
  method: string,
  params?: object,
) => {
  if (method !== "Fetch.requestPaused") return;

  const { requestId, responseStatusCode, request } = params as BackgroundFetchParams;

  const isResponseStage = responseStatusCode !== undefined;

  const matchingIntercepts = currentIntercepts.filter(
    (intercept) =>
      request &&
      matchesPattern(intercept.requestPattern, request.url, intercept.requestRegex ?? false) &&
      request.method === (intercept.method ?? RequestMethods.GET),
  );

  logger.log(matchingIntercepts, params);

  try {
    if (isResponseStage) {
      // await handleResponseStage(source, requestId, params);
    } else {
      // await handleRequestStage(source, requestId, params);
    }
    await browser.debugger
      .sendCommand(source, isResponseStage ? "Fetch.continueResponse" : "Fetch.continueRequest", {
        requestId,
      })
      .catch((err) => logger.error("Fallback continue also failed", err));
  } catch (error) {
    logger.error("Failed to handle paused request, falling back to continue", error);
    await browser.debugger
      .sendCommand(source, isResponseStage ? "Fetch.continueResponse" : "Fetch.continueRequest", {
        requestId,
      })
      .catch((err) => logger.error("Fallback continue also failed", err));
  }
};

const handleDetach = async () => {
  currentError = "The debugger was detached. Disable intercepts or refresh.";
  await setFailure(currentError);
};

const attachListeners = () => {
  // Chromium browsers
  if (!import.meta.env.FIREFOX) {
    browser.debugger.onDetach.addListener(handleDetach);
    browser.debugger.onEvent.addListener(handleFetchEvent);
  }
};

const detachListeners = () => {
  // Chromium browsers
  if (!import.meta.env.FIREFOX) {
    browser.debugger.onDetach.removeListener(handleDetach);
    browser.debugger.onEvent.removeListener(handleFetchEvent);
  }
};

const attachIntercepts = async (tabId: number, intercepts: BackgroundIntercept[]) => {
  // Chromium browsers
  if (!import.meta.env.FIREFOX) {
    logger.log("Attach debugger to", tabId);
    await browser.debugger.attach({ tabId }, DEBUGGER_VERSION);
    await browser.debugger.sendCommand({ tabId }, "Fetch.enable", {
      patterns: [
        { urlPattern: "*", requestStage: "Request" },
        { urlPattern: "*", requestStage: "Response" },
      ],
    });
  }
};

const detachIntercepts = async () => {
  // Chromium browsers
  if (!import.meta.env.FIREFOX && currentTabId) {
    logger.log("Detach debugger from ", currentTabId);
    await browser.debugger.detach({ tabId: currentTabId }).catch((error) => {
      // It's just not there anymore
      logger.error("Tab could not detach", error);
    });
    logger.log("Detached");
  }
};

export const syncIntercepts = async (intercepts: BackgroundIntercept[]) => {
  // Specify that a domain must be attached if none are
  if (intercepts.find((intercept) => !intercept.domains)) {
    throw new Error("Profiles with intercepts must specify at least one domain.");
  }

  if (currentError) {
    const error = new Error(currentError);
    currentError = "";
    throw error;
  }

  detachIntercepts();
  detachListeners();

  const currentTab = await getCurrentTab();

  if (!currentTab || !currentTab.id) return;

  currentTabId = currentTab.id;

  const domainIntercepts = intercepts.filter((intercept) =>
    getDomainsArray(intercept.domains).some(
      (domain) => currentTab.url && matchesDomainPattern(domain, currentTab.url),
    ),
  );

  // If we have some listeners, and are on a configured domain
  if (domainIntercepts.length > 0) {
    currentIntercepts = domainIntercepts;
    attachListeners();
    attachIntercepts(currentTabId, domainIntercepts);
  }
};
