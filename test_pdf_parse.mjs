import pdfjsLib from 'pdfjs-dist';
import * as fs from 'fs';

// 禁用 worker
pdfjsLib.GlobalWorkerOptions.disableWorker = true;

const pdfPath = '/home/ubuntu/upload/sui(20250501-20260308).pdf';

console.log('=== 开始解析真实PDF文件 ===\n');

try {
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfData = new Uint8Array(pdfBuffer);
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  
  console.log('PDF总页数:', pdf.numPages);
  console.log('开始提取交易数据...\n');
  
  let allText = '';
  
  // 只解析前3页以节省时间
  const pagesToRead = Math.min(3, pdf.numPages);
  
  for (let pageNum = 1; pageNum <= pagesToRead; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    allText += pageText + '\n';
    console.log(`✓ 已解析第 ${pageNum} 页`);
  }
  
  console.log('\n=== 提取的文本内容（前1500字符）===');
  console.log(allText.substring(0, 1500));
  
  console.log('\n\n=== 查找支付方式 ===');
  
  // 查找所有可能的支付方式
  const methodPatterns = [
    { name: '银行卡', pattern: /银行卡/g },
    { name: '储蓄卡', pattern: /储蓄卡/g },
    { name: '信用卡', pattern: /信用卡/g },
    { name: '零钱', pattern: /零钱/g },
    { name: '支付宝', pattern: /支付宝/g },
  ];
  
  methodPatterns.forEach(({ name, pattern }) => {
    const matches = allText.match(pattern);
    if (matches) {
      console.log(`✓ 找到 "${name}": ${matches.length} 次`);
    } else {
      console.log(`✗ 未找到 "${name}"`);
    }
  });
  
  // 查找所有"支出"交易
  const expenseMatches = allText.match(/支出/g);
  if (expenseMatches) {
    console.log(`✓ 找到 "支出": ${expenseMatches.length} 次`);
  } else {
    console.log(`✗ 未找到 "支出"`);
  }
  
  console.log('\n=== 分析完成 ===');
  
} catch (error) {
  console.error('解析错误:', error.message);
}
