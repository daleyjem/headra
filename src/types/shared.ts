import type { RequestMethods } from "@/config/constants";

export type RequestMethod = (typeof RequestMethods)[keyof typeof RequestMethods];

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
  title: string;
  body: string;
  enabled: boolean;
  status?: number;
  method?: RequestMethod;
  target: "request" | "response";
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

export type BackgroundIntercept = Intercept &
  Pick<Profile, "domains" | "requestPattern" | "requestRegex">;

export type BackgroundFetchParams = {
  requestId?: number;
  responseStatusCode?: number;
  responseHeaders?: Record<string, string>;
  body?: string;
  request?: {
    url: string;
    method: RequestMethod;
    postData: string;
  };
};
