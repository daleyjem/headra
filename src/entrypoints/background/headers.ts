import type { Header, Profile } from "@/types";
import { getDomainsArray } from "./utils";

const MAX_HEADERS_PER_PROFILE = 10_000;

const ALL_RESOURCE_TYPES: Browser.declarativeNetRequest.ResourceType[] = [
  browser.declarativeNetRequest.ResourceType.MAIN_FRAME,
  browser.declarativeNetRequest.ResourceType.SUB_FRAME,
  browser.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
  browser.declarativeNetRequest.ResourceType.SCRIPT,
  browser.declarativeNetRequest.ResourceType.STYLESHEET,
  browser.declarativeNetRequest.ResourceType.IMAGE,
  browser.declarativeNetRequest.ResourceType.FONT,
  browser.declarativeNetRequest.ResourceType.OBJECT,
  browser.declarativeNetRequest.ResourceType.OTHER,
];

const toRuleId = (profileId: number, headerId: number): number =>
  (profileId + 1) * MAX_HEADERS_PER_PROFILE + headerId;

export const headerToRule = (
  profile: Profile,
  header: Header,
): Browser.declarativeNetRequest.Rule => {
  const domains = getDomainsArray(profile.domains);
  const headerEntry: Browser.declarativeNetRequest.ModifyHeaderInfo = {
    header: header.name,
    operation: header.modType,
    ...(header.modType !== "remove" && { value: header.value }),
  };

  return {
    id: toRuleId(profile.id, header.id),
    priority: 1,
    action: {
      type: "modifyHeaders",
      ...(header.target === "request"
        ? { requestHeaders: [headerEntry] }
        : { responseHeaders: [headerEntry] }),
    },
    condition: {
      [profile.requestRegex ? "regexFilter" : "urlFilter"]: profile.requestPattern,
      ...(domains.length > 0 && { requestDomains: domains }),
      resourceTypes: ALL_RESOURCE_TYPES,
    },
  };
};
