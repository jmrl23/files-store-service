import { FileStoreService } from '../fileStore/fileStoreService';

export class FilesService {
  constructor(private readonly fileStoreService: FileStoreService) {}
}
