const mysql = require('mysql2/promise');

async function checkDBInfo() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '66315066'
  });

  console.log('📊 数据库信息:\n');
  
  // 查看当前数据库
  const [dbs] = await connection.execute('SHOW DATABASES');
  console.log('所有数据库:');
  dbs.forEach(db => console.log(`  - ${db.Database}`));
  
  // 切换到todo_app
  await connection.execute('USE todo_app');
  
  console.log('\n📊 todo_app 数据库表:');
  const [tables] = await connection.execute('SHOW TABLES');
  tables.forEach(table => console.log(`  - ${table.Tables_in_todo_app}`));
  
  console.log('\n📊 tasks 表结构:');
  const [columns] = await connection.execute('DESCRIBE tasks');
  columns.forEach(col => {
    console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(可空)' : '(必填)'}`);
  });

  await connection.end();
}

checkDBInfo().catch(console.error);
