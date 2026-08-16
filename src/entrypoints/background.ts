import { browser } from "wxt/browser";
import { isRuntimeMessage, type PersistedStorage } from "@/types";
import { STORAGE_KEY, STORAGE_KEY_BACKUP } from "@/config/constants";
import { logger } from "@/util/logger";
import { presets } from "@/config/presets";
import { debouncedSyncAllRules, sendFailure, syncRules } from "./background/shared";

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(async () => {
    logger.log("Extension installed");
    await browser.storage.local.set<PersistedStorage>({
      [STORAGE_KEY_BACKUP]: { profiles: presets },
    });
    // Do this mainly for local dev reload
    await syncRules();
  });

  // Initial sync on cold start / browser restart
  browser.runtime.onStartup.addListener(async () => {
    logger.log("runtime startup");
    await syncRules();
  });

  // If the user is switching tabs, we need to resync intercepts.
  browser.tabs.onActivated.addListener(async (info) => {
    logger.log("Tab activated", info);
    // Sync only the intercepts
    await syncRules(false, true);
  });

  // Resync intercepts only on page load/reload,
  // and not already debuggin.
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === "loading") {
      logger.log("Tab loading:", tabId);
      const targets = await browser.debugger.getTargets();
      if (!targets.some((target) => target.tabId === tabId && target.attached)) {
        // Sync only the intercepts
        await syncRules(false, true);
      } else {
        logger.log("Debugger already attached");
      }
    }
  });

  // keep rules in sync with whatever the UI writes to storage
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (!(STORAGE_KEY in changes)) return;

    logger.log("Storage changed:", changes, areaName);

    debouncedSyncAllRules();
  });

  // Listen for messages from the popup
  browser.runtime.onMessage.addListener(async (message) => {
    if (isRuntimeMessage(message) && message.type === "appEvent" && message.event === "init") {
      await sendFailure();
    }
  });
});
