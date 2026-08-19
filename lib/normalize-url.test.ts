import { describe, expect, it } from "vitest";
import { hashUrl, normalizeUrl } from "./normalize-url";

describe("normalizeUrl", () => {
  it("lowercases the host and strips a leading www.", () => {
    expect(normalizeUrl("https://WWW.Example.com/Post")).toBe("https://example.com/Post");
  });

  it("strips utm_* and known tracking params", () => {
    expect(normalizeUrl("https://example.com/post?utm_source=ig&fbclid=abc&id=5")).toBe(
      "https://example.com/post?id=5"
    );
  });

  it("unifies twitter.com to x.com", () => {
    expect(normalizeUrl("https://twitter.com/user/status/123")).toBe(
      "https://x.com/user/status/123"
    );
  });

  it("strips a trailing slash", () => {
    expect(normalizeUrl("https://example.com/post/")).toBe("https://example.com/post");
  });

  it("sorts remaining query params for a stable hash", () => {
    expect(normalizeUrl("https://example.com/post?b=2&a=1")).toBe(
      "https://example.com/post?a=1&b=2"
    );
  });
});

describe("hashUrl", () => {
  it("produces the same hash for URLs that normalize to the same value", () => {
    expect(hashUrl("https://www.example.com/post?utm_source=ig")).toBe(
      hashUrl("https://example.com/post/")
    );
  });

  it("produces a different hash for genuinely different URLs", () => {
    expect(hashUrl("https://example.com/post-1")).not.toBe(hashUrl("https://example.com/post-2"));
  });
});
