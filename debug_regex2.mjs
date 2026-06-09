// 测试数据（从PDF中提取的实际行）
const testLine = "450000012220260213957069 2026-02-13 商户消费 支出 工商银行储蓄卡(5694) 100.00 手机充值 82480570322026021";

console.log('=== 调试正则表达式 ===\n');
console.log('测试行:', testLine);
console.log('长度:', testLine.length);
console.log();

// 问题：正则表达式期望日期后面紧跟时间，但PDF中没有时间！
// 原始正则：(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)
// 但PDF中的格式是：2026-02-13（没有时间）

// 修复：使时间部分可选
const fixedPattern = /^(\d{15,32})\s+(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)\s+([\s\S]+?)\s+(收入|支出|其他|收|支|不计收支)\s+([\s\S]+?)\s+([\d¥￥,.]+)\s+([\s\S]+?)(?:\s+(.*))?$/;

const match = testLine.match(fixedPattern);
if (match) {
  console.log('✓ 修复后的正则匹配成功！');
  console.log(`  订单号: ${match[1]}`);
  console.log(`  日期时间: ${match[2]}`);
  console.log(`  交易类型: ${match[3]}`);
  console.log(`  收支: ${match[4]}`);
  console.log(`  支付方式: ${match[5]}`);
  console.log(`  金额: ${match[6]}`);
  console.log(`  对方: ${match[7]}`);
} else {
  console.log('✗ 修复后的正则仍然不匹配');
}
