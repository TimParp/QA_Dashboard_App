import { promises as fs } from "node:fs";
import path from "node:path";
import type { StorageDriver } from "./types";

function baseDir(): string {
  return path.resolve(process.env.LOCAL_STORAGE_DIR ?? "uploads");
}

function fullPath(key: string): string {
  return path.join(baseDir(), key);
}

export const localDiskDriver: StorageDriver = {
  async put(key, bytes) {
    const target = fullPath(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes);
  },
  async get(key) {
    return fs.readFile(fullPath(key));
  },
  async delete(key) {
    await fs.rm(fullPath(key), { force: true });
  },
};
