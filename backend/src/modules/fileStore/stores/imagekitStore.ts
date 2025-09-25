import { InternalServerError } from 'http-errors';
import ImageKit from 'imagekit';
import { lookup } from 'mime-types';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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
    const mimetype = lookup(fileName) || 'application/octet-stream';

    return {
      id: file.fileId,
      name: file.name,
      size: file.size,
      mimetype,
    };
  }
  public async deleteFile(id: string): Promise<void> {
    await this.imagekit.deleteFile(id);
  }

  public async streamFile(id: string): Promise<NodeJS.ReadableStream> {
    const { url, fileId, name, filePath } =
      await this.imagekit.getFileDetails(id);
    console.log('filePath', filePath);
    const response = await fetch(url);
    const tmpFilePath = path.resolve(
      os.tmpdir(),
      `${fileId}-${Date.now()}${path.extname(name)}`,
    );
    const writeStream = fs.createWriteStream(tmpFilePath);
    const reader = response.body?.getReader();

    if (!reader) throw new InternalServerError();

    async function pump() {
      const { done, value } = await reader!.read();

      if (done) {
        writeStream.end();
        writeStream.close();
        return;
      }

      writeStream.write(value);
      await pump();
    }

    if (!fs.existsSync(tmpFilePath)) await pump();

    return fs.createReadStream(tmpFilePath);
  }
}
