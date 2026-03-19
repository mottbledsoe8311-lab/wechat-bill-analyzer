import * as fs from 'fs';
import * as pdfjs from 'pdfjs-dist';

const pdfPath = '/home/ubuntu/upload/sui(20250501-20260308).pdf';
const pdfData = fs.readFileSync(pdfPath);

console.log('开始解析PDF...');
const pdf = await pdfjs.getDocument({ data: pdfData }).promise;
console.log(`PDF总页数: ${pdf.numPages}\n`);

const transactions = [];
let pageCount = 0;

for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
  try {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items;
    
    // 提取所有文本
    let pageText = '';
    for (const item of items) {
      pageText += item.str + ' ';
    }
    
    // 按行分割
    const lines = pageText.split(/[\n\r]+/);
    
    // 查找交易信息
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 查找包含交易类型的行
      if (line.includes('商户消费') || line.includes('转账') || line.includes('收入')) {
        // 获取前后文本作为上下文
        const prevLine = i > 0 ? lines[i-1].trim() : '';
        const nextLine = i < lines.length - 1 ? lines[i+1].trim() : '';
        
        transactions.push({
          page: pageNum,
          prevLine,
          line,
          nextLine
        });
      }
    }
    
    pageCount++;
    if (pageCount % 5 === 0) {
      console.log(`已处理 ${pageCount} 页...`);
    }
  } catch (err) {
    console.error(`页面 ${pageNum} 解析出错:`, err.message);
  }
}

console.log(`\n总共找到 ${transactions.length} 条交易记录\n`);

// 统计交易类型
let consumerCount = 0;
let transferCount = 0;
let incomeCount = 0;

const consumerTransactions = [];
const transferTransactions = [];

transactions.forEach(tx => {
  if (tx.line.includes('商户消费')) {
    consumerCount++;
    if (consumerCount <= 20) {
      consumerTransactions.push(tx);
    }
  }
  if (tx.line.includes('转账')) {
    transferCount++;
    if (transferCount <= 20) {
      transferTransactions.push(tx);
    }
  }
  if (tx.line.includes('收入')) {
    incomeCount++;
  }
});

console.log('交易类型统计:');
console.log(`  商户消费: ${consumerCount}`);
console.log(`  转账: ${transferCount}`);
console.log(`  收入: ${incomeCount}`);

console.log('\n\n前20条商户消费交易:');
consumerTransactions.forEach((tx, idx) => {
  console.log(`${idx + 1}. [页${tx.page}] ${tx.line.substring(0, 120)}`);
});

console.log('\n\n前20条转账交易:');
transferTransactions.forEach((tx, idx) => {
  console.log(`${idx + 1}. [页${tx.page}] ${tx.line.substring(0, 120)}`);
});
