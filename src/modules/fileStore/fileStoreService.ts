import { PrismaClient } from '@prisma/client';
import { customAlphabet } from 'nanoid';
import { extname } from 'node:path';
import { Boom } from '@hapi/boom';

const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  6,
);

export class FileStoreService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly fileStore: FileStore,
  ) {}

  async uploadFile(
    buffer: Buffer,
    fileName: string,
    path?: string,
  ): Promise<StoreFileInfo> {
    const fileData = await this.fileStore.uploadFile(buffer, fileName);
    const ext = extname(fileName);
    const fileNameWithoutExtention = fileName.replace(ext, '');

    fileName = `${fileNameWithoutExtention}_${nanoid(6)}${ext}`;

    const result = await this.prisma.file.create({
      data: {
        key: fileData.id,
        name: fileName,
        path,
        size: fileData.size,
        mimetype: fileData.mimetype,
      },
      select: {
        id: true,
        name: true,
        size: true,
        mimetype: true,
      },
    });

    return result;
  }

  async streamFile(
    id: string,
    name: string,
    path?: string,
  ): Promise<NodeJS.ReadableStream> {
    const file = await this.prisma.file.findUnique({
      where: {
        id,
        name,
        path,
      },
      select: {
        key: true,
      },
    });

    if (!file) {
      throw new Boom('File not found', {
        statusCode: 404,
      });
    }

    return this.fileStore.streamFile(file.key);
  }

  async deleteFile(id: string): Promise<StoreFileInfo> {
    const file = await this.prisma.file.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        key: true,
        size: true,
        mimetype: true,
      },
    });

    if (!file) {
      throw new Boom('File not found', {
        statusCode: 404,
      });
    }

    await this.fileStore.deleteFile(file.key);

    delete (file as Record<string, unknown>).key;

    return file;
  }
}
