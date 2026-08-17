import { useEffect, useRef, useState } from "react";
import { RequestMethods, TARGET_TYPES } from "@/config/constants";
import type { Intercept } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { isTruthy } from "@/util/isTruthy";
import { ButtonsContainer } from "../global/ButtonsContainer";
import { Select } from "../global/Select";

type Props = {
  intercept: Intercept;
  open: boolean;
  dialogType: "add" | "edit";
  onCancel: () => void;
  onSaveNew?: (intercept: Intercept) => void;
  onSave: (intercept: Intercept) => void;
};

export const AddEditInterceptDialog = (props: Props) => {
  const { intercept, open, dialogType, onCancel, onSave, onSaveNew } = props;

  const setSelectedIntercept = useAppStore((state) => state.setSelectedIntercept);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draftIntercept, setDraftIntercept] = useState<Intercept>(intercept);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      setSelectedIntercept(null);
      onCancel();
    };

    if (open) {
      setDraftIntercept(intercept);
      dialog.showModal();
    }

    dialog.addEventListener("close", handleClose);

    return () => {
      dialog.removeEventListener("close", handleClose);
    };
  }, [open, setSelectedIntercept, intercept, onCancel]);

  const onCancelClick = () => {
    dialogRef.current?.close();
  };

  const onSaveClick = () => {
    onSave(draftIntercept);
    dialogRef.current?.close();
  };

  const onSaveNewClick = () => {
    onSaveNew?.(draftIntercept);
    dialogRef.current?.close();
  };

  const onFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = event.target;
    let newValue: string | boolean | number | undefined = value;
    if (type === "checkbox" && "checked" in event.target) {
      newValue = event.target.checked;
    }
    if (type === "number" && "valueAsNumber" in event.target) {
      const numValue = event.target.valueAsNumber;
      newValue = Number.isNaN(numValue) ? undefined : numValue;
    }
    if (name === "method" && value === "*") {
      newValue = undefined;
    }
    setDraftIntercept((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  return (
    <dialog
      ref={dialogRef}
      className={`intercept-dialog ${dialogType}`}
      onClick={(e) => e.stopPropagation()}
      closedby="any"
    >
      <h2>{dialogType} Intercept</h2>
      <section>
        <article>
          <h3>Intercept Title *</h3>
          <input
            type="text"
            name="title"
            placeholder="e.g. Mock Product"
            value={draftIntercept.title}
            onChange={onFormChange}
          />
        </article>
        <article>
          <h3>Enabled</h3>
          <input
            type="checkbox"
            name="enabled"
            checked={draftIntercept.enabled}
            onChange={onFormChange}
          />
        </article>
      </section>
      <section>
        <article>
          <h3>Target</h3>
          <Select name="target" value={draftIntercept.target} onChange={onFormChange}>
            {TARGET_TYPES.map((target) => (
              <option key={target} value={target}>
                {target}
              </option>
            ))}
          </Select>
        </article>
        {draftIntercept.target === "response" ? (
          <article>
            <h3>Status Code</h3>
            <input
              type="number"
              name="status"
              placeholder="200"
              value={draftIntercept.status}
              onChange={onFormChange}
            />
          </article>
        ) : (
          <article>
            <h3>Request Method</h3>
            <Select name="method" value={draftIntercept.method} onChange={onFormChange}>
              {["*", ...Object.keys(RequestMethods)].map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </Select>
          </article>
        )}
      </section>
      <section>
        <article>
          <h3>{draftIntercept.target === "request" ? "Request" : "Response"} Body</h3>
          <textarea
            name="body"
            placeholder={`e.g. { "key": "value" }`}
            value={draftIntercept.body}
            onChange={onFormChange}
          />
        </article>
      </section>
      <ButtonsContainer
        buttons={[
          { label: "Cancel", onClick: onCancelClick },
          dialogType === "edit" && { label: "Save as New", onClick: onSaveNewClick },
          { label: "Save", onClick: onSaveClick, disabled: draftIntercept.title.trim() === "" },
        ].filter(isTruthy)}
      />
    </dialog>
  );
};
