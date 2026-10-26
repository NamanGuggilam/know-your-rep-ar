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
const ISSUE_LINK =
  /\b(issues?|priorities|positions|platform|vision|agenda|plan|where (?:i|he|she) stands?|legislative agenda)\b/i;
const MAX_PAGES = 14;
const MAX_CHARS_PER_PAGE = 40000;

let browser: Promise<Browser> | null = null;
export async function closeBrowser() {
  await (await browser)?.close();
  browser = null;
}

async function disallowed(origin: string): Promise<string[]> {
  try {
    const res = await fetch(`${origin}/robots.txt`, {
      headers: { "user-agent": UA },
      signal: AbortSignal.timeout(15000),
    });
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

/** Read exactly these pages (same rules: robots.txt respected, blocks never bypassed). */
export async function readPages(urls: string[], kind: "official" | "campaign"): Promise<OwnWords> {
  const pages: OwnWordsPage[] = [];
  for (const u of urls) {
    const r = await ownWords(u, kind, true, true);
    const first = r.pages.find((p) => p.url.replace(/\/$/, "") === u.replace(/\/$/, ""));
    if (first) pages.push(first);
  }
  return pages.length
    ? { status: "ok", note: `From ${pages.length} pages of their ${kind} website.`, pages }
    : { status: "not-found", note: `We could not read those pages of their ${kind} website.`, pages: [] };
}

/**
 * Crawl a site's issues/priorities pages. `kind` only changes the wording of notes.
 * With `fallbackToHome`, a site with no issues section contributes its home page text instead.
 */
export async function ownWords(
  website: string | undefined,
  kind: "official" | "campaign" = "official",
  fallbackToHome = false,
  onlyThisPage = false,
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
      as.map((a) => ({
        href: (a as HTMLAnchorElement).href.split("#")[0],
        text: (a.textContent ?? "").replace(/\s+/g, " ").trim(),
      })),
    );
  }

  // Runs in the browser. Passed as a string so the TypeScript runner can't inject helpers into it.
  // Some sites mark a tiny block as <main>, so use the biggest content area, or the whole page.
  const MAIN_TEXT = `(() => {
    const clean = (el) => {
      const clone = el.cloneNode(true);
      clone.querySelectorAll("nav, header, footer, script, style, form, aside, [role=navigation]").forEach((n) => n.remove());
      return (clone.innerText || clone.textContent || "").replace(/\\n{3,}/g, "\\n\\n").trim();
    };
    const areas = [...document.querySelectorAll("main, [role=main], article, #main-content, #content, .content")];
    const best = areas.map(clean).sort((a, b) => b.length - a.length)[0] || "";
    // If most of the page's text sits outside that area, read the whole page instead.
    const whole = clean(document.body);
    const visible = best.length >= 300 && best.length * 2 >= whole.length ? best : whole;
    // Collapsed tabs and accordions hide their text from innerText. Add it, skipping menus, forms, and pop-ups.
    const hidden = [...document.querySelectorAll("body *")].filter((el) =>
      getComputedStyle(el).display === "none" &&
      !el.closest("nav, header, footer, script, style, template, noscript, form, aside, dialog, [role=dialog], [role=navigation]") &&
      (el.textContent || "").trim().length > 80);
    const outer = hidden.filter((el) => !hidden.some((o) => o !== el && o.contains(el)));
    const extra = outer.map((el) => (el.textContent || "").replace(/\\s+/g, " ").trim()).filter((t) => !visible.includes(t.slice(0, 60)));
    return extra.length ? visible + "\\n\\n" + extra.join("\\n\\n") : visible;
  })()`;
  async function mainText(): Promise<string> {
    return page.evaluate(MAIN_TEXT);
  }

  // Pages that never hold positions.
  const SKIP =
    /donate|contribut|volunteer|contact|privacy|terms|news|blog|press|media|event|store|shop|cart|login|signup|subscribe|wp-|\.pdf$|#/i;

  try {
    if (!allowed(website))
      return { status: "blocked", note: "This official's website asks automated tools not to read it.", pages: [] };
    const home = await open(website);
    if (!home.ok) {
      return {
        status: "blocked",
        note: `This ${kind} website blocks automated tools, so we could not read it. Visit the website to read their positions.`,
        pages: [],
      };
    }
    // "www.example.com" and "example.com" are the same site.
    const host = (u: string) => new URL(u).hostname.replace(/^www\./, "");
    const sameSite = (h: string) => {
      try {
        return host(h) === host(website) && allowed(h);
      } catch {
        return false;
      }
    };
    const norm = (u: string) => u.replace(/#.*$/, "").replace(/\/$/, "");
    const useful = (l: { href: string; text: string }) =>
      sameSite(l.href) &&
      l.text.length > 2 &&
      l.text.length < 60 &&
      !SKIP.test(new URL(l.href).pathname + " " + l.text);

    const out: OwnWordsPage[] = [];
    const seen = new Set<string>();
    async function grab(url: string, fallbackTitle: string) {
      if (seen.has(norm(url)) || out.length >= MAX_PAGES) return;
      seen.add(norm(url));
      try {
        const r = await open(url);
        if (!r.ok) return;
        const text = await mainText();
        const heading = await page
          .$eval("h1", (h) => (h.textContent ?? "").replace(/\s+/g, " ").trim())
          .catch(() => "");
        const title = heading || r.title.split(/\s[|–-]\s/)[0] || fallbackTitle;
        if (text.length > 200) out.push({ url, title, text: text.slice(0, MAX_CHARS_PER_PAGE) });
      } catch {
        // Skip pages that fail to load.
      }
    }

    const homeLinks = await links();
    const homeText = await mainText();
    // Some sites put their issues right on the home page, so it counts too.
    if (fallbackToHome && homeText.length > 300) {
      seen.add(norm(website));
      out.push({ url: website, title: home.title, text: homeText.slice(0, MAX_CHARS_PER_PAGE) });
    }
    if (onlyThisPage) {
      return out.length
        ? { status: "ok", note: `From 1 page of their ${kind} website.`, pages: out }
        : { status: "not-found", note: `That page of their ${kind} website had no text we could read.`, pages: [] };
    }
    const index = homeLinks.find((l) => sameSite(l.href) && ISSUE_LINK.test(l.text) && l.text.length < 40);
    if (index) {
      await grab(index.href, index.text);
      // Every useful page linked from the issues page (sites split issues into pages with any names).
      const fromIndex = (await links()).filter(useful);
      for (const l of fromIndex) await grab(l.href, l.text);
    } else if (fallbackToHome) {
      for (const l of homeLinks.filter(useful)) await grab(l.href, l.text);
    }

    if (!out.length) {
      return {
        status: "not-found",
        note: index
          ? `Their ${kind} website's issues section had no text we could read.`
          : `We could not find an issues or priorities page on their ${kind} website.`,
        pages: [],
      };
    }
    return {
      status: "ok",
      note: index
        ? `From ${out.length} pages of their ${kind} website, including its issues section.`
        : `From ${out.length} pages of their ${kind} website.`,
      pages: out,
    };
  } catch (e) {
    return {
      status: "not-found",
      note: `We could not load their official website (${(e as Error).message.slice(0, 60)}).`,
      pages: [],
    };
  } finally {
    await ctx.close();
  }
}
