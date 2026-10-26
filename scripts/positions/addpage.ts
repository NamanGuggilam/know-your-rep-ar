// Add any public web page (news interview, questionnaire, debate transcript, official site)
// to a candidate's evidence. The page text is saved so finalize.ts can check quotes word-for-word.
//   npx tsx scripts/positions/addpage.ts <candidate-id> <url> "<source label, e.g. Arkansas Advocate, Sept 12, 2026>"
// robots.txt is respected; paywalled or blocked pages are skipped, never bypassed.
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { closeBrowser, readPages } from "../stances/ownwords";

async function main() {
  const [id, url, label] = process.argv.slice(2);
  if (!id || !/^https?:\/\//.test(url ?? "") || !label) {
    throw new Error('usage: addpage.ts <candidate-id> <url> "<source label>"');
  }
  const file = path.join(process.cwd(), ".cache", "campaign", `${id}.json`);
  const saved = existsSync(file)
    ? JSON.parse(readFileSync(file, "utf8"))
    : { website: null, status: "none", note: "We could not find a campaign website for this candidate.", pages: [] };
  if (saved.pages.some((p: { url: string }) => p.url === url)) {
    console.log(`already saved as page ${saved.pages.findIndex((p: { url: string }) => p.url === url) + 1}`);
    return;
  }
  const r = await readPages([url], "campaign");
  if (!r.pages.length) {
    console.log(`could not read ${url} (blocked, paywalled, or empty). Skip it.`);
    process.exitCode = 1;
    return;
  }
  saved.pages.push({ ...r.pages[0], url, source: label });
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(saved, null, 2));
  console.log(`saved as page ${saved.pages.length}: ${label} (${r.pages[0].text.length} chars) ${url}`);
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  // Always shut the browser, or the script hangs after a failed page.
  .finally(() => closeBrowser());
