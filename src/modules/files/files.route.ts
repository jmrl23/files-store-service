import fastifyMultipart, { MultipartFile } from '@fastify/multipart';
import KeyvRedis from '@keyv/redis';
import { createCache } from 'cache-manager';
import { FastifyRequest } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { Keyv } from 'keyv';
import ms from 'ms';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { prisma } from '../../common/prisma';
import { asRoute } from '../../common/typings';
import { generateEtag } from '../../common/utils/generateEtag';
import { fileStoreFactory } from '../fileStore/fileStoreFactory';
import { FileStoreService } from '../fileStore/fileStoreService';
import { FilesService } from './filesService';
import { prevalidationFilesUpload } from './handlers/prevalidationFilesUpload';
import { DeleteFileSchema } from './schemas/deleteFile.schema';
import { FileSchema } from './schemas/file.schema';
import { ListFilesPayloadSchema } from './schemas/listFilesPayload.schema';
import { UploadFileSchema } from './schemas/uploadFile.schema';

export default asRoute(async function (app) {
  const filesService = new FilesService(
    prisma,
    new FileStoreService(
      createCache({
        ttl: ms('30m'),
        stores: [
          new Keyv({
            namespace: 'modules:fileStore',
            store: new KeyvRedis(process.env.REDIS_URL),
          }),
        ],
      }),
      prisma,
      await fileStoreFactory(process.env.STORE_SERVICE),
    ),
  );

  await app.register(fastifyMultipart, {
    attachFieldsToBody: true,
  });

  app
    .route({
      method: 'POST',
      url: '/upload',
      preValidation: [prevalidationFilesUpload],
      schema: {
        description: 'Upload files (uses `files` field)',
        tags: ['files'],
        consumes: ['multipart/form-data'],
        body: UploadFileSchema,
        response: {
          200: {
            type: 'object',
            required: ['data'],
            properties: {
              data: {
                type: 'array',
                items: FileSchema,
              },
            },
          },
        },
      },
      async handler(
        request: FastifyRequest<{
          Body: {
            path: string;
            files: MultipartFile[];
          };
        }>,
      ) {
        await request.saveRequestFiles({
          tmpdir: os.tmpdir(),
        });
        const files = await filesService.uploadFiles(
          request.body.files,
          request.body.path,
        );

        return {
          data: files,
        };
      },
    })

    .route({
      method: 'GET',
      url: '/*',
      schema: {
        description: 'Stream file',
        tags: ['files'],
      },
      async handler(request, reply) {
        const pathSegments = request.url.substring(1).split('/');
        pathSegments.splice(0, 1);

        const fileName = pathSegments.pop()!;
        const filePath = pathSegments.join('/');
        const data = await filesService.getFileData(
          decodeURIComponent(fileName),
          decodeURI(filePath),
        );
        const tempPath = path.resolve(os.tmpdir(), data.fileInfo.id);
        const tempFilePath = path.resolve(tempPath, data.fileInfo.name);

        if (!fs.existsSync(tempPath)) {
          fs.mkdirSync(tempPath, {
            recursive: true,
          });
        }

        await pipeline(data.stream, fs.createWriteStream(tempFilePath));

        reply.raw.on('finish', () => {
          fs.rmSync(tempPath, { recursive: true });
        });

        reply.headers({
          'content-length': data.fileInfo.size,
          'content-type': data.fileInfo.mimetype,
          'cache-control': 'public, max-age=1800, must-revalidate',
          etag: await generateEtag(tempFilePath),
        });
        return fs.createReadStream(tempFilePath);
      },
    })

    .route({
      method: 'GET',
      url: '/',
      schema: {
        description: 'List files',
        tags: ['files'],
        querystring: ListFilesPayloadSchema,
        response: {
          200: {
            type: 'object',
            required: ['data'],
            properties: {
              data: {
                type: 'array',
                items: FileSchema,
              },
            },
          },
        },
      },
      async handler(
        request: FastifyRequest<{
          Querystring: FromSchema<typeof ListFilesPayloadSchema>;
        }>,
      ) {
        const files = await filesService.listFiles(request.query);

        return {
          data: files,
        };
      },
    })

    .route({
      method: 'DELETE',
      url: '/delete/:id',
      schema: {
        description: 'Delete file',
        tags: ['files'],
        params: DeleteFileSchema,
        response: {
          200: {
            type: 'object',
            required: ['data'],
            properties: {
              data: FileSchema,
            },
          },
        },
      },
      async handler(
        request: FastifyRequest<{
          Params: FromSchema<typeof DeleteFileSchema>;
        }>,
      ) {
        const result = await filesService.deleteFile(request.params.id);
        return {
          data: result,
        };
      },
    });
});
