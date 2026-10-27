import type { CompareTopic } from "@/lib/topics";

const TOPIC_WORDS: Record<CompareTopic, string> = {
  "Jobs and the economy": "economy jobs",
  "Taxes and spending": "taxes",
  "Schools and education": "education schools",
  "Health care": "health care",
  "Public safety": "public safety crime",
  Immigration: "immigration",
  "Farming and rural life": "farmers agriculture",
  "Energy and the environment": "energy environment",
  "Roads and infrastructure": "roads infrastructure",
  "Elections and government": "elections",
};

const DEFAULT_NEWS_TERMS = "Arkansas 2026";
const NEW_TAB_LINK = { target: "_blank", rel: "noopener noreferrer" } as const;

export function ResearchLinks({
  name,
  topic,
  website,
  className = "",
}: {
  name: string;
  topic?: CompareTopic;
  website?: string;
  className?: string;
}) {
  const newsSearchTerms = topic ? TOPIC_WORDS[topic] : DEFAULT_NEWS_TERMS;
  const newsUrl = `https://news.google.com/search?q=${encodeURIComponent(`"${name}" ${newsSearchTerms}`)}`;
  const ballotpediaUrl = `https://ballotpedia.org/wiki/index.php?search=${encodeURIComponent(name)}`;
  const aboutTopic = topic ? ` about ${topic.toLowerCase()}` : "";
  return (
    <p className={`text-sm ${className}`}>
      <span className="text-ink-muted">Look it up: </span>
      {website && (
        <>
          <a href={website} {...NEW_TAB_LINK}>
            Campaign site<span className="sr-only"> of {name} (opens in a new tab)</span>
          </a>
          {" · "}
        </>
      )}
      <a href={newsUrl} {...NEW_TAB_LINK}>
        News
        <span className="sr-only">
          {" "}
          stories on {name}
          {aboutTopic} (opens in a new tab)
        </span>
      </a>
      {" · "}
      <a href={ballotpediaUrl} {...NEW_TAB_LINK}>
        Ballotpedia<span className="sr-only"> page for {name} (opens in a new tab)</span>
      </a>
    </p>
  );
}
