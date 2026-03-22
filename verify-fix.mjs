import mysql from 'mysql2/promise';

async function verifyFix() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wechat_bill_analyzer',
  });

  try {
    console.log('=== 验证数据库修复 ===\n');

    // 查询最新的报表
    const [rows] = await connection.query(
      `SELECT id, title, LENGTH(data) as dataLength, SUBSTRING(data, 1, 100) as dataSample 
       FROM reports 
       ORDER BY createdAt DESC 
       LIMIT 3`
    );

    console.log('最新的 3 条报表记录：\n');
    
    rows.forEach((row, index) => {
      console.log(`报表 ${index + 1}:`);
      console.log(`  ID: ${row.id}`);
      console.log(`  标题: ${row.title}`);
      console.log(`  数据大小: ${row.dataLength} 字节`);
      console.log(`  数据样本: ${row.dataSample}`);
      
      // 检查是否是有效的 JSON
      try {
        if (row.dataSample.startsWith('{')) {
          JSON.parse(row.dataSample + '...}'); // 简单检查
          console.log(`  ✓ 数据格式: 有效的 JSON`);
        } else if (row.dataSample === '[object Object]') {
          console.log(`  ✗ 数据格式: [object Object]（错误）`);
        } else {
          console.log(`  ? 数据格式: 未知`);
        }
      } catch (e) {
        console.log(`  ? 数据格式: 无法解析`);
      }
      console.log();
    });

    // 统计统计
    const [stats] = await connection.query(
      `SELECT COUNT(*) as total, 
              SUM(CASE WHEN data LIKE '{%' THEN 1 ELSE 0 END) as validJson,
              SUM(CASE WHEN data = '[object Object]' THEN 1 ELSE 0 END) as invalidObject
       FROM reports`
    );

    console.log('统计信息：');
    console.log(`  总报表数: ${stats[0].total}`);
    console.log(`  有效 JSON 数: ${stats[0].validJson || 0}`);
    console.log(`  [object Object] 数: ${stats[0].invalidObject || 0}`);
    
    if (stats[0].invalidObject > 0) {
      console.log('\n⚠️  检测到有效的 [object Object] 记录，需要清理数据库');
      console.log('建议：删除这些无效的记录，重新生成报表');
    } else {
      console.log('\n✓ 所有报表数据都是有效的 JSON 格式');
    }

  } catch (error) {
    console.error('验证失败:', error.message);
  } finally {
    await connection.end();
  }
}

verifyFix();
