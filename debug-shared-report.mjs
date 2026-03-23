#!/usr/bin/env node

/**
 * 诊断脚本：检查分享链接中的数据完整性
 * 
 * 目标：
 * 1. 检查数据库中是否正确保存了报表数据
 * 2. 检查 API 返回的数据结构
 * 3. 检查组件是否能正确处理数据
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 开始诊断分享链接数据问题...\n');

// 1. 检查 ReportView.tsx 中的数据处理逻辑
console.log('1️⃣  检查 ReportView.tsx 中的数据处理...');
const reportViewPath = '/home/ubuntu/wechat-bill-analyzer/client/src/pages/ReportView.tsx';
const reportViewContent = fs.readFileSync(reportViewPath, 'utf-8');

// 查找 JSON.parse 的调用
if (reportViewContent.includes('JSON.parse')) {
  console.log('✅ 发现 JSON.parse 调用');
} else {
  console.log('❌ 未发现 JSON.parse 调用');
}

// 查找日期转换函数
if (reportViewContent.includes('convertDatesToObjects')) {
  console.log('✅ 发现日期转换函数');
} else {
  console.log('❌ 未发现日期转换函数');
}

// 2. 检查 OverviewSection 组件
console.log('\n2️⃣  检查 OverviewSection 组件...');
const overviewPath = '/home/ubuntu/wechat-bill-analyzer/client/src/components/report/OverviewSection.tsx';
const overviewContent = fs.readFileSync(overviewPath, 'utf-8');

// 检查是否使用了 stats 参数
if (overviewContent.includes('stats.totalIncome')) {
  console.log('✅ 组件正确使用了 stats 参数');
} else {
  console.log('❌ 组件未正确使用 stats 参数');
}

// 3. 检查 MonthlyChart 组件
console.log('\n3️⃣  检查 MonthlyChart 组件...');
const monthlyPath = '/home/ubuntu/wechat-bill-analyzer/client/src/components/report/MonthlyChart.tsx';
const monthlyContent = fs.readFileSync(monthlyPath, 'utf-8');

// 检查是否正确处理了数据
if (monthlyContent.includes('data.map') || monthlyContent.includes('chartData')) {
  console.log('✅ 组件正确处理了数据');
} else {
  console.log('❌ 组件未正确处理数据');
}

// 4. 检查 ShareButton 中的数据传递
console.log('\n4️⃣  检查 ShareButton 中的数据传递...');
const shareButtonPath = '/home/ubuntu/wechat-bill-analyzer/client/src/components/ShareButton.tsx';
const shareButtonContent = fs.readFileSync(shareButtonPath, 'utf-8');

// 检查是否传递了所有必需字段
const requiredFields = ['overview', 'monthlyBreakdown', 'regularTransfers', 'repaymentTracking', 'largeInflows', 'counterpartSummary', 'allTransactions'];
let missingFields = [];

for (const field of requiredFields) {
  if (!shareButtonContent.includes(`reportData.${field}`)) {
    missingFields.push(field);
  }
}

if (missingFields.length === 0) {
  console.log('✅ ShareButton 传递了所有必需字段');
} else {
  console.log(`❌ ShareButton 缺少字段: ${missingFields.join(', ')}`);
}

// 5. 检查 Home.tsx 中的数据收集
console.log('\n5️⃣  检查 Home.tsx 中的数据收集...');
const homePath = '/home/ubuntu/wechat-bill-analyzer/client/src/pages/Home.tsx';
const homeContent = fs.readFileSync(homePath, 'utf-8');

// 查找 ShareButton 的使用
const shareButtonMatch = homeContent.match(/<ShareButton[^>]*reportData=\{([^}]+)\}/s);
if (shareButtonMatch) {
  const reportDataContent = shareButtonMatch[1];
  console.log('✅ 发现 ShareButton 的使用');
  
  // 检查是否包含所有字段
  let homeFields = [];
  for (const field of requiredFields) {
    if (reportDataContent.includes(field)) {
      homeFields.push(field);
    }
  }
  
  console.log(`   传递的字段: ${homeFields.join(', ')}`);
  
  const missingHomeFields = requiredFields.filter(f => !homeFields.includes(f));
  if (missingHomeFields.length > 0) {
    console.log(`   ❌ 缺少字段: ${missingHomeFields.join(', ')}`);
  }
} else {
  console.log('❌ 未发现 ShareButton 的使用');
}

// 6. 检查 server/routers.ts 中的数据处理
console.log('\n6️⃣  检查 server/routers.ts 中的数据处理...');
const routersPath = '/home/ubuntu/wechat-bill-analyzer/server/routers.ts';
const routersContent = fs.readFileSync(routersPath, 'utf-8');

// 检查 reports.create 中是否保存了所有字段
const createReportMatch = routersContent.match(/const reportData = \{([^}]+)\}/s);
if (createReportMatch) {
  const reportDataContent = createReportMatch[1];
  console.log('✅ 发现 reportData 对象');
  
  let savedFields = [];
  for (const field of requiredFields) {
    if (reportDataContent.includes(field)) {
      savedFields.push(field);
    }
  }
  
  console.log(`   保存的字段: ${savedFields.join(', ')}`);
  
  const missingSavedFields = requiredFields.filter(f => !savedFields.includes(f));
  if (missingSavedFields.length > 0) {
    console.log(`   ❌ 缺少字段: ${missingSavedFields.join(', ')}`);
  }
} else {
  console.log('❌ 未发现 reportData 对象');
}

console.log('\n✅ 诊断完成！');
console.log('\n📋 建议：');
console.log('1. 确保 Home.tsx 传递了所有必需字段给 ShareButton');
console.log('2. 确保 ShareButton 的 data 对象包含所有字段');
console.log('3. 确保 server/routers.ts 的 reportData 对象包含所有字段');
console.log('4. 确保 ReportView.tsx 正确处理了所有字段');
