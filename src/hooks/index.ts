import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { RuntimeMessage } from "@/types";
import { isRuntimeMessage } from "@/types";

export const useMessageHandler = () => {
  const setErrorAlert = useAppStore((state) => state.setErrorAlert);

  useEffect(() => {
    const handleOnMessage = (message: unknown) => {
      if (isRuntimeMessage(message) && "failure" in message) {
        setErrorAlert({ message: message.failure });
      }
    };

    browser.runtime.onMessage.addListener(handleOnMessage);
    return () => {
      browser.runtime.onMessage.removeListener(handleOnMessage);
    };
  }, [setErrorAlert]);
};

export const useAppInit = () => {
  const appInitted = useRef(false);

  useEffect(() => {
    if (!appInitted.current) {
      appInitted.current = true;
      browser.runtime.sendMessage<RuntimeMessage>({ type: "appEvent", event: "init" });
    }
  }, []);
};
