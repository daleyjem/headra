import { useEffect } from "react";
import cx from "classnames";
import { useAppStore } from "@/store/useAppStore";
import "./toast-message.css";

export const ToastMessage = () => {
  const setToastMessage = useAppStore((state) => state.setToastMessage);
  const toastMessage = useAppStore((state) => state.toastMessage);

  useEffect(() => {
    if (toastMessage) {
      setTimeout(() => {
        setToastMessage("");
      }, 5000);
    }
  }, [setToastMessage, toastMessage]);

  return <div className={cx("toast-message", { active: toastMessage })}>{toastMessage}</div>;
};
