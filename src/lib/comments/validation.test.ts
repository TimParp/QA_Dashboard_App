import { describe, it, expect } from "vitest";
import { validateCommentBody, MAX_COMMENT_LENGTH } from "@/lib/comments/validation";

describe("validateCommentBody", () => {
  it("accepts a normal comment", () => {
    expect(validateCommentBody("Looks good")).toBeNull();
  });

  it("rejects an empty or whitespace-only body", () => {
    expect(validateCommentBody("")).toMatch(/empty/i);
    expect(validateCommentBody("   \n  ")).toMatch(/empty/i);
  });

  it("rejects a body longer than the max", () => {
    expect(validateCommentBody("x".repeat(MAX_COMMENT_LENGTH + 1))).toMatch(/or fewer/i);
  });

  it("accepts a body exactly at the max after trimming", () => {
    expect(validateCommentBody("x".repeat(MAX_COMMENT_LENGTH))).toBeNull();
  });
});
