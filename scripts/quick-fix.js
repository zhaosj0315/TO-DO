// 一键修复父子关系（简化版）
// 复制此代码到浏览器控制台并按Enter执行

(async () => {
  const taskStore = window.__VUE_DEVTOOLS_GLOBAL_HOOK__?.apps[0]?.config?.globalProperties?.$pinia?.state?.value?.offlineTaskStore
  
  if (!taskStore) {
    alert('❌ 无法获取任务数据，请确保应用已启动')
    return
  }
  
  let fixedCount = 0
  
  taskStore.tasks.forEach(task => {
    const waitingTasks = taskStore.getWaitingTasks(task.id)
    const children = waitingTasks.filter(t => !t.parentTaskId)
    
    if (children.length > 0) {
      const subtaskIds = []
      children.forEach(child => {
        child.parentTaskId = task.id
        subtaskIds.push(child.id)
        fixedCount++
      })
      task.subtasks = subtaskIds
    }
  })
  
  if (fixedCount > 0) {
    await taskStore.saveTasks()
    alert(`✅ 修复完成！共修复 ${fixedCount} 个任务\n\n请刷新页面查看效果`)
  } else {
    alert('✅ 所有任务都正确，无需修复')
  }
})()
