import { sql } from 'drizzle-orm';
import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const file = pgTable(
  'File',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    createdAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    key: text().notNull(),
    name: text().notNull(),
    path: text().default('').notNull(),
    mimetype: text().notNull(),
    size: integer().notNull(),
    store: text().notNull(),
  },
  (table) => [
    uniqueIndex('File_key_key').using(
      'btree',
      table.key.asc().nullsLast().op('text_ops'),
    ),
  ],
);
