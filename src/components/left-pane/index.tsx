import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { ButtonsContainer } from "../global/ButtonsContainer";
import { NoItems } from "../global/NoItems";
import { ProfileItem } from "./ProfileItem";
import TrashcanIcon from "@/assets/icons/trashcan-icon.svg?react";
import DuplicateIcon from "@/assets/icons/duplicate-icon.svg?react";
import PlusIcon from "@/assets/icons/plus-icon.svg?react";
import "./profiles.css";

export const LeftPane = () => {
  const profiles = useAppStore((state) => state.profiles);
  const addProfile = useAppStore((state) => state.addProfile);
  const duplicateProfile = useAppStore((state) => state.duplicateProfile);
  const removeProfile = useAppStore((state) => state.removeProfile);
  const selectedProfileId = useAppStore((state) => state.selectedProfileId);

  const containerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(profiles?.length ?? 0);

  useEffect(() => {
    if ((profiles?.length ?? 0) > prevCountRef.current) {
      containerRef.current?.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
    prevCountRef.current = profiles?.length ?? 0;
  }, [profiles?.length]);

  const handleAdd = () => {
    addProfile();
  };

  const handleRemove = () => {
    if (selectedProfileId !== undefined) {
      removeProfile(selectedProfileId);
    }
  };

  const handleDuplicate = () => {
    if (selectedProfileId !== undefined) {
      const profileToDuplicate = (profiles ?? []).find(
        (profile) => profile.id === selectedProfileId,
      );
      if (profileToDuplicate) {
        duplicateProfile(profileToDuplicate.id);
      }
    }
  };

  return (
    <div className="profiles">
      <h2>Profiles</h2>
      {!profiles || profiles?.length === 0 ? (
        <NoItems>
          Click the "Add +" button below
          <br />
          to add a profile.
        </NoItems>
      ) : (
        <div className="scrollable" ref={containerRef}>
          {(profiles ?? []).map((profile) => (
            <ProfileItem
              key={profile.id}
              profile={profile}
              selected={profile.id === selectedProfileId}
            />
          ))}
        </div>
      )}
      <ButtonsContainer
        buttons={[
          {
            label: "",
            onClick: handleRemove,
            disabled: selectedProfileId === undefined,
            icon: TrashcanIcon,
          },
          {
            label: "",
            onClick: handleDuplicate,
            disabled: selectedProfileId === undefined,
            icon: DuplicateIcon,
          },
          {
            label: "Add",
            onClick: handleAdd,
            icon: PlusIcon,
          },
        ]}
      />
    </div>
  );
};
