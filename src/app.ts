import fastify from 'fastify';
import { logger } from './common/logger';

export const app = fastify({
  loggerInstance: logger,
  ignoreTrailingSlash: true,
});
