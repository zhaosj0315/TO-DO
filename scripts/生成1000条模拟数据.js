const XLSX = require('xlsx');

// 任务名称库
const taskNames = {
  work: [
    '完成项目报告', '准备会议材料', '回复客户邮件', '更新项目文档', '代码审查',
    '系统测试', '需求分析', '技术方案设计', '团队周会', '项目进度汇报',
    '优化系统性能', '修复线上Bug', '数据库优化', '接口开发', '前端页面调整',
    '编写技术文档', '产品需求评审', '跨部门协作会议', '季度总结报告', '客户需求沟通',
    '制定工作计划', '团队建设活动', '新人培训', '技术分享会', '代码重构',
    '安全漏洞修复', '性能监控分析', '用户反馈处理', '版本发布准备', '竞品分析报告'
  ],
  study: [
    '学习Vue3新特性', '阅读技术书籍', '观看在线课程', '练习算法题', '英语口语练习',
    '准备技术认证考试', '复习数据结构', '学习设计模式', '写技术博客', '参加技术讲座',
    '学习TypeScript', '研究新框架', '做项目实战', '整理学习笔记', '背单词',
    '看技术视频', '刷LeetCode', '学习系统设计', '阅读源码', '写代码练习',
    '准备面试', '学习数据库', '研究架构设计', '学习网络协议', '复习操作系统',
    '学习云计算', '研究微服务', '学习容器技术', '准备考试', '做课后作业'
  ],
  life: [
    '健身房锻炼', '买菜做饭', '打扫卫生', '洗衣服', '整理房间',
    '看电影', '约朋友聚餐', '陪家人散步', '去超市购物', '理发',
    '体检', '缴纳水电费', '修理家电', '植物浇水', '宠物喂养',
    '读书', '听音乐', '玩游戏', '看综艺节目', '做瑜伽',
    '跑步', '游泳', '打篮球', '爬山', '骑自行车',
    '看展览', '逛街', '喝咖啡', '看演出', '旅行计划'
  ]
};

// 任务描述库
const descriptions = {
  work: [
    '需要在截止日期前完成，注意质量',
    '重要且紧急，优先处理',
    '与团队协作完成',
    '需要提前准备相关资料',
    '按照既定流程执行',
    '注意细节，确保准确性',
    '需要领导审批',
    '涉及多个部门配合',
    '技术难度较高，需要深入研究',
    '常规工作，按时完成即可'
  ],
  study: [
    '每天坚持学习30分钟',
    '做好笔记，便于复习',
    '理论结合实践',
    '遇到问题及时查资料',
    '定期总结学习成果',
    '保持学习热情',
    '循序渐进，不要急躁',
    '多做练习题巩固知识',
    '与他人交流学习心得',
    '制定详细的学习计划'
  ],
  life: [
    '保持健康的生活习惯',
    '注意劳逸结合',
    '享受生活的美好',
    '多陪伴家人朋友',
    '保持积极乐观的心态',
    '定期锻炼身体',
    '合理安排时间',
    '培养兴趣爱好',
    '注意饮食健康',
    '保证充足睡眠'
  ]
};

// 任务类型
const taskTypes = ['today', 'tomorrow', 'this_week', 'custom_date', 'daily', 'weekday', 'weekly'];
const categories = ['work', 'study', 'life'];
const priorities = ['high', 'medium', 'low'];
const statuses = ['pending', 'completed', 'overdue'];

// 生成随机日期（2025-01-01 到 2026-02-28）
function randomDate() {
  const start = new Date('2025-01-01').getTime();
  const end = new Date('2026-02-28').getTime();
  const randomTime = start + Math.random() * (end - start);
  return new Date(randomTime);
}

// 格式化日期时间
function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

// 格式化日期
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 格式化时间
function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// 随机选择
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// 生成周期
function generateWeekdays() {
  const days = ['一', '二', '三', '四', '五', '六', '日'];
  const count = Math.floor(Math.random() * 3) + 1; // 1-3个工作日
  const selected = [];
  while (selected.length < count) {
    const day = randomChoice(days);
    if (!selected.includes(day)) {
      selected.push(day);
    }
  }
  return selected.sort().join(',');
}

