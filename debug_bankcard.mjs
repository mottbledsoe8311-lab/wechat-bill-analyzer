import pdfjsLib from 'pdfjs-dist';
import * as fs from 'fs';

// 禁用 worker
pdfjsLib.GlobalWorkerOptions.disableWorker = true;

const pdfPath = '/home/ubuntu/upload/sui(20250501-20260308).pdf';

console.log('=== 深度调试：BankCardExpenses模块 ===\n');

try {
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfData = new Uint8Array(pdfBuffer);
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  
  console.log('✓ PDF已加载，总页数:', pdf.numPages);
  
  let allText = '';
  const pagesToRead = Math.min(30, pdf.numPages);
  
  for (let pageNum = 1; pageNum <= pagesToRead; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    allText += pageText + '\n';
  }
  
  console.log(`✓ 已提取 ${pagesToRead} 页的文本\n`);
  
  // 模拟pdfParser的解析逻辑（简化版）
  const transactionRegex = /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?\s+(支出|收入|其他)\s+([¥￥]?[\d,.]+)\s+(.+?)(?=\d{4}-\d{2}-\d{2}|\Z)/gs;
  
  const transactions = [];
  let match;
  
  while ((match = transactionRegex.exec(allText)) !== null) {
    const [, year, month, day, hour, minute, , direction, amountStr, rest] = match;
    
    // 从rest中提取method和counterpart
    const parts = rest.trim().split(/\s+/);
    const method = parts[0] || '';
    const counterpart = parts.slice(1).join(' ').trim() || '未知';
    
    const amount = parseFloat(amountStr.replace(/[¥￥,]/g, ''));
    
    if (!isNaN(amount)) {
      transactions.push({
        date: new Date(`${year}-${month}-${day}T${hour}:${minute}:00`),
        direction,
        method,
        counterpart,
        amount,
      });
    }
  }
  
  console.log(`✓ 解析到 ${transactions.length} 条交易\n`);
  
  // 显示前10条交易的详细信息
  console.log('=== 前10条交易详情 ===\n');
  transactions.slice(0, 10).forEach((tx, idx) => {
    console.log(`交易 ${idx + 1}:`);
    console.log(`  日期: ${tx.date.toISOString()}`);
    console.log(`  方向: ${tx.direction}`);
    console.log(`  支付方式: "${tx.method}"`);
    console.log(`  对方: ${tx.counterpart}`);
    console.log(`  金额: ¥${tx.amount.toFixed(2)}`);
    console.log();
  });
  
  // 现在应用BankCardExpenses的筛选逻辑
  console.log('=== 应用BankCardExpenses筛选逻辑 ===\n');
  
  const bankCardTransactions = transactions.filter(tx => {
    const isExpense = tx.direction === '支出' || tx.direction === '支' || tx.direction?.includes('支');
    const cleanMethod = (tx.method || '').replace(/\s+/g, '').replace(/[()（）0-9]/g, '');
    const isBankCard = cleanMethod.includes('银行卡') || cleanMethod.includes('储蓄卡') || cleanMethod.includes('信用卡');
    
    return isExpense && isBankCard;
  });
  
  console.log(`✓ 筛选后的银行卡支出交易: ${bankCardTransactions.length}条\n`);
  
  if (bankCardTransactions.length > 0) {
    console.log('=== 银行卡支出交易详情 ===\n');
    bankCardTransactions.slice(0, 5).forEach((tx, idx) => {
      console.log(`交易 ${idx + 1}:`);
      console.log(`  日期: ${tx.date.toISOString()}`);
      console.log(`  支付方式: "${tx.method}"`);
      console.log(`  清理后: "${(tx.method || '').replace(/\s+/g, '').replace(/[()（）0-9]/g, '')}"`);
      console.log(`  对方: ${tx.counterpart}`);
      console.log(`  金额: ¥${tx.amount.toFixed(2)}`);
      console.log();
    });
    
    console.log('✅ BankCardExpenses模块应该能显示这些数据！');
  } else {
    console.log('❌ 未找到任何银行卡支出交易');
    
    // 分析为什么没有找到
    console.log('\n=== 问题诊断 ===\n');
    
    const expenseTransactions = transactions.filter(tx => 
      tx.direction === '支出' || tx.direction === '支' || tx.direction?.includes('支')
    );
    console.log(`支出交易总数: ${expenseTransactions.length}`);
    
    if (expenseTransactions.length > 0) {
      console.log('支出交易的支付方式统计:');
      const methodCounts = {};
      expenseTransactions.forEach(tx => {
        if (!methodCounts[tx.method]) {
          methodCounts[tx.method] = 0;
        }
        methodCounts[tx.method]++;
      });
      Object.entries(methodCounts).forEach(([method, count]) => {
        console.log(`  "${method}": ${count}次`);
      });
    }
  }
  
} catch (error) {
  console.error('✗ 错误:', error.message);
  console.error(error.stack);
}
