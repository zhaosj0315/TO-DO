# 任务字段命名深度分析

**日期**: 2026-03-11  
**问题**: 如何命名既包含单次任务又包含重复任务的字段？

---

## 🤔 问题分析

### 当前情况
- 单次任务：今天、明天、本周、本月、指定日期
- 重复任务：每天重复、工作日重复、每周重复

### 命名冲突
- ❌ "截止时间" - 只适合单次任务，不适合重复任务
- ❌ "任务类型" - 容易与"分类"混淆
- ❌ "时间类型" - 太技术化

---

## 💡 命名方案对比

### 方案1：时间安排 ⭐⭐⭐⭐⭐
**中文**: 时间安排  
**英文**: Schedule / Time Schedule

**优点**:
- ✅ 既适合单次任务（"今天安排"）
- ✅ 也适合重复任务（"每天安排"）
- ✅ 生活化，用户容易理解
- ✅ 不与"分类"混淆

**示例**:
```
时间安排：今天
时间安排：明天
时间安排：每天重复
时间安排：每周重复
```

---

### 方案2：完成时间 ⭐⭐⭐⭐
**中文**: 完成时间  
**英文**: Due Time / Completion Time

**优点**:
- ✅ 目标导向
- ✅ 适合单次任务
- ⚠️ 重复任务略显勉强（"每天完成"还算合理）

**示例**:
```
完成时间：今天
完成时间：明天
完成时间：每天重复
完成时间：每周重复
```

---

### 方案3：时间设置 ⭐⭐⭐
**中文**: 时间设置  
**英文**: Time Setting

**优点**:
- ✅ 中性，适合所有类型
- ⚠️ 略显技术化

---

### 方案4：周期 ⭐⭐
**中文**: 周期  
**英文**: Period / Cycle

**优点**:
- ✅ 适合重复任务
- ❌ 不适合单次任务（"今天"不是周期）

---

### 方案5：时间规则 ⭐⭐
**中文**: 时间规则  
**英文**: Time Rule

**优点**:
- ✅ 准确
- ❌ 太技术化

---

### 方案6：何时完成 ⭐⭐⭐⭐
**中文**: 何时完成  
**英文**: When to Complete

**优点**:
- ✅ 口语化，自然
- ✅ 适合单次和重复任务
- ✅ 用户容易理解

**示例**:
```
何时完成：今天
何时完成：明天
何时完成：每天重复
何时完成：每周重复
```

---

### 方案7：时间 ⭐⭐⭐
**中文**: 时间  
**英文**: Time

**优点**:
- ✅ 简洁
- ⚠️ 太宽泛，不够明确

---

## 📊 详细对比表

| 方案 | 中文 | 英文 | 单次任务 | 重复任务 | 生活化 | 简洁度 | 推荐度 |
|------|------|------|----------|----------|--------|--------|--------|
| 1 | 时间安排 | Schedule | ✅ | ✅ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 2 | 完成时间 | Due Time | ✅ | ⚠️ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 3 | 时间设置 | Time Setting | ✅ | ✅ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| 4 | 周期 | Period | ❌ | ✅ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| 5 | 时间规则 | Time Rule | ✅ | ✅ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| 6 | 何时完成 | When | ✅ | ✅ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 7 | 时间 | Time | ✅ | ✅ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🎯 推荐方案

### 🥇 第一推荐：时间安排 ⭐⭐⭐⭐⭐

**理由**:
1. ✅ 既适合单次任务，也适合重复任务
2. ✅ 生活化，用户一看就懂
3. ✅ 不与"分类"混淆
4. ✅ 符合用户思维习惯

**UI示例**:
```html
<label>📅 时间安排</label>
<select v-model="taskSchedule">
  <option value="today">今天</option>
  <option value="tomorrow">明天</option>
  <option value="daily">每天重复</option>
  <option value="weekly">每周重复</option>
</select>
```

