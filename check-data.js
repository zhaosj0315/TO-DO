const mysql = require('mysql2/promise')

async function checkData() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '66315066',
      database: 'todo_app'
    })

    // 统计任务
    const [tasks] = await connection.execute('SELECT COUNT(*) as count, status FROM tasks GROUP BY status')
    console.log('\n📊 任务统计:')
    tasks.forEach(row => {
      console.log(`  ${row.status}: ${row.count} 个`)
    })

    const [total] = await connection.execute('SELECT COUNT(*) as count FROM tasks')
    console.log(`  总计: ${total[0].count} 个任务`)

    // 统计文件夹
    const [collections] = await connection.execute('SELECT COUNT(*) as count FROM collections')
    console.log(`\n📁 文件夹: ${collections[0].count} 个`)

    // 查看最近5个任务
    const [recent] = await connection.execute('SELECT text, status, created_at FROM tasks ORDER BY created_at DESC LIMIT 5')
    console.log('\n📝 最近5个任务:')
    recent.forEach(task => {
      console.log(`  - ${task.text} (${task.status})`)
    })

    await connection.end()
  } catch (error) {
    console.error('❌ 查询失败:', error.message)
  }
}

checkData()
