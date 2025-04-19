import { globSync } from 'glob';
import mime from 'mime';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { join as joinPaths } from 'node:path';

export interface FileStoreOptions {
  dirPath: string;
}

export class LocalStore implements FileStore {
  constructor(private readonly options: FileStoreOptions) {}

  async uploadFile(
    buffer: Buffer,
    fileName: string,
    path?: string,
  ): Promise<StoreFileInfo> {
    const dirPath = joinPaths(this.options.dirPath, path ?? '');
    const filePath = joinPaths(dirPath, crypto.randomUUID() + '-' + fileName);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(filePath, buffer);

    return {
      id: filePath,
      name: fileName,
      size: buffer.length,
      mimetype: mime.getType(filePath) ?? 'application/octet-stream',
    };
  }

  async deleteFile(id: string): Promise<void> {
    fs.rmSync(id);
    await this.cleanDir();
  }

  async streamFile(id: string): Promise<NodeJS.ReadableStream> {
    return fs.createReadStream(id);
  }

  private async cleanDir(): Promise<void> {
    const dirs = globSync(this.options.dirPath + '/**/*', {
      absolute: true,
    }).filter((path) => fs.statSync(path).isDirectory());
    for (const dir of dirs) {
      if (fs.readdirSync(dir).length < 1) {
        fs.rmSync(dir, { recursive: true });
      }
    }
  }
}
