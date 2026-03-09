const mysql = require('mysql2/promise');

async function query() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '66315066',
    database: 'todo_app'
  });

  console.log('✅ 已连接到 todo_app 数据库\n');
  
  // 1. 最新10个任务
  console.log('📋 最新10个任务:');
  const [latest] = await connection.execute(
    `SELECT id, text, created_at FROM tasks WHERE username = 'zhaosj' ORDER BY created_at DESC LIMIT 10`
  );
  latest.forEach((t, i) => console.log(`${i+1}. [${t.created_at}] ${t.text}`));
  
  // 2. 统计
  console.log('\n📊 统计信息:');
  const [stats] = await connection.execute(
    `SELECT COUNT(*) as total, 
            SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending
     FROM tasks WHERE username = 'zhaosj'`
  );
  console.log(`总任务: ${stats[0].total}, 已完成: ${stats[0].completed}, 待办: ${stats[0].pending}`);
  
  // 3. 今天创建的任务
  console.log('\n📅 今天创建的任务:');
  const [today] = await connection.execute(
    `SELECT COUNT(*) as count FROM tasks 
     WHERE username = 'zhaosj' AND DATE(created_at) = CURDATE()`
  );
  console.log(`今天创建: ${today[0].count} 个任务`);

  await connection.end();
}

query().catch(console.error);
