import { browser } from "wxt/browser";
import type { PersistedStorage } from "@/types";
import { type Header, type Profile, type RuntimeMessage } from "@/types";
import { STORAGE_KEY } from "@/config/constants";
import { logger } from "@/util/logger";
import { determineError } from "@/util/determineError";

const MAX_HEADERS_PER_PROFILE = 10_000;
const DEFAULT_ERROR_MESSAGE = "Something went wrong";

const ALL_RESOURCE_TYPES: Browser.declarativeNetRequest.ResourceType[] = [
  browser.declarativeNetRequest.ResourceType.MAIN_FRAME,
  browser.declarativeNetRequest.ResourceType.SUB_FRAME,
  browser.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
  browser.declarativeNetRequest.ResourceType.SCRIPT,
  browser.declarativeNetRequest.ResourceType.STYLESHEET,
  browser.declarativeNetRequest.ResourceType.IMAGE,
  browser.declarativeNetRequest.ResourceType.FONT,
  browser.declarativeNetRequest.ResourceType.OBJECT,
  browser.declarativeNetRequest.ResourceType.OTHER,
];

let currFailure = "";

const setFailure = async (reason: string) => {
  let failure = reason ? DEFAULT_ERROR_MESSAGE : "";

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

    browser.runtime.sendMessage<RuntimeMessage>({ type: "setError", failure }).catch((err) => {
      // The popup probably isn't listening yet. Log otherwise.
      if (!String(err).includes("Receiving end does not exist")) {
        logger.error("sendMessage error:", err);
      }
    });
  }

  if (failure === DEFAULT_ERROR_MESSAGE) {
    logger.error("Sync error:", reason);
  }
};

const toRuleId = (profileId: number, headerId: number): number =>
  (profileId + 1) * MAX_HEADERS_PER_PROFILE + headerId;

const headerToRule = (profile: Profile, header: Header): Browser.declarativeNetRequest.Rule => {
  const domains = profile.domains
    ? profile.domains.split(",").map((domain) => domain.trim())
    : undefined;
  const headerEntry: Browser.declarativeNetRequest.ModifyHeaderInfo = {
    header: header.name,
    operation: header.modType,
    ...(header.modType !== "remove" && { value: header.value }),
  };

  return {
    id: toRuleId(profile.id, header.id),
    priority: 1,
    action: {
      type: "modifyHeaders",
      ...(header.target === "request"
        ? { requestHeaders: [headerEntry] }
        : { responseHeaders: [headerEntry] }),
    },
    condition: {
      [profile.requestRegex ? "regexFilter" : "urlFilter"]: profile.requestPattern,
      ...(domains && { requestDomains: domains }),
      resourceTypes: ALL_RESOURCE_TYPES,
    },
  };
};

const getProfilesFromStorage = async (): Promise<Profile[] | undefined> => {
  const storage = await browser.storage.local.get<PersistedStorage>(STORAGE_KEY);
  return (storage[STORAGE_KEY]?.profiles as Profile[]) ?? [];
};

const syncAllRules = async () => {
  try {
    const profiles = await getProfilesFromStorage();
    if (!profiles) {
      return;
    }

    const currentRuleIds = (await browser.declarativeNetRequest.getDynamicRules()).map(
      (rule) => rule.id,
    );

    const newRules = profiles
      .filter((profile) => profile.enabled)
      .flatMap((profile) =>
        profile.headers
          .filter((header) => header.enabled)
          .map((header) => headerToRule(profile, header)),
      );

    logger.log(`Syncing DNR rules...`, newRules);

    let hasError = false;

    await browser.declarativeNetRequest
      .updateDynamicRules({
        removeRuleIds: currentRuleIds,
        addRules: newRules,
      })
      .then(() => {
        setFailure("");
      })
      .catch((reason) => {
        hasError = true;
        setFailure(String(reason));
      });

    if (newRules.length > 0 && !hasError) {
      await browser.action.setIcon({
        path: {
          16: "icon/16.png",
          32: "icon/32.png",
          48: "icon/48.png",
          96: "icon/96.png",
          128: "icon/128.png",
        },
      });
    } else if (newRules.length > 0 && hasError) {
      await browser.action.setIcon({
        path: {
          16: "icon/16-warning.png",
          32: "icon/32-warning.png",
          48: "icon/48-warning.png",
          96: "icon/96-warning.png",
          128: "icon/128-warning.png",
        },
      });
    } else {
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

// simple debounce so rapid storage writes (e.g. mid-typing saves) don't
// each trigger their own full rule rebuild
const debounce = <T extends (...args: never[]) => void>(fn: T, delayMs: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
};

const debouncedSyncAllRules = debounce(syncAllRules, 300);

export default defineBackground(() => {
  // initial sync on cold start / browser restart
  browser.runtime.onStartup.addListener(() => {
    logger.log("runtime startup");
    syncAllRules();
  });

  // keep rules in sync with whatever the UI writes to storage
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (!(STORAGE_KEY in changes)) return;

    logger.log("Storage changed:", changes, areaName);

    debouncedSyncAllRules();
  });
});
