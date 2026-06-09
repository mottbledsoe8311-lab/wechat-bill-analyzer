import { chromium } from '@playwright/test';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => {
    logs.push(msg.text());
  });
  
  try {
    console.log('1. 访问网站...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    console.log('2. 上传PDF文件...');
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      console.log('✗ 找不到文件输入框');
      await browser.close();
      return;
    }
    
    await fileInput.setInputFiles('/tmp/test_bill.pdf');
    await page.waitForTimeout(500);
    
    console.log('3. 点击分析按钮...');
    const buttons = await page.$$('button');
    let found = false;
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text.includes('开始分析')) {
        await btn.click();
        found = true;
        break;
      }
    }
    
    if (!found) {
      console.log('✗ 找不到"开始分析"按钮');
      await browser.close();
      return;
    }
    
    console.log('4. 等待报表生成...');
    await page.waitForTimeout(10000);
    
    console.log('\n=== 检查BankCardExpenses模块 ===');
    
    // 检查占位符文本
    const bodyText = await page.textContent('body');
    if (bodyText.includes('暂无银行卡支出记录')) {
      console.log('✓ 占位符文本"暂无银行卡支出记录"已找到');
    } else {
      console.log('✗ 占位符文本未找到');
    }
    
    // 检查模块标题
    if (bodyText.includes('银行卡支出统计')) {
      console.log('✓ 模块标题"银行卡支出统计"已找到');
    } else {
      console.log('✗ 模块标题未找到');
    }
    
    // 检查console日志
    const bankCardLogs = logs.filter(l => l.includes('[BankCardExpenses]'));
    console.log('\n=== BankCardExpenses日志 ===');
    bankCardLogs.forEach(log => console.log(log));
    
    if (bankCardLogs.length === 0) {
      console.log('✗ 没有BankCardExpenses日志');
    }
    
    // 检查是否显示占位符
    if (bankCardLogs.some(l => l.includes('showing placeholder'))) {
      console.log('\n✓ 占位符已正确显示');
    } else if (bankCardLogs.some(l => l.includes('No bank card expenses'))) {
      console.log('\n✓ 检测到没有银行卡交易');
    }
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await browser.close();
  }
}

await test();
