import { useEffect, useRef, useState } from "react";
import cx from "classnames";
import type { Profile } from "@/types";
import PencilIcon from "@/assets/icons/pencil-icon.svg?react";
import { useAppStore } from "@/store/useAppStore";

type Props = {
  profile: Profile;
  selected?: boolean;
};

export const ProfileItem = (props: Props) => {
  const setSelectedProfile = useAppStore((state) => state.setSelectedProfile);
  const updateProfile = useAppStore((state) => state.updateProfile);

  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(props.profile.name);
  const editRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);
  const settings = props.profile;

  const displayName = isEditing ? draftName : props.profile.name;

  useEffect(() => {
    if (isEditing) {
      editRef.current?.focus();
      editRef.current?.setSelectionRange(0, editRef.current.value.length);
    }
  }, [isEditing]);

  const onSelect = () => {
    setSelectedProfile(props.profile);
  };

  const onEditClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setDraftName(props.profile.name);
    setIsEditing(true);
  };

  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDraftName(event.target.value);
  };

  const onNameSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      submittedRef.current = true;
      setIsEditing(false);
      updateProfile({
        ...props.profile,
        name: event.currentTarget.value,
      });
    }
  };

  const onEditBlur = () => {
    // Enter already handled this, skip blur logic
    if (submittedRef.current) {
      submittedRef.current = false;
      return;
    }
    setIsEditing(false);
  };

  const onCheckboxClick = (event: React.MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
  };

  const onToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateProfile({
      ...props.profile,
      enabled: event.target.checked,
    });
  };

  return (
    <div
      className={cx({
        "profile-item": true,
        editing: isEditing,
        selected: props.selected,
        enabled: settings.enabled,
      })}
      onClick={onSelect}
    >
      <button className="edit-profile" onClick={onEditClick}>
        <PencilIcon />
      </button>
      <input
        type="text"
        value={displayName}
        inert={!isEditing}
        ref={editRef}
        onChange={onNameChange}
        onKeyUp={onNameSubmit}
        onBlur={onEditBlur}
      />
      <input
        type="checkbox"
        name="profile"
        value={settings.id}
        checked={settings.enabled}
        onClick={onCheckboxClick}
        onChange={onToggle}
      />
    </div>
  );
};
