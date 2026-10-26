import { describe, expect, it } from "vitest";
import { lastName, telHref } from "@/lib/format";
import { buildMessage, buildSubject } from "@/lib/message";

describe("buildMessage", () => {
  it("writes a polite message using only what the person typed", () => {
    const msg = buildMessage(
      { name: "Steve Womack", office: "us-house" },
      { issue: "roads", why: "My road floods", ask: "Please look into it", name: "Jo", town: "Rogers" },
    );
    expect(msg).toContain("Dear Representative Womack,");
    expect(msg).toContain("My name is Jo, and I live in Rogers. I am writing about roads.");
    expect(msg).toContain("My road floods.");
    expect(msg).toContain("Please look into it.");
    expect(msg.trim().endsWith("Rogers")).toBe(true);
  });

  it("works with only the issue filled in", () => {
    const msg = buildMessage({ name: "Bart Hester", office: "state-senate" }, { issue: "schools.", why: "", ask: "", name: "", town: "" });
    expect(msg).toContain("Dear Senator Hester,");
    expect(msg).toContain("I am writing to you. I am writing about schools.");
    expect(msg).toContain("[Your name]");
  });

  it("makes a subject line", () => {
    expect(buildSubject({ issue: "housing", why: "", ask: "", name: "", town: "" })).toBe(
      "A message from a constituent about housing",
    );
  });
});

describe("format helpers", () => {
  it("finds last names", () => {
    expect(lastName('Eric A. "Rick" Crawford')).toBe("Crawford");
    expect(lastName("J. French Hill")).toBe("Hill");
    expect(lastName("John Smith Jr.")).toBe("Smith");
  });
  it("builds tel links", () => {
    expect(telHref("202-224-4843")).toBe("tel:+12022244843");
  });
});
