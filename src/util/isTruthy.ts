export function isTruthy<T>(value: T | null | undefined | false): value is T {
  return value !== null && value !== undefined && value !== false;
}
