import KeyvRedis from '@keyv/redis';
import { Cache, createCache } from 'cache-manager';
import Keyv from 'keyv';
import ms from 'ms';
import assert from 'node:assert';
import path from 'node:path';
import { loadEnvFile } from 'node:process';
import { before, after, describe, it } from 'node:test';
import { prismaClient } from '../../common/prismaClient';
import { fileStoreFactory } from './fileStoreFactory';
import { FileStoreService } from './fileStoreService';

loadEnvFile(path.resolve(__dirname, '../../../.env.development'));

process.env.NODE_ENV = 'test';

describe('fileStoreService test', async () => {
  let fileStore: FileStore;
  let cache: Cache;
  let fileStoreService: FileStoreService;
  let fileId: string;
  let fileName = 'test.txt';

  before(async () => {
    fileStore = await fileStoreFactory('s3', {
      region: process.env.AWS_REGION,
      endpoint: process.env.AWS_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    cache = createCache({
      ttl: ms('30m'),
      stores: [
        new Keyv({
          namespace: 'modules:fileStore',
          store: new KeyvRedis(process.env.REDIS_URL),
        }),
      ],
    });

    fileStoreService = new FileStoreService(cache, prismaClient, fileStore);
  });

  it('should upload file', async () => {
    const uploadedFile = await fileStoreService.uploadFile(
      Buffer.from('test'),
      fileName,
    );

    assert(uploadedFile.id);
    assert.strictEqual(uploadedFile.name.length, fileName.length + 7);
    assert.strictEqual(uploadedFile.size, 4);
    assert.strictEqual(uploadedFile.mimetype, 'text/plain');

    fileId = uploadedFile.id;
    fileName = uploadedFile.name;
  });

  it('should stream file', async () => {
    const stream = await fileStoreService.streamFile(fileId);
    let data = '';

    stream.on('data', (chunk) => {
      data += chunk.toString();
    });

    stream.on('end', () => {
      assert.strictEqual(data, 'test');
    });
  });

  it('should delete file', async () => {
    const deletedFile = await fileStoreService.deleteFile(fileId);

    assert.strictEqual(fileId, deletedFile.id);
  });

  after(async () => {
    await cache.disconnect();
  });
});
