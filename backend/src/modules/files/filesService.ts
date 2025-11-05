import { MultipartFile } from '@fastify/multipart';
import { FromSchema } from 'json-schema-to-ts';
import { ParsedQs } from 'qs';
import { FileStoreService } from '../fileStore/fileStoreService';
import { SavedFile } from '../fileStore/types';
import { ListFilesPayloadSchema } from './schemas/listFilesPayload.schema';

export class FilesService {
  constructor(private readonly fileStoreService: FileStoreService) {}

  public async uploadFiles(
    files: MultipartFile[],
    path?: string,
  ): Promise<SavedFile[]> {
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
  ): Promise<SavedFile[]> {
    const result = await this.fileStoreService.listFiles(payload);
    return result;
  }

  public async getFileData(
    name: string,
    path: string = '',
    query: ParsedQs = {},
  ): Promise<{
    info: SavedFile;
    stream: NodeJS.ReadableStream;
  }> {
    const file = await this.fileStoreService.getFileInfo(name, path);
    const stream = await this.fileStoreService.streamFile(file.id, query);
    return { info: file, stream };
  }

  public async deleteFile(id: string): Promise<SavedFile> {
    return await this.fileStoreService.deleteFile(id);
  }
}
