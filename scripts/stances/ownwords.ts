// Reads the "Issues" / "Priorities" pages on an official's own .gov website.
// We respect robots.txt and never try to get around a site that blocks automated visitors.
import { chromium, type Browser } from "@playwright/test";

export interface OwnWordsPage {
  url: string;
  title: string;
  text: string;
}

export interface OwnWords {
  status: "ok" | "blocked" | "none" | "not-found";
  note: string;
  pages: OwnWordsPage[];
}

const UA = "Mozilla/5.0 (compatible; KnowYourRepAR/1.0; student civic project)";
const ISSUE_LINK = /\b(issues?|priorities|positions|platform|vision|agenda|plan|where (?:i|he|she) stands?|legislative agenda)\b/i;
const MAX_PAGES = 20;
const MAX_CHARS_PER_PAGE = 12000;

let browser: Promise<Browser> | null = null;
export async function closeBrowser() {
  await (await browser)?.close();
  browser = null;
}

async function disallowed(origin: string): Promise<string[]> {
  try {
    const res = await fetch(`${origin}/robots.txt`, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const rules: string[] = [];
    let applies = false;
    for (const line of (await res.text()).split(/\r?\n/)) {
      const [k, ...rest] = line.split(":");
      const v = rest.join(":").trim();
      if (/^user-agent$/i.test(k.trim())) applies = v === "*";
      else if (applies && /^disallow$/i.test(k.trim()) && v) rules.push(v);
    }
    return rules;
  } catch {
    return [];
  }
}

/**
 * Crawl a site's issues/priorities pages. `kind` only changes the wording of notes.
 * With `fallbackToHome`, a site with no issues section contributes its home page text instead.
 */
export async function ownWords(
  website: string | undefined,
  kind: "official" | "campaign" = "official",
  fallbackToHome = false,
): Promise<OwnWords> {
  if (!website) return { status: "none", note: "We do not have an official website for this person.", pages: [] };
  browser ??= chromium.launch();
  const ctx = await (await browser).newContext({ userAgent: UA });
  const page = await ctx.newPage();
  const origin = new URL(website).origin;
  const blockedPaths = await disallowed(origin);
  const allowed = (u: string) => {
    const p = new URL(u).pathname;
    return !blockedPaths.some((r) => r === "/" || p.startsWith(r));
  };

  async function open(url: string) {
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1200);
    const title = await page.title();
    const status = res?.status() ?? 0;
    return { ok: status < 400 && !/unauthorized|access denied|forbidden|just a moment/i.test(title), title };
  }

  async function links() {
    return page.$$eval("a[href]", (as) =>
      as.map((a) => ({ href: (a as HTMLAnchorElement).href.split("#")[0], text: (a.textContent ?? "").replace(/\s+/g, " ").trim() })),
    );
  }

  async function mainText() {
    return page.evaluate(() => {
      const root = document.querySelector("main, [role=main], article, #main-content, #content, .content") ?? document.body;
      const clone = root.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("nav, header, footer, script, style, form, aside, [role=navigation]").forEach((n) => n.remove());
      return (clone.innerText || "").replace(/\n{3,}/g, "\n\n").trim();
    });
  }

  try {
    if (!allowed(website)) return { status: "blocked", note: "This official's website asks automated tools not to read it.", pages: [] };
    const home = await open(website);
    if (!home.ok) {
      return {
        status: "blocked",
        note: `This ${kind} website blocks automated tools, so we could not read it. Visit the website to read their positions.`,
        pages: [],
      };
    }
    const sameSite = (h: string) => h.startsWith(origin) && allowed(h);
    const index = (await links()).find((l) => sameSite(l.href) && ISSUE_LINK.test(l.text) && l.text.length < 40);
    if (!index) {
      if (fallbackToHome) {
        const text = await mainText();
        if (text.length > 400) {
          return {
            status: "ok",
            note: `From the home page of their ${kind} website (it has no separate issues page).`,
            pages: [{ url: website, title: home.title, text: text.slice(0, MAX_CHARS_PER_PAGE) }],
          };
        }
      }
      return { status: "not-found", note: `We could not find an issues or priorities page on their ${kind} website.`, pages: [] };
    }

    const out: OwnWordsPage[] = [];
    await open(index.href);
    const indexText = await mainText();
    const indexPath = new URL(index.href).pathname.toLowerCase().replace(/\/$/, "");
    const subLinks = [
      ...new Map(
        (await links())
          .filter((l) => sameSite(l.href) && l.href !== index.href && l.text.length > 2 && l.text.length < 60 && !/back to top|skip/i.test(l.text))
          .filter((l) => {
            const p = new URL(l.href).pathname.toLowerCase();
            return (p.startsWith(indexPath + "/") || /issue/i.test(l.href)) && !/press|news|media|contact|video/i.test(p);
          })
          .map((l) => [l.href, l]),
      ).values(),
    ].slice(0, MAX_PAGES);

    if (subLinks.length === 0 && indexText.length > 400) {
      out.push({ url: index.href, title: index.text, text: indexText.slice(0, MAX_CHARS_PER_PAGE) });
    }
    for (const l of subLinks) {
      try {
        const r = await open(l.href);
        if (!r.ok) continue;
        const text = await mainText();
        const heading = await page.$eval("h1", (h) => (h.textContent ?? "").replace(/\s+/g, " ").trim()).catch(() => "");
        const title = heading || r.title.split(/\s[|–-]\s/)[0] || l.text;
        if (text.length > 200) out.push({ url: l.href, title, text: text.slice(0, MAX_CHARS_PER_PAGE) });
      } catch {
        // Skip pages that fail to load.
      }
    }
    return out.length
      ? { status: "ok", note: `From ${out.length} issue pages on their ${kind} website.`, pages: out }
      : { status: "not-found", note: "Their official website's issues section had no text we could read.", pages: [] };
  } catch (e) {
    return { status: "not-found", note: `We could not load their official website (${(e as Error).message.slice(0, 60)}).`, pages: [] };
  } finally {
    await ctx.close();
  }
}