// 生成1000条任务数据
function generateTasks(count = 1000) {
  const tasks = [];
  
  for (let i = 0; i < count; i++) {
    const category = randomChoice(categories);
    const priority = randomChoice(priorities);
    const status = randomChoice(statuses);
    const type = randomChoice(taskTypes);
    const createdDate = randomDate();
    
    const taskName = randomChoice(taskNames[category]);
    const description = randomChoice(descriptions[category]);
    
    let weekdays = '';
    let customDate = '';
    let customTime = '';
    
    // 根据类型设置周期和日期
    if (type === 'weekly') {
      weekdays = generateWeekdays();
    } else if (type === 'custom_date') {
      const futureDate = new Date(createdDate);
      futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30));
      customDate = formatDate(futureDate);
      customTime = formatTime(futureDate);
    }
    
    tasks.push({
      '任务名称': taskName,
      '任务描述': description,
      '任务类型': type,
      '任务分类': category,
      '优先级': priority,
      '周期': weekdays,
      '指定日期': customDate,
      '指定时间': customTime,
      '状态': status,
      '创建时间': formatDateTime(createdDate)
    });
  }
  
  // 按创建时间排序
  tasks.sort((a, b) => new Date(a['创建时间']) - new Date(b['创建时间']));
  
  return tasks;
}

// 生成Excel文件
function generateExcel() {
  console.log('开始生成1000条模拟数据...');
  
  const tasks = generateTasks(1000);
  
  // 创建工作簿
  const wb = XLSX.utils.book_new();
  
  // 创建工作表
  const ws = XLSX.utils.json_to_sheet(tasks);
  
  // 设置列宽
  ws['!cols'] = [
    { wch: 20 }, // 任务名称
    { wch: 30 }, // 任务描述
    { wch: 15 }, // 任务类型
    { wch: 10 }, // 任务分类
    { wch: 10 }, // 优先级
    { wch: 15 }, // 周期
    { wch: 12 }, // 指定日期
    { wch: 10 }, // 指定时间
    { wch: 10 }, // 状态
    { wch: 18 }  // 创建时间
  ];
  
  // 添加工作表到工作簿
  XLSX.utils.book_append_sheet(wb, ws, '任务列表');
  
  // 写入文件
  XLSX.writeFile(wb, 'TODO导入模板示例-1000条.xlsx');
  
  console.log('✅ 成功生成1000条模拟数据！');
  console.log('📁 文件名：TODO导入模板示例-1000条.xlsx');
  console.log('');
  console.log('数据统计：');
  
  // 统计信息
  const stats = {
    work: tasks.filter(t => t['任务分类'] === 'work').length,
    study: tasks.filter(t => t['任务分类'] === 'study').length,
    life: tasks.filter(t => t['任务分类'] === 'life').length,
    high: tasks.filter(t => t['优先级'] === 'high').length,
    medium: tasks.filter(t => t['优先级'] === 'medium').length,
    low: tasks.filter(t => t['优先级'] === 'low').length,
    pending: tasks.filter(t => t['状态'] === 'pending').length,
    completed: tasks.filter(t => t['状态'] === 'completed').length,
    overdue: tasks.filter(t => t['状态'] === 'overdue').length
  };
  
  console.log(`  分类 - 工作: ${stats.work}, 学习: ${stats.study}, 生活: ${stats.life}`);
  console.log(`  优先级 - 高: ${stats.high}, 中: ${stats.medium}, 低: ${stats.low}`);
  console.log(`  状态 - 待办: ${stats.pending}, 已完成: ${stats.completed}, 已逾期: ${stats.overdue}`);
  console.log('');
  console.log('时间范围：2025-01-01 至 2026-02-28');
}

// 执行生成
generateExcel();
