import { partyKey, partyName } from "@/lib/party";

export function PartyBadge({ party }: { party: string | undefined }) {
  return <span className={`party party-${partyKey(party)}`}>{partyName(party)}</span>;
}
