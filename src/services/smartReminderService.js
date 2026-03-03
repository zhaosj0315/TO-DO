/**
 * 智能提醒服务
 * 主动式任务提醒和习惯养成鼓励
 */

import { LocalNotifications } from '@capacitor/local-notifications'

export class SmartReminderService {
  /**
   * 初始化提醒服务
   */
  static async init() {
    // 请求通知权限
    const permission = await LocalNotifications.requestPermissions()
    if (permission.display !== 'granted') {
      console.warn('通知权限未授予')
      return false
    }

    // 注册定时提醒
    await this.scheduleDailyReminders()
    return true
  }

  /**
   * 注册每日定时提醒
   */
  static async scheduleDailyReminders() {
    // 取消旧的提醒
    await LocalNotifications.cancel({ notifications: [
      { id: 1001 }, // 早晨问候
      { id: 1002 }  // 晚上总结
    ]})

    const now = new Date()
    
    // 早晨问候（8:00）
    const morning = new Date()
    morning.setHours(8, 0, 0, 0)
    if (morning <= now) {
      morning.setDate(morning.getDate() + 1)
    }

    // 晚上总结（21:00）
    const evening = new Date()
    evening.setHours(21, 0, 0, 0)
    if (evening <= now) {
      evening.setDate(evening.getDate() + 1)
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1001,
          title: '☀️ 早安！新的一天开始了',
          body: '点击查看今日待办任务',
          schedule: {
            at: morning,
            repeats: true,
            every: 'day'
          }
        },
        {
          id: 1002,
          title: '🌙 今日总结时间',
          body: '点击查看今日完成情况',
          schedule: {
            at: evening,
            repeats: true,
            every: 'day'
          }
        }
      ]
    })
  }

  /**
   * 生成早晨问候通知内容
   */
  static generateMorningGreeting(tasks) {
    const pending = tasks.filter(t => t.status === 'pending')
    const highPriority = pending.filter(t => t.priority === 'high')
    const overdueSoon = pending.filter(t => {
      if (!t.deadline) return false
      const deadline = new Date(t.deadline)
      const now = new Date()
      const hoursLeft = (deadline - now) / (1000 * 60 * 60)
      return hoursLeft > 0 && hoursLeft <= 24
    })

    let body = `今日待办 ${pending.length} 个任务`
    
    if (highPriority.length > 0) {
      body += `\n⚡ ${highPriority.length} 个高优先级任务`
    }
    
    if (overdueSoon.length > 0) {
      body += `\n⏰ ${overdueSoon.length} 个任务即将逾期`
    }

    if (pending.length === 0) {
      body = '🎉 今天没有待办任务，享受轻松的一天吧！'
    }

    return body
  }

  /**
   * 生成晚上总结通知内容
   */
  static generateEveningSummary(tasks) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const completedToday = tasks.filter(t => {
      if (t.status !== 'completed' || !t.completed_at) return false
      const completedDate = new Date(t.completed_at)
      return completedDate >= today
    })

    const pendingToday = tasks.filter(t => {
      if (t.status !== 'pending') return false
      if (t.type === 'today') return true
      if (t.type === 'custom_date' && t.customDate) {
        const taskDate = new Date(t.customDate)
        taskDate.setHours(0, 0, 0, 0)
        return taskDate.getTime() === today.getTime()
      }
      return false
    })

    let body = `✅ 完成 ${completedToday.length} 个任务`
    
    if (pendingToday.length > 0) {
      body += `\n⏳ 还有 ${pendingToday.length} 个任务未完成`
    }

    if (completedToday.length === 0) {
      body = '😔 今天还没有完成任务，明天继续加油！'
    } else if (completedToday.length >= 5) {
      body += '\n🎉 效率超高！继续保持！'
    }

    return body
  }

  /**
   * 检测卡壳任务（3天未推进）
   */
  static detectStuckTasks(tasks) {
    const now = new Date()
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000)

    return tasks.filter(t => {
      if (t.status !== 'pending') return false
      
      // 检查最后一次日志时间
      if (t.logs && t.logs.length > 0) {
        const lastLog = t.logs[t.logs.length - 1]
        const lastLogTime = new Date(lastLog.timestamp)
        return lastLogTime < threeDaysAgo
      }
      
      // 检查创建时间
      const createdTime = new Date(t.created_at)
      return createdTime < threeDaysAgo
    })
  }

  /**
   * 发送卡壳任务提醒（防重复）
   */
  static async notifyStuckTasks(stuckTasks) {
    if (stuckTasks.length === 0) return

    const task = stuckTasks[0] // 只提醒第一个
    
    // 🔧 防重复提醒：检查今天是否已经提醒过这个任务
    const today = new Date().toISOString().split('T')[0] // 格式: 2026-03-03
    const lastNotifyKey = `stuck_task_notify_${task.id}`
    const lastNotifyDate = localStorage.getItem(lastNotifyKey)
    
    if (lastNotifyDate === today) {
      console.log(`任务 "${task.text}" 今天已提醒过，跳过`)
      return
    }
    
    // 发送通知
    await LocalNotifications.schedule({
      notifications: [{
        id: 2000 + Math.floor(Math.random() * 1000),
        title: '⚠️ 任务卡壳提醒',
        body: `"${task.text}" 已经3天没有推进了，需要帮助吗？`,
        extra: {
          taskId: task.id,
          action: 'stuck_task'
        }
      }]
    })
    
    // 记录今天已提醒
    localStorage.setItem(lastNotifyKey, today)
  }

  /**
   * 计算连续完成天数
   */
  static calculateStreak(tasks) {
    const completedDates = tasks
      .filter(t => t.status === 'completed' && t.completed_at)
      .map(t => {
        const date = new Date(t.completed_at)
        date.setHours(0, 0, 0, 0)
        return date.getTime()
      })
      .filter((v, i, a) => a.indexOf(v) === i) // 去重
      .sort((a, b) => b - a) // 降序

    if (completedDates.length === 0) return 0

    let streak = 1
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTime = today.getTime()

    // 检查今天或昨天是否有完成任务
    const yesterday = todayTime - 24 * 60 * 60 * 1000
    if (completedDates[0] !== todayTime && completedDates[0] !== yesterday) {
      return 0 // 连续记录已中断
    }

    // 计算连续天数
    for (let i = 1; i < completedDates.length; i++) {
      const diff = completedDates[i - 1] - completedDates[i]
      if (diff === 24 * 60 * 60 * 1000) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  /**
   * 发送习惯养成鼓励（防重复）
   */
  static async notifyStreakMilestone(streak) {
    const milestones = [7, 30, 100, 365]
    
    if (!milestones.includes(streak)) return

    // 🔧 防重复提醒：检查这个里程碑是否已经提醒过
    const milestoneKey = `streak_milestone_${streak}`
    const hasNotified = localStorage.getItem(milestoneKey)
    
    if (hasNotified === 'true') {
      console.log(`连续${streak}天里程碑已提醒过，跳过`)
      return
    }

    const messages = {
      7: '🎉 连续完成7天！习惯正在养成！',
      30: '🏆 连续完成30天！你太棒了！',
      100: '💎 连续完成100天！你是时间管理大师！',
      365: '👑 连续完成365天！传奇成就解锁！'
    }

    await LocalNotifications.schedule({
      notifications: [{
        id: 3000 + streak,
        title: '🎊 里程碑达成',
        body: messages[streak],
        extra: {
          action: 'streak_milestone',
          streak: streak
        }
      }]
    })
    
    // 记录已提醒
    localStorage.setItem(milestoneKey, 'true')
  }

  /**
   * 每日检查（在应用启动时调用）
   */
  static async dailyCheck(tasks) {
    // 1. 更新早晨问候内容
    const morningBody = this.generateMorningGreeting(tasks)
    console.log('早晨问候:', morningBody)

    // 2. 更新晚上总结内容
    const eveningBody = this.generateEveningSummary(tasks)
    console.log('晚上总结:', eveningBody)

    // 3. 检测卡壳任务
    const stuckTasks = this.detectStuckTasks(tasks)
    if (stuckTasks.length > 0) {
      await this.notifyStuckTasks(stuckTasks)
    }

    // 4. 检查连续完成天数
    const streak = this.calculateStreak(tasks)
    if (streak > 0) {
      await this.notifyStreakMilestone(streak)
    }

    return {
      morningBody,
      eveningBody,
      stuckTasks: stuckTasks.length,
      streak
    }
  }
}
