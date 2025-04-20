import { asJsonSchema } from '../../../common/typings';

export const FileSchema = asJsonSchema({
  type: 'object',
  additionalProperties: false,
  required: ['id', 'name', 'size', 'mimetype'],
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
    },
    name: {
      type: 'string',
    },
    size: {
      type: 'number',
      format: 'integer',
    },
    mimetype: {
      type: 'string',
    },
    path: {
      type: 'string',
    },
  },
});
