# 任务类型系统全面审查报告

**日期**: 2026-03-11  
**审查范围**: 任务类型定义、用户体验、逻辑合理性

---

## 📊 当前任务类型（7种）

### 1. 单次任务（4种）
- `today` - 今天（截止：今天 23:59）
- `tomorrow` - 明天（截止：明天 23:59）
- `this_week` - 本周内（截止：本周日 23:59）
- `custom_date` - 指定日期（截止：用户指定）

### 2. 重复任务（3种）
- `daily` - 每天重复（每天 23:59 截止）
- `weekday` - 工作日重复（周一至周五 23:59 截止）
- `weekly` - 每周重复（指定星期几 23:59 截止）

---

## 🔍 问题分析

### ❌ 问题1：缺少"本月内"类型
**现状**:
- ✅ 今天（1天）
- ✅ 明天（1天）
- ✅ 本周内（最多7天）
- ❌ 本月内（缺失）
- ✅ 指定日期（自定义）

**用户痛点**:
- 用户想创建"本月要完成"的任务，只能选择"指定日期"手动选月底
- 不符合用户思维习惯（今天→明天→本周→本月）

**建议**: ⭐ 新增 `this_month` 类型（截止：本月最后一天 23:59）

---

### ❌ 问题2：时间粒度不合理
**现状**:
- 今天（1天）
- 明天（1天）
- 本周内（最多7天）
- **跳跃到指定日期**

**用户痛点**:
- 缺少"3天内"、"一周后"、"两周后"等常用时间段
- 用户需要频繁打开日历选择器

**建议**: 
- 方案A：新增快捷选项（3天内、一周后、两周后）
- 方案B：保持现状（避免选项过多）

**推荐**: 方案B（保持简洁，指定日期已足够灵活）

---

### ❌ 问题3：重复任务缺少"月度重复"
**现状**:
- ✅ 每天重复
- ✅ 工作日重复（周一至周五）
- ✅ 每周重复（指定星期几）
- ❌ 每月重复（缺失）

**用户场景**:
- 每月1号交房租
- 每月15号发工资
- 每月最后一天做总结

**建议**: ⭐ 新增 `monthly` 类型（每月指定日期重复）

---

### ⚠️ 问题4：重复任务时间固定为 23:59
**现状**:
- 所有重复任务默认 23:59 截止
- 用户无法自定义时间

**用户痛点**:
- "每天早上8点晨跑"无法设置
- "每周一下午3点开会"无法设置

**建议**: 
- 方案A：重复任务支持自定义时间
- 方案B：保持 23:59（简化逻辑）

**推荐**: 方案A（提升灵活性）⭐

---

### ⚠️ 问题5：周期选择器体验差
**现状**:
- `weekly` 类型需要弹窗选择星期几
- 用户需要额外点击2次（选择类型→打开弹窗→选择星期）

**建议**: 
- 方案A：内联显示星期选择器（选择 weekly 后自动展开）
- 方案B：保持弹窗（避免界面过长）

**推荐**: 方案A（减少点击次数）⭐

---

### ✅ 问题6：类型命名清晰度
**现状**:
- `today` / `tomorrow` / `this_week` - 清晰 ✅
- `custom_date` - 清晰 ✅
- `daily` / `weekday` / `weekly` - 清晰 ✅

**结论**: 命名合理，无需修改

---

### ⚠️ 问题7：类型排序逻辑
**当前排序**:
1. today
2. tomorrow
3. this_week
4. daily
5. weekday
6. custom_date
7. weekly

**问题**: 单次任务和重复任务混在一起，不够清晰

**建议排序**: ⭐
```
【单次任务】
1. today - 今天
2. tomorrow - 明天
3. this_week - 本周内
4. this_month - 本月内（新增）
5. custom_date - 指定日期

【重复任务】
6. daily - 每天重复
7. weekday - 工作日重复
8. weekly - 每周重复
9. monthly - 每月重复（新增）
```

---

### ❌ 问题8：AddSubtaskModal 功能不完整
**现状**: 只有4种类型（缺少 daily/weekday/weekly）

**影响**: 用户无法创建重复类型的子任务

**建议**: ⭐ 补全所有7种类型（已在修复计划中）

---

## 🎯 优化建议总结

### 🔥 高优先级（强烈建议）

#### 1. 新增"本月内"类型 ⭐⭐⭐
```javascript
{
  value: 'this_month',
  label: '本月内',
  icon: '📅',
  deadline: '本月最后一天 23:59'
}
```

**理由**:
- 符合用户思维习惯（今天→明天→本周→本月）
- 填补时间粒度空白
- 实现简单（计算本月最后一天）

---

#### 2. 新增"每月重复"类型 ⭐⭐⭐
```javascript
{
  value: 'monthly',
  label: '每月重复',
  icon: '📆',
  config: '选择每月几号（1-31）'
}
```

**理由**:
- 常见需求（房租、工资、总结）
- 补全重复任务体系
- 与 daily/weekday/weekly 形成完整闭环

---

#### 3. 补全 AddSubtaskModal 类型选项 ⭐⭐⭐
**理由**:
- 保持一致性
- 功能完整性
- 用户体验统一

---

#### 4. 优化类型排序（分组显示）⭐⭐
**理由**:
- 提升可读性
- 减少用户选择负担
- 逻辑更清晰

---

### 💡 中优先级（建议考虑）

