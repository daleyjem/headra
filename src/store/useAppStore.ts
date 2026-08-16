import zod from "zod";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Header, Intercept, PersistedAppState } from "@/types";
import { persistedStateSchema, type Profile } from "@/types";
import { presets } from "@/config/presets";
import { GlobalErrors, STORAGE_KEY } from "@/config/constants";
import { logger } from "@/util/logger";
import {
  addProfile,
  duplicateProfile,
  removeProfile,
  resetProfiles,
  setSelectedHeader,
  setSelectedIntercept,
  setSelectedProfile,
  updateProfile,
} from "./profiles";
import { storageAdapter } from "./storageAdapter";
import { setToastMessage } from "./messaging";

export type StateSetter = (state: Partial<AppState>) => void;
export type StateGetter = () => AppState;

type AppState = PersistedAppState & {
  /** True once storage has been read and the store is ready to use. */
  hasHydrated: boolean;
  selectedHeaderId?: Header["id"];
  selectedInterceptId?: Intercept["id"];
  toastMessage?: string;

  setSelectedProfile: (profile: Profile) => void;
  setSelectedHeader: (header: Header | null) => void;
  setSelectedIntercept: (intercept: Intercept | null) => void;
  addProfile: () => void;
  duplicateProfile: (profileId: number) => void;
  removeProfile: (profileId: number) => void;
  updateProfile: (profile: Profile, updateSelected?: boolean) => void;
  resetProfiles: (profiles: Profile[]) => boolean;
  setToastMessage: (message: string) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      profiles: [],
      toastMessage: "",

      setSelectedProfile: setSelectedProfile(set),
      setSelectedHeader: setSelectedHeader(set),
      setSelectedIntercept: setSelectedIntercept(set),
      addProfile: addProfile(set, get),
      duplicateProfile: duplicateProfile(set, get),
      updateProfile: updateProfile(set, get),
      removeProfile: removeProfile(set, get),
      resetProfiles: resetProfiles(set),
      setToastMessage: setToastMessage(set),
    }),
    {
      name: STORAGE_KEY,
      storage: storageAdapter,
      version: 2,
      migrate: (persistedState, version) => {
        if (version < 1) {
          logger.log("[Headra] Migrating persisted state from version", version);
        }
        return persistedState as PersistedAppState;
      },
      partialize: (state) => ({
        profiles: state.profiles,
        selectedProfileId: state.selectedProfileId,
        badState: state.badState,
      }),
      merge: (persistedState, currentState) => {
        // Nothing in storage yet — genuinely first run, seed presets.
        if (persistedState == null) {
          return { ...currentState, profiles: presets, selectedProfileId: presets[0]?.id };
        }
        try {
          const parsed = zod.parse(persistedStateSchema, persistedState);
          const selectedProfileId = parsed.profiles.some((p) => p.id === parsed.selectedProfileId)
            ? parsed.selectedProfileId
            : parsed.profiles[0]?.id;
          return {
            ...currentState,
            profiles: parsed.profiles,
            selectedProfileId,
            badState: parsed.badState,
          };
        } catch {
          return {
            ...currentState,
            selectedProfileId: undefined,
            selectedHeaderId: undefined,
            toastMessage: GlobalErrors.parseHydrate,
            badState: persistedState,
          };
        }
      },
      onRehydrateStorage: () => (state, error) => {
        if (!error) {
          useAppStore.setState({
            hasHydrated: true,
          });
        } else {
          useAppStore.setState({
            profiles: [],
            hasHydrated: true,
            toastMessage: GlobalErrors.parseHydrate,
            badState: state,
          });
        }
      },
    },
  ),
);
