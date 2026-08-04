import zod from "zod";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Header } from "@/types";
import { profilesSchema, type Profile } from "@/types";
import { presets } from "@/config/presets";
import { DEFAULT_URL_PATTERN, STORAGE_KEY } from "@/config/constants";
import { storageAdapter } from "./storageAdapter";

type Updater = (state: Partial<AppState>) => void;
type Getter = () => AppState;

type AppState = {
  /**
   * This will show up in the header bar as an alert.
   * if `recommendReinstall` is set to true, instruct to download raw storage string,
   * and re-install the extension.
   */
  errorAlert?: {
    message: string;
    recommendReinstall?: boolean;
  };
  /** True once storage has been read and the store is ready to use. */
  hasHydrated: boolean;
  profiles: Profile[];
  selectedProfileId?: Profile["id"];
  selectedHeaderId?: Header["id"];
  setSelectedProfile: (profile: Profile) => void;
  setSelectedHeader: (header: Header | null) => void;
  setErrorAlert: (errorAlert: AppState["errorAlert"]) => void;
  addProfile: () => void;
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
  const profiles = getState().profiles;
  const newId = profiles.length === 0 ? 0 : profiles[profiles.length - 1].id + 1;
  const newProfile: Profile = {
    id: newId,
    name: `Profile ${newId}`,
    headers: [],
    requestPattern: DEFAULT_URL_PATTERN,
    domains: "",
    enabled: true,
  };
  updateState({ profiles: [...profiles, newProfile], selectedProfileId: newId });
};

const updateProfile = (updateState: Updater, getState: Getter) => (updatedProfile: Profile) => {
  const profiles = getState().profiles;
  updateState({
    profiles: profiles.map((profile) =>
      profile.id === updatedProfile.id ? updatedProfile : profile,
    ),
  });
};

const removeProfile = (updateState: Updater, getState: Getter) => (profileId: number) => {
  const profiles = getState().profiles;
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
      errorAlert: {
        message:
          "Imported profiles don't match expected schema.<br/>Create a backup, and reinstall the extension.",
      },
    });
  }
};

const persistedStateSchema = zod.object({
  profiles: profilesSchema,
  selectedProfileId: zod.number().optional(),
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      profiles: [],

      setSelectedProfile: setSelectedProfile(set),
      setSelectedHeader: setSelectedHeader(set),
      setErrorAlert: setErrorAlert(set, get),
      addProfile: addProfile(set, get),
      updateProfile: updateProfile(set, get),
      removeProfile: removeProfile(set, get),
      resetProfiles: resetProfiles(set),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => storageAdapter),
      partialize: (state) => ({
        profiles: state.profiles,
        selectedProfileId: state.selectedProfileId,
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
          return { ...currentState, profiles: parsed.profiles, selectedProfileId };
        } catch {
          return {
            ...currentState,
            profiles: [],
            selectedProfileId: undefined,
            selectedHeaderId: undefined,
            errorAlert: {
              message: "Issue parsing storage data for extension.",
              recommendReinstall: true,
            },
          };
        }
      },
      onRehydrateStorage: () => () => {
        useAppStore.setState({ hasHydrated: true });
      },
    },
  ),
);
