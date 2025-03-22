import { MultipartFile } from '@fastify/multipart';
import { FileStoreService } from '../fileStore/fileStoreService';
import { FromSchema } from 'json-schema-to-ts';
import { ListFilesPayloadSchema } from './schemas/listFilesPayload.schema';

export class FilesService {
  constructor(private readonly fileStoreService: FileStoreService) {}

  public async uploadFiles(
    files: MultipartFile[],
    path?: string,
  ): Promise<StoreFileInfo[]> {
    const settledUploads = await Promise.allSettled(
      files.map(async (file) =>
        this.fileStoreService.uploadFile(
          await file.toBuffer(),
          file.filename,
          path,
        ),
      ),
    );
    const uploadedFiles = settledUploads
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value);

    return uploadedFiles;
  }

  public async listFiles(
    payload: FromSchema<typeof ListFilesPayloadSchema> = {},
  ): Promise<StoreFileInfo[]> {
    const result = await this.fileStoreService.listFiles(payload);
    return result;
  }
}
