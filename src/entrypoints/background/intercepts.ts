import { parse } from "tldts";
import type { BackgroundIntercept } from "@/types";
import { getDomainsArray } from "./utils";
import { logger } from "@/util/logger";
import { DEBUGGER_VERSION } from "@/config/constants";
import { setFailure } from "./shared";

let currentTabId: number | null = null;
let currentError = "";

const getCurrentTab = async () => {
  const tabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (tabs.length === 0) return;

  return tabs[0];
};

const matchesDomainPattern = (pattern: string, url: string): boolean => {
  const currentHostname = new URL(url).hostname;
  const patternInfo = parse(pattern);
  const currentInfo = parse(currentHostname);

  // Malformed pattern or hostname (no recognizable public suffix) — bail safely
  if (!patternInfo.domain || !currentInfo.domain) return false;

  const patternIsRootDomain = pattern === patternInfo.domain;

  if (patternIsRootDomain) {
    // User specified just the TLD+domain, e.g. "example.com"
    // Match the root domain itself AND any subdomain of it.
    return currentInfo.domain === patternInfo.domain;
  }

  // User specified a full subdomain, e.g. "api.example.com"
  // Exact hostname match only.
  return currentHostname === pattern;
};

const handleDetach = async () => {
  currentError = "The debugger was detached. Disable intercepts or refresh.";
  await setFailure(currentError);
};

const attachListeners = () => {
  // Chromium browsers
  if (!import.meta.env.FIREFOX) {
    browser.debugger.onDetach.addListener(handleDetach);
  }
};

const detachListeners = () => {
  // Chromium browsers
  if (!import.meta.env.FIREFOX) {
    browser.debugger.onDetach.removeListener(handleDetach);
  }
};

const attachIntercepts = async (tabId: number) => {
  // Chromium browsers
  if (!import.meta.env.FIREFOX) {
    logger.log("Attach debugger to", tabId);
    await browser.debugger.attach({ tabId }, DEBUGGER_VERSION);
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

  const isActiveDomain = intercepts.some((intercept) =>
    getDomainsArray(intercept.domains).some(
      (domain) => currentTab.url && matchesDomainPattern(domain, currentTab.url),
    ),
  );

  // If we have some listeners, and are on a configured domain
  if (intercepts.length > 0 && isActiveDomain) {
    attachListeners();
    attachIntercepts(currentTabId);
  }
};
