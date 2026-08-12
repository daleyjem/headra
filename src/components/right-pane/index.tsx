import { useState } from "react";
import type { Header } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import PlusIcon from "@/assets/icons/plus-icon.svg?react";
import { HeaderItem } from "./HeaderItem";
import { ProfilePatterns } from "./ProfilePatterns";
import { ButtonsContainer } from "../global/ButtonsContainer";
import { NoItems } from "../global/NoItems";
import { AddEditHeaderDialog } from "./AddEditHeaderDialog";
import "./headers.css";

export const RightPane = () => {
  const updateProfile = useAppStore((state) => state.updateProfile);
  const profiles = useAppStore((state) => state.profiles);
  const selectedProfileId = useAppStore((state) => state.selectedProfileId);

  const [isAddingHeader, setIsAddingHeader] = useState(false);

  const profile = (profiles ?? []).find((p) => p.id === selectedProfileId) ?? null;
  const headers = profile?.headers ?? [];

  const onHeaderItemChange = (changedHeader: Header) => {
    if (profile) {
      updateProfile({
        ...profile,
        headers: headers.map((header) => (header.id === changedHeader.id ? changedHeader : header)),
      });
    }
  };

  const onHeaderItemRemove = (removedHeader: Header) => {
    if (profile) {
      updateProfile({
        ...profile,
        headers: headers.filter((header) => header.id !== removedHeader.id),
      });
    }
  };

  const onHeaderItemAdd = (newHeader: Header) => {
    setIsAddingHeader(false);
    if (profile) {
      let newId = 0;
      // Get the greatest existing header ID and increment it for the new header
      if (headers.length > 0) {
        newId = Math.max(...headers.map((header) => header.id)) + 1;
      }
      updateProfile({
        ...profile,
        headers: [...headers, { ...newHeader, id: newId }],
      });
    }
  };

  const onAddHeaderClick = () => {
    setIsAddingHeader(true);
  };

  const onAddInterceptClick = () => {
    setIsAddingHeader(true);
  };

  const onAddHeaderDialogCancel = () => {
    setIsAddingHeader(false);
  };

  return (
    <div className="headers">
      {profile && (
        <ProfilePatterns key={profile.id} profile={profile} updateProfile={updateProfile} />
      )}
      <h2>Headers</h2>
      <div className="headers-container">
        {headers.length === 0 ? (
          <NoItems>
            {selectedProfileId !== undefined ? (
              <>
                Click the "Add Header +" button below
                <br />
                to add headers for this profile.
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
        ) : (
          <div className="header-items">
            {headers.map((header, index) => (
              <HeaderItem
                onItemChange={onHeaderItemChange}
                onItemRemove={onHeaderItemRemove}
                onItemDuplicated={onHeaderItemAdd}
                key={index}
                header={header}
              />
            ))}
          </div>
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
      <AddEditHeaderDialog
        open={isAddingHeader}
        dialogType="add"
        onCancel={onAddHeaderDialogCancel}
        onSave={onHeaderItemAdd}
        header={{
          enabled: true,
          id: -1,
          modType: "set",
          target: "request",
          name: "",
          value: "",
        }}
      />
    </div>
  );
};
