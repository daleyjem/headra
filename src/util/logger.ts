import { APP_NAME } from "@/config/constants";

const LOG_PREFIX = `[${APP_NAME}]`;

export const logger = {
  log: (...msg: unknown[]) => {
    if (import.meta.env.DEV) {
      console.log(LOG_PREFIX, ...msg);
    }
  },
  error: (...msg: unknown[]) => {
    if (import.meta.env.DEV) {
      console.error(LOG_PREFIX, ...msg);
    }
  },
};
