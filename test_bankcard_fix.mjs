// 测试修复后的BankCardExpenses筛选逻辑

const testTransactions = [
  {
    date: new Date('2026-03-08'),
    direction: '支出',
    method: '工商银行储 蓄卡(5694)',
    amount: 13.00,
    counterpart: '赵文胜',
  },
  {
    date: new Date('2026-03-07'),
    direction: '支出',
    method: '华夏银行信 用卡(5233)',
    amount: 8.00,
    counterpart: '坤记擀面皮',
  },
  {
    date: new Date('2026-03-06'),
    direction: '支出',
    method: '零钱',
    amount: 50.00,
    counterpart: '朋友A',
  },
  {
    date: new Date('2026-03-05'),
    direction: '支出',
    method: '银行卡',
    amount: 100.00,
    counterpart: '商户B',
  },
];

console.log('=== 测试修复后的BankCardExpenses筛选逻辑 ===\n');

// 修复后的筛选逻辑
const filtered = testTransactions.filter((tx) => {
  const isExpense = tx.direction === '支出' || tx.direction === '支' || tx.direction?.includes('支');
  // 清理method中的空格、括号和数字后再检查
  const cleanMethod = (tx.method || '').replace(/\s+/g, '').replace(/[()（）0-9]/g, '');
  // 匹配各种银行卡类型
  const isBankCard = cleanMethod.includes('银行卡') || cleanMethod.includes('储蓄卡') || cleanMethod.includes('信用卡');
  
  const pass = isExpense && isBankCard;
  
  if (pass) {
    console.log(`✓ 匹配: ${tx.counterpart} - ${tx.method} -> 清理后: ${cleanMethod} - ¥${tx.amount}`);
  } else {
    console.log(`✗ 不匹配: ${tx.counterpart} - ${tx.method} -> 清理后: ${cleanMethod}`);
  }
  
  return pass;
});

console.log(`\n总交易数: ${testTransactions.length}`);
console.log(`银行卡支出交易数: ${filtered.length}`);

if (filtered.length > 0) {
  console.log('\n✓ 修复成功！找到了银行卡支出交易');
  console.log('\n银行卡支出统计:');
  filtered.forEach(tx => {
    console.log(`  - ${tx.counterpart}: ¥${tx.amount} (${tx.method})`);
  });
} else {
  console.log('\n✗ 修复失败！未找到银行卡支出交易');
}
