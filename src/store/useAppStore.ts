import zod from "zod";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Header, PersistedAppState } from "@/types";
import { profilesSchema, type Profile } from "@/types";
import { presets } from "@/config/presets";
import { DEFAULT_URL_PATTERN, STORAGE_KEY } from "@/config/constants";
import { storageAdapter } from "./storageAdapter";
import { logger } from "@/util/logger";

type Updater = (state: Partial<AppState>) => void;
type Getter = () => AppState;

type AppState = PersistedAppState & {
  /** True once storage has been read and the store is ready to use. */
  hasHydrated: boolean;
  selectedHeaderId?: Header["id"];
  setSelectedProfile: (profile: Profile) => void;
  setSelectedHeader: (header: Header | null) => void;
  setErrorAlert: (errorAlert: AppState["errorAlert"]) => void;
  addProfile: () => void;
  duplicateProfile: (profileId: number) => void;
  removeProfile: (profileId: number) => void;
  updateProfile: (profile: Profile, updateSelected?: boolean) => void;
  resetProfiles: (profiles: Profile[]) => void;
};

const setErrorAlert =
  (updateState: Updater, _getState: Getter) => (errorAlert: AppState["errorAlert"]) => {
    updateState({ errorAlert });
  };

const setSelectedProfile = (updateState: Updater) => (profile: Profile) => {
  updateState({ selectedProfileId: profile.id });
};

const setSelectedHeader = (updateState: Updater) => (header: Header | null) => {
  updateState({ selectedHeaderId: header?.id });
};

const addProfile = (updateState: Updater, getState: Getter) => () => {
  const profiles = getState().profiles ?? [];
  const newId = profiles.length === 0 ? 0 : profiles[profiles.length - 1].id + 1;
  const newProfile: Profile = {
    id: newId,
    name: `Profile ${newId}`,
    headers: [],
    requestPattern: DEFAULT_URL_PATTERN,
    domains: "",
    enabled: true,
  };
  updateState({ profiles: [...profiles, newProfile], selectedProfileId: newId, errorAlert: "" });
};

const updateProfile = (updateState: Updater, getState: Getter) => (updatedProfile: Profile) => {
  const profiles = getState().profiles ?? [];
  updateState({
    profiles: profiles.map((profile) =>
      profile.id === updatedProfile.id ? updatedProfile : profile,
    ),
  });
};

const duplicateProfile = (updateState: Updater, getState: Getter) => (profileId: number) => {
  const profiles = getState().profiles ?? [];
  const profileToDuplicate = profiles.find((profile) => profile.id === profileId);
  if (!profileToDuplicate) return;

  const newId = profiles.length === 0 ? 0 : profiles[profiles.length - 1].id + 1;
  const duplicatedProfile: Profile = {
    ...profileToDuplicate,
    enabled: false,
    id: newId,
    name: `${profileToDuplicate.name} (Copy)`,
  };
  updateState({ profiles: [...profiles, duplicatedProfile], selectedProfileId: newId });
};

const removeProfile = (updateState: Updater, getState: Getter) => (profileId: number) => {
  const profiles = getState().profiles ?? [];
  const removeIndex = profiles.findIndex((profile) => profile.id === profileId);
  const newProfiles = profiles.filter((profile) => profile.id !== profileId);
  const newIndex = removeIndex === 0 ? 0 : removeIndex;
  const nextIndex = newIndex === newProfiles.length ? newIndex - 1 : newIndex;

  updateState({
    profiles: newProfiles,
    selectedProfileId: newProfiles.length > 0 ? newProfiles[nextIndex].id : undefined,
  });
};

const resetProfiles = (updateState: Updater) => (profiles: Profile[]) => {
  try {
    const parsed = profilesSchema.parse(profiles);
    updateState({ profiles: parsed, selectedProfileId: profiles[0]?.id });
  } catch {
    updateState({
      errorAlert: "Imported profiles don't match expected schema.",
    });
  }
};

const persistedStateSchema = zod.object({
  profiles: profilesSchema,
  selectedProfileId: zod.number().optional(),
  errorAlert: zod.string().optional(),
  badState: zod.unknown().optional(),
}) satisfies zod.ZodType<PersistedAppState>;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      profiles: [],

      setSelectedProfile: setSelectedProfile(set),
      setSelectedHeader: setSelectedHeader(set),
      setErrorAlert: setErrorAlert(set, get),
      addProfile: addProfile(set, get),
      duplicateProfile: duplicateProfile(set, get),
      updateProfile: updateProfile(set, get),
      removeProfile: removeProfile(set, get),
      resetProfiles: resetProfiles(set),
    }),
    {
      name: STORAGE_KEY,
      storage: storageAdapter,
      version: 1,
      migrate: (persistedState, version) => {
        if (version < 1) {
          logger.log("[Headra] Migrating persisted state from version", version);
        }
        return persistedState as PersistedAppState;
      },
      partialize: (state) => ({
        profiles: state.profiles,
        selectedProfileId: state.selectedProfileId,
        errorAlert: state.errorAlert,
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
            errorAlert: parsed.errorAlert,
          };
        } catch {
          return {
            ...currentState,
            selectedProfileId: undefined,
            selectedHeaderId: undefined,
            errorAlert: "Issue parsing stored data. Download profiles now, and report the issue.",
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
            errorAlert: "Issue parsing stored data. Download profiles now, and report the issue.",
            badState: state,
          });
        }
      },
    },
  ),
);
