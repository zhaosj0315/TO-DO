# 日期选择器优化报告

**日期**: 2026-03-11  
**问题**: Android 上日期选择器显示为滚轮样式，用户体验不佳  
**解决方案**: 创建自定义日历选择器组件

---

## 🔍 问题分析

### 原始实现
```html
<input type="datetime-local" v-model="customDateTime" />
```

### 问题
- ❌ Android 原生控件显示为**滚轮样式**（滑动数字）
- ❌ 不直观，难以快速选择日期
- ❌ 用户体验差，需要多次滑动

### 用户期望
- ✅ **日历样式**：直接点击日期
- ✅ 可视化月份切换
- ✅ 快速选择时间

---

## ✅ 解决方案

### 1. 创建自定义日历组件

**文件**: `src/components/CalendarPicker.vue`

**核心功能**:
- ✅ 日历网格显示（7×6）
- ✅ 月份切换（上一月/下一月）
- ✅ 今天高亮显示
- ✅ 选中日期高亮
- ✅ 禁用过去日期
- ✅ 时间选择器（小时:分钟）
- ✅ 确认/取消按钮

### 2. 日历功能特性

#### 日期显示
```
日 一 二 三 四 五 六
28 29 30 31  1  2  3
 4  5  6  7  8  9 10
11 12 13 14 15 16 17
18 19 20 21 22 23 24
25 26 27 28 29 30 31
```

#### 样式状态
- **其他月份**: 灰色半透明
- **今天**: 橙色渐变背景
- **选中日期**: 紫色渐变背景
- **过去日期**: 禁用（灰色+不可点击）
- **可选日期**: 浅灰背景，悬停变深

#### 时间选择
- **小时**: 00-23（下拉选择）
- **分钟**: 00, 05, 10, ..., 55（5分钟间隔）

---

## 🎨 UI 设计

### 布局结构
```
┌─────────────────────────┐
│  ◀  2026年3月  ▶       │  头部（月份切换）
├─────────────────────────┤
│ 日 一 二 三 四 五 六    │  星期标题
├─────────────────────────┤
│ [日期网格 7×6]          │  日期选择
├─────────────────────────┤
│ 时间：[12]:[30]         │  时间选择
├─────────────────────────┤
│ [取消]  [确定]          │  操作按钮
└─────────────────────────┘
```

### 颜色方案
- **主色**: 紫色渐变 `#667eea → #764ba2`
- **今天**: 橙色渐变 `#fbbf24 → #f59e0b`
- **背景**: 浅灰 `#f9fafb`
- **禁用**: 灰色 `#d1d5db`

---

## 🔧 技术实现

### 组件接口
```vue
<CalendarPicker
  :initial-value="customDateTime"  // 初始值（可选）
  @close="handleClose"             // 关闭事件
  @confirm="handleConfirm"         // 确认事件（返回 YYYY-MM-DDTHH:mm）
/>
```

### 核心算法

#### 1. 生成日历数据
```javascript
const calendarDays = computed(() => {
  // 1. 计算当月第一天是星期几
  const firstDay = new Date(year, month - 1, 1)
  const firstDayWeek = firstDay.getDay()
  
  // 2. 补充上个月的日期
  for (let i = firstDayWeek - 1; i >= 0; i--) {
    days.push({ date: prevLastDay - i, isCurrentMonth: false })
  }
  
  // 3. 添加当月所有日期
  for (let date = 1; date <= lastDay; date++) {
    days.push({ date, isCurrentMonth: true })
  }
  
  // 4. 补充下个月的日期（凑满42天）
  const remainingDays = 42 - days.length
  for (let date = 1; date <= remainingDays; date++) {
    days.push({ date, isCurrentMonth: false })
  }
  
  return days
})
```

#### 2. 禁用过去日期
```javascript
const today = new Date()
today.setHours(0, 0, 0, 0)

const isPast = dayDate < today
```

#### 3. 月份切换
```javascript
const prevMonth = () => {
  if (currentMonth === 1) {
    currentMonth = 12
    currentYear--
  } else {
    currentMonth--
  }
}
```

---

## 📝 修改文件清单

### 1. 新增文件
- ✅ `src/components/CalendarPicker.vue` - 日历选择器组件

### 2. 修改文件
- ✅ `src/views/TodoView.vue`:
  - 导入 `CalendarPicker` 组件
  - 替换原生 `datetime-local` 输入框
  - 修改 `showCustomDateTimePicker()` 函数
  - 新增 `handleCalendarConfirm()` 函数

---

## 🧪 测试清单

### 功能测试
- [ ] 打开日历选择器
- [ ] 切换上一月/下一月
- [ ] 点击选择日期
- [ ] 选择时间（小时:分钟）
- [ ] 点击确定，验证日期时间正确
- [ ] 点击取消，验证不保存

### 边界测试
- [ ] 过去日期不可选
- [ ] 今天日期高亮显示
- [ ] 跨年切换（12月→1月，1月→12月）
- [ ] 初始值正确显示
- [ ] 时间选择器正确工作

### 样式测试
- [ ] 移动端显示正常
- [ ] 日期网格对齐
- [ ] 按钮点击反馈
- [ ] 动画流畅

---

## 📊 优化效果对比

| 项目 | 原生控件 | 自定义日历 |
|------|----------|-----------|
| 显示方式 | 滚轮数字 | 日历网格 |
| 选择速度 | 慢（多次滑动） | 快（直接点击） |
| 可视化 | 差 | 好 |
| 用户体验 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| 跨平台一致性 | 差（各平台不同） | 好（统一样式） |

---

## 🎯 使用场景

### 1. 创建任务时选择日期
```
用户：选择"指定日期"
系统：弹出日历选择器
用户：点击日期 → 选择时间 → 确定
系统：保存日期时间
```

### 2. 编辑任务时修改日期
```
用户：编辑任务 → 修改日期
系统：弹出日历选择器（显示当前日期）
用户：选择新日期 → 确定
系统：更新任务日期
```

---

## 🔄 其他需要优化的地方

### 待优化列表
1. ✅ 创建任务 - 指定日期（已完成）
2. ⚠️ 任务详情 - 修改日期（需要更新）
3. ⚠️ 添加子任务 - 选择日期（需要更新）
4. ⚠️ 子任务预览 - 选择日期（需要更新）
5. ⚠️ 报告中心 - 自定义日期范围（需要更新）

### 统一方案
所有使用 `type="date"` 或 `type="datetime-local"` 的地方都可以替换为 `CalendarPicker` 组件。

---

## ✅ 验收标准

1. ✅ 日历选择器正确显示
2. ✅ 可以切换月份
3. ✅ 可以选择日期和时间
4. ✅ 过去日期不可选
5. ✅ 今天日期高亮
6. ✅ 选中日期高亮
7. ✅ 确认后正确返回日期时间
8. ✅ 取消后不保存
9. ✅ 移动端显示正常
10. ✅ 动画流畅

---

## 📚 相关文档

- [Vue 3 Composition API](https://vuejs.org/guide/introduction.html)
- [日期处理最佳实践](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
