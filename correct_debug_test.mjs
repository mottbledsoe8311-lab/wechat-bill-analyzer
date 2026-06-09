import pdfjsLib from 'pdfjs-dist';
import * as fs from 'fs';

// 禁用 worker
pdfjsLib.GlobalWorkerOptions.disableWorker = true;

const pdfPath = '/home/ubuntu/upload/sui(20250501-20260308).pdf';

console.log('=== 正确的测试：使用Y坐标分组解析PDF ===\n');

function parseDate(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{4})[-/.]\d{1,2}[-/.]\d{1,2}/);
  if (!match) return null;
  return new Date(match[0]);
}

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
  
  const transactions = [];
  const pagesToRead = Math.min(10, pdf.numPages);
  
  for (let pageNum = 1; pageNum <= pagesToRead; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // 按Y坐标分组（模拟pdfParser的逻辑）
    const items = textContent.items;
    const rows = new Map();
    
    for (const item of items) {
      if (!item.str || item.str.trim() === '') continue;
      const y = Math.round(item.transform[5]);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push({ x: item.transform[4], str: item.str });
    }
    
    // 按Y坐标排序（从上到下）
    const sortedRows = Array.from(rows.entries())
      .sort((a, b) => b[0] - a[0]);
    
    // 将每行的单元格连接成字符串
    const rowStrings = sortedRows.map(([y, cells]) => {
      // 按X坐标排序（从左到右）
      const sorted = cells.sort((a, b) => a.x - b.x);
      return sorted.map(c => c.str).join(' ');
    });
    
    console.log(`\n=== 第${pageNum}页的行数据 ===\n`);
    rowStrings.slice(0, 15).forEach((row, idx) => {
      console.log(`行${idx}: ${row.substring(0, 120)}...`);
    });
    
    // 现在尝试解析交易
    const fullPattern = /^(\d{15,32})\s+(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)\s+([\s\S]+?)\s+(收入|支出|其他|收|支|不计收支)\s+([\s\S]+?)\s+([\d¥￥,.]+)\s+([\s\S]+?)(?:\s+(.*))?$/;
    const dateFirstPattern = /^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)\s+([\s\S]+?)\s+(收入|支出|其他|收|支|不计收支)\s+([\s\S]+?)\s+([\d¥￥,.]+)\s+([\s\S]+?)(?:\s+(.*))?$/;
    
    rowStrings.forEach((row, idx) => {
      const cleaned = row.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      
      if (!cleaned) return;
      
      let match = cleaned.match(fullPattern);
      if (match) {
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
          console.log(`✓ 第${pageNum}页行${idx}：解析成功 - ${match[4].trim()} ${match[5].trim()} ¥${parseAmount(match[6]).toFixed(2)}`);
        }
        return;
      }
      
      match = cleaned.match(dateFirstPattern);
      if (match) {
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
          console.log(`✓ 第${pageNum}页行${idx}：解析成功 - ${match[3].trim()} ${match[4].trim()} ¥${parseAmount(match[5]).toFixed(2)}`);
        }
      }
    });
  }
  
  console.log(`\n✓ 总共解析到 ${transactions.length} 条交易\n`);
  
  if (transactions.length > 0) {
    console.log('=== 前5条交易详情 ===\n');
    transactions.slice(0, 5).forEach((tx, idx) => {
      console.log(`交易${idx + 1}:`);
      console.log(`  方向: ${tx.direction}`);
      console.log(`  支付方式: "${tx.method}"`);
      console.log(`  对方: ${tx.counterpart}`);
      console.log(`  金额: ¥${tx.amount.toFixed(2)}`);
      console.log();
    });
    
    // 应用BankCardExpenses筛选逻辑
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
    } else {
      console.log('❌ 未找到任何银行卡支出交易');
    }
  }
  
} catch (error) {
  console.error('✗ 错误:', error.message);
  console.error(error.stack);
}
