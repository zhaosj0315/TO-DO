# 报告中心分类分组功能实现

## 📋 需求说明

在报告中心的各个章节中，按**工作/学习/生活**分类分组显示任务，提升报告的可读性和实用性。

## ✅ 实现内容

### 1. 数据层改造（aiReportGenerator.js）

#### 修改点
- **下期计划**：从单一列表改为按分类分组（`byCategory.work/study/life`）
- **风险与问题**：从单一列表改为按分类分组（`byCategory.work/study/life`）
- **重点任务**：从单一列表改为按分类分组（`work/study/life`）

#### 数据结构
```javascript
// 旧结构
nextPlan: {
  total: 100,
  tasks: [...]  // 混合所有分类
}

// 新结构
nextPlan: {
  total: 100,
  highPriority: 50,
  byCategory: {
    work: [...],   // 工作任务
    study: [...],  // 学习任务
    life: [...]    // 生活任务
  }
}
```

### 2. 视图层改造（TextReportView.vue）

#### 新增组件
- **分类分组容器**：`.category-group`
- **分类标题**：`.category-header`（带图标和数量）
- **任务列表**：每个分类独立显示

#### 显示效果
```
【重点任务】
💼 工作 (82个)
  1. 确定核心架构选型 (⚡高, 🍅8)
  2. 学习系统设计基础理论 (⚡高, 🍅8)
  ...

📚 学习 (11个)
  1. 英语口语练习 (⚡高, 🍅4)
  ...

🏠 生活 (0个)
  暂无生活类任务
```

### 3. 辅助函数

```javascript
// 优先级文本转换
const getPriorityText = (priority) => {
  const map = { high: '高', medium: '中', low: '低' }
  return map[priority] || '中'
}

// 番茄钟数量计算
const getPomodoros = (task) => {
  if (task.estimatedPomodoros) return task.estimatedPomodoros
  const map = { high: 4, medium: 2, low: 1 }
  return map[task.priority] || 2
}
```

### 4. 样式优化

```css
/* 分类标题 */
.category-header {
  font-size: 1rem;
  font-weight: 600;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

/* 任务列表缩进 */
.category-group .key-tasks {
  padding-left: 0.5rem;
}
```

### 5. 统一数据源（UnifiedReportModal.vue）

- 删除旧的 `generateTextData` 和 `generateVisualData` 函数（约150行）
- 统一使用 `AIReportGenerator` 生成报告数据
- 减少代码重复，提升维护性

## 📊 影响范围

### 修改文件
1. `src/services/aiReportGenerator.js` - 数据生成逻辑
2. `src/components/TextReportView.vue` - 文本视图显示
3. `src/components/UnifiedReportModal.vue` - 数据源统一

### 受影响章节
- ✅ 重点任务
- ✅ 风险与问题
- ✅ 下期计划

### 未受影响章节
- 📅 报告周期
- 📝 智能总结
- 📊 数据概览（已有分类统计）
- 🎯 本期目标
- 📈 本期进展

## 🎯 优势

### 1. 可读性提升
- 清晰的分类标题（💼/📚/🏠）
- 每个分类独立显示数量
- 层级分明，一目了然

### 2. 实用性增强
- 快速定位某个领域的任务
- 分类对比更直观
- 支持空分类提示

### 3. 代码质量
- 统一数据源（AIReportGenerator）
- 删除重复代码（约150行）
- 提升可维护性

## 📝 使用示例

### 生成周报
```javascript
const generator = new AIReportGenerator(tasks)
const report = generator.generateReport(startDate, endDate, 'weekly')

// 访问分类数据
console.log(report.nextPlan.byCategory.work)   // 工作待办
console.log(report.issues.byCategory.study)    // 学习逾期
console.log(report.keyWorks.life)              // 生活重点
```

### 显示分类分组
```vue
<div v-if="report.nextPlan.byCategory.work.length > 0">
  <div class="category-header">
    💼 工作 (待办{{ report.nextPlan.byCategory.work.length }}个)
  </div>
  <div v-for="task in report.nextPlan.byCategory.work" :key="task.id">
    {{ task.text }}
  </div>
</div>
```

## 🔄 后续优化建议

### Phase 2（可选）
1. **分类筛选器**：在报告顶部添加分类标签，点击只显示该分类
2. **分类对比图表**：可视化报告中添加分类对比柱状图
3. **分类趋势**：显示各分类的完成率趋势

### Phase 3（高级）
1. **自定义分类**：支持用户自定义分类（如"健康"、"财务"）
2. **分类权重**：根据分类重要性调整显示顺序
3. **分类目标**：为每个分类设置完成目标

## 📦 版本信息

- **实现版本**：v0.8.3
- **实现日期**：2026-03-06
- **代码变更**：+240行 / -150行 / 净增加90行
- **构建状态**：✅ 通过

## 🐛 已知问题

无

## 📚 相关文档

- [README.md](./README.md) - 项目总览
- [aiReportGenerator.js](./src/services/aiReportGenerator.js) - 报告生成服务
- [TextReportView.vue](./src/components/TextReportView.vue) - 文本视图组件
