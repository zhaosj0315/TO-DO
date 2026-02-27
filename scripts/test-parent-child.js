// 父子任务系统测试脚本
// 使用方法：在浏览器控制台中运行此脚本

console.log('=== 父子任务系统测试 ===\n')

// 获取 taskStore
const taskStore = window.__VUE_DEVTOOLS_GLOBAL_HOOK__?.apps[0]?.config?.globalProperties?.$pinia?.state?.value?.offlineTaskStore
if (!taskStore) {
  console.error('❌ 无法获取 taskStore，请确保应用已启动')
} else {
  console.log('✅ taskStore 已加载\n')
  
  // 测试1：查找所有父任务
  console.log('📋 测试1：查找所有父任务')
  const parentTasks = taskStore.tasks.filter(t => 
    Array.isArray(t.subtasks) && t.subtasks.length > 0
  )
  console.log(`找到 ${parentTasks.length} 个父任务:`)
  parentTasks.forEach(task => {
    console.log(`  - ${task.text} (ID: ${task.id})`)
    console.log(`    子任务数量: ${task.subtasks.length}`)
    console.log(`    子任务ID: [${task.subtasks.join(', ')}]`)
  })
  console.log('')
  
  // 测试2：查找所有子任务
  console.log('📋 测试2：查找所有子任务')
  const subtasks = taskStore.tasks.filter(t => t.parentTaskId)
  console.log(`找到 ${subtasks.length} 个子任务:`)
  subtasks.forEach(task => {
    const parent = taskStore.tasks.find(t => t.id === task.parentTaskId)
    console.log(`  - ${task.text} (ID: ${task.id})`)
    console.log(`    父任务: ${parent?.text || '未找到'} (ID: ${task.parentTaskId})`)
    console.log(`    等待任务: [${task.waitFor?.join(', ') || '无'}]`)
  })
  console.log('')
  
  // 测试3：验证父子关系完整性
  console.log('🔍 测试3：验证父子关系完整性')
  let integrityErrors = 0
  
  // 检查父任务的 subtasks 是否都存在
  parentTasks.forEach(parent => {
    parent.subtasks.forEach(subtaskId => {
      const subtask = taskStore.tasks.find(t => t.id === subtaskId)
      if (!subtask) {
        console.error(`  ❌ 父任务 "${parent.text}" 的子任务 ${subtaskId} 不存在`)
        integrityErrors++
      } else if (subtask.parentTaskId !== parent.id) {
        console.error(`  ❌ 子任务 "${subtask.text}" 的 parentTaskId 不匹配`)
        integrityErrors++
      }
    })
  })
  
  // 检查子任务的 parentTaskId 是否存在
  subtasks.forEach(subtask => {
    const parent = taskStore.tasks.find(t => t.id === subtask.parentTaskId)
    if (!parent) {
      console.error(`  ❌ 子任务 "${subtask.text}" 的父任务 ${subtask.parentTaskId} 不存在`)
      integrityErrors++
    } else if (!parent.subtasks?.includes(subtask.id)) {
      console.error(`  ❌ 父任务 "${parent.text}" 的 subtasks 中缺少子任务 ${subtask.id}`)
      integrityErrors++
    }
  })
  
  if (integrityErrors === 0) {
    console.log('  ✅ 所有父子关系完整性检查通过')
  } else {
    console.log(`  ❌ 发现 ${integrityErrors} 个完整性错误`)
  }
  console.log('')
  
  // 测试4：测试辅助方法
  console.log('🛠️ 测试4：测试辅助方法')
  if (parentTasks.length > 0) {
    const testParent = parentTasks[0]
    console.log(`测试父任务: ${testParent.text}`)
    console.log(`  isParentTask: ${taskStore.isParentTask(testParent.id)}`)
    console.log(`  isSubtask: ${taskStore.isSubtask(testParent.id)}`)
    
    const children = taskStore.getSubtasks(testParent.id)
    console.log(`  getSubtasks: 找到 ${children.length} 个子任务`)
    children.forEach(child => {
      console.log(`    - ${child.text}`)
    })
  }
  
  if (subtasks.length > 0) {
    const testSubtask = subtasks[0]
    console.log(`\n测试子任务: ${testSubtask.text}`)
    console.log(`  isParentTask: ${taskStore.isParentTask(testSubtask.id)}`)
    console.log(`  isSubtask: ${taskStore.isSubtask(testSubtask.id)}`)
    
    const parent = taskStore.getParentTask(testSubtask.id)
    console.log(`  getParentTask: ${parent?.text || '未找到'}`)
  }
  console.log('')
  
  // 测试5：统计信息
  console.log('📊 测试5：统计信息')
  console.log(`  总任务数: ${taskStore.tasks.length}`)
  console.log(`  父任务数: ${parentTasks.length}`)
  console.log(`  子任务数: ${subtasks.length}`)
  console.log(`  独立任务数: ${taskStore.tasks.length - parentTasks.length - subtasks.length}`)
  
  // 计算平均子任务数
  if (parentTasks.length > 0) {
    const avgSubtasks = parentTasks.reduce((sum, t) => sum + t.subtasks.length, 0) / parentTasks.length
    console.log(`  平均子任务数: ${avgSubtasks.toFixed(2)}`)
  }
}

console.log('\n=== 测试完成 ===')
