import type { RuntimeMessage } from "./shared";

export const isRuntimeMessage = (message: unknown): message is RuntimeMessage =>
  typeof message === "object" && message !== null && "type" in message;
