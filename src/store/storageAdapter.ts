// storageAdapter.ts
import type { StateStorage } from "zustand/middleware";
import { browser } from "wxt/browser";

export const storageAdapter: StateStorage = {
  getItem: async (name) => {
    const result = await browser.storage.local.get(name);
    return (result[name] as string) ?? null;
  },
  setItem: async (name, value) => {
    await browser.storage.local.set({ [name]: value });
  },
  removeItem: async (name) => {
    await browser.storage.local.remove(name);
  },
};
