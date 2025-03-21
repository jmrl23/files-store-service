import * as env from 'env-var';

export const PORT = env.get('PORT').default(3001).asPortNumber();

export const CORS_ORIGIN = env.get('CORS_ORIGIN').asArray(',');
