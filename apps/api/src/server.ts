import { buildApp } from './app.js';
import { driver } from './db.js';

const app = buildApp();
const port = Number(process.env.PORT ?? 3001);

app.listen({port, host: '0.0.0.0'}).catch(async (error) => {
  app.log.error(error);
  await driver?.close();
  process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await app.close();
    await driver?.close();
    process.exit(0);
  });
}
