import { eq, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, reports, type InsertReport, type Report } from "../drizzle/schema";
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
    
    const insertData: any = {
      id: data.id,
      title: data.title,
      data: jsonData, // 直接传入 JSON 字符串
      expiresAt: data.expiresAt
    };
    
    // 只在 userId 存在时才添加它
    if (data.userId !== null && data.userId !== undefined) {
      insertData.userId = data.userId;
    }
    
    console.log("[Database] Insert data:", { id: insertData.id, title: insertData.title, dataSize: jsonData.length });
    
    await db.insert(reports).values(insertData);
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
    await db.delete(reports).where(gt(now, reports.expiresAt));
  } catch (error) {
    console.error("[Database] Failed to delete expired reports:", error);
  }
}
