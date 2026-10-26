/** Languages most spoken in Arkansas homes (U.S. Census), plus English. */
export const LANGUAGES = [
  { code: "en", native: "English", english: "English" },
  { code: "es", native: "Español", english: "Spanish" },
  { code: "mh", native: "Kajin M̧ajeļ", english: "Marshallese" },
  { code: "vi", native: "Tiếng Việt", english: "Vietnamese" },
  { code: "zh", native: "中文（简体）", english: "Chinese (Simplified)" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

/** Same text, same key: collapse spaces so the dictionary matches what the page shows. */
export const keyOf = (s: string) => s.replace(/\s+/g, " ").trim();

/**
 * Numbers become numbered slots, so one entry covers every district and date:
 * "State House District 13" -> "State House District {0}". Translations may reorder slots.
 */
export function templateOf(key: string): { key: string; nums: string[] } {
  const nums: string[] = [];
  return { key: key.replace(/\d+/g, (m) => `{${nums.push(m) - 1}}`), nums };
}

export function lookup(dict: Record<string, string>, text: string): string | undefined {
  const exact = dict[text];
  if (exact !== undefined) return exact;
  if (!/\d/.test(text)) return undefined;
  const t = templateOf(text);
  const hit = dict[t.key];
  return hit?.replace(/\{(\d+)\}/g, (_, i) => t.nums[Number(i)] ?? "");
}
