import { getAuthUser } from "@/lib/auth/session";
import { getAttachmentForUser } from "@/lib/attachments/queries";
import { getStorage } from "@/lib/storage";
import { isImageMime } from "@/lib/attachments/validation";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const attachment = await getAttachmentForUser(user, id);
  if (!attachment) return new Response("Not found", { status: 404 });

  const bytes = await getStorage().get(attachment.s3Key);
  const disposition = isImageMime(attachment.contentType) ? "inline" : "attachment";

  const headers = new Headers();
  headers.set("Content-Type", attachment.contentType);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Length", String(bytes.length));
  headers.set("Content-Disposition", `${disposition}; filename="${encodeURIComponent(attachment.fileName)}"`);

  return new Response(new Uint8Array(bytes), { status: 200, headers });
}
