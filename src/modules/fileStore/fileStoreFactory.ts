import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { S3Store } from './stores/s3Store';

export type StoreType = 's3';
export type StoreOptions = {
  s3: S3ClientConfig;
};

export async function fileStoreFactory<T extends StoreType>(
  storeType: StoreType = 's3',
  storeOptions: StoreOptions[T],
): Promise<FileStore> {
  switch (storeType) {
    case 's3':
      const s3Client = new S3Client(storeOptions);
      const s3Store = new S3Store(s3Client, process.env.AWS_BUCKET);
      await s3Store.initialize();
      return s3Store;
  }
}
