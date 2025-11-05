import { S3Client } from '@aws-sdk/client-s3';
import { Storage } from '@google-cloud/storage';
import ImageKit from 'imagekit';
import path from 'node:path';
import { GcsStore } from './stores/gcsStore';
import { ImagekitStore } from './stores/imagekitStore';
import { LocalStore } from './stores/localStore';
import { S3Store } from './stores/s3Store';
import { IFileStore } from './types';

/**
 * Register your custom stores here and don't forget to add StoreType.
 */

export type StoreType = 's3' | 'local' | 'imagekit' | 'gcs';

export async function fileStoreFactory(
  storeType: StoreType,
): Promise<IFileStore> {
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

    case 'imagekit':
      const imagekitStore = new ImagekitStore(
        new ImageKit({
          publicKey: process.env.IK_PUBLIC_KEY || '',
          privateKey: process.env.IK_PRIVATE_KEY || '',
          urlEndpoint: process.env.IK_ENDPOINT || '',
        }),
      );
      return imagekitStore;
    case 'gcs':
      const gcsStore = new GcsStore(
        /**
         * It uses the default environment variable `GOOGLE_APPLICATION_CREDENTIALS`
         * for authentication
         *
         * Execute to login:
         *    ```
         *    gcloud auth application-default login
         *    ```
         */
        new Storage(),
      );
      await gcsStore.initialize();
      return gcsStore;
  }
}
