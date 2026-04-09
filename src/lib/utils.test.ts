import { describe, it, expect, vi, afterEach } from "vitest";
import {
  cn,
  formatRelativeTime,
  parsePostContent,
  getInitials,
  validateUsername,
  getSupabaseFileUrl,
} from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("resolves Tailwind conflicts (last wins)", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });
});

describe("formatRelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns seconds for < 60s", () => {
    vi.useFakeTimers();
    const now = new Date("2025-06-01T12:00:30Z");
    vi.setSystemTime(now);

    expect(formatRelativeTime("2025-06-01T12:00:00Z")).toBe("30s");
  });

  it("returns minutes for < 60m", () => {
    vi.useFakeTimers();
    const now = new Date("2025-06-01T12:05:00Z");
    vi.setSystemTime(now);

    expect(formatRelativeTime("2025-06-01T12:00:00Z")).toBe("5m");
  });

  it("returns hours for < 24h", () => {
    vi.useFakeTimers();
    const now = new Date("2025-06-01T15:00:00Z");
    vi.setSystemTime(now);

    expect(formatRelativeTime("2025-06-01T12:00:00Z")).toBe("3h");
  });

  it("returns days for < 7d", () => {
    vi.useFakeTimers();
    const now = new Date("2025-06-04T12:00:00Z");
    vi.setSystemTime(now);

    expect(formatRelativeTime("2025-06-01T12:00:00Z")).toBe("3d");
  });

  it("returns 'MMM d' for same year, > 7 days", () => {
    vi.useFakeTimers();
    const now = new Date("2025-06-20T12:00:00Z");
    vi.setSystemTime(now);

    expect(formatRelativeTime("2025-06-01T12:00:00Z")).toBe("Jun 1");
  });

  it("returns 'MMM d, yyyy' for different year", () => {
    vi.useFakeTimers();
    const now = new Date("2026-01-15T12:00:00Z");
    vi.setSystemTime(now);

    expect(formatRelativeTime("2025-06-01T12:00:00Z")).toBe("Jun 1, 2025");
  });
});

describe("parsePostContent", () => {
  it("returns plain text as a single text segment", () => {
    expect(parsePostContent("Hello world")).toEqual([{ type: "text", value: "Hello world" }]);
  });

  it("parses @mentions", () => {
    const result = parsePostContent("Hello @juan!");
    expect(result).toEqual([
      { type: "text", value: "Hello " },
      { type: "mention", value: "@juan" },
      { type: "text", value: "!" },
    ]);
  });

  it("parses #hashtags", () => {
    const result = parsePostContent("Trending #topic now");
    expect(result).toEqual([
      { type: "text", value: "Trending " },
      { type: "hashtag", value: "#topic" },
      { type: "text", value: " now" },
    ]);
  });

  it("parses URLs", () => {
    const result = parsePostContent("Visit https://example.com today");
    expect(result).toEqual([
      { type: "text", value: "Visit " },
      { type: "url", value: "https://example.com" },
      { type: "text", value: " today" },
    ]);
  });

  it("handles mixed content", () => {
    const result = parsePostContent("Hey @user check #tag at https://x.com");
    expect(result).toEqual([
      { type: "text", value: "Hey " },
      { type: "mention", value: "@user" },
      { type: "text", value: " check " },
      { type: "hashtag", value: "#tag" },
      { type: "text", value: " at " },
      { type: "url", value: "https://x.com" },
    ]);
  });

  it("returns empty array for empty string", () => {
    expect(parsePostContent("")).toEqual([]);
  });

  it("handles mention at start of string", () => {
    const result = parsePostContent("@user hello");
    expect(result).toEqual([
      { type: "mention", value: "@user" },
      { type: "text", value: " hello" },
    ]);
  });

  it("handles hashtag at end of string", () => {
    const result = parsePostContent("check #trending");
    expect(result).toEqual([
      { type: "text", value: "check " },
      { type: "hashtag", value: "#trending" },
    ]);
  });
});

describe("getInitials", () => {
  it("returns initials for two words", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("returns single initial for one word", () => {
    expect(getInitials("Alice")).toBe("A");
  });

  it("returns max 2 initials for 3+ words", () => {
    expect(getInitials("Juan Carlos Garcia")).toBe("JC");
  });

  it("uppercases initials", () => {
    expect(getInitials("jane doe")).toBe("JD");
  });
});

describe("validateUsername", () => {
  it("returns null for valid username", () => {
    expect(validateUsername("valid_user1")).toBeNull();
  });

  it("returns error for too short (< 3)", () => {
    expect(validateUsername("ab")).toBe("Mínimo 3 caracteres");
  });

  it("returns error for too long (> 15)", () => {
    expect(validateUsername("a".repeat(16))).toBe("Máximo 15 caracteres");
  });

  it("returns error for invalid characters", () => {
    expect(validateUsername("user name")).toBe("Solo letras, números y guiones bajos");
  });

  it("accepts exactly 3 characters", () => {
    expect(validateUsername("abc")).toBeNull();
  });

  it("accepts exactly 15 characters", () => {
    expect(validateUsername("a".repeat(15))).toBeNull();
  });

  it("rejects hyphens", () => {
    expect(validateUsername("user-name")).toBe("Solo letras, números y guiones bajos");
  });

  it("accepts underscores", () => {
    expect(validateUsername("user_name")).toBeNull();
  });
});

describe("getSupabaseFileUrl", () => {
  it("constructs the correct URL", () => {
    expect(getSupabaseFileUrl("avatars", "user/photo.jpg")).toBe(
      "https://test.supabase.co/storage/v1/object/public/avatars/user/photo.jpg"
    );
  });
});
