import type { OfficeKind } from "./types";

export interface OfficeInfo {
  name: string;
  /** Used in "Dear ___ Smith" */
  honorific: string;
  /** One line for the rep card */
  short: string;
  /** Longer plain-language explanation */
  long: string[];
  term: string;
  howMany: string;
  /** What the office can do. Facts from the U.S. and Arkansas constitutions. */
  powers: string[];
  contactFor: string[];
}

// Written at a 6th-8th grade reading level. Facts only, no opinions.
export const OFFICES: Record<OfficeKind, OfficeInfo> = {
  "us-senate": {
    name: "U.S. Senator",
    honorific: "Senator",
    short: "Makes national laws in Washington, D.C., for all of Arkansas.",
    long: [
      "U.S. Senators work in the U.S. Senate in Washington, D.C. They vote on national laws.",
      "The Senate also approves people the President picks for important jobs, like federal judges. It votes on treaties with other countries too.",
      "Every state has two U.S. Senators. Both of them represent everyone in Arkansas.",
    ],
    term: "6 years",
    howMany: "2 for all of Arkansas (100 in the whole country)",
    powers: [
      "Writes and votes on national laws. A bill needs to pass both the Senate and the House.",
      "Approves or rejects the people the President picks for top jobs, like federal judges, Supreme Court justices, and Cabinet members.",
      "Approves treaties with other countries. This takes a two-thirds vote.",
      "Holds the trial when a federal official is impeached.",
      "With the House: sets the federal budget and taxes, can declare war, and can override a President's veto with a two-thirds vote.",
    ],
    contactFor: [
      "National laws and the federal budget",
      "Help with a federal agency, like Social Security, Medicare, the VA, or the IRS",
      "Passports and immigration questions",
      "Military and veterans issues",
    ],
  },
  "us-house": {
    name: "U.S. Representative",
    honorific: "Representative",
    short: "Makes national laws in Washington, D.C., for your part of Arkansas.",
    long: [
      "U.S. Representatives work in the U.S. House of Representatives in Washington, D.C. They vote on national laws.",
      "Each one represents one area, called a congressional district. Arkansas has 4 congressional districts.",
      "Under the U.S. Constitution, bills about raising taxes must start in the House.",
    ],
    term: "2 years",
    howMany: "4 in Arkansas, 1 for your district (435 in the whole country)",
    powers: [
      "Writes and votes on national laws. A bill needs to pass both the House and the Senate.",
      "Bills to raise taxes must start in the House.",
      "Can impeach (formally charge) a federal official, like a President or a judge.",
      "Picks the President if no candidate wins a majority in the Electoral College.",
      "With the Senate: sets the federal budget and taxes, can declare war, and can override a President's veto with a two-thirds vote.",
    ],
    contactFor: [
      "National laws and the federal budget",
      "Help with a federal agency, like Social Security, Medicare, the VA, or the IRS",
      "Passports and immigration questions",
      "Issues in your part of the state that need federal help",
    ],
  },
  "state-senate": {
    name: "Arkansas State Senator",
    honorific: "Senator",
    short: "Makes Arkansas state laws at the State Capitol in Little Rock.",
    long: [
      "State Senators work in the Arkansas Senate at the State Capitol in Little Rock. They vote on Arkansas laws and the state budget.",
      "The Arkansas Senate and the Arkansas House together are called the General Assembly. That is Arkansas's legislature.",
      "Each State Senator represents one state senate district.",
    ],
    term: "4 years (some terms are 2 years right after district lines are redrawn)",
    howMany: "35 in Arkansas",
    powers: [
      "Writes and votes on Arkansas laws. A bill needs to pass both the State Senate and the State House.",
      "Votes on the state budget: how Arkansas spends its money.",
      "Approves or rejects many of the people the Governor appoints to state boards and jobs.",
      "Holds the trial when a state official is impeached.",
      "With the House: can override the Governor's veto with a majority vote, and can send up to three changes to the Arkansas Constitution to voters at a general election.",
    ],
    contactFor: [
      "Public schools and colleges",
      "State highways and roads",
      "Driver's licenses and state taxes",
      "State programs like ARKids First and Medicaid",
      "Arkansas laws on jobs, health, and safety",
    ],
  },
  "state-house": {
    name: "Arkansas State Representative",
    honorific: "Representative",
    short: "Makes Arkansas state laws at the State Capitol in Little Rock.",
    long: [
      "State Representatives work in the Arkansas House of Representatives at the State Capitol in Little Rock. They vote on Arkansas laws and the state budget.",
      "Each one represents a small area, so they are often the easiest official to reach. Many of them live near you.",
    ],
    term: "2 years",
    howMany: "100 in Arkansas",
    powers: [
      "Writes and votes on Arkansas laws. A bill needs to pass both the State House and the State Senate.",
      "Votes on the state budget: how Arkansas spends its money.",
      "Can impeach (formally charge) a state official, like the Governor or a judge.",
      "With the Senate: can override the Governor's veto with a majority vote, and can send up to three changes to the Arkansas Constitution to voters at a general election.",
    ],
    contactFor: [
      "Public schools and colleges",
      "State highways and roads",
      "Driver's licenses and state taxes",
      "State programs like ARKids First and Medicaid",
      "Arkansas laws on jobs, health, and safety",
    ],
  },
};
