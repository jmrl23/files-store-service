import { detect } from 'detect-port';
import { app } from './app';
import { bootstrap } from './bootstrap';
import { PORT } from './config/env';

async function main() {
  const host = '0.0.0.0';
  const port = await detect(PORT);

  await app.register(bootstrap);

  app.listen({
    host,
    port,
    listenTextResolver: (address) => `server listening at ${address}`,
  });
}

void main();