**变量命名**:
```javascript
// 当前
newTaskType
editType

// 修改后
newTaskSchedule
editSchedule
```

---

### 🥈 第二推荐：何时完成 ⭐⭐⭐⭐

**理由**:
1. ✅ 口语化，自然
2. ✅ 适合单次和重复任务
3. ✅ 目标导向

**UI示例**:
```html
<label>⏰ 何时完成</label>
<select v-model="taskWhen">
  <option value="today">今天</option>
  <option value="tomorrow">明天</option>
  <option value="daily">每天重复</option>
  <option value="weekly">每周重复</option>
</select>
```

---

## 🔍 主流应用参考

### 滴答清单（TickTick）
- 字段名：**截止日期** + **重复**（分开两个字段）

### 微软 To Do
- 字段名：**截止日期** + **重复**（分开两个字段）

### Google Tasks
- 字段名：**日期** + **重复**（分开两个字段）

### Todoist
- 字段名：**截止日期** + **重复**（分开两个字段）

**发现**: 主流应用都是**分开两个字段**！⭐⭐⭐

---

## 💡 终极方案：拆分为两个字段 ⭐⭐⭐⭐⭐

### 方案：分离单次和重复

#### 字段1：截止时间（单次任务）
```html
<label>📅 截止时间</label>
<select v-model="taskDeadline">
  <option value="today">今天</option>
  <option value="tomorrow">明天</option>
  <option value="day_after_tomorrow">后天</option>
  <option value="this_week">本周内</option>
  <option value="next_week">下周</option>
  <option value="this_month">本月内</option>
  <option value="custom_date">指定日期</option>
  <option value="no_deadline">无截止</option>
</select>
```

#### 字段2：重复周期（重复任务）
```html
<label>🔄 重复周期</label>
<select v-model="taskRepeat">
  <option value="none">不重复</option>
  <option value="daily">每天</option>
  <option value="weekday">工作日</option>
  <option value="weekly">每周</option>
  <option value="monthly">每月</option>
</select>
```

**优点**:
- ✅ 逻辑清晰，不混淆
- ✅ 符合主流应用习惯
- ✅ 命名准确，无歧义
- ✅ 扩展性强

**缺点**:
- ⚠️ 需要重构代码（工作量较大）
- ⚠️ 占用更多界面空间

---

## 🎯 最终建议

### 方案A：保持单字段，改名为"时间安排" ⭐⭐⭐⭐⭐
**优点**: 
- ✅ 改动最小（只改label和变量名）
- ✅ 命名合理，适合所有类型
- ✅ 用户容易理解

**实施**:
```javascript
// 1. 修改label
<label>📅 时间安排</label>

// 2. 修改变量名（可选，保持type也行）
newTaskType → newTaskSchedule
editType → editSchedule
```

---

### 方案B：拆分为两个字段 ⭐⭐⭐⭐
**优点**:
- ✅ 逻辑最清晰
- ✅ 符合主流应用
- ✅ 扩展性最强

**缺点**:
- ❌ 工作量大（需要重构）
- ❌ 占用更多空间

---

## 📋 我的建议

### 立即执行：方案A（时间安排）⭐⭐⭐⭐⭐

**理由**:
1. 改动最小（只改label）
2. 命名合理（适合单次+重复）
3. 用户容易理解
4. 不影响现有逻辑

**修改内容**:
```
任务类型 → 时间安排
Task Type → Schedule
newTaskType → newTaskSchedule（可选）
```

### 长期优化：方案B（拆分字段）⭐⭐⭐⭐

**时机**: v0.9.0 大版本重构时考虑

---

## ✅ 结论

**推荐**: **时间安排**（Schedule）⭐⭐⭐⭐⭐

**原因**:
- 既适合单次任务（"今天安排"）
- 也适合重复任务（"每天安排"）
- 生活化，用户容易理解
- 改动最小，风险最低
