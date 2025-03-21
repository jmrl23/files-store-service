import { createCache } from 'cache-manager';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { Todo, TodosService } from './todosService';
import Keyv from 'keyv';

describe('test todo service', async function () {
  const todos = new TodosService(
    createCache({
      stores: [new Keyv({ namespace: 'todos' })],
    }),
  );
  let itemRef: Todo;

  it('create item', async () => {
    const item = await todos.createTodo('Walk the dog');
    assert.ok(item);
    itemRef = structuredClone(item);
  });

  it('get item', async () => {
    await assert.rejects(todos.getTodo('invalid id'));
    const item = await todos.getTodo(itemRef.id);
    assert.deepStrictEqual(itemRef, item);
  });

  it('get items', async () => {
    const items = await todos.getTodos();
    assert.strictEqual(items.length, 1);
  });

  it('update item', async () => {
    const content = 'Walk the cat';
    const item = await todos.updateTodo(itemRef.id, content);
    assert.strictEqual(item.content, content);
  });

  it('delete item', async () => {
    const id = itemRef.id;
    const item = await todos.deleteTodo(id);
    assert.strictEqual(item.id, id);
    await assert.rejects(todos.deleteTodo(id));
  });
});
