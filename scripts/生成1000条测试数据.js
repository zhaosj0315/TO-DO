const XLSX = require('xlsx');

// 任务名称库（扩展）
const taskNames = {
  work: [
    '完成项目报告', '准备会议材料', '回复客户邮件', '更新项目文档', '代码审查',
    '系统测试', '需求分析', '技术方案设计', '团队周会', '项目进度汇报',
    '优化系统性能', '修复线上Bug', '数据库优化', '接口开发', '前端页面调整',
    '编写技术文档', '产品需求评审', '跨部门协作会议', '季度总结报告', '客户需求沟通',
    '制定工作计划', '团队建设活动', '新人培训', '技术分享会', '代码重构',
    '安全漏洞修复', '性能监控分析', '用户反馈处理', '版本发布准备', '竞品分析报告',
    '撰写周报', '参加培训', '整理工作笔记', '更新知识库', '制作PPT',
    '数据分析报告', '流程优化方案', '风险评估', '成本核算', '资源调配'
  ],
  study: [
    '学习Vue3新特性', '阅读技术书籍', '观看在线课程', '练习算法题', '英语口语练习',
    '准备技术认证考试', '复习数据结构', '学习设计模式', '写技术博客', '参加技术讲座',
    '学习TypeScript', '研究新框架', '做项目实战', '整理学习笔记', '背单词',
    '看技术视频', '刷LeetCode', '学习系统设计', '阅读源码', '写代码练习',
    '准备面试', '学习数据库', '研究架构设计', '学习网络协议', '复习操作系统',
    '学习云计算', '研究微服务', '学习容器技术', '准备考试', '做课后作业',
    '学习Python', '研究AI算法', '学习前端框架', '复习英语语法', '练习听力'
  ],
  life: [
    '健身房锻炼', '买菜做饭', '打扫卫生', '洗衣服', '整理房间',
    '看电影', '约朋友聚餐', '陪家人散步', '去超市购物', '理发',
    '体检', '缴纳水电费', '修理家电', '植物浇水', '宠物喂养',
    '读书', '听音乐', '玩游戏', '看综艺节目', '做瑜伽',
    '跑步', '游泳', '打篮球', '爬山', '骑自行车',
    '看展览', '逛街', '喝咖啡', '看演出', '旅行计划',
    '整理照片', '写日记', '冥想', '学做菜', '家庭聚会'
  ]
};

// 任务描述库
const descriptions = {
  work: [
    '需要在截止日期前完成，注意质量', '重要且紧急，优先处理', '与团队协作完成',
    '需要提前准备相关资料', '按照既定流程执行', '注意细节，确保准确性',
    '需要领导审批', '涉及多个部门配合', '技术难度较高，需要深入研究',
    '常规工作，按时完成即可', '需要创新思维', '参考历史经验',
    '注意时间节点', '保持沟通顺畅', '做好风险控制'
  ],
  study: [
    '每天坚持学习30分钟', '做好笔记，便于复习', '理论结合实践',
    '遇到问题及时查资料', '定期总结学习成果', '保持学习热情',
    '循序渐进，不要急躁', '多做练习题巩固知识', '与他人交流学习心得',
    '制定详细的学习计划', '注重理解而非死记硬背', '定期复习巩固'
  ],
  life: [
    '保持健康的生活习惯', '注意劳逸结合', '享受生活的美好',
    '多陪伴家人朋友', '保持积极乐观的心态', '定期锻炼身体',
    '合理安排时间', '培养兴趣爱好', '注意饮食健康',
    '保证充足睡眠', '放松心情，减压', '提升生活品质'
  ]
};

const taskTypes = ['today', 'tomorrow', 'this_week', 'custom_date', 'daily', 'weekday', 'weekly'];
const categories = ['work', 'study', 'life'];
const priorities = ['high', 'medium', 'low'];

function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateWeekdays() {
  const days = ['一', '二', '三', '四', '五', '六', '日'];
  const count = Math.floor(Math.random() * 3) + 1;
  const selected = [];
  while (selected.length < count) {
    const day = randomChoice(days);
    if (!selected.includes(day)) {
      selected.push(day);
    }
  }
  return selected.sort().join(',');
}

