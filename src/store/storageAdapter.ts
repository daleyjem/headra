import type { StateStorage } from "zustand/middleware";
import { browser } from "wxt/browser";
import { logger } from "@/util/logger";

export const storageAdapter: StateStorage = {
  getItem: async (name) => {
    const result = await browser.storage.local.get(name);
    const raw = result[name];

    if (raw == null) return null;
    if (typeof raw === "string") return raw;

    // Something (e.g. a DevTools storage editor) wrote a raw object instead
    // of a JSON string. Re-stringify so createJSONStorage's JSON.parse works.
    logger.log("[Headra] Storage value wasn't a string, re-serializing:", raw);
    return JSON.stringify(raw);
  },
  setItem: async (name, value) => {
    logger.log("Setting storage:", name, value);
    await browser.storage.local.set({ [name]: value });
  },
  removeItem: async (name) => {
    await browser.storage.local.remove(name);
  },
};
