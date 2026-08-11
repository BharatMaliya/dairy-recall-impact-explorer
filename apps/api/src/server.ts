import {fileURLToPath} from 'node:url';
import {buildApp} from './app.js';
import {driver} from './db.js';

type ServerApp = {
  close: () => Promise<unknown>;
  listen: (options: {port: number; host: string}) => Promise<unknown>;
  log: {error: (error: unknown) => void};
};
type ClosableDriver = {close: () => Promise<unknown>} | null;

export async function startServer(
  app: ServerApp = buildApp(),
  activeDriver: ClosableDriver = driver,
  port = Number(process.env.PORT ?? 3001)
) {
  try {
    await app.listen({port, host: '0.0.0.0'});
    return app;
  } catch (error) {
    app.log.error(error);
    await activeDriver?.close();
    throw error;
  }
}

export function registerShutdownHandlers(app: ServerApp, activeDriver: ClosableDriver = driver, exit = process.exit) {
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, async () => {
      await app.close();
      await activeDriver?.close();
      exit(0);
    });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const app = buildApp();
  registerShutdownHandlers(app);
  startServer(app).catch(() => process.exit(1));
}
