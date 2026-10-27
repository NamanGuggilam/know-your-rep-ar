export const GLOSSARY = {
  district: "An area of the state. Each area elects its own representative.",
  constituent: "A person who lives in an official's district. If you live there, you are their constituent.",
  legislature: "The group of elected people who make laws.",
  "general-assembly": "Arkansas's legislature. It has two parts: the State Senate and the State House of Representatives.",
  congress: "The national legislature in Washington, D.C. It has two parts: the U.S. Senate and the U.S. House of Representatives.",
  bill: "An idea for a new law, written down. It becomes a law only if lawmakers vote for it and it is signed.",
  party: "A group of people with shared ideas about government. Officials list the party they belong to.",
  term: "How long an official serves before the next election for that seat.",
  "federal": "About the whole country. Federal laws are made in Washington, D.C.",
  state: "About Arkansas only. State laws are made in Little Rock.",
  register: "Signing up to vote. You must do this before you can vote in Arkansas.",
  "county-clerk": "The county office that keeps the list of voters. They handle voter registration.",
  precinct: "A small voting area. Your precinct decides where you vote on Election Day.",
  "polling-place": "The place where you go to vote in person.",
  "provisional-ballot": "A ballot you can use if there is a question about your voter registration or ID. It is counted later, once the question is answered.",
  absentee: "Voting by mail instead of in person. In Arkansas, you need a reason, like being away or having an illness or disability.",
  "early-voting": "Voting in person on certain days before Election Day.",
  nonpartisan: "Not taking the side of any political party.",
  casework: "Help an official's office gives you with a government agency. For example, a lost Social Security check.",
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;
