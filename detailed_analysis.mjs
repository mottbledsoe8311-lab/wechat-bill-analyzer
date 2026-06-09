import pdfjsLib from 'pdfjs-dist';
import * as fs from 'fs';

pdfjsLib.GlobalWorkerOptions.disableWorker = true;

const pdfPath = '/home/ubuntu/upload/sui(20250501-20260308).pdf';

console.log('=== 详细分析PDF结构 ===\n');

try {
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfData = new Uint8Array(pdfBuffer);
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  
  // 只分析第4页（已知有交易数据）
  const pageNum = 4;
  const page = await pdf.getPage(pageNum);
  const textContent = await page.getTextContent();
  
  console.log(`第${pageNum}页的原始文本项（前50个）:\n`);
  
  textContent.items.slice(0, 50).forEach((item, idx) => {
    console.log(`项${idx}: y=${Math.round(item.transform[5])}, x=${Math.round(item.transform[4])}, str="${item.str}"`);
  });
  
  console.log('\n\n=== 按Y坐标分组后的行 ===\n');
  
  const items = textContent.items;
  const rows = new Map();
  
  for (const item of items) {
    if (!item.str || item.str.trim() === '') continue;
    const y = Math.round(item.transform[5]);
    if (!rows.has(y)) rows.set(y, []);
    rows.get(y).push({ x: item.transform[4], str: item.str });
  }
  
  const sortedRows = Array.from(rows.entries()).sort((a, b) => b[0] - a[0]);
  
  console.log(`总共${sortedRows.length}行\n`);
  
  sortedRows.slice(0, 30).forEach(([y, cells], idx) => {
    cells.sort((a, b) => a.x - b.x);
    const lineText = cells.map(c => c.str).join(' | ');
    console.log(`行${idx} (y=${y}): ${lineText}`);
  });
  
} catch (error) {
  console.error('✗ 错误:', error.message);
  console.error(error.stack);
}
