// AI 主动式助手功能测试数据生成脚本
// 使用方法：在浏览器控制台中运行此脚本

console.log('🚀 开始生成测试数据...');

// 获取当前用户
const currentUser = localStorage.getItem('currentUser');
if (!currentUser) {
  console.error('❌ 请先登录！');
  throw new Error('未登录');
}

// 获取现有任务
const tasksKey = `tasks_${currentUser}`;
let tasks = JSON.parse(localStorage.getItem(tasksKey) || '[]');

// 清空现有任务（可选）
const clearExisting = confirm('是否清空现有任务？');
if (clearExisting) {
  tasks = [];
  console.log('✅ 已清空现有任务');
}

// 辅助函数：生成随机ID
const generateId = () => Date.now() + Math.floor(Math.random() * 1000);

// 辅助函数：获取日期
const getDate = (daysOffset) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
};

// 1. 创建逾期任务（3个）
console.log('📝 创建逾期任务...');
for (let i = 1; i <= 3; i++) {
  tasks.push({
    id: generateId(),
    text: `逾期任务 ${i}`,
    description: `这是一个逾期的测试任务 ${i}`,
    type: 'today',
    category: 'work',
    priority: i === 1 ? 'high' : 'medium',
    status: 'overdue',
    created_at: getDate(-5),
    user_id: currentUser,
    estimatedPomodoros: 2
  });
}
console.log('✅ 已创建 3 个逾期任务');

// 2. 创建高优先级待办任务（5个）
console.log('📝 创建高优先级待办任务...');
for (let i = 1; i <= 5; i++) {
  tasks.push({
    id: generateId(),
    text: `高优先级任务 ${i}`,
    description: `这是一个高优先级的待办任务 ${i}`,
    type: 'today',
    category: i <= 2 ? 'work' : 'study',
    priority: 'high',
    status: 'pending',
    created_at: getDate(0),
    user_id: currentUser,
    estimatedPomodoros: 4
  });
}
console.log('✅ 已创建 5 个高优先级待办任务');

// 3. 创建今日完成任务（8个）
console.log('📝 创建今日完成任务...');
for (let i = 1; i <= 8; i++) {
  const completedTime = new Date();
  completedTime.setHours(completedTime.getHours() - i);
  
  tasks.push({
    id: generateId(),
    text: `今日完成任务 ${i}`,
    description: `这是一个今日完成的任务 ${i}`,
    type: 'today',
    category: i <= 3 ? 'work' : (i <= 6 ? 'study' : 'life'),
    priority: i <= 2 ? 'high' : (i <= 5 ? 'medium' : 'low'),
    status: 'completed',
    created_at: getDate(0),
    completed_at: completedTime.toISOString(),
    user_id: currentUser,
    estimatedPomodoros: 2,
    completedPomodoros: 2,
    pomodoroHistory: [
      {
        startTime: completedTime.toISOString(),
        endTime: new Date(completedTime.getTime() + 25 * 60 * 1000).toISOString(),
        completed: true
      }
    ]
  });
}
console.log('✅ 已创建 8 个今日完成任务');

// 4. 创建本周任务（20个）
console.log('📝 创建本周任务...');
for (let i = 1; i <= 20; i++) {
  const dayOffset = -Math.floor(i / 3);
  const isCompleted = i <= 15;
  const isOverdue = !isCompleted && i <= 18;
  
  const task = {
    id: generateId(),
    text: `本周任务 ${i}`,
    description: `这是本周的任务 ${i}`,
    type: 'this_week',
    category: i % 3 === 0 ? 'work' : (i % 3 === 1 ? 'study' : 'life'),
    priority: i % 3 === 0 ? 'high' : (i % 3 === 1 ? 'medium' : 'low'),
    status: isCompleted ? 'completed' : (isOverdue ? 'overdue' : 'pending'),
    created_at: getDate(dayOffset),
    user_id: currentUser,
    estimatedPomodoros: 2
  };
  
  if (isCompleted) {
    task.completed_at = getDate(dayOffset + 1);
    task.completedPomodoros = 2;
  }
  
  tasks.push(task);
}
console.log('✅ 已创建 20 个本周任务');

// 5. 创建明日任务（3个）
console.log('📝 创建明日任务...');
for (let i = 1; i <= 3; i++) {
  tasks.push({
    id: generateId(),
    text: `明日任务 ${i}`,
    description: `这是明天要做的任务 ${i}`,
    type: 'tomorrow',
    category: 'work',
    priority: i === 1 ? 'high' : 'medium',
    status: 'pending',
    created_at: getDate(0),
    user_id: currentUser,
    estimatedPomodoros: 2
  });
}
console.log('✅ 已创建 3 个明日任务');

// 6. 创建大任务（用于测试任务分解）
console.log('📝 创建大任务...');
tasks.push({
  id: generateId(),
  text: '开发新功能模块',
  description: '需要完成需求分析、设计、开发、测试等多个步骤',
  type: 'custom_date',
  customDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  customTime: '18:00',
  category: 'work',
  priority: 'high',
  status: 'pending',
  created_at: getDate(0),
  user_id: currentUser,
  estimatedPomodoros: 8
});
console.log('✅ 已创建 1 个大任务');

// 保存到 localStorage
localStorage.setItem(tasksKey, JSON.stringify(tasks));

// 输出统计
console.log('\n📊 测试数据生成完成！');
console.log('==========================================');
console.log(`总任务数: ${tasks.length}`);
console.log(`逾期任务: ${tasks.filter(t => t.status === 'overdue').length}`);
console.log(`待办任务: ${tasks.filter(t => t.status === 'pending').length}`);
console.log(`已完成任务: ${tasks.filter(t => t.status === 'completed').length}`);
console.log(`高优先级任务: ${tasks.filter(t => t.priority === 'high').length}`);
console.log(`今日完成: ${tasks.filter(t => t.status === 'completed' && new Date(t.completed_at).toDateString() === new Date().toDateString()).length}`);
console.log('==========================================');
console.log('\n✅ 请刷新页面查看测试数据！');

// 提示刷新
if (confirm('测试数据已生成！是否立即刷新页面？')) {
  location.reload();
}
