import superjson from 'superjson';

/**
 * 完整的数据流诊断
 * 模拟从报表生成到分享链接显示的整个过程
 */

console.log('=== 完整数据流诊断 ===\n');

// 1. 模拟原始报表数据
const originalReportData = {
  overview: {
    accountName: '测试账户',
    dateRange: '2024-01-01 至 2024-12-31',
    totalIncome: 100000,
    totalExpense: 50000,
    netFlow: 50000,
    totalTransactions: 365,
    avgDailyIncome: 274,
    avgDailyExpense: 137,
    largestSingleTransaction: 10000,
  },
  monthlyBreakdown: [
    { month: '2024-01', income: 8000, expense: 4000, netFlow: 4000, transactionCount: 30 },
  ],
  regularTransfers: [
    { counterpart: '张三', amount: 1000, intervalDays: 7, occurrences: 4 },
  ],
  repaymentTracking: [],
  largeInflows: [],
  counterpartSummary: [],
  allTransactions: [
    { date: new Date('2024-12-31'), amount: 1000, counterpart: '张三', type: '转账' },
  ],
};

console.log('1️⃣  原始报表数据结构：');
console.log('   - overview:', !!originalReportData.overview);
console.log('   - monthlyBreakdown:', originalReportData.monthlyBreakdown.length);
console.log('   - allTransactions:', originalReportData.allTransactions.length);
console.log('   - 数据类型:', typeof originalReportData);

// 2. 模拟 server/routers.ts 中的数据处理
console.log('\n2️⃣  Server 端数据处理（routers.ts）：');
const reportData = {
  overview: originalReportData.overview,
  monthlyBreakdown: originalReportData.monthlyBreakdown || [],
  regularTransfers: originalReportData.regularTransfers || [],
  repaymentTracking: originalReportData.repaymentTracking || [],
  largeInflows: originalReportData.largeInflows || [],
  counterpartSummary: originalReportData.counterpartSummary || [],
  allTransactions: originalReportData.allTransactions || [],
};
console.log('   - 处理后数据类型:', typeof reportData);
console.log('   - 处理后 overview:', !!reportData.overview);

// 3. 模拟数据库存储（JSON.stringify）
console.log('\n3️⃣  数据库存储（db.ts - JSON.stringify）：');
const dbStoredData = JSON.stringify(reportData);
console.log('   - 存储后类型:', typeof dbStoredData);
console.log('   - 存储后长度:', dbStoredData.length);
console.log('   - 前 100 字符:', dbStoredData.substring(0, 100));
console.log('   - 是否是字符串:', typeof dbStoredData === 'string');

// 4. 模拟 API 端点返回（server/_core/index.ts）
console.log('\n4️⃣  API 端点返回（index.ts）：');
let dataToReturn;
if (typeof dbStoredData === 'string') {
  // 如果已经是字符串，直接返回
  dataToReturn = dbStoredData;
  console.log('   ✅ 检测到数据是字符串，直接返回');
} else {
  // 如果是对象，使用 superjson 序列化
  dataToReturn = superjson.stringify(reportData);
  console.log('   ⚠️  数据是对象，使用 superjson 序列化');
}
console.log('   - 返回数据类型:', typeof dataToReturn);
console.log('   - 返回数据长度:', dataToReturn.length);
console.log('   - 前 100 字符:', dataToReturn.substring(0, 100));

// 5. 模拟前端接收和解析（ReportView.tsx）
console.log('\n5️⃣  前端接收和解析（ReportView.tsx）：');
let parsedData;
if (typeof dataToReturn === 'string') {
  // 尝试用 superjson 解析
  try {
    parsedData = superjson.parse(dataToReturn);
    console.log('   - superjson.parse 成功');
  } catch (err) {
    console.log('   - superjson.parse 失败:', err.message);
    // 如果 superjson 失败，尝试 JSON.parse
    try {
      parsedData = JSON.parse(dataToReturn);
      console.log('   - JSON.parse 成功');
    } catch (err2) {
      console.log('   - JSON.parse 也失败:', err2.message);
      parsedData = null;
    }
  }
}
console.log('   - 解析后数据类型:', typeof parsedData);
console.log('   - 解析后 overview:', !!parsedData?.overview);
console.log('   - 解析后 monthlyBreakdown:', parsedData?.monthlyBreakdown?.length || 0);
console.log('   - 解析后 allTransactions:', parsedData?.allTransactions?.length || 0);

// 6. 检查数据完整性
console.log('\n6️⃣  数据完整性检查：');
if (parsedData) {
  const fields = ['overview', 'monthlyBreakdown', 'regularTransfers', 'repaymentTracking', 'largeInflows', 'counterpartSummary', 'allTransactions'];
  let allFieldsPresent = true;
  for (const field of fields) {
    const present = !!parsedData[field];
    console.log(`   - ${field}: ${present ? '✅' : '❌'}`);
    if (!present) allFieldsPresent = false;
  }
  
  if (allFieldsPresent) {
    console.log('\n   ✅ 所有字段都存在！');
  } else {
    console.log('\n   ❌ 某些字段缺失！');
  }
} else {
  console.log('   ❌ 解析失败，parsedData 为 null');
}

console.log('\n=== 诊断完成 ===');
