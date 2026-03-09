/**
 * 测试脚本：验证 PDF 时间提取逻辑
 */

// 模拟 parseDate 函数
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  const cleaned = dateStr.replace(/\s+/g, ' ').trim();
  console.log('原始输入:', dateStr);
  console.log('清理后:', cleaned);
  
  const patterns = [
    { 
      name: 'YYYY-MM-DD HH:MM:SS',
      regex: /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})/, 
      groups: { year: 1, month: 2, day: 3, hour: 4, minute: 5, second: 6 } 
    },
    { 
      name: 'YYYY-MM-DD HH:MM',
      regex: /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\s+(\d{1,2}):(\d{2})/, 
      groups: { year: 1, month: 2, day: 3, hour: 4, minute: 5, second: null } 
    },
    { 
      name: 'YYYY-MM-DD',
      regex: /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/, 
      groups: { year: 1, month: 2, day: 3, hour: null, minute: null, second: null } 
    },
  ];

  for (const { name, regex, groups } of patterns) {
    const match = cleaned.match(regex);
    if (match) {
      console.log(`✓ 匹配格式: ${name}`);
      const year = parseInt(match[groups.year]);
      const month = parseInt(match[groups.month]) - 1;
      const day = parseInt(match[groups.day]);
      const hour = groups.hour ? parseInt(match[groups.hour]) : 0;
      const minute = groups.minute ? parseInt(match[groups.minute]) : 0;
      const second = groups.second ? parseInt(match[groups.second]) : 0;
      
      console.log(`  年月日: ${year}-${month+1}-${day}`);
      console.log(`  时分秒: ${hour}:${minute}:${second}`);
      
      const date = new Date(year, month, day, hour, minute, second);
      console.log(`  Date 对象: ${date}`);
      console.log(`  格式化输出: ${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`);
      return date;
    }
  }
  
  console.log('✗ 未匹配任何格式');
  return null;
}

// 测试用例
console.log('========== 测试 1: 完整时间格式 ==========');
parseDate('2025-05-01 21:15:30');

console.log('\n========== 测试 2: 不带秒的时间格式 ==========');
parseDate('2025-05-01 21:15');

console.log('\n========== 测试 3: 只有日期 ==========');
parseDate('2025-05-01');

console.log('\n========== 测试 4: 带斜杠的日期 ==========');
parseDate('2025/05/01 21:15');

console.log('\n========== 测试 5: 可能的 PDF 提取格式 ==========');
parseDate('2025-05-01  21:15');  // 多个空格

console.log('\n========== 测试 6: 可能的错误格式 ==========');
parseDate('2025-05-01');  // 缺少时间
