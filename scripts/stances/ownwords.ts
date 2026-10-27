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

type WebsiteKind = "official" | "campaign";
type PageLink = { href: string; text: string };

const USER_AGENT = "Mozilla/5.0 (compatible; KnowYourRepAR/1.0; student civic project)";
const ISSUE_LINK =
  /\b(issues?|priorities|positions|platform|vision|agenda|plan|where (?:i|he|she) stands?|legislative agenda)\b/i;
const PAGES_WITHOUT_POSITIONS =
  /donate|contribut|volunteer|contact|privacy|terms|news|blog|press|media|event|store|shop|cart|login|signup|subscribe|wp-|\.pdf$|#/i;
const BLOCKED_PAGE_TITLE = /unauthorized|access denied|forbidden|just a moment/i;
const MAX_PAGES = 14;
const MAX_CHARS_PER_PAGE = 40000;
const MIN_PAGE_TEXT_CHARS = 200;
const MIN_HOME_TEXT_CHARS = 300;
const MAX_ISSUE_LINK_TEXT = 40;
const MIN_LINK_TEXT = 2;
const MAX_LINK_TEXT = 60;
const ROBOTS_TIMEOUT_MS = 15000;
const NAVIGATION_TIMEOUT_MS = 45000;
const PAGE_SETTLE_MS = 1200;
const ERROR_MESSAGE_PREVIEW_CHARS = 60;
const HTTP_ERROR_STATUS = 400;

let sharedBrowser: Promise<Browser> | null = null;

export async function closeBrowser() {
  await (await sharedBrowser)?.close();
  sharedBrowser = null;
}

async function fetchDisallowedPaths(origin: string): Promise<string[]> {
  try {
    const response = await fetch(`${origin}/robots.txt`, {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(ROBOTS_TIMEOUT_MS),
    });
    if (!response.ok) return [];
    const rules: string[] = [];
    let appliesToUs = false;
    for (const line of (await response.text()).split(/\r?\n/)) {
      const [directive, ...rest] = line.split(":");
      const value = rest.join(":").trim();
      if (/^user-agent$/i.test(directive.trim())) appliesToUs = value === "*";
      else if (appliesToUs && /^disallow$/i.test(directive.trim()) && value) rules.push(value);
    }
    return rules;
  } catch {
    return [];
  }
}

