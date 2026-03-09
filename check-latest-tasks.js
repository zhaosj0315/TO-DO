const mysql = require('mysql2/promise');

async function checkLatestTasks() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '66315066',
    database: 'todo_app'
  });

  console.log('📊 查询最新创建的10个任务...\n');
  
  const [tasks] = await connection.execute(
    `SELECT id, text, created_at, parent_task_id 
     FROM tasks 
     WHERE username = 'zhaosj' 
     ORDER BY created_at DESC 
     LIMIT 10`
  );

  console.log('最新10个任务:');
  console.log('='.repeat(80));
  tasks.forEach((task, index) => {
    console.log(`${index + 1}. ID: ${task.id}`);
    console.log(`   标题: ${task.text}`);
    console.log(`   创建时间: ${task.created_at}`);
    console.log(`   父任务ID: ${task.parent_task_id || '无'}`);
    console.log('-'.repeat(80));
  });

  console.log('\n📊 统计信息:');
  const [stats] = await connection.execute(
    `SELECT COUNT(*) as total FROM tasks WHERE username = 'zhaosj'`
  );
  console.log(`总任务数: ${stats[0].total}`);

  await connection.end();
}

checkLatestTasks().catch(console.error);
