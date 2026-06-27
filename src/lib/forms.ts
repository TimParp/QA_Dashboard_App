export function optionalString(
  v: FormDataEntryValue | null,
): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 ? s : undefined;
}
