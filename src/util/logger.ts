import { APP_NAME } from "@/config/constants";

const LOG_PREFIX = `[${APP_NAME}]`;
const DEV_MODE = import.meta.env.DEV || import.meta.env.VITE_DEV;

export const logger = {
  log: (...msg: unknown[]) => {
    if (DEV_MODE) {
      console.log(LOG_PREFIX, ...msg);
    }
  },
  error: (...msg: unknown[]) => {
    if (DEV_MODE) {
      console.error(LOG_PREFIX, ...msg);
    }
  },
};
