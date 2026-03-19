// 测试过滤逻辑

const MERCHANT_KEYWORDS = [
  '滴滴', '美团', '京东', '淘宝', '拼多多', '支付宝', '饿了么',
  '超市', '便利店', '商城', '商店', '药店', '医院', '银行',
  '电信', '移动', '联通', '水电', '燃气', '物业', '保险',
  '出行', '打车', '公交', '地铁', '加油', '停车',
  '餐饮', '酒店', '旅游', '航空', '铁路', '12306',
  '腾讯', '网易', '百度', '阿里', '字节', '华为', '小米',
  '公司工资', '投资收益', '理财', '基金', '股票',
];

function isMerchant(name) {
  if (!name) return false;
  const lower = name.toLowerCase();
  return MERCHANT_KEYWORDS.some(kw => lower.includes(kw));
}

// 测试数据
const testTransactions = [
  { counterpart: '美团外卖', type: '商户消费', direction: '支出' },
  { counterpart: '赵文胜', type: '商户消费', direction: '支出' },
  { counterpart: '京东商城', type: '商户消费', direction: '支出' },
  { counterpart: '张三', type: '转账', direction: '支出' },
  { counterpart: '李四', type: '商户消费', direction: '支出' },
  { counterpart: '超市', type: '商户消费', direction: '支出' },
];

console.log('测试过滤逻辑:\n');

testTransactions.forEach(tx => {
  const isMerchantName = isMerchant(tx.counterpart);
  const hasConsumerType = tx.type === '消费' || tx.type?.includes('消费');
  const shouldFilter = isMerchantName || hasConsumerType;
  
  console.log(`对方: ${tx.counterpart}`);
  console.log(`  类型: ${tx.type}`);
  console.log(`  方向: ${tx.direction}`);
  console.log(`  isMerchant: ${isMerchantName}`);
  console.log(`  hasConsumerType: ${hasConsumerType}`);
  console.log(`  应该过滤: ${shouldFilter}`);
  console.log('');
});

// 检查"赵文胜"是否被过滤
console.log('关键检查 - "赵文胜":');
console.log(`  isMerchant("赵文胜"): ${isMerchant('赵文胜')}`);
console.log(`  类型包含"消费": ${'商户消费'.includes('消费')}`);
