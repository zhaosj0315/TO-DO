// 批量修复所有任务的父子关系
// 使用方法：在浏览器控制台中运行此脚本

console.log('=== 批量修复任务父子关系 ===\n')

// 获取 taskStore
const taskStore = window.__VUE_DEVTOOLS_GLOBAL_HOOK__?.apps[0]?.config?.globalProperties?.$pinia?.state?.value?.offlineTaskStore
if (!taskStore) {
  console.error('❌ 无法获取 taskStore')
} else {
  console.log('✅ taskStore 已加载')
  console.log(`总任务数: ${taskStore.tasks.length}\n`)
  
  let fixedCount = 0
  const fixes = []
  
  // 遍历所有任务
  taskStore.tasks.forEach(task => {
    // 获取等待此任务的所有任务
    const waitingTasks = taskStore.getWaitingTasks(task.id)
    
    if (waitingTasks.length > 0) {
      // 找出没有 parentTaskId 的任务
      const potentialChildren = waitingTasks.filter(t => !t.parentTaskId)
      
      if (potentialChildren.length > 0) {
        fixes.push({
          parent: task,
          children: potentialChildren
        })
      }
    }
  })
  
  if (fixes.length === 0) {
    console.log('✅ 所有任务的父子关系都正确，无需修复')
  } else {
    console.log(`发现 ${fixes.length} 个任务需要修复:\n`)
    
    fixes.forEach((fix, i) => {
      console.log(`${i + 1}. 父任务: "${fix.parent.text}"`)
      console.log(`   潜在子任务数量: ${fix.children.length}`)
      fix.children.forEach(child => {
        console.log(`     - ${child.text}`)
      })
      console.log('')
    })
    
    const shouldFix = confirm(
      `发现 ${fixes.length} 个父任务需要修复父子关系。\n\n` +
      `是否批量修复？`
    )
    
    if (shouldFix) {
      console.log('开始批量修复...\n')
      
      fixes.forEach((fix, i) => {
        console.log(`修复 ${i + 1}/${fixes.length}: ${fix.parent.text}`)
        
        const subtaskIds = []
        fix.children.forEach(child => {
          child.parentTaskId = fix.parent.id
          subtaskIds.push(child.id)
          fixedCount++
        })
        
        fix.parent.subtasks = subtaskIds
        console.log(`  ✅ 设置 ${fix.children.length} 个子任务`)
      })
      
      // 保存
      await taskStore.saveTasks()
      console.log(`\n✅ 修复完成！共修复 ${fixedCount} 个任务`)
      console.log('✅ 已保存到本地存储')
      console.log('\n请刷新页面查看效果')
    } else {
      console.log('❌ 用户取消修复')
    }
  }
}

console.log('\n=== 脚本执行完成 ===')
