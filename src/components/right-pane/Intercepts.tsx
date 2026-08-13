import { useAppStore } from "@/store/useAppStore";
import type { Intercept, Profile } from "@/types";
import { AddEditInterceptDialog } from "./AddEditInterceptDialog";

type Props = {
  profile: Profile | null;
  isAdding: boolean;
  onDialogUpdate: (isAdding: boolean) => void;
};

export const Intercepts = (props: Props) => {
  const { profile, onDialogUpdate, isAdding } = props;

  const updateProfile = useAppStore((state) => state.updateProfile);

  if (!profile) {
    return;
  }

  const { intercepts: items = [] } = profile;

  const onItemChange = (changedIntercept: Intercept) => {
    if (profile) {
      updateProfile({
        ...profile,
        intercepts: items.map((intercept) =>
          intercept.id === changedIntercept.id ? changedIntercept : intercept,
        ),
      });
    }
  };

  const onItemRemove = (removedIntercept: Intercept) => {
    if (profile) {
      updateProfile({
        ...profile,
        intercepts: items.filter((intercept) => intercept.id !== removedIntercept.id),
      });
    }
  };

  const onItemAdd = (newIntercept: Intercept) => {
    onDialogUpdate(false);
    if (profile) {
      let newId = 0;
      // Get the greatest existing intercept ID and increment it for the new intercept
      if (items.length > 0) {
        newId = Math.max(...items.map((intercept) => intercept.id)) + 1;
      }
      updateProfile({
        ...profile,
        intercepts: [...items, { ...newIntercept, id: newId }],
      });
    }
  };

  const onDialogCancel = () => {
    onDialogUpdate(false);
  };

  return (
    <>
      {items.length > 0 && (
        <>
          <h2>Intercepts</h2>
          <div className="intercepts-container"></div>
        </>
      )}
      <AddEditInterceptDialog
        open={isAdding}
        dialogType="add"
        onCancel={onDialogCancel}
        onSave={onItemAdd}
        intercept={{
          enabled: true,
          id: -1,
          target: "request",
          title: "",
          body: "",
          request: {},
        }}
      />
    </>
  );
};
