/** "under_review" -> "Under review". For labels that come from database enums. */
export function sentence(value: string | null | undefined): string {
  const t = (value ?? "").replace(/_/g, " ").trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}
