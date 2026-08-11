import type { Header } from "@/types";

export const APP_NAME = "Headra";

export const DEFAULT_URL_PATTERN = "*://*";

export const TARGET_TYPES: Header["target"][] = ["request", "response"];

export const MOD_TYPES: Header["modType"][] = ["set", "remove", "append"];

export const STORAGE_KEY = "headra-storage";
export const STORAGE_KEY_BACKUP = `${STORAGE_KEY}-backup`;
