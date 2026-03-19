import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as pdfjs from 'pdfjs-dist';

const pdfPath = '/home/ubuntu/upload/sui(20250501-20260308).pdf';
const pdfData = fs.readFileSync(pdfPath);

console.log('开始解析PDF...');
const pdf = await pdfjs.getDocument({ data: pdfData }).promise;
console.log(`PDF总页数: ${pdf.numPages}`);

// 只解析前10页作为示例
const pagesToCheck = Math.min(10, pdf.numPages);
const allTransactions = [];

for (let pageNum = 1; pageNum <= pagesToCheck; pageNum++) {
  try {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const text = textContent.items.map(item => item.str).join(' ');
    
    // 分行处理
    const lines = text.split(/[\n\r]+/);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // 查找包含交易信息的行
      if (line.length > 0 && (line.includes('消费') || line.includes('转账') || line.includes('收入'))) {
        allTransactions.push({
          page: pageNum,
          content: line.substring(0, 150)
        });
      }
    }
  } catch (err) {
    console.error(`页面 ${pageNum} 解析出错:`, err.message);
  }
}

console.log(`\n找到的交易记录（前50条）:`);
allTransactions.slice(0, 50).forEach((tx, idx) => {
  console.log(`${idx + 1}. [页${tx.page}] ${tx.content}`);
});

console.log(`\n总共找到 ${allTransactions.length} 条交易记录`);

// 统计交易类型
let consumerCount = 0;
let transferCount = 0;
let incomeCount = 0;

allTransactions.forEach(tx => {
  if (tx.content.includes('消费')) consumerCount++;
  if (tx.content.includes('转账')) transferCount++;
  if (tx.content.includes('收入')) incomeCount++;
});

console.log('\n交易类型统计:');
console.log(`  消费: ${consumerCount}`);
console.log(`  转账: ${transferCount}`);
console.log(`  收入: ${incomeCount}`);
