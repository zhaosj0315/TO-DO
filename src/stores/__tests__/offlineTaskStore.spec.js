import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useOfflineTaskStore } from '../offlineTaskStore'

describe('offlineTaskStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('任务创建', () => {
    it('应该成功创建一个新任务', () => {
      const store = useOfflineTaskStore()
      const taskData = {
        text: '测试任务',
        description: '这是一个测试任务',
        type: 'today',
        category: 'work',
        priority: 'high'
      }

      store.addTask(taskData)

      expect(store.tasks).toHaveLength(1)
      expect(store.tasks[0].text).toBe('测试任务')
      expect(store.tasks[0].status).toBe('pending')
    })

    it('应该为新任务生成唯一ID', () => {
      const store = useOfflineTaskStore()
      
      store.addTask({ text: '任务1', type: 'today' })
      store.addTask({ text: '任务2', type: 'today' })

      expect(store.tasks[0].id).not.toBe(store.tasks[1].id)
    })

    it('应该正确设置任务创建时间', () => {
      const store = useOfflineTaskStore()
      const beforeCreate = new Date().toISOString()
      
      store.addTask({ text: '任务', type: 'today' })
      
      const afterCreate = new Date().toISOString()
      const taskTime = store.tasks[0].created_at

      expect(taskTime >= beforeCreate).toBe(true)
      expect(taskTime <= afterCreate).toBe(true)
    })
  })

  describe('任务状态管理', () => {
    it('应该能够完成任务', () => {
      const store = useOfflineTaskStore()
      store.addTask({ text: '任务', type: 'today' })
      const taskId = store.tasks[0].id

      store.toggleTaskCompletion(taskId)

      expect(store.tasks[0].status).toBe('completed')
      expect(store.tasks[0].completed_at).toBeDefined()
    })

    it('应该能够取消完成任务', () => {
      const store = useOfflineTaskStore()
      store.addTask({ text: '任务', type: 'today' })
      const taskId = store.tasks[0].id

      store.toggleTaskCompletion(taskId) // 完成
      store.toggleTaskCompletion(taskId) // 取消完成

      expect(store.tasks[0].status).toBe('pending')
      expect(store.tasks[0].completed_at).toBeFalsy() // null 或 undefined
    })
  })

  describe('任务筛选', () => {
    beforeEach(() => {
      const store = useOfflineTaskStore()
      store.addTask({ text: '工作任务', type: 'today', category: 'work', priority: 'high', status: 'pending' })
      store.addTask({ text: '学习任务', type: 'today', category: 'study', priority: 'medium', status: 'completed' })
      store.addTask({ text: '生活任务', type: 'today', category: 'life', priority: 'low', status: 'pending' })
    })

    it('应该能够按状态筛选任务', () => {
      const store = useOfflineTaskStore()
      
      const pending = store.tasks.filter(t => t.status === 'pending')
      const completed = store.tasks.filter(t => t.status === 'completed')

      expect(pending).toHaveLength(2)
      expect(completed).toHaveLength(1)
    })

    it('应该能够按分类筛选任务', () => {
      const store = useOfflineTaskStore()
      
      const workTasks = store.tasks.filter(t => t.category === 'work')
      const studyTasks = store.tasks.filter(t => t.category === 'study')

      expect(workTasks).toHaveLength(1)
      expect(studyTasks).toHaveLength(1)
    })

    it('应该能够按优先级筛选任务', () => {
      const store = useOfflineTaskStore()
      
      const highPriority = store.tasks.filter(t => t.priority === 'high')

      expect(highPriority).toHaveLength(1)
      expect(highPriority[0].text).toBe('工作任务')
    })
  })

  describe('任务删除', () => {
    it('应该能够删除任务到回收站', () => {
      const store = useOfflineTaskStore()
      store.addTask({ text: '任务', type: 'today' })
      const taskId = store.tasks[0].id

      store.deleteTask(taskId)

      expect(store.tasks).toHaveLength(0)
      expect(store.deletedTasks).toHaveLength(1)
    })

    it('应该能够从回收站恢复任务', () => {
      const store = useOfflineTaskStore()
      store.addTask({ text: '任务', type: 'today' })
      const taskId = store.tasks[0].id

      store.deleteTask(taskId)
      store.restoreTask(taskId)

      expect(store.tasks).toHaveLength(1)
      expect(store.deletedTasks).toHaveLength(0)
    })

    it('应该能够永久删除任务', () => {
      const store = useOfflineTaskStore()
      store.addTask({ text: '任务', type: 'today' })
      const taskId = store.tasks[0].id

      store.deleteTask(taskId)
      store.permanentDeleteTask(taskId)

      expect(store.tasks).toHaveLength(0)
      expect(store.deletedTasks).toHaveLength(0)
    })
  })

  describe('统计功能', () => {
    beforeEach(() => {
      const store = useOfflineTaskStore()
      store.addTask({ text: '任务1', type: 'today', status: 'pending' })
      store.addTask({ text: '任务2', type: 'today', status: 'completed' })
      store.addTask({ text: '任务3', type: 'today', status: 'completed' })
      store.addTask({ text: '任务4', type: 'today', status: 'overdue' })
    })

    it('应该正确统计各状态任务数量', () => {
      const store = useOfflineTaskStore()

      const stats = {
        total: store.tasks.length,
        pending: store.tasks.filter(t => t.status === 'pending').length,
        completed: store.tasks.filter(t => t.status === 'completed').length,
        overdue: store.tasks.filter(t => t.status === 'overdue').length
      }

      expect(stats.total).toBe(4)
      expect(stats.pending).toBe(1)
      expect(stats.completed).toBe(2)
      expect(stats.overdue).toBe(1)
    })

    it('应该正确计算完成率', () => {
      const store = useOfflineTaskStore()
      
      const completionRate = (store.tasks.filter(t => t.status === 'completed').length / store.tasks.length) * 100

      expect(completionRate).toBe(50)
    })
  })
})
