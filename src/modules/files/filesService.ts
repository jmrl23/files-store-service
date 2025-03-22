import { MultipartFile } from '@fastify/multipart';
import { FileStoreService } from '../fileStore/fileStoreService';
import { FromSchema } from 'json-schema-to-ts';
import { ListFilesPayloadSchema } from './schemas/listFilesPayload.schema';
import { PrismaClient } from '@prisma/client';
import { NotFound } from 'http-errors';

export class FilesService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly fileStoreService: FileStoreService,
  ) {}

  public async uploadFiles(
    files: MultipartFile[],
    path?: string,
  ): Promise<StoreFileInfo[]> {
    const uploadedFiles = await Promise.all(
      files.map(async (file) =>
        this.fileStoreService.uploadFile(
          await file.toBuffer(),
          file.filename,
          path,
        ),
      ),
    );

    return uploadedFiles;
  }

  public async listFiles(
    payload: FromSchema<typeof ListFilesPayloadSchema> = {},
  ): Promise<StoreFileInfo[]> {
    const result = await this.fileStoreService.listFiles(payload);
    return result;
  }

  public async getFileData(
    name: string,
    path?: string,
  ): Promise<{
    fileInfo: StoreFileInfo;
    stream: NodeJS.ReadableStream;
  }> {
    const file = await this.prisma.file.findFirst({
      where: { name, path },
      select: {
        id: true,
        createdAt: true,
        name: true,
        path: true,
        mimetype: true,
        size: true,
      },
    });

    if (!file) throw NotFound('File not found');

    const stream = await this.fileStoreService.streamFile(file.id);
    return {
      fileInfo: file,
      stream,
    };
  }

  public async deleteFile(id: string): Promise<StoreFileInfo> {
    return await this.fileStoreService.deleteFile(id);
  }
}
