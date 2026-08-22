import { describe, expect, it } from "vitest";
import { instagramProvider } from "./instagram";

describe("instagramProvider.matches", () => {
  it("matches the bare post form", () => {
    expect(instagramProvider.matches("https://www.instagram.com/p/DEH3huSR4d3/")).toBe(true);
  });

  it("matches the username-prefixed post form", () => {
    expect(instagramProvider.matches("https://www.instagram.com/natgeo/p/DEH3huSR4d3/")).toBe(true);
  });

  it("matches the reel form", () => {
    expect(instagramProvider.matches("https://www.instagram.com/reel/DEH3huSR4d3/")).toBe(true);
  });

  it("does not match a bare profile URL", () => {
    expect(instagramProvider.matches("https://www.instagram.com/natgeo/")).toBe(false);
  });
});
