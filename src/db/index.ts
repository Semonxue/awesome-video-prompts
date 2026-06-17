/**
 * Drizzle D1 客户端
 * 在 Next.js App Router 里用：import { db } from '@/db'
 */
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// D1Database 类型在 @cloudflare/workers-types 中定义
export type D1Database = {
  prepare(sql: string): D1PreparedStatement;
  exec(sql: string): Promise<D1ExecResult>;
  batch(stmts: D1Statement[]): Promise<D1Result[]>;
  dump(): Promise<ArrayBuffer>;
};

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

interface D1ExecResult {
  results: unknown[];
  success: boolean;
  meta: { changes_db?: boolean; rows_read?: number; rows_written?: number };
}

interface D1Statement {
  sql: string;
  args?: unknown[];
}

interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: D1ExecResult['meta'];
}

// 全局实例，运行时由 edge runtime 注入 binding
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb(d1: D1Database) {
  _db = drizzle(d1, { schema });
  return _db;
}

// 方便直接导出 schema
export { schema };
export type { Prompt, Tag, Model } from './schema';
