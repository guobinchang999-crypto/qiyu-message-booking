export const stringifyValue = (value: unknown): string => {
  if (Array.isArray(value)) return value.join(' ');
  if (value === null || value === undefined) return '';
  return String(value);
};
