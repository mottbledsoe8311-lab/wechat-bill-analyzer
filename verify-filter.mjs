import * as fs from 'fs';
import { parsePDF } from './client/src/lib/pdfParser.js';

const pdfPath = '/home/ubuntu/upload/sui(20250501-20260308).pdf';
const file = new File([fs.readFileSync(pdfPath)], 'test.pdf', { type: 'application/pdf' });

console.log('开始解析PDF...');
try {
  const result = await parsePDF(file, (progress, msg) => {
    if (progress % 20 === 0) {
      console.log(`进度: ${progress}% - ${msg}`);
    }
  });
  
  console.log(`\n解析完成!`);
  console.log(`总交易数: ${result.transactions.length}`);
  
  // 统计交易类型
  const typeStats = {};
  result.transactions.forEach(tx => {
    const type = tx.type || '未知';
    typeStats[type] = (typeStats[type] || 0) + 1;
  });
  
  console.log('\n交易类型统计:');
  Object.entries(typeStats).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
  // 查找规律转账
  console.log('\n\n检查规律转账识别...');
  
  // 统计商户消费在规律转账中的出现
  const consumerInRegular = result.transactions.filter(tx => 
    tx.type === '消费' && (tx.direction === '支出' || tx.direction === '支')
  );
  
  console.log(`商户消费（支出）交易数: ${consumerInRegular.length}`);
  
  if (consumerInRegular.length > 0) {
    console.log('\n前10条商户消费交易:');
    consumerInRegular.slice(0, 10).forEach((tx, idx) => {
      console.log(`${idx + 1}. ${tx.date.toISOString().split('T')[0]} ${tx.counterpart} ${tx.type} ${tx.amount}元`);
    });
  }
  
} catch (err) {
  console.error('解析失败:', err.message);
  console.error(err.stack);
}
