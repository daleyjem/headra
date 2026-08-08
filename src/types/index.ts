import zod from "zod";

export interface Header {
  id: number;
  target: "response" | "request";
  modType: "set" | "remove" | "append";
  name: string;
  value: string;
  enabled: boolean;
}

export interface Profile {
  id: number;
  name: string;
  enabled: boolean;
  headers: Header[];
  domains?: string;
  requestPattern: string;
  requestRegex?: boolean;
}

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

export const profileSchema: zod.ZodType<Profile> = zod.object({
  id: zod.number(),
  name: zod.string(),
  enabled: zod.boolean(),
  headers: zod.array(headerSchema),
  domains: zod.optional(zod.string()),
  requestPattern: zod.string(),
  requestRegex: zod.optional(zod.boolean()),
});

export const profilesSchema: zod.ZodType<Profile[]> = zod.array(profileSchema);

export const isRuntimeMessage = (message: unknown): message is RuntimeMessage =>
  typeof message === "object" && message !== null && "type" in message;
