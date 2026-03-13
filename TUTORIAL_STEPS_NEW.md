# 新教程步骤（18步）

## 步骤配置

```javascript
const steps = [
  // 1. 欢迎
  { target: null, icon: '👋', title: '欢迎使用 TO-DO App v0.9.2！', description: '功能强大的离线任务管理应用...', position: 'center', category: 'intro' },
  
  // 2. 顶部功能区
  { target: '.header-row', icon: '🎛️', title: '顶部功能区', description: '第一行：刷新|AI|回收站|教程|我的...', position: 'bottom', category: 'intro' },
  
  // 3. 笔记本+统计
  { target: '.collection-quick-bar', icon: '📁', title: '笔记本 & 统计栏', description: '按项目组织任务...', position: 'bottom', category: 'basic' },
  
  // 4. 创建任务
  { target: '.unified-input-container', icon: '➕', title: '创建新任务', description: '输入标题→回车...', position: 'bottom', category: 'basic' },
  
  // 5. 任务卡片
  { target: '.task-list', icon: '📝', title: '任务卡片操作', description: '完成|番茄钟|置顶|删除...', position: 'bottom', category: 'basic' },
  
  // 6. 执行日志
  { target: '.task-list', icon: '💬', title: '执行日志系统', description: '6种日志类型...', position: 'bottom', category: 'basic' },
  
  // 7. 双向链接
  { target: '.task-list', icon: '🔗', title: 'Obsidian风格：双向链接', description: '[[任务名]]语法...', position: 'bottom', category: 'advanced' },
  
  // 8. 层级标签
  { target: '.btn-tag-browser', icon: '🏷️', title: 'Obsidian风格：层级标签', description: '#work/project-a...', position: 'bottom-left', category: 'advanced' },
  
  // 9. 关系图谱
  { target: '.btn-task-graph', icon: '🕸️', title: '任务关系图谱', description: '8种关系可视化...', position: 'bottom-left', category: 'advanced' },
  
  // 10. 甘特图
  { target: '.btn-gantt-chart', icon: '📊', title: '甘特图视图', description: '时间轴可视化...', position: 'bottom-left', category: 'advanced' },
  
  // 11. 日历
  { target: '.btn-calendar-view', icon: '📅', title: '日历视图', description: '月视图网格...', position: 'bottom-left', category: 'advanced' },
  
  // 12. 番茄钟
  { target: '.task-list', icon: '🍅', title: '番茄钟计时器', description: '25分钟专注...', position: 'bottom', category: 'basic' },
  
  // 13. AI助手
  { target: '.btn-ai', icon: '🤖', title: 'AI智能助手', description: '问答|拆分|报告...', position: 'bottom-left', category: 'advanced' },
  
  // 14. 成长树
  { target: '.growth-tree', icon: '🌳', title: '任务树成长系统', description: '10级成长体系...', position: 'bottom-right', category: 'intro' },
  
  // 15. 数据管理
  { target: '.btn-avatar', icon: '💾', title: '数据管理 & 备份', description: '导出|导入|备份...', position: 'bottom-left', category: 'basic' },
  
  // 16. 更多功能
  { target: null, icon: '🎁', title: '更多实用功能', description: '附件|Markdown|语音|OCR...', position: 'center', category: 'advanced' },
  
  // 17. 快捷操作
  { target: null, icon: '⚡', title: '快捷操作技巧', description: '快速创建|筛选|完成...', position: 'center', category: 'advanced' },
  
  // 18. 完成
  { target: null, icon: '🎉', title: '恭喜！教程完成', description: '下一步建议...', position: 'center', category: 'intro' }
]
```

## CSS选择器验证

需要确认以下选择器存在：
- `.header-row` ✅
- `.collection-quick-bar` ✅
- `.unified-input-container` ✅
- `.task-list` ✅
- `.btn-tag-browser` ⚠️ 需要验证
- `.btn-task-graph` ⚠️ 需要验证
- `.btn-gantt-chart` ⚠️ 需要验证
- `.btn-calendar-view` ⚠️ 需要验证
- `.btn-ai` ✅
- `.growth-tree` ✅
- `.btn-avatar` ✅
