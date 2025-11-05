import { file } from '../../../db/schema';

export type File = typeof file.$inferSelect;

export type SavedFile = Omit<File, 'key' | 'updatedAt' | 'store'>;

export type FileInStore = Pick<File, 'id' | 'name' | 'size' | 'mimetype'> & {
  createdAt?: Date;
  path?: string;
};

export interface IFileStore {
  uploadFile(
    buffer: Buffer,
    fileName: string,
    path?: string,
  ): Promise<FileInStore>;
  deleteFile(id: string): Promise<void>;
  streamFile(id: string, options?: unknown): Promise<NodeJS.ReadableStream>;
}
