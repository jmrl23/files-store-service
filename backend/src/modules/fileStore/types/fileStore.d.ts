declare interface FileStore {
  uploadFile(
    buffer: Buffer,
    fileName: string,
    path?: string,
  ): Promise<StoreFileInfo>;
  deleteFile(id: string): Promise<void>;
  streamFile(id: string, options?: unknown): Promise<NodeJS.ReadableStream>;
}
