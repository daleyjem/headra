import { useState } from "react";
import cx from "classnames";
import type { Intercept } from "@/types";
import ReqResIcon from "@/assets/icons/req-res-icon.svg?react";
import TrashcanIcon from "@/assets/icons/trashcan-icon.svg?react";
import { AddEditInterceptDialog } from "./AddEditInterceptDialog";
import { getShortenedMethod } from "@/util/shared";

type Props = {
  intercept: Intercept;
  onItemChange: (changedIntercept: Intercept) => void;
  onItemRemove: (removedIntercept: Intercept) => void;
  onItemDuplicated: (duplicatedIntercept: Intercept) => void;
};

export const InterceptItem = (props: Props) => {
  const { enabled, target, title, body, status, method = "ALL" } = props.intercept;

  const [isEditing, setIsEditing] = useState(false);

  const onCheckboxClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const onToggle = () => {
    props.onItemChange({
      ...props.intercept,
      enabled: !enabled,
    });
  };

  const onClick = () => {
    setIsEditing(true);
  };

  const onRemoveClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    props.onItemRemove(props.intercept);
  };

  const onDialogCancel = () => {
    setIsEditing(false);
  };

  const onDialogSave = (updatedIntercept: Intercept) => {
    props.onItemChange(updatedIntercept);
    setIsEditing(false);
  };

  const onDialogSaveNew = (duplicatedIntercept: Intercept) => {
    props.onItemDuplicated(duplicatedIntercept);
    setIsEditing(false);
  };

  return (
    <div
      className={cx({
        "intercept-item": true,
        enabled: enabled,
      })}
      onClick={onClick}
    >
      <span className="target" title={`${target} intercept`}>
        <ReqResIcon className={target} />
      </span>
      <span
        className={cx(
          "status-method",
          target === "response"
            ? {
                info: Number(status) < 200,
                positive: Number(status) >= 200 && Number(status) < 300,
                alt: Number(status) >= 300 && Number(status) < 400,
                alt2: Number(status) >= 400 && Number(status) < 500,
                negative: Number(status) >= 500,
              }
            : {
                info: ["ALL"].includes(method),
                positive: ["GET", "POST", "PUT"].includes(method),
                alt: ["HEAD", "CONNECT", "OPTIONS", "TRACE", "PATCH"].includes(method),
                negative: ["DELETE"].includes(method),
              },
        )}
      >
        {target === "response" ? status : getShortenedMethod(method)}
      </span>
      <span className="intercept-title">{title}</span>
      <span className="intercept-body">{body}</span>
      <input type="checkbox" onClick={onCheckboxClick} onChange={onToggle} checked={enabled} />
      <button className="remove-button" onClick={onRemoveClick} title="Remove intercept">
        <TrashcanIcon />
      </button>

      <AddEditInterceptDialog
        dialogType="edit"
        intercept={props.intercept}
        open={isEditing}
        onCancel={onDialogCancel}
        onSave={onDialogSave}
        onSaveNew={onDialogSaveNew}
      />
    </div>
  );
};
