type ErrorType = "badRegex" | "emptyValue" | "noMultiple";

const errors = new Map<ErrorType, string[]>([
  [
    "badRegex",
    [`regexFilter is not a valid regular expression`, `incorrect value for the "regexFilter" key`],
  ],
  [
    "emptyValue",
    [
      `Request pattern cannot have an empty value.`,
      `urlFilter should not be an empty string`,
      `regexFilter should not be an empty string`,
      `cannot have an empty value for urlFilter key`,
      `cannot have an empty value for regexFilter key`,
    ],
  ],
  ["noMultiple", [`Only standard HTTP request headers that can specify multiple values`]],
]);

export const determineError = (msg: string): ErrorType | undefined => {
  for (const [errorType, patterns] of errors) {
    if (patterns.some((pattern) => msg.includes(pattern))) {
      return errorType;
    }
  }

  return undefined;
};

export const ensureError = (value: unknown): Error => {
  if (value instanceof Error) return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  )
    return new Error(value.message);

  return new Error(String(value));
};
