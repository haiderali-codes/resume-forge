import 'dotenv/config';
import { Injectable } from '@nestjs/common';
import { GetObjectCommand,PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
  private readonly bucket = process.env.S3_BUCKET ?? 'resumes';

  private readonly client = new S3Client({
    region: 'us-east-1',
    endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    },
  });

  async upload(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    return key;
  }

  async download(key: string): Promise<Buffer> {
  const response = await this.client.send(
    new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }),
  );

  if (!response.Body) {
    throw new Error('Stored file has no content');
  }

  const bytes = await response.Body.transformToByteArray();

  return Buffer.from(bytes);
}
}