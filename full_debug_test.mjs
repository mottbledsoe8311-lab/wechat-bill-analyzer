import pdfjsLib from 'pdfjs-dist';
import * as fs from 'fs';

// 禁用 worker
pdfjsLib.GlobalWorkerOptions.disableWorker = true;

const pdfPath = '/home/ubuntu/upload/sui(20250501-20260308).pdf';

console.log('=== 完整测试：模拟pdfParser和BankCardExpenses ===\n');

// 复制pdfParser中的parseDate函数
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  const dateMatch = dateStr.match(/(\d{4})[-/.]\d{1,2}[-/.]\d{1,2}\s+(\d{1,2}):(\d{2})/);
  if (!dateMatch) return null;
  
  const year = parseInt(dateMatch[1]);
  const match2 = dateStr.match(/(\d{4})[-/.]\d{1,2}[-/.]\d{1,2}/);
  if (!match2) return null;
  
  return new Date(match2[0]);
}

// 复制pdfParser中的parseAmount函数
function parseAmount(amountStr) {
  if (!amountStr) return 0;
  const cleaned = amountStr.replace(/[¥￥,]/g, '').trim();
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? 0 : amount;
}

try {
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfData = new Uint8Array(pdfBuffer);
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  
  console.log('✓ PDF已加载，总页数:', pdf.numPages);
  
  // 提取所有文本
  let allText = '';
  const pagesToRead = Math.min(30, pdf.numPages);
  
  for (let pageNum = 1; pageNum <= pagesToRead; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    allText += pageText + '\n';
  }
  
  console.log(`✓ 已提取 ${pagesToRead} 页的文本\n`);
  
  // 使用pdfParser中的正则表达式
  const fullPattern = /^(\d{15,32})\s+(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)\s+([\s\S]+?)\s+(收入|支出|其他|收|支|不计收支)\s+([\s\S]+?)\s+([\d¥￥,.]+)\s+([\s\S]+?)(?:\s+(.*))?$/;
  const dateFirstPattern = /^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)\s+([\s\S]+?)\s+(收入|支出|其他|收|支|不计收支)\s+([\s\S]+?)\s+([\d¥￥,.]+)\s+([\s\S]+?)(?:\s+(.*))?$/;
  
  const transactions = [];
  const lines = allText.split('\n');
  
  console.log(`总行数: ${lines.length}\n`);
  
  // 尝试解析每一行
  let matchCount = 0;
  lines.forEach((line, lineIdx) => {
    const cleaned = line.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (!cleaned) return;
    
    let match = cleaned.match(fullPattern);
    if (match) {
      matchCount++;
      const date = parseDate(match[2]);
      if (date) {
        transactions.push({
          orderId: match[1].trim(),
          date,
          dateStr: match[2].trim(),
          type: match[3].trim(),
          direction: match[4].trim(),
          method: match[5].trim(),
          amount: parseAmount(match[6]),
          counterpart: match[7].trim(),
          merchantId: (match[8] || '').trim(),
        });
      }
      return;
    }
    
    match = cleaned.match(dateFirstPattern);
    if (match) {
      matchCount++;
      const date = parseDate(match[1]);
      if (date) {
        transactions.push({
          orderId: '',
          date,
          dateStr: match[1].trim(),
          type: match[2].trim(),
          direction: match[3].trim(),
          method: match[4].trim(),
          amount: parseAmount(match[5]),
          counterpart: match[6].trim(),
          merchantId: (match[7] || '').trim(),
        });
      }
    }
  });
  
  console.log(`✓ 正则匹配次数: ${matchCount}`);
  console.log(`✓ 解析到 ${transactions.length} 条交易\n`);
  
  if (transactions.length === 0) {
    console.log('❌ 未找到任何交易！');
    console.log('\n=== 样本行分析 ===\n');
    
    // 显示前20行的内容，看看格式如何
    lines.slice(0, 20).forEach((line, idx) => {
      const cleaned = line.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleaned) {
        console.log(`行${idx}: ${cleaned.substring(0, 100)}...`);
      }
    });
  } else {
    console.log('=== 前10条交易详情 ===\n');
    transactions.slice(0, 10).forEach((tx, idx) => {
      console.log(`交易${idx + 1}:`);
      console.log(`  日期: ${tx.dateStr}`);
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
      console.log('✅ BankCardExpenses模块应该能显示这些数据！');
      console.log('\n=== 银行卡支出交易详情 ===\n');
      bankCardTransactions.slice(0, 5).forEach((tx, idx) => {
        console.log(`交易${idx + 1}:`);
        console.log(`  支付方式: "${tx.method}"`);
        console.log(`  清理后: "${(tx.method || '').replace(/\s+/g, '').replace(/[()（）0-9]/g, '')}"`);
        console.log(`  对方: ${tx.counterpart}`);
        console.log(`  金额: ¥${tx.amount.toFixed(2)}`);
        console.log();
      });
    } else {
      console.log('❌ 未找到任何银行卡支出交易');
      
      // 分析为什么
      console.log('\n=== 问题诊断 ===\n');
      const expenseTransactions = transactions.filter(tx => 
        tx.direction === '支出' || tx.direction === '支' || tx.direction?.includes('支')
      );
      console.log(`支出交易总数: ${expenseTransactions.length}`);
      
      if (expenseTransactions.length > 0) {
        console.log('\n支出交易的支付方式统计:');
        const methodCounts = {};
        expenseTransactions.forEach(tx => {
          if (!methodCounts[tx.method]) {
            methodCounts[tx.method] = [];
          }
          methodCounts[tx.method].push(tx);
        });
        
        Object.entries(methodCounts).forEach(([method, txs]) => {
          console.log(`\n"${method}": ${txs.length}次`);
          const cleanMethod = method.replace(/\s+/g, '').replace(/[()（）0-9]/g, '');
          console.log(`  清理后: "${cleanMethod}"`);
          console.log(`  包含"银行卡": ${cleanMethod.includes('银行卡')}`);
          console.log(`  包含"储蓄卡": ${cleanMethod.includes('储蓄卡')}`);
          console.log(`  包含"信用卡": ${cleanMethod.includes('信用卡')}`);
          
          // 显示前3条交易
          txs.slice(0, 3).forEach((tx, idx) => {
            console.log(`    样本${idx + 1}: 对方="${tx.counterpart}", 金额=${tx.amount}`);
          });
        });
      }
    }
  }
  
} catch (error) {
  console.error('✗ 错误:', error.message);
  console.error(error.stack);
}
