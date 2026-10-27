import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { closeBrowser, readPages } from "../stances/ownwords";

const USAGE = 'usage: addpage.ts <candidate-id> <url> "<source label, e.g. Arkansas Advocate, Sept 12, 2026>"';
const NO_CAMPAIGN_WEBSITE_NOTE = "We could not find a campaign website for this candidate.";

type SavedPage = { url: string };

function emptyCampaignFile() {
  return { website: null, status: "none", note: NO_CAMPAIGN_WEBSITE_NOTE, pages: [] };
}

async function main() {
  const [candidateId, url, sourceLabel] = process.argv.slice(2);
  if (!candidateId || !/^https?:\/\//.test(url ?? "") || !sourceLabel) throw new Error(USAGE);

  const campaignFile = path.join(process.cwd(), ".cache", "campaign", `${candidateId}.json`);
  const saved = existsSync(campaignFile) ? JSON.parse(readFileSync(campaignFile, "utf8")) : emptyCampaignFile();

  const existingIndex = saved.pages.findIndex((page: SavedPage) => page.url === url);
  if (existingIndex !== -1) {
    console.log(`already saved as page ${existingIndex + 1}`);
    return;
  }

  const result = await readPages([url], "campaign");
  if (!result.pages.length) {
    console.log(`could not read ${url} (blocked, paywalled, or empty). Skip it.`);
    process.exitCode = 1;
    return;
  }
  saved.pages.push({ ...result.pages[0], url, source: sourceLabel });
  await mkdir(path.dirname(campaignFile), { recursive: true });
  await writeFile(campaignFile, JSON.stringify(saved, null, 2));
  console.log(`saved as page ${saved.pages.length}: ${sourceLabel} (${result.pages[0].text.length} chars) ${url}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => closeBrowser());
