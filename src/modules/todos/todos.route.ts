import { createCache } from 'cache-manager';
import { FastifyRequest } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';
import { asJsonSchema, asRoute } from '../../common/typings';
import { TodosService } from './todosService';
import { CreateTodoSchema } from './schemas/createTodo.schema';
import { TodoSchema } from './schemas/todo.schema';
import { GetTodosSchema } from './schemas/getTodos.schema';
import { GetTodoSchema } from './schemas/getTodo.schema';
import { UpdateTodoSchema } from './schemas/updateTodo.schema';
import { DeleteTodoSchema } from './schemas/deleteTodo.schema';
import Keyv from 'keyv';

export default asRoute(async function (app) {
  const cache = createCache({
    stores: [new Keyv({ namespace: 'todos' })],
  });
  const todosService = new TodosService(cache);

  app

    .route({
      method: 'POST',
      url: '/create',
      schema: {
        description: 'create a todo',
        tags: ['todos'],
        body: CreateTodoSchema,
        response: {
          200: asJsonSchema({
            type: 'object',
            description: 'todo',
            required: ['data'],
            properties: {
              data: TodoSchema,
            },
          }),
        },
      },
      async handler(
        request: FastifyRequest<{ Body: FromSchema<typeof CreateTodoSchema> }>,
      ) {
        const { content } = request.body;
        const todo = await todosService.createTodo(content);
        return {
          data: todo,
        };
      },
    })

    .route({
      method: 'GET',
      url: '/',
      schema: {
        description: 'get todos by query',
        tags: ['todos'],
        querystring: GetTodosSchema,
        response: {
          200: asJsonSchema({
            type: 'object',
            description: 'todos',
            required: ['data'],
            properties: {
              data: {
                type: 'array',
                items: TodoSchema,
              },
            },
          }),
        },
      },
      async handler(
        request: FastifyRequest<{
          Querystring: FromSchema<typeof GetTodosSchema>;
        }>,
      ) {
        const query = request.query;
        const todos = await todosService.getTodos(query);
        return {
          data: todos,
        };
      },
    })

    .route({
      method: 'GET',
      url: '/:id',
      schema: {
        description: 'get a todo',
        tags: ['todos'],
        params: GetTodoSchema,
        response: {
          200: asJsonSchema({
            type: 'object',
            description: 'todo',
            required: ['data'],
            properties: {
              data: TodoSchema,
            },
          }),
        },
      },
      async handler(
        request: FastifyRequest<{ Params: FromSchema<typeof GetTodoSchema> }>,
      ) {
        const { id } = request.params;
        const todo = await todosService.getTodo(id);
        return {
          data: todo,
        };
      },
    })

    .route({
      method: 'PATCH',
      url: '/update/:id',
      schema: {
        description: 'update a todo',
        tags: ['todos'],
        params: UpdateTodoSchema.properties.params,
        body: UpdateTodoSchema.properties.body,
        response: {
          200: asJsonSchema({
            type: 'object',
            description: 'todo',
            required: ['data'],
            properties: {
              data: TodoSchema,
            },
          }),
        },
      },
      async handler(
        request: FastifyRequest<{
          Params: FromSchema<typeof UpdateTodoSchema.properties.params>;
          Body: FromSchema<typeof UpdateTodoSchema.properties.body>;
        }>,
      ) {
        const id = request.params.id;
        const { content, done } = request.body;
        const todo = await todosService.updateTodo(id, content, done);
        return {
          data: todo,
        };
      },
    })

    .route({
      method: 'DELETE',
      url: '/delete/:id',
      schema: {
        description: 'delete a todo',
        tags: ['todos'],
        params: DeleteTodoSchema,
        response: {
          200: asJsonSchema({
            type: 'object',
            description: 'todo',
            required: ['data'],
            properties: {
              data: TodoSchema,
            },
          }),
        },
      },
      async handler(
        request: FastifyRequest<{
          Params: FromSchema<typeof DeleteTodoSchema>;
        }>,
      ) {
        const { id } = request.params;
        const todo = await todosService.deleteTodo(id);
        return {
          data: todo,
        };
      },
    });
});
