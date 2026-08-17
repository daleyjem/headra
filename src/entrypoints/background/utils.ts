import { parse } from "tldts";

const SEPARATOR_CLASS = "[^A-Za-z0-9_\\-.%]";

const escapeRegExpLiteral = (chunk: string): string => {
  return chunk.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const compileUrlFilter = (pattern: string): RegExp | null => {
  if (pattern.length === 0) return null;

  let body = pattern;
  let leftAnchor = "";
  let rightAnchor = "";

  if (body.endsWith("|") && body.length > 1) {
    rightAnchor = "$";
    body = body.slice(0, -1);
  } else if (body === "|") {
    rightAnchor = "$";
    body = "";
  }

  if (body.startsWith("||")) {
    leftAnchor = "^[a-z][a-z0-9+.-]*://([^/]*\\.)?";
    body = body.slice(2);
    if (body.includes("||")) return null;
  } else if (body.startsWith("|")) {
    leftAnchor = "^";
    body = body.slice(1);
  }

  if (body.includes("||")) return null;
  if (body.includes("|")) return null;

  let regexBody = "";
  let literal = "";
  const flushLiteral = () => {
    if (literal) {
      regexBody += escapeRegExpLiteral(literal);
      literal = "";
    }
  };

  for (const ch of body) {
    if (ch === "*") {
      flushLiteral();
      regexBody += ".*";
    } else if (ch === "^") {
      flushLiteral();
      regexBody += `(?:${SEPARATOR_CLASS}|$)`;
    } else {
      literal += ch;
    }
  }
  flushLiteral();

  try {
    return new RegExp(`${leftAnchor}${regexBody}${rightAnchor}`, "i");
  } catch {
    return null;
  }
};

const compileRegexFilter = (pattern: string): RegExp | null => {
  if (pattern.length === 0) return null;
  try {
    return new RegExp(pattern, "i");
  } catch {
    return null;
  }
};

export const getDomainsArray = (domains?: string) =>
  domains ? domains.split(",").map((domain) => domain.trim()) : [];

export const matchesDomainPattern = (pattern: string, url: string): boolean => {
  const currentHostname = new URL(url).hostname;
  const patternInfo = parse(pattern);
  const currentInfo = parse(currentHostname);

  // Malformed pattern or hostname (no recognizable public suffix) — bail safely
  if (!patternInfo.domain || !currentInfo.domain) return false;

  const patternIsRootDomain = pattern === patternInfo.domain;

  if (patternIsRootDomain) {
    // User specified just the TLD+domain, e.g. "example.com"
    // Match the root domain itself AND any subdomain of it.
    return currentInfo.domain === patternInfo.domain;
  }

  // User specified a full subdomain, e.g. "api.example.com"
  // Exact hostname match only.
  return currentHostname === pattern;
};

export const encodeBody = (body: string): string => {
  const bytes = new TextEncoder().encode(body);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

/**
 * Tests whether `url` matches `pattern`.
 * isRegex true  -> pattern is a JS regular expression source string.
 * isRegex false -> pattern is a DNR urlFilter string (*, |, ||, ^ tokens).
 * A malformed pattern returns false.
 */
export function matchesPattern(pattern: string, url: string, isRegex: boolean): boolean {
  const regexp = isRegex ? compileRegexFilter(pattern) : compileUrlFilter(pattern);
  return regexp?.test(url) ?? false;
}
