import superjson from 'superjson';

/**
 * 诊断分享链接数据流
 * 检查 superjson 序列化和反序列化过程
 */

async function diagnose() {
  console.log('=== 分享链接数据流诊断 ===\n');

  // 模拟测试数据
  const testReportData = {
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
      { month: '2024-02', income: 9000, expense: 4500, netFlow: 4500, transactionCount: 28 },
    ],
    regularTransfers: [
      { counterpart: '张三', amount: 1000, intervalDays: 7, occurrences: 4, riskLevel: 'low', regularity: 100 },
    ],
    repaymentTracking: [
      { counterpart: '李四', totalRepaid: 5000, repaymentCount: 5, lastRepaymentDate: new Date('2024-12-01'), averageInterval: 20 },
    ],
    largeInflows: [
      { date: new Date('2024-12-15'), amount: 50000, counterpart: '公司', subsequentExpenses: [] },
    ],
    counterpartSummary: [
      { name: '张三', totalAmount: 10000, transactionCount: 5, type: '个人' },
    ],
    allTransactions: [
      { date: new Date('2024-12-31'), amount: 1000, counterpart: '张三', type: '转账', remark: '测试' },
    ],
  };

  console.log('1. 测试数据结构：');
  console.log('   - overview:', !!testReportData.overview);
  console.log('   - monthlyBreakdown:', testReportData.monthlyBreakdown.length, '条');
  console.log('   - regularTransfers:', testReportData.regularTransfers.length, '条');
  console.log('   - allTransactions:', testReportData.allTransactions.length, '条');

  // 测试 superjson 序列化
  console.log('\n2. superjson 序列化测试：');
  const serialized = superjson.stringify(testReportData);
  console.log('   - 序列化后类型:', typeof serialized);
  console.log('   - 序列化后长度:', serialized.length);
  console.log('   - 前 200 字符:', serialized.substring(0, 200));

  // 测试 superjson 反序列化
  console.log('\n3. superjson 反序列化测试：');
  const deserialized = superjson.parse(serialized);
  console.log('   - 反序列化后类型:', typeof deserialized);
  console.log('   - 反序列化后 overview:', !!deserialized.overview);
  console.log('   - 反序列化后 monthlyBreakdown:', deserialized.monthlyBreakdown?.length || 0);
  console.log('   - 反序列化后日期类型:', deserialized.allTransactions?.[0]?.date instanceof Date ? 'Date' : typeof deserialized.allTransactions?.[0]?.date);

  // 测试 JSON 序列化（数据库存储）
  console.log('\n4. JSON 序列化测试（数据库存储）：');
  const jsonSerialized = JSON.stringify(testReportData);
  console.log('   - JSON 序列化后长度:', jsonSerialized.length);
  console.log('   - 前 200 字符:', jsonSerialized.substring(0, 200));

  // 测试双重序列化问题
  console.log('\n5. 双重序列化问题检测：');
  const doubleSerialized = superjson.stringify(jsonSerialized);
  console.log('   - 双重序列化后长度:', doubleSerialized.length);
  console.log('   - 是否包含转义引号:', doubleSerialized.includes('\\"'));
  
  // 尝试反序列化双重序列化的数据
  try {
    const doubleDeserialized = superjson.parse(doubleSerialized);
    console.log('   - 双重反序列化后类型:', typeof doubleDeserialized);
    console.log('   - 双重反序列化后是字符串:', typeof doubleDeserialized === 'string');
    if (typeof doubleDeserialized === 'string') {
      console.log('   ⚠️  检测到双重序列化问题！数据被序列化为字符串而不是对象');
      console.log('   - 字符串长度:', doubleDeserialized.length);
      console.log('   - 前 200 字符:', doubleDeserialized.substring(0, 200));
    }
  } catch (err) {
    console.log('   - 双重反序列化失败:', err.message);
  }

  // 模拟 API 返回的数据流
  console.log('\n6. 模拟 API 返回数据流：');
  
  // 场景 1: 正确的流程
  console.log('   场景 1: 正确的流程');
  const apiResponse1 = {
    title: '测试报表',
    data: serialized, // superjson.stringify 返回的字符串
  };
  console.log('   - API 返回 data 类型:', typeof apiResponse1.data);
  const parsed1 = superjson.parse(apiResponse1.data);
  console.log('   - 前端解析后类型:', typeof parsed1);
  console.log('   - 前端解析后有 overview:', !!parsed1.overview);

  // 场景 2: 错误的流程（双重序列化）
  console.log('\n   场景 2: 错误的流程（双重序列化）');
  const apiResponse2 = {
    title: '测试报表',
    data: doubleSerialized, // 双重序列化
  };
  console.log('   - API 返回 data 类型:', typeof apiResponse2.data);
  const parsed2 = superjson.parse(apiResponse2.data);
  console.log('   - 前端解析后类型:', typeof parsed2);
  console.log('   - 前端解析后有 overview:', !!parsed2.overview);
  console.log('   - 前端解析后是字符串:', typeof parsed2 === 'string');

  console.log('\n=== 诊断完成 ===');
  console.log('\n结论：');
  console.log('如果场景 2 中前端解析后是字符串，说明存在双重序列化问题');
  console.log('解决方案：在 server/_core/index.ts 中检查 report.data 是否已经是字符串');
}

diagnose().catch(console.error);
