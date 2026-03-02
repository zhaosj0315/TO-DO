# 🔙 Android返回手势支持修复 - v0.7.9

**修复日期**: 2026-03-02  
**问题类型**: 功能缺失  
**优先级**: P1（高优先级）

---

## 🐛 问题描述

### **用户反馈**
在Android设备上，从左侧或右侧向中间滑动的返回手势在以下两个页面不生效：
1. **任务预览弹窗**（点击"预览"按钮后）
2. **AI任务拆分弹窗**（点击"🤖 AI拆分"后）

### **预期行为**
- 用户在任何弹窗页面使用Android返回手势时，应该关闭当前弹窗
- 返回手势应该与点击关闭按钮效果一致

### **实际行为**
- 在任务预览弹窗中使用返回手势无效
- 在AI任务拆分弹窗中使用返回手势无效
- 用户只能点击关闭按钮或点击遮罩层关闭

---

## 🔍 问题分析

### **根本原因**
在`TodoView.vue`的Android返回按钮监听器中，缺少以下两个弹窗的处理逻辑：
1. `showTaskInputPreview` - 任务预览弹窗
2. `showTaskSplitter` - AI任务拆分弹窗

### **代码位置**
`src/views/TodoView.vue` 第11136-11350行

### **现有逻辑**
返回按钮监听器已经处理了30+个弹窗，但遗漏了这两个v0.7.9新增的弹窗：
```javascript
App.addListener('backButton', ({ canGoBack }) => {
  // ... 其他弹窗处理
  
  // ❌ 缺少 showTaskInputPreview 的处理
  // ❌ 缺少 showTaskSplitter 的处理
  
  if (showFullscreenDesc.value) {
    showFullscreenDesc.value = false
    return
  }
  // ...
})
```

---

## ✅ 修复方案

### **修复内容**
在返回按钮监听器中添加两个弹窗的处理逻辑：

```javascript
// 在 showFullscreenDesc 之前添加

} else if (showTaskInputPreview.value) {
  console.log('✅ 关闭任务输入预览')
  showTaskInputPreview.value = false
  previewTaskData.value = null
  return
} else if (showTaskSplitter.value) {
  console.log('✅ 关闭AI任务拆分')
  showTaskSplitter.value = false
  taskToSplit.value = null
  return
} else if (showFullscreenDesc.value) {
```

### **修复位置**
`src/views/TodoView.vue` 第11235-11245行（插入位置）

### **修复逻辑**
1. 检查`showTaskInputPreview`是否为true
   - 如果是，关闭预览弹窗并清空预览数据
2. 检查`showTaskSplitter`是否为true
   - 如果是，关闭拆分弹窗并清空待拆分任务

---

## 🎯 修复优先级

### **为什么放在这个位置？**
返回按钮监听器按照弹窗层级优先级处理：
1. **第三层弹窗**（最上层）：密码弹窗、手机号弹窗等
2. **第二层弹窗**（中层）：任务详情、AI问答、个人主页等
3. **第一层弹窗**（底层）：筛选、回收站等

**任务预览和AI拆分属于第三层弹窗**，应该在`showFullscreenDesc`之前处理。

---

## 📊 测试验证

### **测试场景1：任务预览弹窗**
1. 点击首页"➕"按钮
2. 输入任务标题和描述
3. 点击"预览"按钮
4. 使用Android返回手势
5. **预期结果**：预览弹窗关闭，返回全屏编辑页面

### **测试场景2：AI任务拆分弹窗**
1. 在任务预览弹窗中点击"🤖 AI拆分"
2. 选择拆分模板
3. 使用Android返回手势
4. **预期结果**：AI拆分弹窗关闭，返回任务预览弹窗

### **测试场景3：嵌套弹窗**
1. 全屏编辑 → 预览 → AI拆分
2. 连续使用3次返回手势
3. **预期结果**：
   - 第1次：关闭AI拆分，返回预览
   - 第2次：关闭预览，返回全屏编辑
   - 第3次：关闭全屏编辑，返回首页

---

## 🔧 技术细节

### **返回按钮监听器工作原理**
```javascript
App.addListener('backButton', ({ canGoBack }) => {
  // 1. 检查是否有打开的弹窗（按优先级）
  // 2. 如果有，关闭最上层的弹窗并return
  // 3. 如果没有，执行默认返回行为（退出应用）
})
```

### **弹窗关闭的标准模式**
```javascript
if (showXxxModal.value) {
  console.log('✅ 关闭XXX弹窗')
  showXxxModal.value = false
  // 清空相关状态
  xxxData.value = null
  return  // 阻止继续执行
}
```

### **为什么需要清空状态？**
- `previewTaskData.value = null`：防止下次打开预览时显示旧数据
- `taskToSplit.value = null`：防止下次打开拆分时显示旧任务

---

## 📝 修复总结

### **修改文件**
- `src/views/TodoView.vue`：+8行

### **修改内容**
- 添加`showTaskInputPreview`的返回按钮处理
- 添加`showTaskSplitter`的返回按钮处理

### **影响范围**
- Android设备的返回手势行为
- 不影响iOS设备（iOS没有返回手势）
- 不影响其他弹窗的返回逻辑

### **向后兼容性**
- ✅ 完全兼容
- ✅ 不影响现有功能
- ✅ 只是补充缺失的功能

---

## 🎉 修复结果

### **修复前**
- ❌ 任务预览弹窗不支持返回手势
- ❌ AI任务拆分弹窗不支持返回手势
- ❌ 用户体验不一致

### **修复后**
- ✅ 任务预览弹窗支持返回手势
- ✅ AI任务拆分弹窗支持返回手势
- ✅ 用户体验一致

---

## 💡 经验教训

### **问题根源**
新增功能时忘记在返回按钮监听器中添加处理逻辑

### **预防措施**
1. **功能开发检查清单**：
   - [ ] 功能实现
   - [ ] UI设计
   - [ ] 返回按钮支持 ⚠️
   - [ ] 测试验证

2. **代码审查重点**：
   - 检查所有新增的弹窗是否在返回按钮监听器中处理
   - 检查弹窗层级优先级是否正确

3. **自动化测试**：
   - 添加返回手势的自动化测试用例

---

**修复人员**: 开发团队  
**修复日期**: 2026-03-02  
**修复状态**: ✅ 完成  
**测试状态**: ⏳ 待测试
