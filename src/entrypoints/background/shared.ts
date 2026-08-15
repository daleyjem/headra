import { STORAGE_KEY } from "@/config/constants";
import type { BackgroundIntercept, PersistedStorage, Profile, RuntimeMessage } from "@/types";
import { logger } from "@/util/logger";
import { headerToRule } from "./headers";
import { determineError, ensureError } from "@/util/errors";
import { syncIntercepts } from "./intercepts";

const DEFAULT_ERROR_MESSAGE = "Something went wrong";

let currFailure = "";

export const setFailure = async (value: unknown, updateIcon = true) => {
  const reason = ensureError(value).message;
  let failure = reason;

  if (determineError(reason) === "badRegex") {
    failure = `Bad regex request pattern.`;
  }
  if (determineError(reason) === "emptyValue") {
    failure = `Request pattern cannot have an empty value.`;
  }
  if (determineError(reason) === "noMultiple") {
    failure = `Can't "append" headers that don't support multiple entries.`;
  }

  if (failure !== currFailure) {
    currFailure = failure;
    const storage = await browser.storage.local.get<PersistedStorage>(STORAGE_KEY);

    storage[STORAGE_KEY].errorAlert = failure;
    logger.log("Background.js setting storage to", storage);
    browser.storage.local.set<PersistedStorage>({ [STORAGE_KEY]: storage[STORAGE_KEY] });

    await browser.runtime
      .sendMessage<RuntimeMessage>({ type: "setError", failure })
      .catch((err) => {
        // The popup probably isn't listening yet. Log otherwise.
        if (!String(err).includes("Receiving end does not exist")) {
          logger.error("sendMessage error:", err);
        }
      });
  }

  if (failure === "" && updateIcon) {
    await browser.action.setIcon({
      path: {
        16: "icon/16.png",
        32: "icon/32.png",
        48: "icon/48.png",
        96: "icon/96.png",
        128: "icon/128.png",
      },
    });
  } else if (updateIcon) {
    await browser.action.setIcon({
      path: {
        16: "icon/16-warning.png",
        32: "icon/32-warning.png",
        48: "icon/48-warning.png",
        96: "icon/96-warning.png",
        128: "icon/128-warning.png",
      },
    });
  }

  if (failure === DEFAULT_ERROR_MESSAGE) {
    logger.error("Sync error:", reason);
  }
};

const debounce = <T extends (...args: never[]) => void>(fn: T, delayMs: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
};

const getProfilesFromStorage = async (): Promise<Profile[] | undefined> => {
  const storage = await browser.storage.local.get<PersistedStorage>(STORAGE_KEY);
  return (storage[STORAGE_KEY]?.profiles as Profile[]) ?? [];
};

export const syncRules = async (includeHeaders = true, includeIntercepts = true) => {
  try {
    const profiles = await getProfilesFromStorage();
    if (!profiles) {
      return;
    }

    const currentRuleIds = (await browser.declarativeNetRequest.getDynamicRules()).map(
      (rule) => rule.id,
    );

    let newHeaderRules: Browser.declarativeNetRequest.Rule[] = [];
    let newInterceptRules: BackgroundIntercept[] = [];

    profiles
      .filter((profile) => profile.enabled)
      .forEach((profile) => {
        newHeaderRules.push(
          ...profile.headers
            .filter((header) => header.enabled)
            .map((header) => headerToRule(profile, header)),
        );
        newInterceptRules.push(
          ...(profile.intercepts ?? [])
            .filter((intercept) => intercept.enabled)
            .map((intercept) => ({
              ...intercept,
              domains: profile.domains,
              requestPattern: profile.requestPattern,
              requestRegex: profile.requestRegex,
            })),
        );
      });

    logger.log(`Syncing rules...`, newHeaderRules, newInterceptRules);

    let error = false;

    await Promise.all([
      includeHeaders
        ? browser.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: currentRuleIds,
            addRules: newHeaderRules,
          })
        : Promise.resolve(),
      includeIntercepts ? syncIntercepts(newInterceptRules) : Promise.resolve(),
    ]).catch((reason) => {
      error = reason;
    });

    if ((newHeaderRules.length > 0 || newInterceptRules.length > 0) && !error) {
      await setFailure("");
    } else if ((newHeaderRules.length > 0 || newInterceptRules.length > 0) && error) {
      await setFailure(error);
    } else {
      await setFailure("", false);
      await browser.action.setIcon({
        path: {
          16: "icon/16-inactive.png",
          32: "icon/32-inactive.png",
          48: "icon/48-inactive.png",
          96: "icon/96-inactive.png",
          128: "icon/128-inactive.png",
        },
      });
    }
  } catch (err) {
    logger.error("Failed to sync DNR rules:", err);
  }
};

export const debouncedSyncAllRules = debounce(syncRules, 300);