#### 5. 重复任务支持自定义时间 ⭐⭐
**当前**: 固定 23:59  
**建议**: 允许用户设置具体时间

**实现**:
```html
<div v-if="isRepeatType(newTaskType)">
  <label>重复时间</label>
  <input type="time" v-model="repeatTime" />
</div>
```

---

#### 6. 周期选择器内联显示 ⭐
**当前**: 弹窗选择  
**建议**: 选择 weekly 后自动展开星期选择器

**实现**:
```html
<div v-if="newTaskType === 'weekly'" class="inline-weekday-selector">
  <label v-for="day in weekdays" :key="day.value">
    <input type="checkbox" :value="day.value" v-model="selectedWeekdays">
    {{ day.label }}
  </label>
</div>
```

---

### 🔧 低优先级（可选）

#### 7. 新增快捷时间选项
- 3天内
- 一周后
- 两周后

**不推荐理由**: 
- 选项过多会增加用户选择负担
- "指定日期"已足够灵活

---

## 📋 完整优化后的任务类型体系

### 单次任务（5种）
1. `today` - 📅 今天（截止：今天 23:59）
2. `tomorrow` - 📆 明天（截止：明天 23:59）
3. `this_week` - 📋 本周内（截止：本周日 23:59）
4. `this_month` - 📅 本月内（截止：本月最后一天 23:59）⭐ 新增
5. `custom_date` - 🗓️ 指定日期（截止：用户指定）

### 重复任务（4种）
6. `daily` - 🔄 每天重复（每天 [时间] 截止）
7. `weekday` - 💼 工作日重复（周一至周五 [时间] 截止）
8. `weekly` - 📆 每周重复（指定星期几 [时间] 截止）
9. `monthly` - 📆 每月重复（每月指定日期 [时间] 截止）⭐ 新增

**总计**: 9种类型（当前7种 + 新增2种）

---

## 🎨 UI 优化建议

### 1. 分组下拉框
```html
<select v-model="newTaskType">
  <optgroup label="📅 单次任务">
    <option value="today">今天</option>
    <option value="tomorrow">明天</option>
    <option value="this_week">本周内</option>
    <option value="this_month">本月内</option>
    <option value="custom_date">指定日期</option>
  </optgroup>
  <optgroup label="🔄 重复任务">
    <option value="daily">每天重复</option>
    <option value="weekday">工作日重复</option>
    <option value="weekly">每周重复</option>
    <option value="monthly">每月重复</option>
  </optgroup>
</select>
```

### 2. 动态配置区域
```html
<!-- 指定日期 -->
<div v-if="newTaskType === 'custom_date'">
  <CalendarPicker />
</div>

<!-- 每周重复 -->
<div v-if="newTaskType === 'weekly'">
  <WeekdaySelector v-model="selectedWeekdays" />
</div>

<!-- 每月重复 -->
<div v-if="newTaskType === 'monthly'">
  <input type="number" min="1" max="31" v-model="monthDay" placeholder="每月几号" />
</div>

<!-- 重复任务时间 -->
<div v-if="isRepeatType(newTaskType)">
  <input type="time" v-model="repeatTime" />
</div>
```

---

## 🚀 实施计划

### Phase 1: 修复一致性（立即）⭐⭐⭐
- ✅ 补全 AddSubtaskModal 的类型选项（7种）
- ✅ 添加 weekdays 字段支持

### Phase 2: 新增核心类型（推荐）⭐⭐⭐
- 🆕 新增 `this_month` 类型
- 🆕 新增 `monthly` 类型
- 🔧 优化类型排序（分组显示）

### Phase 3: 增强灵活性（可选）⭐⭐
- 🔧 重复任务支持自定义时间
- 🔧 周期选择器内联显示

### Phase 4: UI 优化（可选）⭐
- 🎨 下拉框分组显示
- 🎨 动态配置区域优化

---

## 📊 用户体验对比

### 优化前
```
用户想创建"本月要完成的报告"：
1. 选择"指定日期"
2. 打开日历选择器
3. 翻到月底
4. 选择日期
5. 确认
总计：5步操作
```

### 优化后
```
用户想创建"本月要完成的报告"：
1. 选择"本月内"
总计：1步操作
```

**效率提升**: 80% ⭐

---

## ✅ 验收标准

### Phase 1（一致性修复）
1. ✅ AddSubtaskModal 包含所有7种类型
2. ✅ weekly 类型支持周期选择
3. ✅ 与其他页面保持一致

### Phase 2（新增类型）
1. ✅ this_month 类型正确计算截止时间
2. ✅ monthly 类型支持选择每月几号
3. ✅ 类型排序分组清晰

### Phase 3（增强灵活性）
1. ✅ 重复任务可设置自定义时间
2. ✅ 周期选择器内联显示

---

## 🎯 最终建议

### 立即执行（Phase 1）⭐⭐⭐
- 修复 AddSubtaskModal 一致性问题

### 强烈推荐（Phase 2）⭐⭐⭐
- 新增 `this_month` 和 `monthly` 类型
- 优化类型排序

### 可选优化（Phase 3-4）⭐⭐
- 重复任务自定义时间
- UI 分组显示

---

## 📚 相关文档

- [TASK_TYPE_CONSISTENCY_REPORT.md](TASK_TYPE_CONSISTENCY_REPORT.md) - 类型一致性对比
- [README.md](README.md) - 当前任务类型定义
