import { describe, expect, it } from "vitest";
import { normalize } from "../../scripts/stances/organize";

describe("quote check normalization", () => {
  it("ignores curly quotes, dashes, and extra spaces", () => {
    const page = "We must  protect Arkansas’s farmers — and their families.";
    expect(normalize(page).includes(normalize("protect Arkansas's farmers - and their families."))).toBe(true);
  });
  it("still rejects changed words", () => {
    const page = "We must protect Arkansas farmers.";
    expect(normalize(page).includes(normalize("We must help Arkansas farmers."))).toBe(false);
  });
});
