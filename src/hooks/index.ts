import { useEffect, useRef, useState } from "react";
import type { RuntimeMessage } from "@/types";

type MessageType = RuntimeMessage["type"];
type MessageOfType<T extends MessageType> = Extract<RuntimeMessage, { type: T }>;

/**
 * Listens for messages from the background service worker of a certain type.
 */
export const useMessageHandler = <T extends MessageType>(type: T): MessageOfType<T> | null => {
  const [message, setMessage] = useState<MessageOfType<T> | null>(null);

  useEffect(() => {
    const handleMessage = (runtimeMessage: RuntimeMessage) => {
      if (runtimeMessage.type === type) {
        setMessage(runtimeMessage as MessageOfType<T>);
      }
    };

    browser.runtime.onMessage.addListener(handleMessage);

    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, [type]);

  return message;
};

export const useAppInit = () => {
  const appInitted = useRef(false);

  useEffect(() => {
    if (!appInitted.current) {
      appInitted.current = true;
      browser.runtime
        .sendMessage<RuntimeMessage>({ type: "appEvent", event: "init" })
        .catch(() => {});
    }
  }, []);
};
