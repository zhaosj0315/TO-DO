const mysql = require('mysql2/promise');

async function dropDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'zhaosj',
      password: '66315066'
    });
    
    console.log('🔗 连接MySQL成功');
    
    await connection.execute('DROP DATABASE IF EXISTS todo_app');
    console.log('✅ 数据库 todo_app 已删除');
    
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('\n📋 当前数据库列表：');
    databases.forEach(db => {
      if (db.Database !== 'information_schema' && 
          db.Database !== 'mysql' && 
          db.Database !== 'performance_schema' && 
          db.Database !== 'sys') {
        console.log('  -', db.Database);
      }
    });
    
    console.log('\n✅ 数据库已删除！现在可以在前端测试自动创建功能了！');
    console.log('📱 操作步骤：');
    console.log('   1. 打开应用 → 数据库配置');
    console.log('   2. 输入连接信息');
    console.log('   3. 点击"测试连接"');
    console.log('   4. 应该看到：✅ 连接成功！数据库和表已自动创建');
    
    await connection.end();
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

dropDatabase();
