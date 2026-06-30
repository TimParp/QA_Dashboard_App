import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import type { StorageDriver } from "./types";

function client(): S3Client {
  return new S3Client({ region: process.env.AWS_REGION });
}

function bucket(): string {
  const name = process.env.S3_BUCKET;
  if (!name) throw new Error("S3_BUCKET is not set");
  return name;
}

export const s3Driver: StorageDriver = {
  async put(key, bytes, contentType) {
    await client().send(
      new PutObjectCommand({ Bucket: bucket(), Key: key, Body: bytes, ContentType: contentType }),
    );
  },
  async get(key) {
    const res = await client().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
    const bytes = await res.Body!.transformToByteArray();
    return Buffer.from(bytes);
  },
  async delete(key) {
    await client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
  },
};
