import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Design Inspo")).toBe("design-inspo");
  });

  it("collapses non-alphanumeric runs into a single hyphen", () => {
    expect(slugify("Cool  Stuff!! & More")).toBe("cool-stuff-more");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("--Weird Name--")).toBe("weird-name");
  });

  it("falls back to a placeholder for an empty/symbols-only name", () => {
    expect(slugify("!!!")).toBe("board");
    expect(slugify("")).toBe("board");
  });
});
