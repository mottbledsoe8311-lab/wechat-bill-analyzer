import { getDb, getReportById } from './server/db.ts';

async function checkData() {
  const db = await getDb();
  if (!db) {
    console.log('Database not available');
    return;
  }

  // 获取最新的报表
  const reports = await db.select().from(db.schema.reports).limit(1);
  
  if (reports.length === 0) {
    console.log('No reports found');
    return;
  }

  const report = reports[0];
  console.log('Report ID:', report.id);
  console.log('Report Title:', report.title);
  console.log('Data type:', typeof report.data);
  console.log('Data is string:', typeof report.data === 'string');
  console.log('Data length:', report.data?.length || 0);
  console.log('First 200 chars:', String(report.data).substring(0, 200));
}

checkData().catch(console.error);
