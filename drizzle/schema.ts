import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// 报表存储表
export const reports = mysqlTable("reports", {
  id: varchar("id", { length: 32 }).primaryKey(), // 唯一报表ID
  userId: int("userId").notNull(), // 用户ID
  title: text("title").notNull(), // 报表标题
  data: text("data").notNull(), // JSON格式的报表数据
  createdAt: timestamp("createdAt").defaultNow().notNull(), // 创建时间
  expiresAt: timestamp("expiresAt").notNull(), // 过期时间（7天后）
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;