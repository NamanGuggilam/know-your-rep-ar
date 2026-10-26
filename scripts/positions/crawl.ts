// Step 1 of the agent-assisted path: read a candidate's campaign site and save the text.
//   npx tsx scripts/positions/crawl.ts <candidate-id> <https://campaign-site>
//   npx tsx scripts/positions/crawl.ts <candidate-id> --exact <url1> <url2> ...   (read exactly these pages)
// Saves .cache/campaign/<id>.json. Respects robots.txt; blocked sites are recorded, never bypassed.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { closeBrowser, ownWords, readPages } from "../stances/ownwords";

async function main() {
  const [id, ...rest] = process.argv.slice(2);
  const exact = rest[0] === "--exact";
  const urls = exact ? rest.slice(1) : rest.slice(0, 1);
  if (!id || !urls.length || !urls.every((u) => /^https?:\/\//.test(u))) {
    throw new Error("usage: crawl.ts <candidate-id> <url> | crawl.ts <candidate-id> --exact <url> [url...]");
  }
  const site = urls[0];
  const words = exact ? await readPages(urls, "campaign") : await ownWords(site, "campaign", true);
  const dir = path.join(process.cwd(), ".cache", "campaign");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${id}.json`), JSON.stringify({ website: site, ...words }, null, 2));
  console.log(`${id}: ${words.status} — ${words.note}`);
  words.pages.forEach((p, i) => console.log(`  page ${i + 1}: ${p.title} (${p.text.length} chars) ${p.url}`));
  await closeBrowser();
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
