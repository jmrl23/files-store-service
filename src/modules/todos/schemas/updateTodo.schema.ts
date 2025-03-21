import { asJsonSchema } from '../../../common/typings';

export const UpdateTodoSchema = asJsonSchema({
  type: 'object',
  additionalProperties: false,
  required: ['params', 'body'],
  properties: {
    params: {
      type: 'object',
      additionalProperties: false,
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
        },
      },
    },
    body: {
      type: 'object',
      additionalProperties: false,
      properties: {
        content: {
          type: 'string',
          minLength: 1,
          examples: ['Walk the dog'],
        },
        done: {
          type: 'boolean',
          examples: [true],
        },
      },
    },
  },
});
