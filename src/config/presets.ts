import type { Profile } from "@/types";
import { DEFAULT_URL_PATTERN } from "./constants";

export const presets: Profile[] = [
  {
    id: 0,
    name: "Preset: Privacy",
    enabled: false,
    requestPattern: DEFAULT_URL_PATTERN,
    headers: [
      {
        id: 0,
        target: "request",
        modType: "set",
        enabled: true,
        name: "Sec-GPC",
        value: "1",
      },
    ],
  },
  {
    id: 1,
    name: "Preset: Color Scheme",
    enabled: false,
    requestPattern: DEFAULT_URL_PATTERN,
    headers: [
      {
        id: 0,
        target: "response",
        modType: "append",
        enabled: true,
        name: "Accept-CH",
        value: "Sec-CH-Prefers-Color-Scheme",
      },
      {
        id: 1,
        target: "request",
        modType: "set",
        enabled: true,
        name: "Sec-CH-Prefers-Color-Scheme",
        value: "dark",
      },
      {
        id: 2,
        target: "request",
        modType: "set",
        enabled: false,
        name: "Sec-CH-Prefers-Color-Scheme",
        value: "light",
      },
    ],
  },
];
