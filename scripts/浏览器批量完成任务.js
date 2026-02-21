/**
 * 浏览器控制台批量完成任务
 * 
 * 使用方法：
 * 1. 打开 TODO App
 * 2. 按 F12 打开开发者工具
 * 3. 切换到 Console 标签
 * 4. 复制下面的代码粘贴执行
 */

(async function() {
  const { Preferences } = window.Capacitor || { Preferences: null }
  
  if (!Preferences) {
    console.error('❌ Capacitor Preferences 不可用，请在 TODO App 中运行')
    return
  }
  
  const username = 'zhaosj'
  
  try {
    // 读取任务
    const { value } = await Preferences.get({ key: `tasks_${username}` })
    if (!value) {
      console.log('❌ 未找到任务数据')
      return
    }
    
    const tasks = JSON.parse(value)
    console.log(`📊 总任务数: ${tasks.length}`)
    
    // 筛选待办和逾期任务
    const incompleteTasks = tasks.filter(t => t.status === 'pending' || t.status === 'overdue')
    console.log(`📝 待办/逾期任务: ${incompleteTasks.length}`)
    
    // 计算80%
    const completeCount = Math.floor(incompleteTasks.length * 0.8)
    console.log(`✅ 将完成: ${completeCount} 个任务 (80%)`)
    
    // 随机选择80%
    const shuffled = [...incompleteTasks].sort(() => Math.random() - 0.5)
    const toCompleteIds = new Set(shuffled.slice(0, completeCount).map(t => t.id))
    
    // 更新状态
    let completedCount = 0
    tasks.forEach(task => {
      if (toCompleteIds.has(task.id)) {
        task.status = 'completed'
        completedCount++
      }
    })
    
    // 保存
    await Preferences.set({
      key: `tasks_${username}`,
      value: JSON.stringify(tasks)
    })
    
    const totalCompleted = tasks.filter(t => t.status === 'completed').length
    const completionRate = ((totalCompleted / tasks.length) * 100).toFixed(1)
    
    console.log('✅ 批量完成成功！')
    console.log(`📈 已完成: ${completedCount} 个任务`)
    console.log(`📊 总完成率: ${completionRate}%`)
    console.log('🔄 请刷新页面查看效果')
    
    // 自动刷新页面
    setTimeout(() => {
      window.location.reload()
    }, 2000)
    
  } catch (err) {
    console.error('❌ 执行失败:', err)
  }
})()
