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

export type BackgroundIntercept = Intercept & Pick<Profile, "domains">;
