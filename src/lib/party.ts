/** Party color group: Reversal Red (Republican), Lapse Blue (Democratic), Hollow Purple (everyone else). */
export type PartyKey = "r" | "d" | "o";

export function partyKey(party: string | undefined): PartyKey {
  const p = (party ?? "").toLowerCase();
  if (p.startsWith("republican")) return "r";
  if (p.startsWith("democrat")) return "d";
  return "o";
}

/** "Republican" -> "Republican Party", "Democrat" -> "Democratic Party", "Independent" -> "Independent" */
export function partyName(party: string | undefined) {
  const p = (party ?? "").trim();
  if (!p || /^not listed$/i.test(p)) return "No party listed";
  if (/^democrat(ic)?$/i.test(p)) return "Democratic Party";
  if (/^republican$/i.test(p)) return "Republican Party";
  if (/^(independent|nonpartisan|no party)/i.test(p)) return p;
  return /party$/i.test(p) ? p : `${p} Party`;
}

/** The closing line under each candidate on the comparison page. */
export function memberSentence(party: string | undefined) {
  const name = partyName(party);
  if (name === "No party listed") return "No party is listed for this candidate.";
  if (/^(independent|nonpartisan|no party)/i.test(name)) return `Running as ${name.toLowerCase()}, not as a member of a party.`;
  return `Member of the ${name}.`;
}
