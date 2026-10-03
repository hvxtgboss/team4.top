import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db: Database | null = null;

export function resolveDbPath(): string {
  if (process.env.SQLITE_PATH) {
    return process.env.SQLITE_PATH;
  }
  return path.join(__dirname, '../../database.sqlite');
}

export async function getDatabase(): Promise<Database> {
  if (db) {
    return db;
  }

  const dbPath = resolveDbPath();
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}

/** 测试用：关闭并删除文件库，保证每套用例独立 */
export async function resetDatabaseForTests(): Promise<void> {
  await closeDatabase();
  const dbPath = resolveDbPath();
  if (dbPath !== ':memory:' && fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const database = await getDatabase();
  return database.all(sql, params);
}

export async function run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  const database = await getDatabase();
  const result = await database.run(sql, params);
  return {
    lastID: result.lastID || 0,
    changes: result.changes || 0,
  };
}
