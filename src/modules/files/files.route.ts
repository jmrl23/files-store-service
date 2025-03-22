import fastifyMultipart, { MultipartFile } from '@fastify/multipart';
import { FastifyRequest } from 'fastify';
import os from 'node:os';
import path from 'node:path';
import { asRoute } from '../../common/typings';
import { fileStoreFactory } from '../fileStore/fileStoreFactory';
import { FileStoreService } from '../fileStore/fileStoreService';
import { prismaClient } from '../prisma/prismaClient';
import { FilesService } from './filesService';
import { prevalidationFilesUpload } from './handlers/prevalidationFilesUpload';
import { FileSchema } from './schemas/file.schema';
import { UploadFileSchema } from './schemas/uploadFile.schema';

export default asRoute(async function (app) {
  const filesService = new FilesService(
    new FileStoreService(
      prismaClient,
      await fileStoreFactory('s3', {
        region: process.env.AWS_REGION,
        endpoint: process.env.AWS_ENDPOINT,
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      }),
    ),
  );

  await app.register(fastifyMultipart, {
    attachFieldsToBody: true,
  });

  app.route({
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
        tmpdir: path.resolve(os.tmpdir()),
      });
      const files = await filesService.upload(
        request.body.files,
        request.body.path,
      );

      return {
        data: files,
      };
    },
  });
});
