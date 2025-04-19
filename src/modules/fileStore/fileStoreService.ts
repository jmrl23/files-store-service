import { BadRequest } from 'http-errors';
import { Cache } from 'cache-manager';
import { extname } from 'node:path';
import { NotFound } from 'http-errors';
import { nanoid } from '../../common/utils/nanoid';
import { PrismaClient } from '../../../generated/prisma';

export class FileStoreService {
  constructor(
    private readonly cache: Cache,
    private readonly prisma: PrismaClient,
    private readonly fileStore: FileStore,
  ) {}

  async uploadFile(
    buffer: Buffer,
    fileName: string,
    path: string = '',
  ): Promise<StoreFileInfo> {
    if (path?.includes('#') || path?.startsWith('/') || path?.endsWith('/')) {
      throw new BadRequest('Invalid path');
    }

    const fileData = await this.fileStore.uploadFile(buffer, fileName, path);

    function generateFileName(name: string): string {
      const ext = extname(name);
      const fileNameWithoutExtention = name.replace(ext, '');
      const fileName = `${fileNameWithoutExtention}_${nanoid(6)}${ext}`;
      return fileName;
    }

    const newFileName = generateFileName(fileName);

    const conflictedFileCount = await this.prisma.file.count({
      where: {
        name: newFileName,
      },
    });

    if (conflictedFileCount > 0) {
      return await this.uploadFile(buffer, fileName, path);
    }

    const result = await this.prisma.file.create({
      data: {
        key: fileData.id,
        name: newFileName,
        path: encodeURI(path),
        size: fileData.size,
        mimetype: fileData.mimetype,
        store: process.env.STORE_SERVICE!,
      },
      select: {
        id: true,
        createdAt: true,
        name: true,
        size: true,
        mimetype: true,
        path: true,
        store: true,
      },
    });

    return result;
  }

  async listFiles(payload: ListFilesPayload): Promise<StoreFileInfo[]> {
    const cacheKey = `list:files[ref:payload]:(${JSON.stringify([
      payload.id,
      payload.createdAtFrom,
      payload.createdAtTo,
      payload.skip,
      payload.take,
      payload.order,
      payload.name,
      payload.mimetype,
      payload.path,
      payload.mimetype,
      payload.sizeFrom,
      payload.sizeTo,
      payload.store,
    ])})`;

    if (payload.revalidate) {
      await this.cache.del(cacheKey);
    }

    const cachedData = await this.cache.get<StoreFileInfo[]>(cacheKey);
    if (cachedData) return cachedData;

    const result = await this.prisma.file.findMany({
      where: {
        id: payload.id,
        createdAt: {
          gte: payload.createdAtFrom,
          lte: payload.createdAtTo,
        },
        name: {
          startsWith: payload.name,
        },
        path: payload.path ? encodeURI(payload.path) : payload.path,
        mimetype: payload.mimetype,
        size: {
          gte: payload.sizeFrom,
          lte: payload.sizeTo,
        },
        store: payload.store,
      },
      skip: payload.skip,
      take: payload.take,
      orderBy: {
        createdAt: payload.order,
      },
      select: {
        id: true,
        createdAt: true,
        name: true,
        size: true,
        mimetype: true,
        path: true,
        store: true,
      },
    });

    await this.cache.set(cacheKey, result);

    return result;
  }

  async streamFile(id: string): Promise<NodeJS.ReadableStream> {
    const file = await this.prisma.file.findUnique({
      where: { id },
      select: { key: true },
    });

    if (!file) {
      throw new NotFound('File not found');
    }

    return this.fileStore.streamFile(file.key);
  }

  async deleteFile(id: string): Promise<StoreFileInfo> {
    const file = await this.prisma.file.findUnique({
      where: { id },
      select: {
        id: true,
        createdAt: true,
        name: true,
        key: true,
        size: true,
        mimetype: true,
        path: true,
        store: true,
      },
    });

    if (!file) {
      throw new NotFound('File not found');
    }

    await this.fileStore.deleteFile(file.key);
    await this.prisma.file.delete({
      where: { id },
    });

    delete (file as Record<string, unknown>).key;

    return file;
  }
}
