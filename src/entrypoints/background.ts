import { browser } from "wxt/browser";
import type { PersistedStorage } from "@/types";
import { STORAGE_KEY, STORAGE_KEY_BACKUP } from "@/config/constants";
import { logger } from "@/util/logger";
import { presets } from "@/config/presets";
import { debouncedSyncAllRules, syncRules } from "./background/shared";

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    browser.storage.local.set<PersistedStorage>({ [STORAGE_KEY_BACKUP]: { profiles: presets } });
  });

  // Initial sync on cold start / browser restart
  browser.runtime.onStartup.addListener(() => {
    logger.log("runtime startup");
    syncRules();
  });

  browser.tabs.onActivated.addListener(() => {
    // Sync only the intercepts
    syncRules(false, true);
  });

  browser.tabs.onUpdated.addListener(() => {
    // Sync only the intercepts
    syncRules(false, true);
  });

  // keep rules in sync with whatever the UI writes to storage
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (!(STORAGE_KEY in changes)) return;

    logger.log("Storage changed:", changes, areaName);

    debouncedSyncAllRules();
  });
});
