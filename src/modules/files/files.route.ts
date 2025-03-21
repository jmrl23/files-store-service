import fastifyMultipart, { Multipart } from '@fastify/multipart';
import { FastifyRequest } from 'fastify';
import { asRoute } from '../../common/typings';
import { UploadFileSchema } from './schemas/uploadFile.schema';
import { prevalidationFilesUpload } from './handlers/prevalidationFilesUpload';

export default asRoute(async function (app) {
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
    },
    async handler(
      request: FastifyRequest<{
        Body: {
          path: string;
          files: Multipart[];
        };
      }>,
    ) {
      const files = request.body.files;

      console.log(files);

      return {
        message: 'success!',
      };
    },
  });
});
