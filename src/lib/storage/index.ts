import type { StorageDriver } from "./types";
import { localDiskDriver } from "./local-disk";
import { s3Driver } from "./s3";

export type { StorageDriver } from "./types";

export function getStorage(): StorageDriver {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "local") return localDiskDriver;
  if (driver === "s3") return s3Driver;
  throw new Error(`Unknown STORAGE_DRIVER: ${driver}`);
}
