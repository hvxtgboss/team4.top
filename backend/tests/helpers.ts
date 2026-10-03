import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import request from 'supertest';
import { createApp } from '../src/app';
import { initDatabase } from '../src/utils/init-db';
import { closeDatabase, resetDatabaseForTests } from '../src/utils/db';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setupTestApp() {
  await closeDatabase();

  const dbFile = path.join(
    os.tmpdir(),
    `xuedao-test-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`
  );
  process.env.SQLITE_PATH = dbFile;
  process.env.JWT_SECRET = 'test-secret-key';

  await resetDatabaseForTests();
  await initDatabase();
  return createApp();
}

export { request };
