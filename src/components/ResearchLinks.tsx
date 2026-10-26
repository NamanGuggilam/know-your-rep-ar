import type { CompareTopic } from "@/lib/ballot";

// Plain words to search the news with, for each topic.
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

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

/**
 * Neutral places to keep researching when we found nothing in a candidate's own words.
 * Same three kinds of links for every candidate.
 */
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
  const news = `https://news.google.com/search?q=${encodeURIComponent(`"${name}" ${topic ? TOPIC_WORDS[topic] : "Arkansas 2026"}`)}`;
  const ballotpedia = `https://ballotpedia.org/wiki/index.php?search=${encodeURIComponent(name)}`;
  const about = topic ? ` about ${topic.toLowerCase()}` : "";
  return (
    <p className={`text-sm ${className}`}>
      <span className="text-ink-muted">Look it up: </span>
      {website && (
        <>
          <a href={website} {...ext}>
            Campaign site<span className="sr-only"> of {name} (opens in a new tab)</span>
          </a>
          {" · "}
        </>
      )}
      <a href={news} {...ext}>
        News
        <span className="sr-only">
          {" "}
          stories on {name}
          {about} (opens in a new tab)
        </span>
      </a>
      {" · "}
      <a href={ballotpedia} {...ext}>
        Ballotpedia<span className="sr-only"> page for {name} (opens in a new tab)</span>
      </a>
    </p>
  );
}
