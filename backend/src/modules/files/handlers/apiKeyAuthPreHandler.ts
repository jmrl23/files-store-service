import { FastifyRequest } from 'fastify';
import { Forbidden, Unauthorized } from 'http-errors';
import { API_KEY } from '../../../config/env';

export async function apiKeyAuthPreHandler(request: FastifyRequest) {
  const xApiKey = request.headers['x-api-key'];

  if (!xApiKey) throw new Forbidden('Missing API key');

  if (xApiKey !== API_KEY) {
    throw new Unauthorized('Invalid API key');
  }
}
