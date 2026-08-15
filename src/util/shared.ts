import type { RequestMethod } from "@/types";

export const getShortenedMethod = (method: RequestMethod | "ALL") => {
  switch (method) {
    case "ALL":
    case "CONNECT":
    case "TRACE":
    case "HEAD":
    case "POST":
      return method.substring(0, 4);
    default:
      return method.substring(0, 3);
  }
};
