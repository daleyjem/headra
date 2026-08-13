import type { StateSetter } from "./useAppStore";

export const setErrorAlert = (updateState: StateSetter) => (errorAlert: string) => {
  updateState({ errorAlert });
};

export const setToastMessage = (updateState: StateSetter) => (toastMessage: string) => {
  updateState({ toastMessage });
};
