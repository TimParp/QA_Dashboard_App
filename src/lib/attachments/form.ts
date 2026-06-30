import type { UploadFile } from "@/lib/attachments/mutations";

export async function readUploadFiles(
  formData: FormData,
  field = "attachments",
): Promise<UploadFile[]> {
  const selected = formData
    .getAll(field)
    .filter((f): f is File => f instanceof File && f.size > 0);

  return Promise.all(
    selected.map(async (f) => ({
      name: f.name,
      type: f.type,
      size: f.size,
      bytes: Buffer.from(await f.arrayBuffer()),
    })),
  );
}
