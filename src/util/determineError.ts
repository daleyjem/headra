type ErrorType = "badRegex" | "emptyValue" | "noMultiple";

const errors = new Map<ErrorType, string[]>([
  [
    "badRegex",
    [`regexFilter is not a valid regular expression`, `incorrect value for the "regexFilter" key`],
  ],
  [
    "emptyValue",
    [`Request pattern cannot have an empty value.`, `urlFilter should not be an empty string`],
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
