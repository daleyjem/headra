import type { BackgroundFetchParams } from "@/types";
import { type BackgroundIntercept } from "@/types";
import { logger } from "@/util/logger";
import { DEBUGGER_VERSION } from "@/config/constants";
import { setFailure } from "./shared";
import { encodeBody, getDomainsArray, matchesDomainPattern, matchesPattern } from "./utils";

let currentTabId: number | null = null;
let currentIntercepts: BackgroundIntercept[] = [];

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

  const { request, requestId, body, responseStatusCode, responseHeaders } =
    params as BackgroundFetchParams;

  const stageType: BackgroundIntercept["target"] =
    responseStatusCode !== undefined ? "response" : "request";

  const matchingIntercepts = currentIntercepts.filter(
    (intercept) =>
      request &&
      matchesPattern(intercept.requestPattern, request.url, intercept.requestRegex ?? false) &&
      (intercept.target !== "request" || request.method === (intercept.method ?? request.method)) &&
      intercept.target === stageType,
  );

  if (matchingIntercepts.length > 1) {
    logger.log("Detected multiple intercepts");
    await setFailure(
      `Multiple intercepts detected for the same ${stageType}. The first will be used.`,
    );
  }

  const matchingIntercept = matchingIntercepts?.[0];

  if (matchingIntercept) {
    logger.log(`Matching ${stageType} intercept on:`, request?.url);

    try {
      if (stageType === "request") {
        await browser.debugger.sendCommand(source, "Fetch.continueRequest", {
          requestId,
          postData: encodeBody(matchingIntercept.body),
        });
      } else {
        await browser.debugger.sendCommand(source, "Fetch.fulfillRequest", {
          requestId,
          responseCode: matchingIntercept.status ?? responseStatusCode ?? 200,
          responseHeaders: responseHeaders,
          body: encodeBody(matchingIntercept.body ?? body ?? ""),
        });
      }
      return;
    } catch {
      // We'll take care of this in the non-matching
      logger.error(`Intercept for ${stageType} failed on:`, request?.url);
    }
  }

  // Not matching or failed intercept... let it through
  await browser.debugger.sendCommand(
    source,
    stageType === "response" ? "Fetch.continueResponse" : "Fetch.continueRequest",
    {
      requestId,
    },
  );
};

const handleDetach = async () => {
  await setFailure("The debugger was detached. Disable intercepts or refresh.");
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

const attachIntercepts = async (tabId: number) => {
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
    throw new Error(
      "For your security, profiles with intercepts must specify at least one domain.",
    );
  }

  if (import.meta.env.FIREFOX && intercepts.length > 0) {
    throw new Error("Intercepts are not currently supported for Firefox.");
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
    attachIntercepts(currentTabId);
  }
};
