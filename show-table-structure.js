const mysql = require('mysql2/promise')

async function showTableStructure() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '66315066',
    database: 'todo_app'
  })
  
  console.log('📊 tasks 表结构：\n')
  const [columns] = await connection.execute('SHOW COLUMNS FROM tasks')
  columns.forEach(col => {
    console.log(`  ${col.Field} (${col.Type})`)
  })
  
  console.log('\n📊 collections 表结构：\n')
  const [cols2] = await connection.execute('SHOW COLUMNS FROM collections')
  cols2.forEach(col => {
    console.log(`  ${col.Field} (${col.Type})`)
  })
  
  console.log('\n📊 tasks 表现有索引：\n')
  const [indexes] = await connection.execute('SHOW INDEX FROM tasks')
  const uniqueIndexes = [...new Set(indexes.map(i => i.Key_name))]
  uniqueIndexes.forEach(idx => {
    console.log(`  ✅ ${idx}`)
  })
  
  await connection.end()
}

showTableStructure()
