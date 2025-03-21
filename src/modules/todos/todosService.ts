import { NotFound } from 'http-errors';
import { FromSchema } from 'json-schema-to-ts';
import crypto from 'node:crypto';
import { Cache } from 'cache-manager';
import { TodoSchema } from './schemas/todo.schema';
import { GetTodosSchema } from './schemas/getTodos.schema';

export interface Todo extends FromSchema<typeof TodoSchema> {}

/**
 * This is just an example, just imagine we're
 * using database for todos and we actually need caching
 */
export class TodosService {
  private readonly todos: Todo[] = [];

  constructor(private readonly cache: Cache) {}

  public async createTodo(content: string): Promise<Todo> {
    const id = crypto.randomUUID();
    const now = new Date();
    const todo: Todo = {
      id,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      content,
      done: false,
    };
    this.todos.push(todo);
    await this.cache.set(`todo#id:${id}`, structuredClone(todo), 300 * 1000);
    return todo;
  }

  public async getTodos(
    query: FromSchema<typeof GetTodosSchema> = {},
  ): Promise<Todo[]> {
    const cacheKey = `todos#query:(${JSON.stringify([query.content, query.done, query.skip, query.take])})`;

    if (query.revalidate === true) {
      await this.cache.del(cacheKey);
    }

    const cachedtodos = await this.cache.get<Todo[]>(cacheKey);
    if (cachedtodos) return cachedtodos;

    const todos = structuredClone(
      this.todos.filter((todo) => {
        let isIncluded = true;

        if (query.content !== undefined) {
          if (!todo.content.startsWith(query.content)) isIncluded = false;
        }

        if (!isIncluded) return false;

        if (query.done !== undefined) {
          if (todo.done !== query.done) isIncluded = false;
        }

        return isIncluded;
      }),
    ).slice(query.skip, query.take);

    await this.cache.set(
      cacheKey,
      todos,
      300 * 1000, // 5 mins.
    );

    return todos;
  }

  public async getTodo(id: string): Promise<Todo> {
    const cachedKey = `todo#id:${id}`;
    const cachedTodo = await this.cache.get<Todo>(cachedKey);
    if (cachedTodo !== null) return cachedTodo;

    const todo = structuredClone(this.todos.find((todo) => todo.id === id));
    if (!todo) throw new NotFound('Todo not found');

    await this.cache.set(cachedKey, todo, 300 * 1000);
    return todo;
  }

  public async updateTodo(
    id: string,
    content?: string,
    done?: boolean,
  ): Promise<Todo> {
    const todo = this.todos.find((todo) => todo.id);
    if (!todo) throw new NotFound('Todo not found');

    if (content !== undefined) todo.content = content;
    if (done !== undefined) todo.done = done;

    const todoClone = structuredClone(todo);
    await this.cache.set(`todo#id:${todo.id}`, todoClone, 300 * 1000);
    return todoClone;
  }

  public async deleteTodo(id: string): Promise<Todo> {
    const index = this.todos.findIndex((todo) => todo.id === id);
    if (index < 0) throw new NotFound('Todo not found');

    await this.cache.del(`todo#id:${id}`);
    const todo = this.todos.splice(index, 1)[0];
    return todo;
  }
}
