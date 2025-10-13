import fastifyMultipart, { MultipartFile } from '@fastify/multipart';
import KeyvRedis from '@keyv/redis';
import { createCache } from 'cache-manager';
import { FastifyRequest } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { Keyv } from 'keyv';
import ms from 'ms';
import fs, { createWriteStream } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prisma } from '../../common/prisma';
import { asRoute } from '../../common/typings';
import { generateEtag } from '../../common/utils/generateEtag';
import { fileStoreFactory } from '../fileStore/fileStoreFactory';
import { FileStoreService } from '../fileStore/fileStoreService';
import { FilesService } from './filesService';
import { apiKeyAuthPreHandler } from './handlers/apiKeyAuthPreHandler';
import { filesUploadPreValidation } from './handlers/filesUploadPrevalidation';
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

  const fileSizeLimit = Number.isNaN(Number(process.env.FILE_SIZE_LIMIT))
    ? 500_000_000 // 500MB
    : Number(process.env.FILE_SIZE_LIMIT);

  await app.register(fastifyMultipart, {
    attachFieldsToBody: true,
    limits: {
      fileSize: fileSizeLimit,
    },
  });

  app
    .route({
      method: 'POST',
      url: '/upload',
      schema: {
        description: 'Upload files (uses `files` field)',
        tags: ['files'],
        consumes: ['multipart/form-data'],
        security: [{ ApiKeyAuth: [] }],
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
      preValidation: [filesUploadPreValidation],
      preHandler: [apiKeyAuthPreHandler],
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
        const segments = request.url.substring(1).split('/');
        segments.splice(0, 1);

        const fileName = segments.pop()!;
        const filePath = segments.join('/');
        const data = await filesService.getFileData(
          decodeURIComponent(fileName),
          decodeURI(filePath),
        );
        const tmpPath = path.resolve(os.tmpdir(), data.fileInfo.id);
        const tmpFile = path.resolve(tmpPath, data.fileInfo.name);

        if (!fs.existsSync(tmpPath)) {
          fs.mkdirSync(tmpPath, {
            recursive: true,
          });
        }

        reply.raw.on('close', () => {
          fs.rmdirSync(tmpPath, {
            recursive: true,
          });
        });

        data.stream.pipe(createWriteStream(tmpFile));

        let totalBytes = 0;
        data.stream.on('data', (chunk) => {
          totalBytes += chunk.length;
        });

        await new Promise<void>((resolve) => {
          data.stream.on('end', () => {
            resolve();
          });
        });

        reply.headers({
          'content-length': totalBytes,
          'content-type': data.fileInfo.mimetype,
          'cache-control': 'public, max-age=1800, must-revalidate',
          etag: await generateEtag(tmpFile),
        });

        return fs.createReadStream(tmpFile);
      },
    })

    .route({
      method: 'GET',
      url: '/',
      schema: {
        description: 'List files',
        tags: ['files'],
        security: [{ ApiKeyAuth: [] }],
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
      preHandler: [apiKeyAuthPreHandler],
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
        security: [{ ApiKeyAuth: [] }],
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
      preHandler: [apiKeyAuthPreHandler],
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
