import { browser } from "wxt/browser";
import { type Header, type Profile, type RuntimeMessage } from "@/types";
import { STORAGE_KEY } from "@/config/constants";

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

const setFailure = (reason: string) => {
  let failure = reason ? DEFAULT_ERROR_MESSAGE : "";

  if (reason.includes(`incorrect value for the "regexFilter" key`)) {
    failure = `Bad regex request pattern.`;
  }
  if (reason.includes(`cannot have an empty value`)) {
    failure = `Request pattern cannot have an empty value.`;
  }
  if (reason.includes(`Only standard HTTP request headers that can specify multiple values`)) {
    failure = `Can't "append" headers that don't support multiple entries.`;
  }

  browser.runtime.sendMessage<RuntimeMessage>({ type: "setError", failure }).catch((err) => {
    // The popup probably isn't listening yet. Log otherwise.
    if (!String(err).includes("Receiving end does not exist")) {
      console.log("[Headra] sendMessage error:", err);
    }
  });

  if (failure === DEFAULT_ERROR_MESSAGE) {
    console.error("[Headra] Sync error:", reason);
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

// TODO: adjust to match how profiles are actually persisted in storage —
// this assumes a single `profiles` key holding Profile[]
const getProfilesFromStorage = async (): Promise<Profile[]> => {
  const result = await browser.storage.local.get(STORAGE_KEY);
  const raw = result[STORAGE_KEY];
  if (typeof raw !== "string") return [];

  try {
    const parsed = JSON.parse(raw);
    return parsed?.state?.profiles ?? [];
  } catch (err) {
    console.error("[Headra] Failed to parse persisted state:", err);
    return [];
  }
};

const syncAllRules = async () => {
  console.log("[Headra] Syncing DNR rules...");
  try {
    const profiles = await getProfilesFromStorage();
    console.log(`[Headra] Found:`, profiles);

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

    console.log(`[Headra] Syncing...`, newRules);

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
    console.error("[Headra] Failed to sync DNR rules:", err);
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
  /**
   * Listen for app events
   */
  browser.runtime.onMessage.addListener((message: RuntimeMessage, sender) => {
    if (sender.url?.endsWith("popup.html")) {
      /**
       * We do this so that the UI can show an error message if a rule is invalid.
       * @todo Maybe if we store the error message in persisted state, we don't have to.
       */
      if (message.type == "appEvent" && message.event === "init") {
        syncAllRules();
      }
    }
  });

  // initial sync on cold start / browser restart
  browser.runtime.onStartup.addListener(() => {
    syncAllRules();
  });

  // initial sync on install/update — also useful as a hook if you ever
  // need to migrate/clear rules from an old ID scheme on update
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === "update") {
      // e.g. clear all dynamic rules here first if you ever change
      // MAX_HEADERS_PER_PROFILE or the packing scheme
    }
    syncAllRules();
  });

  // keep rules in sync with whatever the UI writes to storage
  browser.storage.onChanged.addListener((changes, areaName) => {
    console.log("[Headra] Storage changed:", changes, areaName);
    if (areaName !== "local") return;
    if (!(STORAGE_KEY in changes)) return;
    debouncedSyncAllRules();
  });
});
