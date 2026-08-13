import type { PersistStorage } from "zustand/middleware";
import { browser } from "wxt/browser";
import type { PersistedStorage, PersistedAppState } from "@/types";

let lastWritten: unknown;

export const storageAdapter: PersistStorage<PersistedAppState> = {
  getItem: async (name) => {
    const storage = await browser.storage.local.get<PersistedStorage>(name);
    let state = storage[name];

    // Migrate v0 string type storage
    if (typeof state === "string") {
      lastWritten = state;
      state = JSON.parse(state);
    } else {
      lastWritten = JSON.stringify(state);
    }

    if (state == null) return null;

    return { state };
  },

  setItem: async (name, value) => {
    const serialized = JSON.stringify(value);
    if (serialized === lastWritten) return;
    lastWritten = serialized;
    await browser.storage.local.set({ [name]: value.state });
  },

  removeItem: async (name) => {
    lastWritten = undefined;
    await browser.storage.local.remove(name);
  },
};
