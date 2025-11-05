import KeyvRedis from '@keyv/redis';
import { Cache, createCache } from 'cache-manager';
import Keyv from 'keyv';
import ms from 'ms';
import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { db } from '../../common/db';
import { fileStoreFactory } from './fileStoreFactory';
import { FileStoreService } from './fileStoreService';
import { IFileStore } from './types';

describe('fileStoreService test', async () => {
  let fileStore: IFileStore;
  let cache: Cache;
  let fileStoreService: FileStoreService;
  let fileId: string;
  let fileName = 'test.txt';

  before(async () => {
    fileStore = await fileStoreFactory(process.env.STORE_SERVICE);
    cache = createCache({
      ttl: ms('30m'),
      stores: [
        new Keyv({
          namespace: 'test',
          store: new KeyvRedis(process.env.REDIS_URL),
        }),
      ],
    });
    fileStoreService = new FileStoreService(cache, db, fileStore);
  });

  after(async () => {
    await cache.disconnect();
  });

  it('should upload file', async () => {
    const uploadedFile = await fileStoreService.uploadFile(
      Buffer.from('test'),
      fileName,
    );
    assert.ok(uploadedFile);
    assert.strictEqual(uploadedFile.name.length, fileName.length + 7);
    assert.strictEqual(uploadedFile.size, 4);
    assert.strictEqual(uploadedFile.mimetype, 'text/plain');
    fileId = uploadedFile.id;
    fileName = uploadedFile.name;
  });

  it('should stream file', async () => {
    const stream = await fileStoreService.streamFile(fileId);
    let data = '';
    for await (const chunk of stream) {
      data += chunk;
    }
    assert.strictEqual(data, 'test');
  });

  it('should delete file', async () => {
    const deletedFile = await fileStoreService.deleteFile(fileId);
    assert.strictEqual(fileId, deletedFile.id);
  });
});
