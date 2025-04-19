import { S3Client } from '@aws-sdk/client-s3';
import { S3Store } from './stores/s3Store';
import { LocalStore } from './stores/localStore';
import path from 'node:path';

/**
 * Register your custom stores here and don't forget to add StoreType.
 *
 * e.g.
 * ```ts
 * export type StoreType = 's3' | 'local';
 * ```
 */

export type StoreType = 's3' | 'local';

export async function fileStoreFactory(
  storeType: StoreType,
): Promise<FileStore> {
  switch (storeType) {
    case 's3':
      const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        endpoint: process.env.AWS_ENDPOINT,
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
        },
      });
      const s3Store = new S3Store(s3Client, process.env.AWS_BUCKET);
      await s3Store.initialize();
      return s3Store;
    case 'local':
      const localStore = new LocalStore({
        dirPath:
          process.env.LOCAL_DIR_PATH ??
          path.resolve(__dirname, '../../../local_uploads'),
      });
      return localStore;
  }
}
