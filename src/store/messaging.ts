import type { StateSetter } from "./useAppStore";

export const setToastMessage = (updateState: StateSetter) => (toastMessage: string) => {
  updateState({ toastMessage });
};
