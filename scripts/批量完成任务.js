/**
 * 批量完成任务脚本
 * 将80%的待办任务标记为已完成
 */

import { Preferences } from '@capacitor/preferences'

const username = 'zhaosj' // 你的用户名

async function batchCompleteTasks() {
  try {
    // 读取任务数据
    const { value } = await Preferences.get({ key: `tasks_${username}` })
    if (!value) {
      console.log('❌ 未找到任务数据')
      return
    }
    
    const tasks = JSON.parse(value)
    console.log(`📊 总任务数: ${tasks.length}`)
    
    // 筛选待办和逾期任务
    const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'overdue')
    console.log(`📝 待办/逾期任务: ${pendingTasks.length}`)
    
    // 计算需要完成的数量（80%）
    const completeCount = Math.floor(pendingTasks.length * 0.8)
    console.log(`✅ 将完成: ${completeCount} 个任务`)
    
    // 随机选择80%的任务标记为已完成
    const shuffled = pendingTasks.sort(() => Math.random() - 0.5)
    const toComplete = shuffled.slice(0, completeCount)
    
    // 更新任务状态
    toComplete.forEach(task => {
      task.status = 'completed'
    })
    
    // 保存回数据库
    await Preferences.set({
      key: `tasks_${username}`,
      value: JSON.stringify(tasks)
    })
    
    console.log('✅ 批量完成成功！')
    console.log(`📈 完成率: ${((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100).toFixed(1)}%`)
    
  } catch (err) {
    console.error('❌ 执行失败:', err)
  }
}

batchCompleteTasks()
