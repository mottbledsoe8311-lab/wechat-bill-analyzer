import { eq, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, reports, riskAccounts, type InsertReport, type Report, type RiskAccount, type InsertRiskAccount, visitorStats, type VisitorStat, type InsertVisitorStat } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// 报表相关查询
export async function createReport(data: InsertReport): Promise<Report | undefined> {
  const db = await getDb();
  if (!db) {
    console.error("[Database] Cannot create report: database not available");
    throw new Error("Database connection not available");
  }

  try {
    console.log("[Database] Creating report:", { id: data.id, userId: data.userId, title: data.title });
    
    // 确保 data 字段被正确地序列化为 JSON 字符串
    let jsonData: string;
    if (typeof data.data === 'string') {
      jsonData = data.data;
    } else {
      jsonData = JSON.stringify(data.data);
    }
    
    // 显式处理所有字段
    const now = new Date();
    const expiresAt = new Date(data.expiresAt);
    
    // 使用原生 SQL 绕过 Drizzle ORM 的问题
    const connection = (db as any).session.client;
    
    const sql = data.userId 
      ? `INSERT INTO reports (id, userId, title, data, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?)`
      : `INSERT INTO reports (id, title, data, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?)`;
    
    const params = data.userId
      ? [data.id, data.userId, data.title, jsonData, now, expiresAt]
      : [data.id, data.title, jsonData, now, expiresAt];
    
    console.log("[Database] Executing SQL:", sql);
    console.log("[Database] Insert data:", { 
      id: data.id, 
      userId: data.userId,
      title: data.title, 
      dataSize: jsonData.length,
      createdAt: now,
      expiresAt: expiresAt
    });
    
    await connection.execute(sql, params);
    console.log("[Database] Insert completed for report:", data.id);
    
    // 获取插入的记录
    const created = await db.select().from(reports).where(eq(reports.id, data.id)).limit(1);
    console.log("[Database] Retrieved report:", created.length > 0 ? created[0].id : "not found");
    
    if (created.length === 0) {
      console.error("[Database] Failed to retrieve created report after insert");
      throw new Error("Failed to retrieve created report");
    }
    
    console.log("[Database] Report created successfully:", created[0].id);
    return created[0];
  } catch (error) {
    console.error("[Database] Failed to create report:", error);
    throw error;
  }
}

export async function getReportById(reportId: string): Promise<Report | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get report: database not available");
    return undefined;
  }

  try {
    const result = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get report:", error);
    throw error;
  }
}

export async function deleteExpiredReports(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete reports: database not available");
    return;
  }

  try {
    const now = new Date();
    await db.delete(reports).where(gt(reports.expiresAt, now));
  } catch (error) {
    console.error("[Database] Failed to delete expired reports:", error);
  }
}

// 高风险账户相关查询
export async function saveRiskAccount(data: InsertRiskAccount): Promise<RiskAccount | undefined> {
  const db = await getDb();
  if (!db) {
    console.error("[Database] Cannot save risk account: database not available");
    throw new Error("Database connection not available");
  }

  try {
    console.log("[Database] Saving risk account:", data.accountName);
    
    // 使用 onDuplicateKeyUpdate 处理重复的账户名
    await db.insert(riskAccounts).values(data).onDuplicateKeyUpdate({
      set: {
        riskLevel: data.riskLevel,
        regularity: data.regularity,
        description: data.description,
        updatedAt: new Date(),
      },
    });
    
    // 获取保存的记录
    const saved = await db.select().from(riskAccounts).where(eq(riskAccounts.accountName, data.accountName)).limit(1);
    console.log("[Database] Risk account saved successfully:", data.accountName);
    return saved.length > 0 ? saved[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to save risk account:", error);
    throw error;
  }
}

export async function getRiskAccountByName(accountName: string): Promise<RiskAccount | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get risk account: database not available");
    return undefined;
  }

  try {
    const result = await db.select().from(riskAccounts).where(eq(riskAccounts.accountName, accountName)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get risk account:", error);
    throw error;
  }
}

