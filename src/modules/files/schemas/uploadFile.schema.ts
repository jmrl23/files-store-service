import { asJsonSchema } from '../../../common/typings';

export const UploadFileSchema = asJsonSchema({
  type: 'object',
  additionalProperties: false,
  required: ['files'],
  properties: {
    path: {
      type: 'string',
      default: '',
    },
    files: {
      oneOf: [
        {
          type: 'array',
          maxItems: 5,
          items: {
            // @ts-expect-error this is a valid schema, uses @fastify/multipart
            isFile: true,
          },
        },
        {
          isFile: true,
        },
      ],
    },
  },
});
