import { readFileSync } from "node:fs";

const USAGE = "Usage: node scripts/i18n/check.mjs <lang>   (for example: es)";
const SOURCE_STRINGS_PATH = "scripts/i18n/strings.json";
const KEY_PREVIEW_LENGTH = 80;
const SLOT_KEY_PREVIEW_LENGTH = 60;
const SLOT_VALUE_PREVIEW_LENGTH = 60;

const language = process.argv[2];
if (!language) {
  console.log(USAGE);
  process.exit(1);
}

const slotSignature = (text) => [...text.matchAll(/\{\d+\}/g)].map((match) => match[0]).sort().join(",");

function findProblem(sourceKeys, key, value) {
  if (!sourceKeys.includes(key)) return ["UNKNOWN KEY:", key.slice(0, KEY_PREVIEW_LENGTH)];
  if (typeof value !== "string" || !value.trim()) return ["EMPTY:", key.slice(0, KEY_PREVIEW_LENGTH)];
  if (slotSignature(key) !== slotSignature(value)) {
    return ["SLOTS DIFFER:", key.slice(0, SLOT_KEY_PREVIEW_LENGTH), "=>", value.slice(0, SLOT_VALUE_PREVIEW_LENGTH)];
  }
  return null;
}

function main() {
  const sourceKeys = JSON.parse(readFileSync(SOURCE_STRINGS_PATH, "utf8"));
  const dictionary = JSON.parse(readFileSync(`public/i18n/${language}.json`, "utf8"));
  let problemCount = 0;
  for (const [key, value] of Object.entries(dictionary)) {
    const problem = findProblem(sourceKeys, key, value);
    if (!problem) continue;
    console.log(...problem);
    problemCount++;
  }
  const missing = sourceKeys.filter((key) => !(key in dictionary));
  console.log(`${language}: ${Object.keys(dictionary).length}/${sourceKeys.length} translated, ${missing.length} missing, ${problemCount} problems`);
  process.exitCode = problemCount ? 1 : 0;
}

main();