export async function getAllRiskAccounts(): Promise<RiskAccount[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get risk accounts: database not available");
    return [];
  }

  try {
    const result = await db.select().from(riskAccounts);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get risk accounts:", error);
    return [];
  }
}

// 足迹关键词相关查询
import { footprintKeywords, repaymentKeywords, type FootprintKeyword, type InsertFootprintKeyword, type RepaymentKeyword, type InsertRepaymentKeyword } from "../drizzle/schema";

export async function getAllFootprintKeywords(): Promise<FootprintKeyword[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(footprintKeywords);
  } catch (error) {
    console.error("[Database] Failed to get footprint keywords:", error);
    return [];
  }
}

export async function saveFootprintKeyword(data: InsertFootprintKeyword): Promise<FootprintKeyword | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database connection not available");
  try {
    await db.insert(footprintKeywords).values(data).onDuplicateKeyUpdate({
      set: { keyword: data.keyword, category: data.category ?? null, description: data.description ?? null },
    });
    const saved = await db.select().from(footprintKeywords).where(eq(footprintKeywords.keyword, data.keyword)).limit(1);
    return saved.length > 0 ? saved[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to save footprint keyword:", error);
    throw error;
  }
}

export async function deleteFootprintKeyword(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection not available");
  try {
    await db.delete(footprintKeywords).where(eq(footprintKeywords.id, id));
  } catch (error) {
    console.error("[Database] Failed to delete footprint keyword:", error);
    throw error;
  }
}

// 规律转账疑似还款账户关键词相关查询
export async function getAllRepaymentKeywords(): Promise<RepaymentKeyword[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(repaymentKeywords);
  } catch (error) {
    console.error("[Database] Failed to get repayment keywords:", error);
    return [];
  }
}

export async function saveRepaymentKeyword(data: InsertRepaymentKeyword): Promise<RepaymentKeyword | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database connection not available");
  try {
    await db.insert(repaymentKeywords).values(data).onDuplicateKeyUpdate({
      set: { keyword: data.keyword, description: data.description ?? null },
    });
    const saved = await db.select().from(repaymentKeywords).where(eq(repaymentKeywords.keyword, data.keyword)).limit(1);
    return saved.length > 0 ? saved[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to save repayment keyword:", error);
    throw error;
  }
}

export async function deleteRepaymentKeyword(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection not available");
  try {
    await db.delete(repaymentKeywords).where(eq(repaymentKeywords.id, id));
  } catch (error) {
    console.error("[Database] Failed to delete repayment keyword:", error);
    throw error;
  }
}

// 每日统计相关查询
import { dailyStats, type DailyStat } from "../drizzle/schema";
import { sql as drizzleSql } from "drizzle-orm";

// 获取当日日期字符串 YYYY-MM-DD
function getTodayStr(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

// 自增上传计数
export async function incrementUploadCount(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const today = getTodayStr();
  try {
    await db.insert(dailyStats)
      .values({ date: today, uploadCount: 1, shareCount: 0 })
      .onDuplicateKeyUpdate({ set: { uploadCount: drizzleSql`uploadCount + 1` } });
  } catch (error) {
    console.error("[Database] Failed to increment upload count:", error);
  }
}

// 自增 PV 计数
export async function incrementPvCount(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const today = getTodayStr();
  try {
    await db.insert(dailyStats)
      .values({ date: today, uploadCount: 0, shareCount: 0, pvCount: 1 })
      .onDuplicateKeyUpdate({ set: { pvCount: drizzleSql`pvCount + 1` } });
  } catch (error) {
    console.error("[Database] Failed to increment pv count:", error);
  }
}

// 自增分享计数
export async function incrementShareCount(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const today = getTodayStr();
  try {
    await db.insert(dailyStats)
      .values({ date: today, uploadCount: 0, shareCount: 1 })
      .onDuplicateKeyUpdate({ set: { shareCount: drizzleSql`shareCount + 1` } });
  } catch (error) {
    console.error("[Database] Failed to increment share count:", error);
  }
}

// 获取近 N 天的统计数据
export async function getDailyStats(days: number = 14): Promise<DailyStat[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    // 生成近 N 天的日期列表
    const result = await db.select().from(dailyStats)
      .orderBy(dailyStats.date);
    // 返回最近 days 天的数据
    return result.slice(-days);
  } catch (error) {
    console.error("[Database] Failed to get daily stats:", error);
    return [];
  }
}

