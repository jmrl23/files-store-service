import { Multipart } from '@fastify/multipart';
import { FastifyRequest } from 'fastify';

export async function filesUploadPreValidation(
  request: FastifyRequest<{ Body: any }>,
) {
  const body = request.body as Record<string, Multipart | Multipart[] | string>;

  if (!(body instanceof Object)) return;

  for (const key in body) {
    const prop = body[key];

    if (!(prop instanceof Object) || Array.isArray(prop)) {
      continue;
    }

    if (prop.type === 'file') {
      body[key] = [prop];
      continue;
    }

    if (prop.type === 'field') {
      if (typeof prop.value === 'string') {
        body[key] = prop.value;
      }
    }
  }
}
