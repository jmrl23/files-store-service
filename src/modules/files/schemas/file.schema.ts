import { asJsonSchema } from '../../../common/typings';

export const FileSchema = asJsonSchema({
  type: 'object',
  additionalProperties: false,
  required: ['id', 'name', 'size', 'mimetype', 'store'],
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
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
    store: {
      type: 'string',
    },
    path: {
      type: 'string',
    },
  },
});
