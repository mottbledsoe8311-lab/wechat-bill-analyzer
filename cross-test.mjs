const BASE_URL = 'http://localhost:3002';
const TESTS = [];

async function test(name, fn) {
  try {
    await fn();
    TESTS.push({ name, status: '✓ PASS', error: null });
    console.log(`✓ ${name}`);
  } catch (error) {
    TESTS.push({ name, status: '✗ FAIL', error: error.message });
    console.log(`✗ ${name}: ${error.message}`);
  }
}

async function runCrossTests() {
  console.log('=== 开始多轮交叉检验 ===\n');

  // 测试 1: 创建报表
  let reportId = null;
  let shareUrl = null;

  await test('测试 1: 创建报表', async () => {
    const response = await fetch(`${BASE_URL}/api/trpc/reports.create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        json: {
          title: '交叉测试报表',
          data: {
            overview: {
              totalIncome: 100000,
              totalExpense: 50000,
              netFlow: 50000,
              totalTransactions: 200,
              accountName: '测试账户'
            },
            monthlyBreakdown: [
              { month: '2026-01', income: 10000, expense: 5000 },
              { month: '2026-02', income: 12000, expense: 6000 }
            ]
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    const data = result.result.data.json;
    
    if (!data.reportId || !data.sharePath) {
      throw new Error('缺少 reportId 或 sharePath');
    }

    reportId = data.reportId;
    shareUrl = data.sharePath;

    console.log(`  报表 ID: ${reportId}`);
    console.log(`  分享路径: ${shareUrl}`);
  });

  // 测试 2: 验证报表数据（使用 REST API）
  await test('测试 2: 获取报表数据', async () => {
    const response = await fetch(`${BASE_URL}/api/reports/${reportId}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data) {
      throw new Error('缺少 data 字段');
    }

    // 解析 data 字段（可能是字符串或对象）
    let parsedData;
    if (typeof data.data === 'string') {
      parsedData = JSON.parse(data.data);
    } else {
      parsedData = data.data;
    }

    if (!parsedData.overview || parsedData.overview.totalIncome !== 100000) {
      throw new Error('报表数据错误');
    }

    console.log(`  报表标题: ${data.title}`);
    console.log(`  总收入: ${parsedData.overview.totalIncome}`);
  });

  // 测试 3: 验证分享链接格式
  await test('测试 3: 验证分享链接格式', async () => {
    if (!shareUrl.startsWith('/report/')) {
      throw new Error(`分享链接格式错误: ${shareUrl}`);
    }

    console.log(`  分享链接: ${shareUrl}`);
  });

  // 测试 4: 验证完整 URL 拼接
  await test('测试 4: 验证完整 URL 拼接', async () => {
    const fullUrl = `${BASE_URL}${shareUrl}`;
    const response = await fetch(fullUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    if (!html.includes('微信账单')) {
      throw new Error('页面内容不包含微信账单信息');
    }

    console.log(`  完整 URL: ${fullUrl}`);
    console.log(`  页面加载成功 (${html.length} 字节)`);
  });

  // 测试 5: 验证多次访问
  await test('测试 5: 验证多次访问相同报表', async () => {
    for (let i = 0; i < 3; i++) {
      const response = await fetch(`${BASE_URL}/api/reports/${reportId}`);

      if (!response.ok) {
        throw new Error(`第 ${i + 1} 次访问失败: HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.data) {
        throw new Error(`第 ${i + 1} 次访问失败: 数据不完整`);
      }
    }

    console.log(`  成功访问 3 次`);
  });

  // 测试 6: 验证数据库持久化
  await test('测试 6: 验证数据库持久化', async () => {
    // 等待 1 秒确保数据已写入
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await fetch(`${BASE_URL}/api/reports/${reportId}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data) {
      throw new Error('数据库持久化失败');
    }

    // 解析 data 字段
    let parsedData;
    if (typeof data.data === 'string') {
      parsedData = JSON.parse(data.data);
    } else {
      parsedData = data.data;
    }

    if (parsedData.overview.totalIncome !== 100000) {
      throw new Error('数据库持久化失败');
    }

    console.log(`  数据库持久化验证成功`);
  });

  // 测试 7: 验证页面渲染
  await test('测试 7: 验证报表页面渲染', async () => {
    const fullUrl = `${BASE_URL}${shareUrl}`;
    const response = await fetch(fullUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    
    // 检查关键的页面元素
    if (!html.includes('微信账单')) {
      throw new Error('页面未正确渲染');
    }

    console.log(`  报表页面渲染成功`);
  });

  // 打印总结
  console.log('\n=== 测试总结 ===');
  const passed = TESTS.filter(t => t.status === '✓ PASS').length;
  const failed = TESTS.filter(t => t.status === '✗ FAIL').length;

  console.log(`总测试数: ${TESTS.length}`);
  console.log(`通过: ${passed}`);
  console.log(`失败: ${failed}`);

  if (failed > 0) {
    console.log('\n失败的测试:');
    TESTS.filter(t => t.status === '✗ FAIL').forEach(t => {
      console.log(`  - ${t.name}: ${t.error}`);
    });
    process.exit(1);
  }

  console.log('\n✅ 所有测试完成！');
}

runCrossTests().catch(console.error);
