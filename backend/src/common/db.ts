import { drizzle } from 'drizzle-orm/node-postgres';
import { DATABASE_URL } from '../config/env';

export type Db = typeof db;
export const db = drizzle(DATABASE_URL);
