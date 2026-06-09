const fs = require('fs');
const path = require('path');

const filePath = '/home/ubuntu/wechat-bill-analyzer/client/src/lib/pdfParser.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 修复fullPattern - 使时间部分可选
content = content.replace(
  /const fullPattern = \/\^\\(\\\d\{15,32\}\\)\\\s\+\\(\\\d\{4\}\[-\/\.\]\\\d\{1,2\}\[-\/\.\]\\\d\{1,2\}\\s\+\\\d\{1,2\}:\\\d\{2\}\(\?::\\\d\{2\}\)\?\)/,
  "const fullPattern = /^(\\d{15,32})\\s+(\\d{4}[-\\/.]\\ d{1,2}[-\\/.]\\ d{1,2}(?:\\s+\\d{1,2}:\\d{2}(?::\\d{2})?)?)"
);

// 修复dateFirstPattern - 使时间部分可选
content = content.replace(
  /const dateFirstPattern = \/\^\\(\\\d\{4\}\[-\/\.\]\\\d\{1,2\}\[-\/\.\]\\\d\{1,2\}\\s\+\\\d\{1,2\}:\\\d\{2\}\(\?::\\\d\{2\}\)\?\)/,
  "const dateFirstPattern = /^(\\d{4}[-\\/.]\\ d{1,2}[-\\/.]\\ d{1,2}(?:\\s+\\d{1,2}:\\d{2}(?::\\d{2})?)?)"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ 正则表达式已修复');
