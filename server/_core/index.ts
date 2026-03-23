import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import fileUpload from "express-fileupload";
import superjson from "superjson";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { deleteExpiredReports } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Configure file upload middleware
  app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Image upload endpoint
  app.post('/api/upload', async (req, res) => {
    try {
      const { storagePut } = await import('../storage');
      
      // 从 multipart/form-data 中获取文件
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const file = Array.isArray(req.files.file) ? req.files.file[0] : req.files.file;
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // 验证文件类型
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: 'Only image files are allowed' });
      }
      
      // 生成唯一的文件名
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const fileKey = `feedback/${timestamp}-${random}-${file.name}`;
      
      // 上传到 S3
      const { url } = await storagePut(fileKey, file.data, file.mimetype);
      
      res.json({
        success: true,
        url: url,
      });
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });
  
  // Public report retrieval endpoint (no authentication required)
  app.get('/api/reports/:reportId', async (req, res) => {
    try {
      const { reportId } = req.params;
      const { getReportById } = await import('../db');
      
      const report = await getReportById(reportId);
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      if (report.expiresAt < new Date()) {
        return res.status(404).json({ error: 'Report has expired' });
      }
      
      // 检查 report.data 是否已经是 JSON 字符串
      // 如果是字符串，说明已经被序列化，直接返回
      // 如果是对象，需要用 superjson 序列化
      let dataToReturn: string;
      if (typeof report.data === 'string') {
        // 数据库中存储的已经是 JSON 字符串，直接返回
        dataToReturn = report.data;
      } else {
        // 数据是对象，使用 superjson 序列化
        dataToReturn = superjson.stringify(report.data);
      }
      
      res.json({
        success: true,
        title: report.title,
        data: dataToReturn,
      });
    } catch (error: any) {
      console.error('Failed to get report:', error);
      res.status(500).json({ error: 'Failed to get report' });
    }
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
  
  // 启动定时任务：每小时清理一次过期报表
  const cleanupInterval = setInterval(async () => {
    try {
      console.log('[Cleanup] Starting expired reports cleanup...');
      await deleteExpiredReports();
      console.log('[Cleanup] Expired reports cleanup completed');
    } catch (error) {
      console.error('[Cleanup] Failed to cleanup expired reports:', error);
    }
  }, 60 * 60 * 1000); // 每小时执行一次（3600000 毫秒）
  
  // 在服务器关闭时清理定时器
  server.on('close', () => {
    clearInterval(cleanupInterval);
    console.log('[Cleanup] Cleanup interval cleared');
  });
}

startServer().catch(console.error);