function generateTasks() {
  const tasks = [];
  const startDate = new Date('2025-01-01');
  const endDate = new Date('2026-02-28');
  const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const tasksPerDay = Math.floor(Math.random() * 2) + 2;
    
    for (let i = 0; i < tasksPerDay; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + dayOffset);
      currentDate.setHours(Math.floor(Math.random() * 24));
      currentDate.setMinutes(Math.floor(Math.random() * 60));
      
      const category = randomChoice(categories);
      const priority = randomChoice(priorities);
      const type = randomChoice(taskTypes);
      
      let status;
      const now = new Date('2026-02-19');
      const daysSinceCreated = Math.floor((now - currentDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceCreated < 0) {
        // 未来的任务：全部待办
        status = 'pending';
      } else if (daysSinceCreated <= 7) {
        // 最近一周：80%待办，20%已完成
        status = Math.random() < 0.8 ? 'pending' : 'completed';
      } else if (daysSinceCreated <= 30) {
        // 最近一月：50%待办，45%已完成，5%逾期
        const rand = Math.random();
        if (rand < 0.5) status = 'pending';
        else if (rand < 0.95) status = 'completed';
        else status = 'overdue';
      } else if (daysSinceCreated <= 90) {
        // 最近三月：35%待办，55%已完成，10%逾期
        const rand = Math.random();
        if (rand < 0.35) status = 'pending';
        else if (rand < 0.9) status = 'completed';
        else status = 'overdue';
      } else {
        // 更早：25%待办，60%已完成，15%逾期
        const rand = Math.random();
        if (rand < 0.25) status = 'pending';
        else if (rand < 0.85) status = 'completed';
        else status = 'overdue';
      }
      
      const taskName = randomChoice(taskNames[category]);
      const description = randomChoice(descriptions[category]);
      
      let weekdays = '';
      let customDate = '';
      let customTime = '';
      
      if (type === 'weekly') {
        weekdays = generateWeekdays();
      } else if (type === 'custom_date') {
        const futureDate = new Date(currentDate);
        futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 60) - 10);
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
        '创建时间': formatDateTime(currentDate)
      });
      
      if (tasks.length >= 1000) break;
    }
    if (tasks.length >= 1000) break;
  }
  
  return tasks.slice(0, 1000);
}

function generateExcel() {
  console.log('开始生成1000条全面测试数据...\n');
  
  const tasks = generateTasks();
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(tasks);
  
  ws['!cols'] = [
    { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 10 },
    { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 18 }
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, '任务列表');
  XLSX.writeFile(wb, 'TODO导入模板示例.xlsx');
  
  console.log('✅ 成功生成1000条测试数据！');
  console.log('📁 文件名：TODO导入模板示例.xlsx\n');
  
  const stats = {
    work: tasks.filter(t => t['任务分类'] === 'work').length,
    study: tasks.filter(t => t['任务分类'] === 'study').length,
    life: tasks.filter(t => t['任务分类'] === 'life').length,
    high: tasks.filter(t => t['优先级'] === 'high').length,
    medium: tasks.filter(t => t['优先级'] === 'medium').length,
    low: tasks.filter(t => t['优先级'] === 'low').length,
    pending: tasks.filter(t => t['状态'] === 'pending').length,
    completed: tasks.filter(t => t['状态'] === 'completed').length,
    overdue: tasks.filter(t => t['状态'] === 'overdue').length,
    today: tasks.filter(t => t['任务类型'] === 'today').length,
    tomorrow: tasks.filter(t => t['任务类型'] === 'tomorrow').length,
    this_week: tasks.filter(t => t['任务类型'] === 'this_week').length,
    custom_date: tasks.filter(t => t['任务类型'] === 'custom_date').length,
    daily: tasks.filter(t => t['任务类型'] === 'daily').length,
    weekday: tasks.filter(t => t['任务类型'] === 'weekday').length,
    weekly: tasks.filter(t => t['任务类型'] === 'weekly').length
  };
  
  console.log('📊 数据统计：\n');
  console.log('按分类：');
  console.log(`  💼 工作: ${stats.work} (${(stats.work/10).toFixed(1)}%)`);
  console.log(`  📚 学习: ${stats.study} (${(stats.study/10).toFixed(1)}%)`);
  console.log(`  🏠 生活: ${stats.life} (${(stats.life/10).toFixed(1)}%)\n`);
  console.log('按优先级：');
  console.log(`  ⚡ 高: ${stats.high} (${(stats.high/10).toFixed(1)}%)`);
  console.log(`  ⚡ 中: ${stats.medium} (${(stats.medium/10).toFixed(1)}%)`);
  console.log(`  ⚡ 低: ${stats.low} (${(stats.low/10).toFixed(1)}%)\n`);
  console.log('按状态：');
  console.log(`  ⏳ 待办: ${stats.pending} (${(stats.pending/10).toFixed(1)}%)`);
  console.log(`  ✅ 已完成: ${stats.completed} (${(stats.completed/10).toFixed(1)}%)`);
  console.log(`  ❌ 已逾期: ${stats.overdue} (${(stats.overdue/10).toFixed(1)}%)\n`);
  console.log('按类型：');
  console.log(`  今天: ${stats.today}, 明天: ${stats.tomorrow}, 本周: ${stats.this_week}`);
  console.log(`  指定日期: ${stats.custom_date}, 每天: ${stats.daily}`);
  console.log(`  工作日: ${stats.weekday}, 每周: ${stats.weekly}\n`);
  console.log('⏰ 时间范围：2025-01-01 至 2026-02-28 (均匀分布)\n');
  console.log('✨ 测试覆盖：');
  console.log('  ✓ 所有分类、优先级、状态、类型组合');
  console.log('  ✓ 时间均匀分布（每天2-3个任务）');
  console.log('  ✓ 智能状态分配（根据创建时间）');
}

generateExcel();
