// Checks a translation file against the English strings.
//   node scripts/i18n/check.mjs es
import { readFileSync } from "node:fs";
const lang = process.argv[2];
const keys = JSON.parse(readFileSync("scripts/i18n/strings.json", "utf8"));
const dict = JSON.parse(readFileSync(`public/i18n/${lang}.json`, "utf8"));
const slots = (s) => [...s.matchAll(/\{\d+\}/g)].map((m) => m[0]).sort().join(",");
let bad = 0;
for (const [k, v] of Object.entries(dict)) {
  if (!keys.includes(k)) { console.log("UNKNOWN KEY:", k.slice(0, 80)); bad++; }
  else if (typeof v !== "string" || !v.trim()) { console.log("EMPTY:", k.slice(0, 80)); bad++; }
  else if (slots(k) !== slots(v)) { console.log("SLOTS DIFFER:", k.slice(0, 60), "=>", v.slice(0, 60)); bad++; }
}
const missing = keys.filter((k) => !(k in dict));
console.log(`${lang}: ${Object.keys(dict).length}/${keys.length} translated, ${missing.length} missing, ${bad} problems`);
process.exitCode = bad ? 1 : 0;
