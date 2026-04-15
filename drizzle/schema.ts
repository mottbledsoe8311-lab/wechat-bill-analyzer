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
  userId: int("userId"), // 用户ID（可选，支持匿名分享）
  title: text("title").notNull(), // 报表标题
  data: text("data", { mode: 'string' }).notNull(), // JSON格式的报表数据（存储为字符串，使用 MEDIUMTEXT）
  createdAt: timestamp("createdAt").defaultNow().notNull(), // 创建时间
  expiresAt: timestamp("expiresAt").notNull(), // 过期时间（7天后）
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

// 高风险账户标记表
export const riskAccounts = mysqlTable("riskAccounts", {
  id: int("id").autoincrement().primaryKey(), // 主键
  accountName: varchar("accountName", { length: 255 }).notNull().unique(), // 账户名称（唯一）
  riskLevel: mysqlEnum("riskLevel", ["high", "medium", "low"]).default("high").notNull(), // 风险等级
  regularity: int("regularity").default(100).notNull(), // 规律度（0-100）
  description: text("description"), // 风险描述
  createdAt: timestamp("createdAt").defaultNow().notNull(), // 创建时间
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(), // 更新时间
});

export type RiskAccount = typeof riskAccounts.$inferSelect;
export type InsertRiskAccount = typeof riskAccounts.$inferInsert;

// 足迹关键词表（停车场/物业关键词）
export const footprintKeywords = mysqlTable("footprintKeywords", {
  id: int("id").autoincrement().primaryKey(),
  keyword: varchar("keyword", { length: 100 }).notNull().unique(), // 关键词
  category: mysqlEnum("category", ["parking", "property", "transit"]).notNull(), // 分类
  description: text("description"), // 备注
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FootprintKeyword = typeof footprintKeywords.$inferSelect;
export type InsertFootprintKeyword = typeof footprintKeywords.$inferInsert;

// 规律转账疑似还款账户关键词表
export const repaymentKeywords = mysqlTable("repaymentKeywords", {
  id: int("id").autoincrement().primaryKey(),
  keyword: varchar("keyword", { length: 255 }).notNull().unique(), // 账户名/关键词
  description: text("description"), // 备注说明
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RepaymentKeyword = typeof repaymentKeywords.$inferSelect;
export type InsertRepaymentKeyword = typeof repaymentKeywords.$inferInsert;

// 每日统计表（上传账单数量 + 分享链接次数）
export const dailyStats = mysqlTable("dailyStats", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull().unique(), // 日期，格式：YYYY-MM-DD
  uploadCount: int("uploadCount").default(0).notNull(), // 当日上传账单次数
  shareCount: int("shareCount").default(0).notNull(),   // 当日分享链接次数
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyStat = typeof dailyStats.$inferSelect;
export type InsertDailyStat = typeof dailyStats.$inferInsert;

// 为了支持大型报表数据，我们需要使用 MEDIUMTEXT
// 但 Drizzle 的 text() 默认生成 TEXT，需要在迁移后手动调整或使用原始 SQL