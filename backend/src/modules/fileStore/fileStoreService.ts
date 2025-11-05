import { Cache } from 'cache-manager';
import { and, asc, desc, eq, gte, ilike, lte, SQL } from 'drizzle-orm';
import { BadRequest, NotFound } from 'http-errors';
import { extname } from 'node:path';
import qs from 'node:querystring';
import { ParsedQs } from 'qs';
import { Db } from '../../common/db';
import { nanoid } from '../../common/utils/nanoid';
import { file } from '../../db/schema';
import { File, IFileStore, SavedFile } from './types';

export type ListSavedFilesPayload = Partial<
  Omit<File, 'createdAt' | 'store' | 'size'> & {
    revalidate: boolean;
    createdAtFrom: string;
    createdAtTo: string;
    skip: number;
    take: number;
    order: 'asc' | 'desc';
    sizeFrom: number;
    sizeTo: number;
  }
>;

export class FileStoreService {
  constructor(
    private readonly cache: Cache,
    private readonly db: Db,
    private readonly fileStore: IFileStore,
  ) {}

  async uploadFile(
    buffer: Buffer,
    fileName: string,
    path: string = '',
  ): Promise<SavedFile> {
    if (path?.includes('#') || path?.startsWith('/') || path?.endsWith('/')) {
      throw new BadRequest('Invalid path');
    }
    const uploadedFile = await this.fileStore.uploadFile(
      buffer,
      fileName,
      path,
    );
    const generatedName = this.generateFilename(fileName);
    const conflict = await this.db.$count(file, eq(file.name, generatedName));
    if (conflict) {
      return await this.uploadFile(buffer, fileName, path);
    }
    const [savedFile] = await this.db
      .insert(file)
      .values({
        store: process.env.STORE_SERVICE,
        mimetype: uploadedFile.mimetype,
        size: uploadedFile.size,
        name: generatedName,
        key: uploadedFile.id,
        path: encodeURI(path),
      })
      .returning({
        id: file.id,
        createdAt: file.createdAt,
        name: file.name,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path,
      });

    return savedFile;
  }

  async listFiles(payload: ListSavedFilesPayload): Promise<SavedFile[]> {
    const { revalidate, ...PAYLOAD } = payload;
    const CACHE_KEY = `files:${qs.encode(PAYLOAD)}`;
    if (revalidate) await this.cache.del(CACHE_KEY);
    const cachedData = await this.cache.get<SavedFile[]>(CACHE_KEY);
    if (cachedData) return cachedData;

    let filesQuery = this.db
      .select({
        id: file.id,
        createdAt: file.createdAt,
        name: file.name,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
      })
      .from(file)
      .$dynamic();

    const conditions: (SQL | undefined)[] = [];

    if (PAYLOAD.id) conditions.push(eq(file.id, PAYLOAD.id));
    if (PAYLOAD.createdAtFrom)
      conditions.push(gte(file.createdAt, PAYLOAD.createdAtFrom));
    if (PAYLOAD.createdAtTo)
      conditions.push(lte(file.createdAt, PAYLOAD.createdAtTo));
    if (PAYLOAD.name) conditions.push(ilike(file.name, PAYLOAD.name + '%'));
    if (PAYLOAD.path) conditions.push(eq(file.path, PAYLOAD.path));
    if (PAYLOAD.mimetype) conditions.push(eq(file.mimetype, PAYLOAD.mimetype));
    if (PAYLOAD.sizeFrom) conditions.push(gte(file.size, PAYLOAD.sizeFrom));
    if (PAYLOAD.sizeTo) conditions.push(lte(file.size, PAYLOAD.sizeTo));

    if (conditions.length > 0) {
      filesQuery.where(and(...conditions.filter(Boolean)));
    }

    if (PAYLOAD.skip) filesQuery = filesQuery.offset(PAYLOAD.skip);
    if (PAYLOAD.take) filesQuery = filesQuery.limit(PAYLOAD.take);

    if (PAYLOAD.order === 'desc') {
      filesQuery = filesQuery.orderBy(desc(file.createdAt));
    } else {
      filesQuery = filesQuery.orderBy(asc(file.createdAt));
    }

    const files = await filesQuery.execute();
    await this.cache.set(CACHE_KEY, files);
    return files;
  }

  async getFileInfo(name: string, path?: string): Promise<SavedFile> {
    const fileQuery = this.db
      .selectDistinct({
        id: file.id,
        createdAt: file.createdAt,
        name: file.name,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
      })
      .from(file)
      .$dynamic();
    const conditions: (SQL | undefined)[] = [eq(file.name, name)];
    if (path) conditions.push(eq(file.path, path));
    fileQuery.where(and(...conditions.filter(Boolean)));
    const [savedFile] = await fileQuery.execute();
    if (!savedFile) throw NotFound('File not fould');
    return savedFile;
  }

  async streamFile(
    id: string,
    query: ParsedQs = {},
  ): Promise<NodeJS.ReadableStream> {
    const [savedFile] = await this.db
      .selectDistinct({ key: file.key })
      .from(file)
      .where(eq(file.id, id));
    if (!savedFile) throw new NotFound('File not found');
    return await this.fileStore.streamFile(savedFile.key, query);
  }

  async deleteFile(id: string): Promise<SavedFile> {
    const savedFile = await this.db.transaction(async (tx) => {
      const [savedFile] = await tx
        .select({
          id: file.id,
          createdAt: file.createdAt,
          name: file.name,
          key: file.key,
          size: file.size,
          mimetype: file.mimetype,
          path: file.path,
        })
        .from(file)
        .where(eq(file.id, id));
      if (savedFile) {
        await Promise.all([
          this.db.delete(file).where(eq(file.id, id)),
          this.fileStore.deleteFile(savedFile.key),
        ]);
      }
      return savedFile;
    });
    if (!savedFile) throw new NotFound('File not found');
    return savedFile;
  }

  private generateFilename(name: string): string {
    const extension = extname(name);
    name = name.substring(0, name.length - extension.length);
    const filename = `${name}_${nanoid(6)}${extension}`;
    return filename;
  }
}
