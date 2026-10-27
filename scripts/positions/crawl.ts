import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { closeBrowser, ownWords, readPages } from "../stances/ownwords";

const USAGE = "usage: crawl.ts <candidate-id> <url> | crawl.ts <candidate-id> --exact <url> [url...]";
const EXACT_FLAG = "--exact";

const isHttpUrl = (url: string) => /^https?:\/\//.test(url);

async function main() {
  const [candidateId, ...rest] = process.argv.slice(2);
  const readExactPages = rest[0] === EXACT_FLAG;
  const urls = readExactPages ? rest.slice(1) : rest.slice(0, 1);
  if (!candidateId || !urls.length || !urls.every(isHttpUrl)) throw new Error(USAGE);

  const website = urls[0];
  const words = readExactPages ? await readPages(urls, "campaign") : await ownWords(website, "campaign", true);
  const outputDir = path.join(process.cwd(), ".cache", "campaign");
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, `${candidateId}.json`), JSON.stringify({ website, ...words }, null, 2));
  console.log(`${candidateId}: ${words.status} — ${words.note}`);
  words.pages.forEach((page, index) => console.log(`  page ${index + 1}: ${page.title} (${page.text.length} chars) ${page.url}`));
  await closeBrowser();
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