// 访客统计相关函数
export async function recordVisitorUpload(visitorId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const today = getTodayStr();
  try {
    await db.insert(visitorStats)
      .values({ 
        visitorId, 
        date: today, 
        visitCount: 0, 
        uploadCount: 1,
        lastVisitAt: new Date(),
      })
      .onDuplicateKeyUpdate({ 
        set: { 
          uploadCount: drizzleSql`uploadCount + 1`,
          lastVisitAt: new Date(),
        } 
      });
  } catch (error) {
    console.error("[Database] Failed to record visitor upload:", error);
  }
}

export async function recordVisitorVisit(visitorId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const today = getTodayStr();
  try {
    await db.insert(visitorStats)
      .values({ 
        visitorId, 
        date: today, 
        visitCount: 1, 
        uploadCount: 0,
        lastVisitAt: new Date(),
      })
      .onDuplicateKeyUpdate({ 
        set: { 
          visitCount: drizzleSql`visitCount + 1`,
          lastVisitAt: new Date(),
        } 
      });
  } catch (error) {
    console.error("[Database] Failed to record visitor visit:", error);
  }
}

// 获取访客统计数据（按日期和访客ID分组）
export async function getVisitorStats(days: number = 14): Promise<Array<{
  date: string;
  uniqueVisitors: number;
  totalVisits: number;
  totalUploads: number;
}>> {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db.select().from(visitorStats)
      .orderBy(visitorStats.date);
    
    // 按日期分组统计
    const grouped = new Map<string, {
      uniqueVisitors: Set<string>;
      totalVisits: number;
      totalUploads: number;
    }>();

    result.forEach(row => {
      if (!grouped.has(row.date)) {
        grouped.set(row.date, {
          uniqueVisitors: new Set(),
          totalVisits: 0,
          totalUploads: 0,
        });
      }
      const stats = grouped.get(row.date)!;
      stats.uniqueVisitors.add(row.visitorId);
      stats.totalVisits += row.visitCount;
      stats.totalUploads += row.uploadCount;
    });

    // 转换为数组格式，返回最近days天
    const output = Array.from(grouped.entries())
      .map(([date, stats]) => ({
        date,
        uniqueVisitors: stats.uniqueVisitors.size,
        totalVisits: stats.totalVisits,
        totalUploads: stats.totalUploads,
      }))
      .slice(-days);

    return output;
  } catch (error) {
    console.error("[Database] Failed to get visitor stats:", error);
    return [];
  }
}

// 获取总体访客统计摘要
export async function getVisitorSummary(days: number = 14): Promise<{
  totalUniqueVisitors: number;
  totalVisits: number;
  totalUploads: number;
}> {
  const db = await getDb();
  if (!db) return { totalUniqueVisitors: 0, totalVisits: 0, totalUploads: 0 };
  try {
    const result = await db.select().from(visitorStats)
      .orderBy(visitorStats.date);

    // 计算最近days天的统计
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = cutoffDate.toISOString().slice(0, 10);

    const recentData = result.filter(row => row.date >= cutoffStr);

    const uniqueVisitors = new Set(recentData.map(row => row.visitorId));
    const totalVisits = recentData.reduce((sum, row) => sum + row.visitCount, 0);
    const totalUploads = recentData.reduce((sum, row) => sum + row.uploadCount, 0);

    return {
      totalUniqueVisitors: uniqueVisitors.size,
      totalVisits,
      totalUploads,
    };
  } catch (error) {
    console.error("[Database] Failed to get visitor summary:", error);
    return { totalUniqueVisitors: 0, totalVisits: 0, totalUploads: 0 };
  }
}
