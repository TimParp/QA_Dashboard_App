import { describe, it, expect } from "vitest";
import { validateFiles, isImageMime, MAX_FILE_BYTES } from "@/lib/attachments/validation";

describe("validateFiles", () => {
  it("accepts a valid image", () => {
    expect(validateFiles([{ name: "a.png", type: "image/png", size: 1000 }], 0)).toBeNull();
  });

  it("rejects a disallowed type including svg", () => {
    expect(
      validateFiles([{ name: "a.svg", type: "image/svg+xml", size: 10 }], 0),
    ).toMatch(/not allowed/i);
  });

  it("rejects an oversize file", () => {
    expect(
      validateFiles([{ name: "big.png", type: "image/png", size: MAX_FILE_BYTES + 1 }], 0),
    ).toMatch(/too large/i);
  });

  it("rejects when the batch exceeds the per-issue cap against existing", () => {
    const files = Array.from({ length: 5 }, (_, i) => ({ name: `${i}.png`, type: "image/png", size: 1 }));
    expect(validateFiles(files, 6)).toMatch(/max 10/i);
  });

  it("returns null for an empty batch", () => {
    expect(validateFiles([], 0)).toBeNull();
  });
});

describe("isImageMime", () => {
  it("is true for images and false for documents", () => {
    expect(isImageMime("image/png")).toBe(true);
    expect(isImageMime("application/pdf")).toBe(false);
  });
});
