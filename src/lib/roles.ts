import { OFFICES } from "./offices";
import type { OfficeKind } from "./types";

export interface Role {
  id: string;
  level: "Arkansas" | "National";
  name: string;
  where: string;
  howMany: string;
  term: string;
  powers: string[];
  responsibleFor: string[];
}

const fromOffice = (k: OfficeKind, level: Role["level"], where: string): Role => ({
  id: k,
  level,
  name: OFFICES[k].name,
  where,
  howMany: OFFICES[k].howMany,
  term: OFFICES[k].term,
  powers: OFFICES[k].powers,
  responsibleFor: OFFICES[k].contactFor,
});

export const GOVERNOR: Role = {
  id: "governor",
  level: "Arkansas",
  name: "Governor of Arkansas",
  where: "State Capitol, Little Rock",
  howMany: "1 for all of Arkansas",
  term: "4 years",
  powers: [
    "Signs bills into law or vetoes (rejects) them. Lawmakers can override a veto with a majority vote.",
    "Proposes a state budget to the legislature.",
    "Runs state agencies and appoints many state officials. The State Senate approves many of these picks.",
    "Can call lawmakers back for a special session.",
    "Can pardon people or shorten sentences for state crimes.",
    "Leads the Arkansas National Guard when it is not called into federal service.",
  ],
  responsibleFor: ["State agencies and programs", "Emergencies and disasters in Arkansas", "Carrying out state laws"],
};

export const STATEWIDE = [
  { name: "Lieutenant Governor", job: "Leads the State Senate and votes only to break a tie. Steps in as Governor if the Governor cannot serve." },
  { name: "Attorney General", job: "The state's lawyer. Represents Arkansas in court and handles consumer protection." },
  { name: "Secretary of State", job: "Oversees state elections and keeps official state records and business filings." },
  { name: "Treasurer of State", job: "Manages and invests the state's money." },
  { name: "Auditor of State", job: "Keeps the state's accounts, pays the state's bills, and runs the unclaimed property program." },
  { name: "Commissioner of State Lands", job: "Manages state-owned land and sells land with unpaid property taxes." },
];

export const ROLES: Role[] = [
  fromOffice("state-house", "Arkansas", "State Capitol, Little Rock"),
  fromOffice("state-senate", "Arkansas", "State Capitol, Little Rock"),
  GOVERNOR,
  fromOffice("us-house", "National", "U.S. Capitol, Washington, D.C."),
  fromOffice("us-senate", "National", "U.S. Capitol, Washington, D.C."),
];

