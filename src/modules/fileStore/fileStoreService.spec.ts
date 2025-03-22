import assert from 'node:assert';
import path from 'node:path';
import { loadEnvFile } from 'node:process';
import { describe, it } from 'node:test';
import { prismaClient } from '../prisma/prismaClient';
import { fileStoreFactory } from './fileStoreFactory';
import { FileStoreService } from './fileStoreService';
import { createCache } from 'cache-manager';
import Keyv from 'keyv';
import ms from 'ms';
import KeyvRedis from '@keyv/redis';

loadEnvFile(path.resolve(__dirname, '../../../.env.development'));

describe('fileStoreService', async () => {
  const fileStore = await fileStoreFactory('s3', {
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  const cache = createCache({
    ttl: ms('30m'),
    stores: [
      new Keyv({
        namespace: 'modules:fileStore',
        store: new KeyvRedis(process.env.REDIS_URL),
      }),
    ],
  });
  const fileStoreService = new FileStoreService(cache, prismaClient, fileStore);

  let fileId: string;
  let fileName = 'test.txt';

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
});
