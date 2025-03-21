import { FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { glob } from 'glob';
import path from 'node:path';

export interface Options {
  dirPath: string;
  callback?: Callback;
}

export interface Callback {
  (routeFiles: string[]): void;
}

/**
 * routes
 * - filename must ends with `.route.{ts,js}`
 * - must export default a [route function](src/common/typings.ts:#L10)
 * - if prefix is not provided, the route prefix will be the directory path
 * - if prefix is provided, it must be a string and will be used as the route prefix,
 *   example: `export const prefix = '/example'`
 */

export const routesAutoloadPlugin = fastifyPlugin(async function (
  app: FastifyInstance,
  options: Options,
) {
  const { dirPath, callback } = options;
  const files = await glob([`${dirPath}/**/*.route.{ts,js}`], {
    absolute: true,
  });
  const registeredRouteFiles: string[] = [];
  for (const routeFile of files) {
    const route = await import(routeFile);

    if (typeof route.default !== 'function') continue;

    const _path = routeFile.replace(/[\\/]/g, '/').substring(dirPath.length);
    const fileName = path.basename(routeFile);

    if ('prefix' in route && typeof route.prefix !== 'string') {
      throw new Error('Invalid route prefix');
    }

    const prefix =
      route.prefix ??
      (_path.substring(0, _path.length - fileName.length - 1) || '/');

    app.register(route, { prefix });
    registeredRouteFiles.push(routeFile);
  }

  callback?.(registeredRouteFiles);
});
