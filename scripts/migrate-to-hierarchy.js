/**
 * 数据迁移脚本：为现有任务添加父子任务和依赖关系字段
 * 运行方式：在浏览器控制台中执行此脚本
 */

async function migrateToHierarchy() {
  console.log('🚀 开始数据迁移...')
  
  // 获取所有用户
  const { value: usersData } = await Preferences.get({ key: 'users' })
  if (!usersData) {
    console.log('❌ 未找到用户数据')
    return
  }
  
  const users = JSON.parse(usersData)
  const usernames = Object.keys(users)
  
  let totalMigrated = 0
  
  for (const username of usernames) {
    console.log(`\n📦 处理用户: ${username}`)
    
    // 加载用户任务
    const { value: tasksData } = await Preferences.get({ key: `tasks_${username}` })
    if (!tasksData) {
      console.log(`  ⚠️  用户 ${username} 没有任务`)
      continue
    }
    
    const tasks = JSON.parse(tasksData)
    console.log(`  📊 找到 ${tasks.length} 个任务`)
    
    // 迁移每个任务
    const migratedTasks = tasks.map(task => {
      // 计算截止时间
      const deadline = calculateDeadline(task)
      const duration = calculateDuration(task, deadline)
      
      return {
        ...task,
        
        // ========== 层级关系 ==========
        parentId: task.parentId || null,
        childrenIds: task.childrenIds || [],
        taskLevel: task.taskLevel || 0,
        hasChildren: task.hasChildren || false,
        isExpanded: task.isExpanded !== undefined ? task.isExpanded : true,
        
        // 继承规则
        inheritSettings: task.inheritSettings || {
          deadline: true,
          category: true,
          priority: false,
          tags: true
        },
        
        // ========== 依赖关系 ==========
        dependencies: task.dependencies || {
          blockedBy: [],
          blocking: [],
          relatedTo: []
        },
        
        // 依赖状态（自动计算）
        dependencyStatus: task.dependencyStatus || 'independent',
        canStart: task.canStart !== undefined ? task.canStart : true,
        blockingCount: task.blockingCount || 0,
        
        // ========== 进度追踪 ==========
        progress: task.progress || {
          subtaskTotal: 0,
          subtaskCompleted: 0,
          subtaskPercentage: 0,
          executionPercentage: task.stats?.progress || 0,
          overallPercentage: task.stats?.progress || 0
        },
        
        // ========== 可视化数据 ==========
        visualization: task.visualization || {
          gantt: {
            startDate: task.created_at.split('T')[0],
            endDate: deadline ? deadline.split('T')[0] : null,
            duration: duration,
            criticalPath: false
          },
          flowchart: {
            x: 0,
            y: 0,
            collapsed: false
          }
        },
        
        // ========== 团队协作（预留） ==========
        collaboration: task.collaboration || {
          assignee: null,
          watchers: [],
          sharedWith: [],
          comments: []
        },
        
        // ========== 智能标签 ==========
        tags: task.tags || [],
        aiSuggestions: task.aiSuggestions || {
          estimatedDuration: null,
          riskLevel: 'low',
          suggestedSubtasks: []
        }
      }
    })
    
    // 保存迁移后的任务
    await Preferences.set({ 
      key: `tasks_${username}`, 
      value: JSON.stringify(migratedTasks) 
    })
    
    totalMigrated += migratedTasks.length
    console.log(`  ✅ 迁移完成: ${migratedTasks.length} 个任务`)
    
    // 同样处理回收站任务
    const { value: deletedData } = await Preferences.get({ key: `deletedTasks_${username}` })
    if (deletedData) {
      const deletedTasks = JSON.parse(deletedData)
      const migratedDeleted = deletedTasks.map(task => ({
        ...task,
        parentId: task.parentId || null,
        childrenIds: task.childrenIds || [],
        taskLevel: task.taskLevel || 0,
        dependencies: task.dependencies || { blockedBy: [], blocking: [], relatedTo: [] }
      }))
      
      await Preferences.set({ 
        key: `deletedTasks_${username}`, 
        value: JSON.stringify(migratedDeleted) 
      })
      
      console.log(`  ♻️  回收站迁移: ${migratedDeleted.length} 个任务`)
    }
  }
  
  console.log(`\n🎉 迁移完成！共处理 ${totalMigrated} 个任务`)
  console.log('💡 建议：刷新页面以加载新数据结构')
}

// 辅助函数：计算截止时间
function calculateDeadline(task) {
  const now = new Date()
  
  switch (task.type) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()
    
    case 'tomorrow':
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59).toISOString()
    
    case 'this_week':
      const endOfWeek = new Date(now)
      const daysUntilSunday = 7 - now.getDay()
      endOfWeek.setDate(endOfWeek.getDate() + daysUntilSunday)
      return new Date(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate(), 23, 59, 59).toISOString()
    
    case 'custom_date':
      if (task.customDate) {
        const [year, month, day] = task.customDate.split('-').map(Number)
        const [hour, minute] = task.customTime ? task.customTime.split(':').map(Number) : [23, 59]
        return new Date(year, month - 1, day, hour, minute, 0).toISOString()
      }
      return null
    
    default:
      return null
  }
}

// 辅助函数：计算任务时长（天数）
function calculateDuration(task, deadline) {
  if (!deadline) return 1
  
  const start = new Date(task.created_at)
  const end = new Date(deadline)
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(1, diffDays)
}

// 导出函数供控制台使用
if (typeof window !== 'undefined') {
  window.migrateToHierarchy = migrateToHierarchy
  console.log('✅ 迁移脚本已加载')
  console.log('💡 在控制台执行: migrateToHierarchy()')
}
