import { useEffect, useRef, useState } from "react";
import { MOD_TYPES, TARGET_TYPES } from "@/config/constants";
import type { Header } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { isTruthy } from "@/util/isTruthy";
import { ButtonsContainer } from "../global/ButtonsContainer";
import { Select } from "../global/Select";

type Props = {
  header: Header;
  open: boolean;
  dialogType: "add" | "edit";
  onCancel: () => void;
  onSaveNew?: (header: Header) => void;
  onSave: (header: Header) => void;
};

export const AddEditDialog = (props: Props) => {
  const { header, open, dialogType, onCancel, onSave, onSaveNew } = props;

  const setSelectedHeader = useAppStore((state) => state.setSelectedHeader);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draftHeader, setDraftHeader] = useState<Header>(header);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      setSelectedHeader(null);
      onCancel();
    };

    if (open) {
      setDraftHeader(header);
      dialog.showModal();
    }

    dialog.addEventListener("close", handleClose);

    return () => {
      dialog.removeEventListener("close", handleClose);
    };
  }, [open, setSelectedHeader, header, onCancel]);

  const onCancelClick = () => {
    dialogRef.current?.close();
  };

  const onSaveClick = () => {
    onSave(draftHeader);
    dialogRef.current?.close();
  };

  const onSaveNewClick = () => {
    onSaveNew?.(draftHeader);
    dialogRef.current?.close();
  };

  const onFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = event.target;
    setDraftHeader((prev) => ({
      ...prev,
      [name]: type === "checkbox" && "checked" in event.target ? event.target.checked : value,
    }));
  };

  return (
    <dialog
      ref={dialogRef}
      className={`header-dialog ${dialogType}`}
      onClick={(e) => e.stopPropagation()}
      closedby="any"
    >
      <h2>{dialogType} Header</h2>
      <section>
        <article>
          <h3>Modification</h3>
          <Select name="modType" value={draftHeader.modType} onChange={onFormChange}>
            {MOD_TYPES.map((mType) => (
              <option key={mType} value={mType}>
                {mType}
              </option>
            ))}
          </Select>
        </article>
        <article>
          <h3>Target</h3>
          <Select name="target" value={draftHeader.target} onChange={onFormChange}>
            {TARGET_TYPES.map((target) => (
              <option key={target} value={target}>
                {target}
              </option>
            ))}
          </Select>
        </article>
      </section>
      <section>
        <article>
          <h3>Header Name *</h3>
          <input
            type="text"
            name="name"
            placeholder="e.g. Cache-Control"
            value={draftHeader.name}
            onChange={onFormChange}
          />
        </article>
        <article>
          <h3>Enabled</h3>
          <input
            type="checkbox"
            name="enabled"
            checked={draftHeader.enabled}
            onChange={onFormChange}
          />
        </article>
      </section>
      <section>
        <article>
          <h3>Header Value</h3>
          <textarea
            name="value"
            placeholder={draftHeader.name === "" ? "e.g. no-cache" : ""}
            value={draftHeader.value}
            onChange={onFormChange}
          />
        </article>
      </section>
      <ButtonsContainer
        buttons={[
          { label: "Cancel", onClick: onCancelClick },
          dialogType === "edit" && { label: "Save as New", onClick: onSaveNewClick },
          { label: "Save", onClick: onSaveClick, disabled: draftHeader.name.trim() === "" },
        ].filter(isTruthy)}
      />
    </dialog>
  );
};
