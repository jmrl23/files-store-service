import { Bucket, Storage } from '@google-cloud/storage';
import { NotFound, ServiceUnavailable } from 'http-errors';
import mime from 'mime-types';
import { join as joinPath } from 'node:path';

export class GcsStore implements FileStore {
  private bucket!: Bucket;

  constructor(private readonly storage: Storage) {}

  public async initialize(): Promise<void> {
    const [buckets] = await this.storage.getBuckets();
    if (!process.env.GCS_BUCKET) throw new ServiceUnavailable('No bucket');
    if (!buckets.find((bucket) => bucket.name === process.env.GCS_BUCKET)) {
      await this.storage.createBucket(process.env.GCS_BUCKET);
    }
    this.bucket = this.storage.bucket(process.env.GCS_BUCKET);
  }

  public async uploadFile(
    buffer: Buffer,
    fileName: string,
    path?: string,
  ): Promise<StoreFileInfo> {
    const dirPath = joinPath(path ?? '');
    const filePath = joinPath(dirPath, crypto.randomUUID() + '-' + fileName);
    const file = this.bucket.file(filePath);
    const mimetype = mime.lookup(fileName) || 'application/octet-stream';
    await file?.save(buffer);
    return {
      id: filePath,
      name: fileName,
      size: buffer.length,
      mimetype,
    };
  }

  public async deleteFile(id: string): Promise<void> {
    const file = this.bucket.file(id);
    await file?.delete();
  }

  public async streamFile(id: string): Promise<NodeJS.ReadableStream> {
    const stream = this.bucket.file(id).createReadStream();
    if (!stream) throw NotFound('File not found');
    return stream;
  }
}