const normalizeUrl = (url: string) => url.replace(/#.*$/, "").replace(/\/$/, "");
const hostWithoutWww = (url: string) => new URL(url).hostname.replace(/^www\./, "");

const MAIN_TEXT_SCRIPT = `(() => {
    const clean = (element) => {
      const clone = element.cloneNode(true);
      clone.querySelectorAll("nav, header, footer, script, style, form, aside, [role=navigation]").forEach((node) => node.remove());
      return (clone.innerText || clone.textContent || "").replace(/\\n{3,}/g, "\\n\\n").trim();
    };
    const areas = [...document.querySelectorAll("main, [role=main], article, #main-content, #content, .content")];
    const best = areas.map(clean).sort((a, b) => b.length - a.length)[0] || "";
    const whole = clean(document.body);
    const visible = best.length >= 300 && best.length * 2 >= whole.length ? best : whole;
    const hidden = [...document.querySelectorAll("body *")].filter((element) =>
      getComputedStyle(element).display === "none" &&
      !element.closest("nav, header, footer, script, style, template, noscript, form, aside, dialog, [role=dialog], [role=navigation]") &&
      (element.textContent || "").trim().length > 80);
    const outermost = hidden.filter((element) => !hidden.some((other) => other !== element && other.contains(element)));
    const extra = outermost
      .map((element) => (element.textContent || "").replace(/\\s+/g, " ").trim())
      .filter((text) => !visible.includes(text.slice(0, 60)));
    return extra.length ? visible + "\\n\\n" + extra.join("\\n\\n") : visible;
  })()`;

export async function readPages(urls: string[], kind: WebsiteKind): Promise<OwnWords> {
  const pages: OwnWordsPage[] = [];
  for (const url of urls) {
    const result = await ownWords(url, kind, true, true);
    const requestedPage = result.pages.find((page) => page.url.replace(/\/$/, "") === url.replace(/\/$/, ""));
    if (requestedPage) pages.push(requestedPage);
  }
  return pages.length
    ? { status: "ok", note: `From ${pages.length} pages of their ${kind} website.`, pages }
    : { status: "not-found", note: `We could not read those pages of their ${kind} website.`, pages: [] };
}

export async function ownWords(
  website: string | undefined,
  kind: WebsiteKind = "official",
  fallbackToHome = false,
  onlyThisPage = false,
): Promise<OwnWords> {
  if (!website) return { status: "none", note: "We do not have an official website for this person.", pages: [] };
  sharedBrowser ??= chromium.launch();
  const context = await (await sharedBrowser).newContext({ userAgent: USER_AGENT });
  const page = await context.newPage();
  const disallowedPaths = await fetchDisallowedPaths(new URL(website).origin);

  const isAllowedByRobots = (url: string) => {
    const pathname = new URL(url).pathname;
    return !disallowedPaths.some((rule) => rule === "/" || pathname.startsWith(rule));
  };

  async function openPage(url: string) {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAVIGATION_TIMEOUT_MS });
    await page.waitForTimeout(PAGE_SETTLE_MS);
    const title = await page.title();
    const status = response?.status() ?? 0;
    return { ok: status < HTTP_ERROR_STATUS && !BLOCKED_PAGE_TITLE.test(title), title };
  }

  async function collectLinks(): Promise<PageLink[]> {
    return page.$$eval("a[href]", (anchors) =>
      anchors.map((anchor) => ({
        href: (anchor as HTMLAnchorElement).href.split("#")[0],
        text: (anchor.textContent ?? "").replace(/\s+/g, " ").trim(),
      })),
    );
  }

  async function readMainText(): Promise<string> {
    return page.evaluate(MAIN_TEXT_SCRIPT);
  }

  function isSameAllowedSite(url: string) {
    try {
      return hostWithoutWww(url) === hostWithoutWww(website!) && isAllowedByRobots(url);
    } catch {
      return false;
    }
  }

  function isUsefulLink(link: PageLink) {
    return (
      isSameAllowedSite(link.href) &&
      link.text.length > MIN_LINK_TEXT &&
      link.text.length < MAX_LINK_TEXT &&
      !PAGES_WITHOUT_POSITIONS.test(new URL(link.href).pathname + " " + link.text)
    );
  }

  try {
    if (!isAllowedByRobots(website))
      return { status: "blocked", note: "This official's website asks automated tools not to read it.", pages: [] };
    const home = await openPage(website);
    if (!home.ok) {
      return {
        status: "blocked",
        note: `This ${kind} website blocks automated tools, so we could not read it. Visit the website to read their positions.`,
        pages: [],
      };
    }

    const collected: OwnWordsPage[] = [];
    const seen = new Set<string>();

    async function collectPage(url: string, fallbackTitle: string) {
      if (seen.has(normalizeUrl(url)) || collected.length >= MAX_PAGES) return;
      seen.add(normalizeUrl(url));
      try {
        const opened = await openPage(url);
        if (!opened.ok) return;
        const text = await readMainText();
        const heading = await page
          .$eval("h1", (element) => (element.textContent ?? "").replace(/\s+/g, " ").trim())
          .catch(() => "");
        const title = heading || opened.title.split(/\s[|–-]\s/)[0] || fallbackTitle;
        if (text.length > MIN_PAGE_TEXT_CHARS) collected.push({ url, title, text: text.slice(0, MAX_CHARS_PER_PAGE) });
      } catch {
        return;
      }
    }

    const homeLinks = await collectLinks();
    const homeText = await readMainText();
    if (fallbackToHome && homeText.length > MIN_HOME_TEXT_CHARS) {
      seen.add(normalizeUrl(website));
      collected.push({ url: website, title: home.title, text: homeText.slice(0, MAX_CHARS_PER_PAGE) });
    }
    if (onlyThisPage) {
      return collected.length
        ? { status: "ok", note: `From 1 page of their ${kind} website.`, pages: collected }
        : { status: "not-found", note: `That page of their ${kind} website had no text we could read.`, pages: [] };
    }
    const issuesIndex = homeLinks.find(
      (link) => isSameAllowedSite(link.href) && ISSUE_LINK.test(link.text) && link.text.length < MAX_ISSUE_LINK_TEXT,
    );
    if (issuesIndex) {
      await collectPage(issuesIndex.href, issuesIndex.text);
      const linksFromIndex = (await collectLinks()).filter(isUsefulLink);
      for (const link of linksFromIndex) await collectPage(link.href, link.text);
    } else if (fallbackToHome) {
      for (const link of homeLinks.filter(isUsefulLink)) await collectPage(link.href, link.text);
    }

    if (!collected.length) {
      return {
        status: "not-found",
        note: issuesIndex
          ? `Their ${kind} website's issues section had no text we could read.`
          : `We could not find an issues or priorities page on their ${kind} website.`,
        pages: [],
      };
    }
    return {
      status: "ok",
      note: issuesIndex
        ? `From ${collected.length} pages of their ${kind} website, including its issues section.`
        : `From ${collected.length} pages of their ${kind} website.`,
      pages: collected,
    };
  } catch (error) {
    return {
      status: "not-found",
      note: `We could not load their official website (${(error as Error).message.slice(0, ERROR_MESSAGE_PREVIEW_CHARS)}).`,
      pages: [],
    };
  } finally {
    await context.close();
  }
}
