const mysql = require('mysql2/promise');

async function dropDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'zhaosj',
      password: '66315066',
      database: 'todo_app'  // 先连接到数据库
    });
    
    console.log('🔗 连接到 todo_app 成功');
    
    // 查看当前用户权限
    const [grants] = await connection.execute('SHOW GRANTS');
    console.log('\n当前用户权限：');
    grants.forEach(g => console.log('  ', Object.values(g)[0]));
    
    await connection.end();
    
    // 尝试删除
    const conn2 = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'zhaosj',
      password: '66315066'
    });
    
    await conn2.execute('DROP DATABASE IF EXISTS todo_app');
    console.log('\n✅ 数据库 todo_app 已删除');
    
    await conn2.end();
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.log('\n💡 建议：使用root用户或者在MySQL中手动删除');
    console.log('   mysql -u root -p');
    console.log('   DROP DATABASE IF EXISTS todo_app;');
  }
}

dropDatabase();
