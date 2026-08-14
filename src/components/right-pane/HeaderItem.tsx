import { useState } from "react";
import cx from "classnames";
import type { Header } from "@/types";
import ReqResIcon from "@/assets/icons/req-res-icon.svg?react";
import TrashcanIcon from "@/assets/icons/trashcan-icon.svg?react";
import { AddEditHeaderDialog } from "./AddEditHeaderDialog";
import { negative } from "zod";

type Props = {
  header: Header;
  onItemChange: (changedHeader: Header) => void;
  onItemRemove: (removedHeader: Header) => void;
  onItemDuplicated: (duplicatedHeader: Header) => void;
};

export const HeaderItem = (props: Props) => {
  const { enabled, target, modType, name, value } = props.header;

  const [isEditing, setIsEditing] = useState(false);

  const onCheckboxClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const onToggle = () => {
    props.onItemChange({
      ...props.header,
      enabled: !enabled,
    });
  };

  const onClick = () => {
    setIsEditing(true);
  };

  const onRemoveClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    props.onItemRemove(props.header);
  };

  const onDialogCancel = () => {
    setIsEditing(false);
  };

  const onDialogSave = (updatedHeader: Header) => {
    props.onItemChange(updatedHeader);
    setIsEditing(false);
  };

  const onDialogSaveNew = (duplicatedHeader: Header) => {
    props.onItemDuplicated(duplicatedHeader);
    setIsEditing(false);
  };

  return (
    <div
      className={cx({
        "header-item": true,
        enabled: enabled,
      })}
      onClick={onClick}
    >
      <span className="target" title={`${target} header`}>
        <ReqResIcon className={target} />
      </span>
      <span
        title={`${modType} header`}
        className={cx("mod-type", {
          positive: modType === "set",
          alt: modType === "append",
          negative: modType === "remove",
        })}
      ></span>
      <span className="header-name">{name}</span>
      <span className="header-value">{value}</span>
      <input type="checkbox" onClick={onCheckboxClick} onChange={onToggle} checked={enabled} />
      <button className="remove-button" onClick={onRemoveClick} title="Remove header">
        <TrashcanIcon />
      </button>

      <AddEditHeaderDialog
        dialogType="edit"
        header={props.header}
        open={isEditing}
        onCancel={onDialogCancel}
        onSave={onDialogSave}
        onSaveNew={onDialogSaveNew}
      />
    </div>
  );
};
