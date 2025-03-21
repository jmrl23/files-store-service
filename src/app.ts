import fastify from 'fastify';
import { logger } from './common/logger';
import { ajvFilePlugin } from '@fastify/multipart';

export const app = fastify({
  loggerInstance: logger,
  ignoreTrailingSlash: true,
  ajv: {
    plugins: [ajvFilePlugin],
  },
});
