import { asJsonSchema } from '../../../common/typings';

export const ListFilesPayloadSchema = asJsonSchema({
  type: 'object',
  additionalProperties: false,
  properties: {
    revalidate: {
      type: 'boolean',
    },
    id: {
      type: 'string',
      format: 'uuid',
    },
    createdAtFrom: {
      type: 'string',
      format: 'date-time',
    },
    createdAtTo: {
      type: 'string',
      format: 'date-time',
    },
    skip: {
      type: 'integer',
      minimum: 0,
    },
    take: {
      type: 'integer',
      minimum: 0,
    },
    order: {
      type: 'string',
      enum: ['asc', 'desc'],
    },
    name: {
      type: 'string',
    },
    path: {
      type: 'string',
    },
    mimetype: {
      type: 'string',
    },
    sizeFrom: {
      type: 'integer',
      minimum: 0,
    },
    sizeTo: {
      type: 'integer',
      minimum: 0,
    },
    store: {
      type: 'string',
    },
  },
});
