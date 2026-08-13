import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import PlusIcon from "@/assets/icons/plus-icon.svg?react";
import { ProfilePatterns } from "./ProfilePatterns";
import { Headers } from "./Headers";
import { Intercepts } from "./Intercepts";
import { ButtonsContainer } from "../global/ButtonsContainer";
import { NoItems } from "../global/NoItems";
import "./headers.css";

export const RightPane = () => {
  const updateProfile = useAppStore((state) => state.updateProfile);
  const profiles = useAppStore((state) => state.profiles);
  const selectedProfileId = useAppStore((state) => state.selectedProfileId);

  const [isAddingHeader, setIsAddingHeader] = useState(false);
  const [isAddingIntercept, setIsAddingIntercept] = useState(false);

  const profile = (profiles ?? []).find((p) => p.id === selectedProfileId) ?? null;
  const headers = profile?.headers ?? [];
  const intercepts = profile?.intercepts ?? [];

  const onAddHeaderClick = () => {
    setIsAddingHeader(true);
  };

  const onAddInterceptClick = () => {
    setIsAddingIntercept(true);
  };

  const onHeaderDialogUpdate = (isAdding: boolean) => {
    setIsAddingHeader(isAdding);
  };

  const onInterceptDialogUpdate = (isAdding: boolean) => {
    setIsAddingIntercept(isAdding);
  };

  return (
    <div className="headers">
      {profile && (
        <ProfilePatterns key={profile.id} profile={profile} updateProfile={updateProfile} />
      )}
      <div className="scrollable">
        <Headers
          profile={profile}
          isAdding={isAddingHeader}
          onDialogUpdate={onHeaderDialogUpdate}
        />
        <Intercepts
          profile={profile}
          isAdding={isAddingIntercept}
          onDialogUpdate={onInterceptDialogUpdate}
        />
        {headers.length === 0 && intercepts.length === 0 && (
          <NoItems>
            {selectedProfileId !== undefined ? (
              <>
                Click the "Add +" buttons below
                <br />
                to add headers and intercepts for this profile.
              </>
            ) : (
              <>
                {!profiles || profiles.length === 0 ? (
                  <>
                    You need to add some
                    <br />
                    profiles first.
                  </>
                ) : (
                  <>Select a profile</>
                )}
              </>
            )}
          </NoItems>
        )}
      </div>
      <ButtonsContainer
        buttons={[
          {
            label: "Add Intercept",
            onClick: onAddInterceptClick,
            icon: PlusIcon,
            disabled: selectedProfileId === undefined,
          },
          {
            label: "Add Header",
            onClick: onAddHeaderClick,
            icon: PlusIcon,
            disabled: selectedProfileId === undefined,
          },
        ]}
      />
    </div>
  );
};
