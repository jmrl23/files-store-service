import * as env from 'env-var';

export const PORT = env.get('PORT').default(3001).asPortNumber();

export const CORS_ORIGIN = env.get('CORS_ORIGIN').asArray(',');

export const API_KEY = env.get('API_KEY').required().asString();
