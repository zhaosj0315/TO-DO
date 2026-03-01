# 任务关系显示验证清单

## 验证步骤

### 测试1：AI拆分后的显示 ✅

**操作**：
1. 创建任务"开发新功能"
2. 打开任务详情，点击"AI拆分"
3. 输入拆分数量：5
4. 创建子任务

**验证父任务详情**：
- [ ] 📂 父任务：无
- [ ] 🔗 前置任务：无
- [ ] 🧩 子任务：显示5个子任务
- [ ] 🔗 后续任务：无

**验证子任务详情**（打开任意子任务）：
- [ ] 📂 父任务：显示"开发新功能"
- [ ] 🔗 前置任务：无（父任务不显示）
- [ ] 🧩 子任务：无
- [ ] 🔗 后续任务：无

---

### 测试2：手动添加依赖 ✅

**操作**：
1. 创建任务A："设计数据库"
2. 创建任务B："实现API"
3. 打开任务B详情
4. 点击"➕ 添加前置任务"
5. 选择任务A

**验证任务B详情**：
- [ ] 📂 父任务：无
- [ ] 🔗 前置任务：显示"设计数据库"
- [ ] 🧩 子任务：无
- [ ] 🔗 后续任务：无

**验证任务A详情**：
- [ ] 📂 父任务：无
- [ ] 🔗 前置任务：无
- [ ] 🧩 子任务：无
- [ ] 🔗 后续任务：显示"实现API"

---

### 测试3：复杂组合 ✅

**操作**：
1. 创建任务"需求分析"
2. 创建任务"开发阶段"
3. 为"开发阶段"添加前置任务"需求分析"
4. 对"开发阶段"进行AI拆分（3个子任务）
5. 创建任务"测试阶段"
6. 为"测试阶段"添加前置任务"开发阶段"

**验证"开发阶段"详情**：
- [ ] 📂 父任务：无
- [ ] 🔗 前置任务：显示"需求分析"
- [ ] 🧩 子任务：显示3个子任务
- [ ] 🔗 后续任务：显示"测试阶段"（不包含子任务）

**验证子任务详情**：
- [ ] 📂 父任务：显示"开发阶段"
- [ ] 🔗 前置任务：无（父任务不显示）
- [ ] 🧩 子任务：无
- [ ] 🔗 后续任务：无

**验证"测试阶段"详情**：
- [ ] 📂 父任务：无
- [ ] 🔗 前置任务：显示"开发阶段"
- [ ] 🧩 子任务：无
- [ ] 🔗 后续任务：无

---

## 浏览器控制台验证

```javascript
// 获取 taskStore
const taskStore = window.__VUE_DEVTOOLS_GLOBAL_HOOK__?.apps[0]?.config?.globalProperties?.$pinia?.state?.value?.offlineTaskStore

// 查找测试任务
const parentTask = taskStore.tasks.find(t => t.text === "开发阶段")
const subtask = taskStore.tasks.find(t => t.parentTaskId === parentTask?.id)

// 验证数据结构
console.log('=== 父任务 ===')
console.log('subtasks:', parentTask?.subtasks)
console.log('waitFor:', parentTask?.waitFor)

console.log('\n=== 子任务 ===')
console.log('parentTaskId:', subtask?.parentTaskId)
console.log('waitFor:', subtask?.waitFor)
console.log('waitFor包含父任务ID:', subtask?.waitFor?.includes(parentTask?.id))

// 验证过滤逻辑
console.log('\n=== 过滤验证 ===')
const allWaitFor = taskStore.getWaitForTasks(subtask?.id)
const filteredWaitFor = allWaitFor.filter(t => t.id !== subtask?.parentTaskId)
console.log('子任务的所有waitFor:', allWaitFor.map(t => t.text))
console.log('过滤后的前置任务:', filteredWaitFor.map(t => t.text))
console.log('过滤成功:', filteredWaitFor.length === 0)
```

---

## 预期结果

### 数据层面
- ✅ 子任务的 `waitFor` 包含父任务ID
- ✅ 子任务的 `parentTaskId` 等于父任务ID
- ✅ 父任务的 `subtasks` 包含所有子任务ID

### UI层面
- ✅ 父任务不显示在子任务的"🔗 前置任务"中
- ✅ 子任务不显示在父任务的"🔗 后续任务"中
- ✅ 父任务单独显示在"📂 父任务"区域
- ✅ 子任务单独显示在"🧩 子任务"区域

---

## 全部通过后

任务关系显示功能已完全优化，4种关系清晰分离，无重复显示！✅
