import zod from "zod";

export type Header = {
  id: number;
  target: "response" | "request";
  modType: "set" | "remove" | "append";
  name: string;
  value: string;
  enabled: boolean;
};

export type Intercept = {
  id: number;
  name: string;
  enabled: boolean;
  target: "response" | "request";
};

export type Profile = {
  id: number;
  name: string;
  enabled: boolean;
  headers: Header[];
  intercepts?: Intercept[];
  domains?: string;
  requestPattern: string;
  requestRegex?: boolean;
};

export type PersistedAppState = {
  profiles?: Profile[];
  selectedProfileId?: Profile["id"];
  /**
   * This will show up in the header bar as an alert.
   * if `recommendReinstall` is set to true, instruct to download raw storage string,
   * and re-install the extension.
   */
  errorAlert?: string;
  badState?: unknown;
};

export type PersistedStorage = {
  [storageKey: string]: PersistedAppState;
};

export type RuntimeMessage =
  | { type: "appEvent"; event: "init" }
  | {
      type: "setError";
      failure: string;
    };

export const headerSchema: zod.ZodType<Header> = zod.object({
  id: zod.number(),
  target: zod.enum(["response", "request"]),
  modType: zod.enum(["set", "remove", "append"]),
  name: zod.string(),
  value: zod.string(),
  enabled: zod.boolean(),
});

export const interceptSchema: zod.ZodType<Intercept> = zod.object({
  id: zod.number(),
  name: zod.string(),
  enabled: zod.boolean(),
  target: zod.enum(["response", "request"]),
});

export const profileSchema: zod.ZodType<Profile> = zod.object({
  id: zod.number(),
  name: zod.string(),
  enabled: zod.boolean(),
  headers: zod.array(headerSchema),
  intercepts: zod.array(interceptSchema).optional(),
  domains: zod.optional(zod.string()),
  requestPattern: zod.string(),
  requestRegex: zod.optional(zod.boolean()),
});

export const profilesSchema: zod.ZodType<Profile[]> = zod.array(profileSchema);

export const isRuntimeMessage = (message: unknown): message is RuntimeMessage =>
  typeof message === "object" && message !== null && "type" in message;
