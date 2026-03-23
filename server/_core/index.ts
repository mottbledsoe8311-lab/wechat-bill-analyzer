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
      
      // 使用 superjson 序列化数据，自动处理 Date 等特殊类型
      const serializedData = superjson.stringify(report.data);
      
      res.json({
        success: true,
        title: report.title,
        data: serializedData,
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
}

startServer().catch(console.error);
