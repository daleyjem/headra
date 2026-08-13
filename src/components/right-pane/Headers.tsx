import { useAppStore } from "@/store/useAppStore";
import type { Header, Profile } from "@/types";
import { HeaderItem } from "./HeaderItem";
import { AddEditHeaderDialog } from "./AddEditHeaderDialog";

type Props = {
  profile: Profile | null;
  isAdding: boolean;
  onDialogUpdate: (isAdding: boolean) => void;
};

export const Headers = (props: Props) => {
  const { profile, onDialogUpdate, isAdding } = props;

  const updateProfile = useAppStore((state) => state.updateProfile);

  if (!profile) {
    return;
  }

  const { headers: items } = profile;

  const onItemChange = (changedHeader: Header) => {
    if (profile) {
      updateProfile({
        ...profile,
        headers: items.map((header) => (header.id === changedHeader.id ? changedHeader : header)),
      });
    }
  };

  const onItemRemove = (removedHeader: Header) => {
    if (profile) {
      updateProfile({
        ...profile,
        headers: items.filter((header) => header.id !== removedHeader.id),
      });
    }
  };

  const onItemAdd = (newHeader: Header) => {
    onDialogUpdate(false);
    if (profile) {
      let newId = 0;
      // Get the greatest existing header ID and increment it for the new header
      if (items.length > 0) {
        newId = Math.max(...items.map((header) => header.id)) + 1;
      }
      updateProfile({
        ...profile,
        headers: [...items, { ...newHeader, id: newId }],
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
          <h2>Headers</h2>
          <div className="headers-container">
            <div className="header-items">
              {items.map((header) => (
                <HeaderItem
                  onItemChange={onItemChange}
                  onItemRemove={onItemRemove}
                  onItemDuplicated={onItemAdd}
                  key={`${profile.id}-${header.id}`}
                  header={header}
                />
              ))}
            </div>
          </div>
        </>
      )}
      <AddEditHeaderDialog
        open={isAdding}
        dialogType="add"
        onCancel={onDialogCancel}
        onSave={onItemAdd}
        header={{
          enabled: true,
          id: -1,
          modType: "set",
          target: "request",
          name: "",
          value: "",
        }}
      />
    </>
  );
};
