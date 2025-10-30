import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListBucketsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { NotFound } from 'http-errors';
import mime from 'mime-types';
import { Readable } from 'node:stream';
import { nanoid } from '../../../common/utils/nanoid';

export class S3Store implements FileStore {
  constructor(
    private readonly s3Client: S3Client,
    private readonly bucket?: string,
  ) {
    if (!bucket) throw new Error('Bucket is required');
  }

  async initialize(): Promise<void> {
    const buckets = await this.s3Client.send(new ListBucketsCommand({}));
    if (!buckets.Buckets?.find((bucket) => bucket.Name === this.bucket)) {
      await this.s3Client.send(
        new CreateBucketCommand({ Bucket: this.bucket }),
      );
    }
  }

  async uploadFile(buffer: Buffer, fileName: string): Promise<StoreFileInfo> {
    const key = `${nanoid(6)}-${fileName}`;
    const mimetype = mime.lookup(fileName) || 'application/octet-stream';
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    });

    await this.s3Client.send(command);

    const headResult = await this.s3Client.send(
      new HeadObjectCommand({
        Key: key,
        Bucket: this.bucket,
      }),
    );

    return {
      id: key,
      name: fileName,
      size: headResult.ContentLength ?? 0,
      mimetype: headResult.ContentType ?? mimetype,
    };
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Key: key,
      Bucket: this.bucket,
    });
    await this.s3Client.send(command);
  }

  async streamFile(key: string): Promise<Readable> {
    const command = new GetObjectCommand({ Key: key, Bucket: this.bucket });
    const result = await this.s3Client.send(command);

    if (result.Body instanceof Readable) {
      return result.Body;
    }

    throw new NotFound('File not found');
  }
}
