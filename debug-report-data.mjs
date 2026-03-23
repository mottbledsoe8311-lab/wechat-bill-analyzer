#!/usr/bin/env node

/**
 * 诊断脚本：追踪报表数据从创建到显示的完整流程
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function main() {
  console.log('🔍 开始诊断报表数据流...\n');

  // 1. 检查本地数据库中的报表
  console.log('1️⃣  检查本地数据库中的报表...');
  try {
    const { stdout } = await execAsync(
      `sqlite3 /home/ubuntu/wechat-bill-analyzer/data.db "SELECT id, title, LENGTH(data) as data_size FROM reports LIMIT 5;" 2>/dev/null || echo "SQLite not available"`
    );
    console.log(stdout);
  } catch (e) {
    console.log('SQLite 检查失败，这可能是因为使用的是 MySQL\n');
  }

  // 2. 检查 server/db.ts 中的 createReport 实现
  console.log('\n2️⃣  检查 createReport 函数的实现...');
  try {
    const { stdout } = await execAsync(
      'grep -A 30 "export async function createReport" /home/ubuntu/wechat-bill-analyzer/server/db.ts'
    );
    console.log(stdout);
  } catch (e) {
    console.log('查询失败');
  }

  // 3. 检查 ReportView.tsx 中的数据处理
  console.log('\n3️⃣  检查 ReportView.tsx 中的数据处理逻辑...');
  try {
    const { stdout } = await execAsync(
      'grep -A 5 "const parsedData" /home/ubuntu/wechat-bill-analyzer/client/src/pages/ReportView.tsx'
    );
    console.log(stdout);
  } catch (e) {
    console.log('查询失败');
  }

  // 4. 检查 OverviewSection 组件期望的数据格式
  console.log('\n4️⃣  检查 OverviewSection 组件期望的数据格式...');
  try {
    const { stdout } = await execAsync(
      'head -30 /home/ubuntu/wechat-bill-analyzer/client/src/components/report/OverviewSection.tsx'
    );
    console.log(stdout);
  } catch (e) {
    console.log('查询失败');
  }

  // 5. 检查 MonthlyChart 组件期望的数据格式
  console.log('\n5️⃣  检查 MonthlyChart 组件期望的数据格式...');
  try {
    const { stdout } = await execAsync(
      'head -30 /home/ubuntu/wechat-bill-analyzer/client/src/components/report/MonthlyChart.tsx'
    );
    console.log(stdout);
  } catch (e) {
    console.log('查询失败');
  }

  console.log('\n✅ 诊断完成！');
}

main().catch(console.error);
