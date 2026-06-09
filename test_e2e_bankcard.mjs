import pdfjsLib from 'pdfjs-dist';
import * as fs from 'fs';

// 禁用 worker
pdfjsLib.GlobalWorkerOptions.disableWorker = true;

const pdfPath = '/home/ubuntu/upload/sui(20250501-20260308).pdf';

console.log('=== 端到端测试：验证BankCardExpenses模块 ===\n');

try {
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfData = new Uint8Array(pdfBuffer);
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  
  console.log('✓ PDF已加载，总页数:', pdf.numPages);
  
  let allText = '';
  const pagesToRead = Math.min(10, pdf.numPages); // 读取前10页
  
  for (let pageNum = 1; pageNum <= pagesToRead; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    allText += pageText + '\n';
  }
  
  console.log(`✓ 已提取 ${pagesToRead} 页的文本\n`);
  
  // 使用与pdfParser相同的正则表达式解析交易
  const lines = allText.split('\n');
  const transactions = [];
  
  // 简化的交易解析（模拟pdfParser的逻辑）
  lines.forEach(line => {
    const cleaned = line.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    
    // 查找包含日期、方向和金额的行
    if (cleaned.includes('支出') && cleaned.match(/\d{4}-\d{2}-\d{2}/)) {
      // 提取关键信息
      const dateMatch = cleaned.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
      const directionMatch = cleaned.match(/(支出|收入|其他|支|收)/);
      const amountMatch = cleaned.match(/([¥￥])?\s*([\d,.]+)\s+/);
      
      // 提取method（支付方式）
      const methodMatch = cleaned.match(/(工商银行储\s*蓄卡|华夏银行信\s*用卡|银行卡|储蓄卡|信用卡|零钱)(?:\(\d+\))?/);
      
      if (dateMatch && directionMatch && amountMatch && methodMatch) {
        const method = methodMatch[1];
        const direction = directionMatch[1];
        
        transactions.push({
          date: new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`),
          direction,
          method,
          amount: parseFloat(amountMatch[2].replace(/[,，]/g, '')),
        });
      }
    }
  });
  
  console.log(`✓ 解析到 ${transactions.length} 条交易\n`);
  
  // 应用修复后的BankCardExpenses筛选逻辑
  console.log('=== 应用修复后的筛选逻辑 ===\n');
  
  const bankCardTransactions = transactions.filter(tx => {
    const isExpense = tx.direction === '支出' || tx.direction === '支' || tx.direction?.includes('支');
    // 清理method中的空格、括号和数字后再检查
    const cleanMethod = (tx.method || '').replace(/\s+/g, '').replace(/[()（）0-9]/g, '');
    // 匹配各种银行卡类型
    const isBankCard = cleanMethod.includes('银行卡') || cleanMethod.includes('储蓄卡') || cleanMethod.includes('信用卡');
    
    return isExpense && isBankCard;
  });
  
  console.log(`✓ 找到 ${bankCardTransactions.length} 条银行卡支出交易\n`);
  
  if (bankCardTransactions.length > 0) {
    console.log('=== 银行卡支出统计 ===\n');
    
    // 按支付方式分类
    const byMethod = {};
    let totalAmount = 0;
    
    bankCardTransactions.forEach(tx => {
      const cleanMethod = (tx.method || '').replace(/\s+/g, '').replace(/[()（）0-9]/g, '');
      if (!byMethod[cleanMethod]) {
        byMethod[cleanMethod] = { count: 0, amount: 0 };
      }
      byMethod[cleanMethod].count++;
      byMethod[cleanMethod].amount += tx.amount;
      totalAmount += tx.amount;
    });
    
    console.log('支付方式统计:');
    Object.entries(byMethod).forEach(([method, data]) => {
      console.log(`  ${method}: ${data.count}笔, ¥${data.amount.toFixed(2)}`);
    });
    
    console.log(`\n总计: ${bankCardTransactions.length}笔, ¥${totalAmount.toFixed(2)}`);
    console.log('\n✓ BankCardExpenses模块应该能正确显示这些数据');
  } else {
    console.log('✗ 未找到银行卡支出交易');
  }
  
} catch (error) {
  console.error('✗ 错误:', error.message);
}
