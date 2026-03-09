/**
 * 测试脚本：验证日期时间合并逻辑
 */

// 模拟 PDF 提取的行数据
const mockRows = [
  { y: 100, cells: [{ x: 10, str: '4200003060' }, { x: 50, str: '2026-03-08' }, { x: 100, str: '扫二维码付' }] },
  { y: 95, cells: [{ x: 10, str: '15:59:26' }] },  // 时间单独一行
  { y: 90, cells: [{ x: 10, str: '4200002974' }, { x: 50, str: '2026-03-07' }, { x: 100, str: '商户消费' }] },
  { y: 85, cells: [{ x: 10, str: '19:02:26' }] },  // 时间单独一行
  { y: 80, cells: [{ x: 10, str: '4500000145' }, { x: 50, str: '2026-03-07' }, { x: 100, str: '转账' }] },
];

// 模拟合并逻辑
function mergeRows(sortedRows) {
  const mergedRows = [];
  let rowIdx = 0;
  
  while (rowIdx < sortedRows.length) {
    const [y, cells] = sortedRows[rowIdx];
    const lineText = cells.map(c => c.str).join(' ');
    
    // 检查当前行是否只有时间
    const isTimeOnly = /^\d{1,2}:\d{2}(?::\d{2})?$/.test(lineText.trim());
    const hasDateInNextRow = rowIdx + 1 < sortedRows.length && 
      /\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(sortedRows[rowIdx + 1][1].map(c => c.str).join(' '));
    
    console.log(`\n行 ${rowIdx}: "${lineText}"`);
    console.log(`  是否仅时间: ${isTimeOnly}`);
    console.log(`  下一行有日期: ${hasDateInNextRow}`);
    
    if (isTimeOnly && hasDateInNextRow) {
      // 合并当前行（时间）和下一行（日期）
      const [nextY, nextCells] = sortedRows[rowIdx + 1];
      const timeStr = lineText.trim();
      const nextLineText = nextCells.map(c => c.str).join(' ');
      
      console.log(`  ✓ 合并: "${nextLineText}" + "${timeStr}"`);
      
      // 在日期后面添加时间
      const mergedText = nextLineText.replace(
        /(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/,
        `$1 ${timeStr}`
      );
      
      console.log(`  → 合并后: "${mergedText}"`);
      
      // 创建合并后的行
      const mergedCells = nextCells.map(c => ({ ...c }));
      mergedCells.push({ x: 0, str: ` ${timeStr}` });
      
      mergedRows.push({ y: nextY, cells: mergedCells });
      rowIdx += 2; // 跳过已处理的两行
    } else {
      mergedRows.push({ y, cells });
      rowIdx += 1;
    }
  }
  
  return mergedRows;
}

console.log('========== 测试日期时间合并逻辑 ==========');
const sortedRows = mockRows.map(r => [r.y, r.cells]);
const merged = mergeRows(sortedRows);

console.log('\n========== 合并结果 ==========');
merged.forEach((row, i) => {
  const lineText = row.cells.map(c => c.str).join(' ');
  console.log(`${i}: "${lineText}"`);
});

console.log('\n✓ 测试完成');
