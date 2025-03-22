import { asJsonSchema } from '../../../common/typings';

export const DeleteFileSchema = asJsonSchema({
  type: 'object',
  additionalProperties: false,
  required: ['id'],
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
    },
  },
});
