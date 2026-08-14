import zod from "zod";
import type { Header, Intercept, PersistedAppState, Profile } from "./shared";

export const headerSchema: zod.ZodType<Header> = zod.object({
  id: zod.number(),
  target: zod.enum(["response", "request"]),
  modType: zod.enum(["set", "remove", "append"]),
  name: zod.string(),
  value: zod.string(),
  enabled: zod.boolean(),
});

const interceptSchema = zod.object({
  id: zod.number(),
  title: zod.string(),
  body: zod.string(),
  enabled: zod.boolean(),
  target: zod.enum(["request", "response"]),
  status: zod.number().optional(),
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

export const persistedStateSchema = zod.object({
  profiles: profilesSchema,
  selectedProfileId: zod.number().optional(),
  errorAlert: zod.string().optional(),
  badState: zod.unknown().optional(),
}) satisfies zod.ZodType<PersistedAppState>;
