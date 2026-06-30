import { describe, it, expect, afterEach } from "vitest";
import { getStorage } from "@/lib/storage";
import { localDiskDriver } from "@/lib/storage/local-disk";

describe("getStorage", () => {
  afterEach(() => {
    delete process.env.STORAGE_DRIVER;
  });

  it("returns the local driver when STORAGE_DRIVER=local", () => {
    process.env.STORAGE_DRIVER = "local";
    expect(getStorage()).toBe(localDiskDriver);
  });

  it("defaults to the local driver when STORAGE_DRIVER is unset", () => {
    delete process.env.STORAGE_DRIVER;
    expect(getStorage()).toBe(localDiskDriver);
  });

  it("returns an object for STORAGE_DRIVER=s3", () => {
    process.env.STORAGE_DRIVER = "s3";
    expect(typeof getStorage().put).toBe("function");
  });

  it("throws on an unknown driver", () => {
    process.env.STORAGE_DRIVER = "nope";
    expect(() => getStorage()).toThrow(/Unknown STORAGE_DRIVER/);
  });
});
