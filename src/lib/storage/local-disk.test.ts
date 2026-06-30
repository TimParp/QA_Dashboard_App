import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import { localDiskDriver } from "@/lib/storage/local-disk";

const TMP = path.resolve(".test-uploads");

beforeAll(() => {
  process.env.LOCAL_STORAGE_DIR = TMP;
});
afterAll(async () => {
  await fs.rm(TMP, { recursive: true, force: true });
});

describe("localDiskDriver", () => {
  it("round-trips put then get", async () => {
    await localDiskDriver.put("attachments/i1/k1", Buffer.from("hello"), "text/plain");
    const got = await localDiskDriver.get("attachments/i1/k1");
    expect(got.toString()).toBe("hello");
  });

  it("deletes a key, and deleting a missing key is safe", async () => {
    await localDiskDriver.put("attachments/i1/k2", Buffer.from("x"), "text/plain");
    await localDiskDriver.delete("attachments/i1/k2");
    await expect(localDiskDriver.delete("attachments/i1/k2")).resolves.toBeUndefined();
  });
});
