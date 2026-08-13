import type { Header, Intercept, Profile } from "@/types";
import { profilesSchema } from "@/types";
import { DEFAULT_URL_PATTERN } from "@/config/constants";
import type { StateGetter, StateSetter } from "./useAppStore";

export const setSelectedProfile = (updateState: StateSetter) => (profile: Profile) => {
  updateState({ selectedProfileId: profile.id });
};

export const setSelectedHeader = (updateState: StateSetter) => (header: Header | null) => {
  updateState({ selectedHeaderId: header?.id });
};

export const setSelectedIntercept = (updateState: StateSetter) => (intercept: Intercept | null) => {
  updateState({ selectedInterceptId: intercept?.id });
};

export const addProfile = (updateState: StateSetter, getState: StateGetter) => () => {
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

export const updateProfile =
  (updateState: StateSetter, getState: StateGetter) => (updatedProfile: Profile) => {
    const profiles = getState().profiles ?? [];
    updateState({
      profiles: profiles.map((profile) =>
        profile.id === updatedProfile.id ? updatedProfile : profile,
      ),
    });
  };

export const duplicateProfile =
  (updateState: StateSetter, getState: StateGetter) => (profileId: number) => {
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

export const removeProfile =
  (updateState: StateSetter, getState: StateGetter) => (profileId: number) => {
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

export const resetProfiles =
  (updateState: StateSetter) =>
  (profiles: Profile[]): boolean => {
    try {
      const parsed = profilesSchema.parse(profiles);
      updateState({
        profiles: parsed,
        selectedProfileId: profiles[0]?.id,
        errorAlert: "",
        badState: undefined,
      });
      return true;
    } catch {
      return false;
    }
  };
