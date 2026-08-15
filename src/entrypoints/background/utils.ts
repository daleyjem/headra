export const getDomainsArray = (domains?: string) =>
  domains ? domains.split(",").map((domain) => domain.trim()) : [];
