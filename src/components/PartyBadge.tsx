import { partyKey, partyName } from "@/lib/party";

/** Always the party name in words, plus its color. Never color alone. */
export function PartyBadge({ party }: { party: string | undefined }) {
  return <span className={`party party-${partyKey(party)}`}>{partyName(party)}</span>;
}
