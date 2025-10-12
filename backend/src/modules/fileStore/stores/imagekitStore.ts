import { InternalServerError } from 'http-errors';
import ImageKit from 'imagekit';
import { lookup } from 'mime-types';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import qs from 'node:querystring';

export class ImagekitStore implements FileStore {
  constructor(private readonly imagekit: ImageKit) {}

  public async uploadFile(
    buffer: Buffer,
    fileName: string,
    path: string,
  ): Promise<StoreFileInfo> {
    const file = await this.imagekit.upload({
      file: buffer,
      fileName,
      folder: path,
    });
    const { mime, size } = await this.imagekit.getFileDetails(file.fileId);
    const mimetype = mime ?? (lookup(fileName) || 'application/octet-stream');

    return {
      id: file.fileId,
      name: file.name,
      size,
      mimetype,
    };
  }

  public async deleteFile(id: string): Promise<void> {
    await this.imagekit.deleteFile(id);
  }

  public async streamFile(fileId: string): Promise<NodeJS.ReadableStream> {
    const { url, name } = await this.imagekit.getFileDetails(fileId);
    const response = await fetch(url + `&${qs.stringify({ q: 100 })}`);
    const tmpFilePath = path.resolve(
      os.tmpdir(),
      `${fileId}-${Date.now()}${path.extname(name)}`,
    );
    const writable = fs.createWriteStream(tmpFilePath);

    if (!response.ok || !response.body) throw new InternalServerError();

    await response.body.pipeTo(
      new WritableStream({
        write(chunk) {
          writable.write(chunk);
        },
      }),
    );

    return fs.createReadStream(tmpFilePath);
  }
}
