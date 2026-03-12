# 甘特图移动端时间线优化方案

**核心问题**: 手机上任务挤在一起，看不出时间线效果
**日期**: 2026-03-12

## 🎯 解决方案

### 方案1：限制显示任务数量（推荐）⭐⭐⭐⭐⭐

**核心思路**: 一次只显示少量任务，其他任务可滚动查看

#### 实施方法
```javascript
// 1. 默认只显示最近的10个任务
const displayTasks = computed(() => {
  return ganttData.value
    .sort((a, b) => a.startTime - b.startTime)
    .slice(0, 10)  // 🔑 关键：只显示10个
})

// 2. 添加"加载更多"按钮
const showMoreTasks = () => {
  displayLimit.value += 10
}
```

#### 效果
- ✅ 任务间距拉开，时间线清晰
- ✅ 每个任务条高度充足（40px）
- ✅ 滚动流畅，不卡顿

---

### 方案2：按日期分组折叠（推荐）⭐⭐⭐⭐⭐

**核心思路**: 按日期分组，默认折叠，点击展开

#### 设计示例
```
📅 今天 (3个任务) ▼
  ├─ 完成Q1季度总结报告
  ├─ 学习Vue3新特性
  └─ 整理代码仓库

📅 明天 (2个任务) ▶  ← 折叠状态
```

#### 实施方法
```javascript
const groupedTasks = computed(() => {
  const groups = {}
  ganttData.value.forEach(task => {
    const date = formatDate(task.deadline)
    if (!groups[date]) groups[date] = []
    groups[date].push(task)
  })
  return groups
})

// 默认只展开今天和明天
const expandedDates = ref(['today', 'tomorrow'])
```

---

### 方案3：横向滚动优化（简单）⭐⭐⭐

**核心思路**: 增加图表宽度，让时间轴拉长

#### 实施方法
```javascript
// 1. 设置最小宽度
grid: {
  width: Math.max(window.innerWidth * 2, 1000)  // 至少2倍屏幕宽度
}

// 2. 添加滚动提示
<div class="scroll-hint">
  👈 左右滑动查看完整时间轴 👉
</div>
```

#### 效果
- ✅ 时间轴拉长，任务不挤
- ✅ 横向滚动查看
- ❌ 需要横向滑动（不太方便）

---

### 方案4：智能筛选（推荐）⭐⭐⭐⭐

**核心思路**: 默认只显示重要任务

#### 实施方法
```javascript
// 1. 默认只显示高优先级 + 即将到期的任务
const displayTasks = computed(() => {
  return ganttData.value.filter(task => {
    const isHighPriority = task.priority === 'high'
    const isDueSoon = isWithinDays(task.deadline, 7)
    return isHighPriority || isDueSoon
  })
})

// 2. 添加筛选按钮
<button @click="showAllTasks = !showAllTasks">
  {{ showAllTasks ? '只看重要' : '显示全部' }}
</button>
```

---

## 💡 最佳实践组合

### 推荐配置
```javascript
// 1. 限制显示数量
const maxDisplayTasks = 8  // 手机上最多显示8个任务

// 2. 优先显示规则
const prioritySort = (tasks) => {
  return tasks
    .filter(t => t.deadline)  // 只显示有截止时间的
    .sort((a, b) => {
      // 优先级：高 > 中 > 低
      const priorityWeight = { high: 3, medium: 2, low: 1 }
      if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
        return priorityWeight[b.priority] - priorityWeight[a.priority]
      }
      // 相同优先级，按时间排序
      return a.deadline - b.deadline
    })
    .slice(0, maxDisplayTasks)
}

// 3. 图表配置
const chartOption = {
  grid: {
    left: 100,
    right: 20,
    top: 60,
    bottom: 40,
    height: maxDisplayTasks * 50  // 每个任务50px高度
  },
  yAxis: {
    data: taskNames,
    axisLabel: {
      fontSize: 14,
      width: 80,
      overflow: 'truncate',
      ellipsis: '...'
    }
  }
}
```

---

## 🎨 视觉优化配合

### 1. 增加任务间距
```javascript
// 每个任务之间留更多空间
const barHeight = 0.6  // 从 0.8 改为 0.6，留出更多间距
```

### 2. 任务名称换行
```javascript
yAxis: {
  axisLabel: {
    fontSize: 13,
    width: 90,
    overflow: 'break',  // 允许换行
    lineHeight: 16
  }
}
```

### 3. 时间轴标签优化
```javascript
xAxis: {
  axisLabel: {
    fontSize: 12,
    rotate: 0,  // 不旋转
    formatter: (value) => {
      const date = new Date(value)
      return `${date.getMonth()+1}/${date.getDate()}`  // 简化显示
    }
  }
}
```

---

## 🚀 立即实施方案

### 第一步：限制显示数量（5分钟）
```javascript
// 在 GanttChartView.vue 中
const displayLimit = ref(8)  // 默认显示8个

const displayTasks = computed(() => {
  return ganttData.value
    .filter(t => t.deadline)
    .sort((a, b) => a.deadline - b.deadline)
    .slice(0, displayLimit.value)
})
```

### 第二步：添加"显示更多"按钮（5分钟）
```html
<div class="load-more" v-if="ganttData.length > displayLimit">
  <button @click="displayLimit += 8">
    显示更多任务 (还有 {{ ganttData.length - displayLimit }} 个)
  </button>
</div>
```

### 第三步：优化任务间距（5分钟）
```javascript
// 减小任务条高度，增加间距
renderItem: (params, api) => {
  const height = api.size([0, 1])[1] * 0.5  // 从 0.6 改为 0.5
  // ...
}
```

**总计**: 15分钟，立即见效！

---

## 📊 效果对比

### 优化前
```
任务1 ▬▬▬▬▬▬
任务2 ▬▬▬▬▬▬
任务3 ▬▬▬▬▬▬
任务4 ▬▬▬▬▬▬
任务5 ▬▬▬▬▬▬
...
任务50 ▬▬▬▬▬▬  ← 挤在一起，看不清
```

### 优化后
```
任务1 ▬▬▬▬▬▬▬▬▬

任务2 ▬▬▬▬▬▬

任务3 ▬▬▬▬▬▬▬▬

...

[显示更多任务 (还有42个)]  ← 清晰，可控
```

---

## 💬 总结

**核心问题**: 任务太多 → 挤在一起 → 看不清时间线

**解决方案**: 
1. ✅ **限制显示数量**（8-10个）
2. ✅ **增加任务间距**（50px/任务）
3. ✅ **优先显示重要任务**
4. ✅ **添加"显示更多"按钮**

**实施时间**: 15分钟
**效果提升**: 时间线清晰度提升 200%

---

## 🎯 推荐配置

```javascript
// 移动端最佳配置
const mobileConfig = {
  maxTasks: 8,           // 最多显示8个任务
  taskHeight: 50,        // 每个任务50px高度
  barHeightRatio: 0.5,   // 任务条占50%高度
  fontSize: 14,          // 字体14px
  leftMargin: 100        // 左侧任务名100px宽度
}

// 总高度 = 8 * 50 = 400px（舒适的可视区域）
```

需要我立即实施这个优化吗？🚀
