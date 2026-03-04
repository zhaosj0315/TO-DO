# EnhancedPomodoroStats 组件说明

## 📋 概述

`EnhancedPomodoroStats.vue` 是一个整合了**番茄钟统计**和**数据统计**的综合统计组件，通过标签页切换实现两个模块的统一管理。

## ✨ 功能特性

### 🍅 番茄钟统计标签页

#### 1. 今日专注统计（3卡片）
- ⏱️ **今日专注（分钟）**：今天完成的番茄钟总时长
- 🍅 **今日完成（个）**：今天完成的番茄钟数量
- 📊 **本周完成（个）**：最近7天完成的番茄钟数量

#### 2. 番茄钟总览（4卡片）
- ✅ **已获得**：已完成任务获得的番茄钟
- ⏳ **待获得**：待办任务预估的番茄钟
- ❌ **逾期扣除**：已逾期任务扣除的番茄钟
- 🏆 **净获得**：已获得 - 逾期扣除

#### 3. 近7天趋势
- 柱状图展示最近7天的番茄钟完成情况
- 紫色渐变柱状图
- 显示每天的具体数量

#### 4. 分类占比
- 💼 **工作**：工作类任务的番茄钟数量和百分比
- 📚 **学习**：学习类任务的番茄钟数量和百分比
- 🏠 **生活**：生活类任务的番茄钟数量和百分比
- 彩色进度条可视化

### 📊 数据统计标签页

#### 1. 时间范围选择
- 最近7天
- 最近30天
- 最近90天

#### 2. 任务完成趋势图
- ECharts折线图
- 显示完成任务和创建任务的趋势对比

#### 3. 任务分类占比
- ECharts饼图
- 工作/学习/生活三大分类的占比

#### 4. 优先级分布
- ECharts柱状图
- 高/中/低优先级任务的数量分布

#### 5. 365天完成热力图
- GitHub风格的热力图
- 显示全年每天的任务完成情况

#### 6. 任务执行质量分析（4卡片）
- 💬 **平均日志数**：任务推进频率
- ⚠️ **平均阻碍数**：任务难度指标
- ⭐ **平均完成评分**：任务质量指标
- 📊 **平均进度**：任务完成度

#### 7. 效率分析（4卡片）
- ⏱️ **平均完成时间**
- 🎯 **完成率**
- 🔥 **最高效时段**
- 📊 **总任务数**

## 🎨 UI设计

### 布局结构
```
┌─────────────────────────────────────┐
│  ← 返回    📊 统计中心         [空]  │ ← 紫色渐变头部
├─────────────────────────────────────┤
│  🍅 番茄钟  │  📊 数据统计          │ ← 标签页切换
├─────────────────────────────────────┤
│                                     │
│  [标签页内容区域]                    │
│                                     │
│  (可滚动)                            │
│                                     │
└─────────────────────────────────────┘
```

### 颜色主题
- **主色调**：紫色渐变 `#667eea → #764ba2`
- **工作分类**：紫色渐变
- **学习分类**：粉红渐变 `#f093fb → #f5576c`
- **生活分类**：蓝色渐变 `#4facfe → #00f2fe`

### 响应式设计
- 移动端：今日专注统计改为单列布局
- 移动端：番茄钟总览改为2列布局
- 移动端：图表高度自适应

## 📦 Props

```javascript
{
  visible: Boolean  // 控制弹窗显示/隐藏
}
```

## 🔄 Events

```javascript
emit('close')  // 关闭弹窗
```

## 🔧 核心方法

### 番茄钟统计方法
- `calculatePomodoroStats()` - 计算番茄钟统计数据
- `getTodayFocusMinutes()` - 获取今日专注时长
- `getTodayCompletedPomodoros()` - 获取今日完成数
- `getWeekCompletedPomodoros()` - 获取本周完成数
- `getLast7DaysTrend()` - 获取近7天趋势数据
- `getMaxDailyInWeek()` - 获取一周内最大值
- `getPomodorosByCategory(category)` - 按分类统计
- `getCategoryPercent(category)` - 计算分类百分比

### 数据统计方法
- `initTrendChart()` - 初始化趋势图
- `initCategoryChart()` - 初始化分类饼图
- `initPriorityChart()` - 初始化优先级图
- `initHeatmapChart()` - 初始化热力图
- `calculateEfficiency(days)` - 计算效率指标
- `updateCharts()` - 更新所有图表

## 📊 数据来源

所有数据来自 `useOfflineTaskStore()`：
- `tasks` - 任务列表
- `pomodoroHistory` - 番茄钟历史记录
- `logs` - 任务执行日志

## 🚀 使用方法

### 1. 在TodoView.vue中引入

```vue
<script setup>
import EnhancedPomodoroStats from '@/components/EnhancedPomodoroStats.vue'

const showEnhancedStats = ref(false)
</script>

<template>
  <!-- 触发按钮 -->
  <button @click="showEnhancedStats = true">
    📊 统计中心
  </button>

  <!-- 统计弹窗 -->
  <EnhancedPomodoroStats 
    :visible="showEnhancedStats"
    @close="showEnhancedStats = false"
  />
</template>
```

### 2. 替换原有的两个独立弹窗

删除或替换：
- `showPomodoroStats` → `showEnhancedStats`
- `showDataStats` → `showEnhancedStats`

## 📝 注意事项

1. **依赖项**：需要安装 `echarts` 库
2. **性能优化**：图表只在切换到"数据统计"标签页时才初始化
3. **内存管理**：弹窗关闭时自动销毁所有图表实例
4. **数据实时性**：每次打开弹窗都会重新计算统计数据

## 🔄 与原组件的对比

| 功能 | 原PomodoroStats | 原DataStatsModal | EnhancedPomodoroStats |
|------|----------------|------------------|----------------------|
| 番茄钟统计 | ✅ | ❌ | ✅ |
| 数据统计 | ❌ | ✅ | ✅ |
| 标签页切换 | ❌ | ❌ | ✅ |
| 统一入口 | ❌ | ❌ | ✅ |
| 代码行数 | ~200 | 804 | 1291 |

## ✅ 优势

1. **统一入口**：一个按钮访问所有统计功能
2. **清晰分类**：番茄钟和数据统计分开展示
3. **性能优化**：按需加载图表
4. **用户体验**：标签页切换流畅
5. **代码复用**：整合了两个组件的所有功能

## 🎯 下一步

建议在TodoView.vue中：
1. 删除 `showPomodoroStats` 和 `showDataStats` 变量
2. 新增 `showEnhancedStats` 变量
3. 将右上角的两个按钮合并为一个"📊 统计中心"按钮
4. 引入 `EnhancedPomodoroStats` 组件

---

**创建时间**: 2026-03-04  
**版本**: v1.0.0  
**作者**: Kiro AI Assistant
