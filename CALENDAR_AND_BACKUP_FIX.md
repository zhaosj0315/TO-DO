# 日历和备份提醒Bug修复报告

**修复日期**: 2026-03-12  
**版本**: v0.9.1+

## 🐛 问题1：已完成任务无法点击跳转

### 问题描述
在日历视图中，点击已完成的任务无法跳转到任务详情页面，只有待办任务可以跳转。

### 根本原因
`CalendarView.vue` 中已完成任务的 div 元素缺少 `@click` 事件绑定。

```vue
<!-- ❌ 修复前：缺少点击事件 -->
<div v-for="task in completedTasks" :key="task.id" class="task-item completed">
  <span class="task-text">{{ task.text }}</span>
</div>

<!-- ✅ 修复后：添加点击事件 -->
<div
  v-for="task in completedTasks"
  :key="task.id"
  class="task-item completed"
  @click="openTaskDetail(task)"
>
  <span class="task-text">{{ task.text }}</span>
</div>
```

### 修复文件
- `src/components/CalendarView.vue` (5行)

### 测试验证
- ✅ 点击已完成任务 → 打开任务详情
- ✅ 点击待办任务 → 打开任务详情
- ✅ 任务详情正常显示和编辑

---

## 🐛 问题2：数据备份提醒每次刷新都弹出

### 问题描述
每次刷新页面或重新打开应用，数据备份提醒都会弹出，即使用户已经关闭过。

### 根本原因
`showBackupReminder` 使用的是全局 key，没有按用户隔离，导致：
1. 用户A首次登录设置了 `showBackupReminder = 'true'`
2. 用户A关闭提醒后删除了这个 key
3. 用户B首次登录又设置了 `showBackupReminder = 'true'`
4. 用户A再次登录时，读取到用户B设置的值，又弹出提醒

### 修复方案
将 `showBackupReminder` 改为按用户隔离的 key：`showBackupReminder_${username}`

### 修复详情

#### 1. LoginView.vue - 设置提醒标记
```javascript
// ❌ 修复前：全局 key
if (isFirstLogin) {
  await Preferences.set({ key: 'showBackupReminder', value: 'true' })
}

// ✅ 修复后：按用户隔离
if (isFirstLogin) {
  await Preferences.set({ key: `showBackupReminder_${username.value}`, value: 'true' })
}
```

#### 2. TodoView.vue - 读取提醒标记
```javascript
// ❌ 修复前：全局 key
const { value: showReminder } = await Preferences.get({ key: 'showBackupReminder' })
if (showReminder === 'true') {
  await Preferences.remove({ key: 'showBackupReminder' })
  setTimeout(() => {
    showBackupReminder.value = true
  }, 500)
}

// ✅ 修复后：按用户隔离
const { value: showReminder } = await Preferences.get({ key: `showBackupReminder_${userStore.currentUser}` })
if (showReminder === 'true') {
  await Preferences.remove({ key: `showBackupReminder_${userStore.currentUser}` })
  setTimeout(() => {
    showBackupReminder.value = true
  }, 500)
}
```

### 修复文件
- `src/views/LoginView.vue` (1行)
- `src/views/TodoView.vue` (3行)

### 逻辑说明

#### 正确的提醒流程
```
1. 用户首次注册/登录
   ↓
2. 设置 showBackupReminder_用户名 = 'true'
   ↓
3. 进入首页，检测到该标记
   ↓
4. 显示备份提醒弹窗
   ↓
5. 用户关闭弹窗
   ↓
6. 删除 showBackupReminder_用户名 标记
   ↓
7. 下次登录不再弹出（除非满足定期提醒条件）
```

#### 定期提醒条件（不受此bug影响）
- 30天未备份
- 或任务数超过50且7天未备份

### 测试验证
- ✅ 用户A首次登录 → 显示备份提醒
- ✅ 用户A关闭提醒 → 刷新页面不再显示
- ✅ 用户B首次登录 → 显示备份提醒
- ✅ 用户A再次登录 → 不显示备份提醒（已关闭过）
- ✅ 用户B关闭提醒 → 刷新页面不再显示

---

## 📊 代码变更统计

### CalendarView.vue
- **修改行数**: 5 行
- **修改内容**: 添加已完成任务的点击事件

### LoginView.vue
- **修改行数**: 1 行
- **修改内容**: 备份提醒标记改为按用户隔离

### TodoView.vue
- **修改行数**: 3 行
- **修改内容**: 备份提醒读取改为按用户隔离

**总计**: 9 行代码修改

---

## 🎯 影响范围

### 问题1影响
- **影响用户**: 所有使用日历功能的用户
- **影响场景**: 查看已完成任务详情
- **严重程度**: 中等（功能缺失）

### 问题2影响
- **影响用户**: 多用户共用设备的场景
- **影响场景**: 用户切换、刷新页面
- **严重程度**: 高（用户体验差）

---

## ✅ 修复验证

### 问题1验证
```
测试步骤：
1. 打开日历
2. 选择有已完成任务的日期
3. 点击已完成任务
4. 验证是否打开任务详情

预期结果：✅ 成功打开任务详情
```

### 问题2验证
```
测试步骤：
1. 用户A首次登录 → 关闭备份提醒
2. 刷新页面 → 验证不再弹出
3. 用户B首次登录 → 关闭备份提醒
4. 用户A再次登录 → 验证不再弹出
5. 刷新页面 → 验证不再弹出

预期结果：✅ 每个用户只在首次登录时提醒一次
```

---

## 📝 总结

本次修复解决了两个用户体验问题：

1. **日历已完成任务可点击**: 补全了缺失的点击事件，现在所有任务都可以跳转到详情页面
2. **备份提醒按用户隔离**: 修复了多用户场景下的重复提醒问题，每个用户只在首次登录时提醒一次

**核心改进**:
- ✅ 功能完整性（已完成任务可点击）
- ✅ 数据隔离性（按用户存储提醒状态）
- ✅ 用户体验（不再重复提醒）
- ✅ 代码一致性（与其他用户数据保持一致）

**用户价值**:
- 更流畅的日历交互体验
- 更合理的备份提醒逻辑
- 更好的多用户支持
