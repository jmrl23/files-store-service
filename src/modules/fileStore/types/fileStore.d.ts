declare interface FileStore {
  uploadFile(
    buffer: Buffer,
    fileName: string,
    path?: string,
  ): Promise<FileInfo>;
  deleteFile(id: string): Promise<void>;
  streamFile(id: string): Promise<NodeJS.ReadableStream>;
}
