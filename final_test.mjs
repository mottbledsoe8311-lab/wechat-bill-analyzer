import pdfjsLib from 'pdfjs-dist';
import * as fs from 'fs';

pdfjsLib.GlobalWorkerOptions.disableWorker = true;

const pdfPath = '/home/ubuntu/upload/sui(20250501-20260308).pdf';

console.log('=== 最终测试：验证修复后的pdfParser ===\n');

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
  const pagesToRead = Math.min(15, pdf.numPages);
  
  for (let pageNum = 1; pageNum <= pagesToRead; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    const items = textContent.items;
    const rows = new Map();
    
    for (const item of items) {
      if (!item.str || item.str.trim() === '') continue;
      const y = Math.round(item.transform[5]);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push({ x: item.transform[4], str: item.str });
    }
    
    const sortedRows = Array.from(rows.entries()).sort((a, b) => b[0] - a[0]);
    
    // 应用修复：合并被分散的支付方式
    const fixedMergedRows = [];
    let rowIdx2 = 0;
    while (rowIdx2 < sortedRows.length) {
      const [y, cells] = sortedRows[rowIdx2];
      const currentText = cells.map(c => c.str).join(' ');
      
      const hasAmount = /[¥￥]?[\d,.]+/.test(currentText);
      
      if (hasAmount && rowIdx2 + 1 < sortedRows.length) {
        const nextRow = sortedRows[rowIdx2 + 1];
        const nextText = nextRow[1].map(c => c.str).join(' ');
        
        if (/\d{1,2}:\d{2}:\d{2}/.test(nextText) && /卡|账户|零钱|银行/.test(nextText)) {
          const mergedCells = [...cells];
          const combinedText = currentText + ' ' + nextText;
          
          const bankCardMatch = combinedText.match(/(\S*银行\S*)[\s\n]+(\S*卡\S*)/g);
          if (bankCardMatch) {
            const fixedText = combinedText.replace(/([\s\n]+)(?=\d{1,2}:\d{2}:\d{2})/g, ' ');
            mergedCells[0] = { ...mergedCells[0], str: fixedText };
          } else {
            mergedCells[mergedCells.length - 1] = { ...mergedCells[mergedCells.length - 1], str: mergedCells[mergedCells.length - 1].str + ' ' + nextText };
          }
          
          fixedMergedRows.push({ y, cells: mergedCells });
          rowIdx2 += 2;
          continue;
        }
      }
      
      fixedMergedRows.push({ y, cells });
      rowIdx2 += 1;
    }
    
    // 解析交易
    const fullPattern = /^(\d{15,32})\s+(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)\s+([\s\S]+?)\s+(收入|支出|其他|收|支|不计收支)\s+([\s\S]+?)\s+([\d¥￥,.]+)\s+([\s\S]+?)(?:\s+(.*))?$/;
    const dateFirstPattern = /^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)\s+([\s\S]+?)\s+(收入|支出|其他|收|支|不计收支)\s+([\s\S]+?)\s+([\d¥￥,.]+)\s+([\s\S]+?)(?:\s+(.*))?$/;
    
    fixedMergedRows.forEach(({ cells }) => {
      cells.sort((a, b) => a.x - b.x);
      const lineText = cells.map(c => c.str).join(' ');
      const cleaned = lineText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      
      if (!cleaned || cleaned.length < 20) return;
      
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
        }
      }
    });
  }
  
  console.log(`✓ 总共解析到 ${transactions.length} 条交易\n`);
  
  if (transactions.length > 0) {
    console.log('=== 前10条交易详情 ===\n');
    transactions.slice(0, 10).forEach((tx, idx) => {
      console.log(`交易${idx + 1}: ${tx.direction} ${tx.method} ¥${tx.amount.toFixed(2)} ${tx.counterpart}`);
    });
    
    console.log('\n=== 应用BankCardExpenses筛选逻辑 ===\n');
    
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
      bankCardTransactions.slice(0, 10).forEach((tx, idx) => {
        console.log(`交易${idx + 1}: ${tx.method} ¥${tx.amount.toFixed(2)} ${tx.counterpart}`);
      });
    } else {
      console.log('❌ 仍然未找到任何银行卡支出交易');
    }
  }
  
} catch (error) {
  console.error('✗ 错误:', error.message);
  console.error(error.stack);
}
