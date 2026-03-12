const mysql = require('mysql2/promise');

async function checkData() {
  try {
    const connection = await mysql.createConnection({
      host: '192.168.31.159',
      port: 3306,
      user: 'root',
      password: '66315066',
      database: 'todo'
    });

    console.log('✅ 数据库连接成功\n');

    // 查询任务总数
    const [tasks] = await connection.execute(
      'SELECT COUNT(*) as total FROM tasks WHERE username = ?',
      ['zhaosj']
    );
    console.log('📊 任务总数:', tasks[0].total);

    // 查询前5个任务
    const [taskList] = await connection.execute(
      'SELECT id, text, status, created_at FROM tasks WHERE username = ? LIMIT 5',
      ['zhaosj']
    );
    console.log('\n📝 前5个任务:');
    taskList.forEach(task => {
      console.log(`  - ${task.id}: ${task.text} (${task.status})`);
    });

    // 查询回收站
    const [deleted] = await connection.execute(
      'SELECT COUNT(*) as total FROM deleted_tasks WHERE username = ?',
      ['zhaosj']
    );
    console.log('\n🗑️ 回收站数量:', deleted[0].total);

    // 查询文件夹
    const [collections] = await connection.execute(
      'SELECT COUNT(*) as total FROM collections WHERE username = ?',
      ['zhaosj']
    );
    console.log('📁 文件夹数量:', collections[0].total);

    await connection.end();
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

checkData();
