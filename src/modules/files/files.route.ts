import fastifyMultipart, { MultipartFile } from '@fastify/multipart';
import { FastifyRequest } from 'fastify';
import os from 'node:os';
import { asRoute } from '../../common/typings';
import { fileStoreFactory } from '../fileStore/fileStoreFactory';
import { FileStoreService } from '../fileStore/fileStoreService';
import { prismaClient } from '../prisma/prismaClient';
import { FilesService } from './filesService';
import { prevalidationFilesUpload } from './handlers/prevalidationFilesUpload';
import { FileSchema } from './schemas/file.schema';
import { UploadFileSchema } from './schemas/uploadFile.schema';
import { createCache } from 'cache-manager';
import { Keyv } from 'keyv';
import KeyVRedis from '@keyv/redis';
import ms from 'ms';
import { ListFilesPayloadSchema } from './schemas/listFilesPayload.schema';
import { FromSchema } from 'json-schema-to-ts';
import { DeleteFileSchema } from './schemas/deleteFile.schema';

export default asRoute(async function (app) {
  const filesService = new FilesService(
    new FileStoreService(
      createCache({
        ttl: ms('30m'),
        stores: [
          new Keyv({
            namespace: 'modules:fileStore',
            store: new KeyVRedis(process.env.REDIS_URL),
          }),
        ],
      }),
      prismaClient,
      await fileStoreFactory('s3', {
        region: process.env.AWS_REGION,
        endpoint: process.env.AWS_ENDPOINT,
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
        },
      }),
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
      url: '/list',
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
