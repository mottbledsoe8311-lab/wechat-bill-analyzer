// 测试BankCardExpenses的筛选逻辑

const testTransactions = [
  {
    date: new Date('2026-03-08'),
    direction: '支',
    method: '银行卡',
    amount: 100,
    counterpart: '工商银行',
  },
  {
    date: new Date('2026-03-07'),
    direction: '支',
    method: '储蓄卡',
    amount: 500,
    counterpart: '建设银行',
  },
  {
    date: new Date('2026-03-06'),
    direction: '支',
    method: '信用卡',
    amount: 200,
    counterpart: '农业银行',
  },
  {
    date: new Date('2026-03-05'),
    direction: '支',
    method: '工商银行储 蓄卡',  // 多行描述
    amount: 300,
    counterpart: '工商银行',
  },
  {
    date: new Date('2026-03-04'),
    direction: '支',
    method: '零钱',
    amount: 50,
    counterpart: '朋友A',
  },
];

console.log('=== BankCardExpenses筛选逻辑测试 ===\n');

// 模拟筛选逻辑
const filtered = testTransactions.filter((tx) => {
  // 筛选银行卡支出交易
  const isExpense = tx.direction === '支出' || tx.direction === '支' || tx.direction?.includes('支');
  // 清理method中的空格后再检查
  const cleanMethod = (tx.method || '').replace(/\s+/g, '');
  const isBankCard = cleanMethod === '银行卡' || cleanMethod.includes('银行卡') || cleanMethod.includes('储蓄卡') || cleanMethod.includes('信用卡');
  
  const pass = isExpense && isBankCard;
  
  if (pass) {
    console.log(`✓ 找到银行卡交易: ${tx.counterpart} - ${tx.method} - ¥${tx.amount}`);
  }
  
  return pass;
});

console.log(`\n总交易数: ${testTransactions.length}`);
console.log(`银行卡支出交易数: ${filtered.length}`);

if (filtered.length === 0) {
  console.log('\n✗ 没有找到银行卡支出交易，应显示占位符');
} else {
  console.log('\n✓ 找到银行卡支出交易，应显示详细信息');
  console.log('\n银行卡支出统计:');
  filtered.forEach(tx => {
    console.log(`  - ${tx.counterpart}: ¥${tx.amount} (${tx.method})`);
  });
}

// 测试多行描述的处理
console.log('\n=== 多行描述处理测试 ===');
const multilineMethod = '工商银行储 蓄卡';
const cleanedMethod = multilineMethod.replace(/\s+/g, '');
console.log(`原始method: "${multilineMethod}"`);
console.log(`清理后method: "${cleanedMethod}"`);
console.log(`包含"储蓄卡"? ${cleanedMethod.includes('储蓄卡')}`);
