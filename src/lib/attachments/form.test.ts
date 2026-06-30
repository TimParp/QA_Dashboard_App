import { describe, it, expect } from "vitest";
import { readUploadFiles } from "@/lib/attachments/form";

describe("readUploadFiles", () => {
  it("maps selected files to upload objects with bytes", async () => {
    const fd = new FormData();
    fd.append("attachments", new File([Buffer.from("hello")], "a.png", { type: "image/png" }));
    const uploads = await readUploadFiles(fd);
    expect(uploads).toHaveLength(1);
    expect(uploads[0].name).toBe("a.png");
    expect(uploads[0].type).toBe("image/png");
    expect(uploads[0].bytes.toString()).toBe("hello");
  });

  it("skips empty file inputs", async () => {
    const fd = new FormData();
    fd.append("attachments", new File([], "", { type: "" }));
    expect(await readUploadFiles(fd)).toHaveLength(0);
  });
});
