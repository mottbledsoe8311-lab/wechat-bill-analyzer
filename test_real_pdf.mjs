import * as fs from 'fs';
import * as path from 'path';

// 简单的PDF文本提取（基于pdfParser的逻辑）
const pdfPath = '/home/ubuntu/upload/sui(20250501-20260308).pdf';

console.log('=== 测试真实PDF文件 ===\n');
console.log('PDF文件路径:', pdfPath);
console.log('文件是否存在:', fs.existsSync(pdfPath));

if (fs.existsSync(pdfPath)) {
  const stats = fs.statSync(pdfPath);
  console.log('文件大小:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
  console.log('文件修改时间:', stats.mtime);
}

console.log('\n我们需要使用pdfParser来解析这个文件...');
