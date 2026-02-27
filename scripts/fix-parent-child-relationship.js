// 修复任务父子关系脚本
// 使用方法：在浏览器控制台中运行此脚本

console.log('=== 开始修复任务父子关系 ===\n')

// 获取 taskStore
const taskStore = window.__VUE_DEVTOOLS_GLOBAL_HOOK__?.apps[0]?.config?.globalProperties?.$pinia?.state?.value?.offlineTaskStore
if (!taskStore) {
  console.error('❌ 无法获取 taskStore，请确保应用已启动')
} else {
  console.log('✅ taskStore 已加载\n')
  
  // 查找问题任务
  const problemTask = taskStore.tasks.find(t => t.text.includes('深入学习Composition API'))
  
  if (!problemTask) {
    console.error('❌ 未找到问题任务')
  } else {
    console.log('找到问题任务:', problemTask.text)
    console.log('当前 subtasks:', problemTask.subtasks)
    console.log('当前 parentTaskId:', problemTask.parentTaskId)
    
    // 获取所有等待此任务的任务
    const waitingTasks = taskStore.getWaitingTasks(problemTask.id)
    console.log('\n等待此任务的任务数量:', waitingTasks.length)
    
    // 分析这些任务
    const tasksWithoutParent = waitingTasks.filter(t => !t.parentTaskId)
    console.log('没有父任务的数量:', tasksWithoutParent.length)
    
    if (tasksWithoutParent.length > 0) {
      console.log('\n这些任务可能是子任务，但缺少 parentTaskId:')
      tasksWithoutParent.forEach((t, i) => {
        console.log(`  ${i + 1}. ${t.text}`)
      })
      
      // 询问是否修复
      const shouldFix = confirm(
        `发现 ${tasksWithoutParent.length} 个任务等待"${problemTask.text}"完成，\n` +
        `但它们没有设置 parentTaskId。\n\n` +
        `是否将它们设置为子任务？`
      )
      
      if (shouldFix) {
        console.log('\n开始修复...')
        
        // 设置子任务的 parentTaskId
        const subtaskIds = []
        tasksWithoutParent.forEach(t => {
          t.parentTaskId = problemTask.id
          subtaskIds.push(t.id)
          console.log(`  ✅ 设置 ${t.text} 的 parentTaskId = ${problemTask.id}`)
        })
        
        // 更新父任务的 subtasks
        problemTask.subtasks = subtaskIds
        console.log(`\n✅ 更新父任务的 subtasks: [${subtaskIds.length}个]`)
        
        // 保存
        await taskStore.saveTasks()
        console.log('✅ 已保存到本地存储')
        
        console.log('\n=== 修复完成 ===')
        console.log('请刷新页面查看效果')
      } else {
        console.log('❌ 用户取消修复')
      }
    } else {
      console.log('\n✅ 所有等待任务都已正确设置父子关系')
    }
  }
}

console.log('\n=== 脚本执行完成 ===')
