import { MultipartFile } from '@fastify/multipart';
import { FileStoreService } from '../fileStore/fileStoreService';

export class FilesService {
  constructor(private readonly fileStoreService: FileStoreService) {}

  public async upload(
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
}
