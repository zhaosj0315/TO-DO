# v0.8.1 版本发布说明

**发布日期**: 2026-03-05  
**版本类型**: Bug修复版本  
**核心改进**: Android返回手势全面修复

---

## 🎯 版本概述

v0.8.1是一个专注于**用户体验优化**的版本，主要解决了Android返回手势在不同设备上的兼容性问题，特别是针对使用**手势导航**的现代Android设备（如一加13）。

---

## 🔙 核心修复：Android返回手势

### 问题背景

在v0.8.0版本中，返回手势存在以下问题：
1. ❌ 在手势导航设备上完全不工作（一加13等）
2. ❌ 部分弹窗缺少返回手势支持
3. ❌ 弹窗层级关系混乱，返回顺序错误
4. ❌ 关键变量未定义导致返回手势崩溃

### 修复内容

#### 1. 修复关键Bug
- **showPomodoroStats变量未定义**
  - 问题：返回手势执行时JavaScript崩溃
  - 修复：添加 `const showPomodoroStats = ref(false)`
  - 影响：这是导致返回手势完全失效的根本原因

#### 2. 补全弹窗支持
新增4个弹窗的返回手势处理：
- `showManualSubtaskModal` - 手动添加子任务
- `showEnhancedStats` - 统计中心
- `showAIMenu` - AI菜单
- `showAITaskPreview` - AI任务预览

#### 3. 修复层级关系
**问题**：统计中心作为个人主页的子弹窗，返回时直接跳到首页
```
错误流程：
统计中心 → 按返回 → 首页 ❌

正确流程：
统计中心 → 按返回 → 个人主页 → 按返回 → 首页 ✅
```

**修复方案**：
```javascript
else if (showProfile.value) {
  // 先检查个人主页内部是否有打开的子弹窗
  if (showEnhancedStats.value) {
    showEnhancedStats.value = false
    return
  }
  // 没有子弹窗，关闭个人主页本身
  showProfile.value = false
}
```

#### 4. 修复监听器冲突
**问题**：UnifiedReportModal组件单独注册了返回监听器，与TodoView冲突
```javascript
// 错误：两个监听器同时触发
// UnifiedReportModal.vue
App.addListener('backButton', () => { ... })

// TodoView.vue
App.addListener('backButton', () => { ... })
```

**修复**：删除UnifiedReportModal的独立监听器，统一由TodoView管理

#### 5. 修复内部状态处理
**问题**：UnifiedReportModal有两层内部状态（选择页/查看页），返回手势无法处理

**修复**：通过defineExpose暴露内部状态
```javascript
// UnifiedReportModal.vue
defineExpose({
  reportGenerated,
  handleBackButton: () => {
    if (reportGenerated.value) {
      // 返回到选择页
      reportGenerated.value = false
      return true
    }
    return false // 应关闭弹窗
  }
})

// TodoView.vue
if (unifiedReportModalRef.value?.handleBackButton) {
  const handled = unifiedReportModalRef.value.handleBackButton()
  if (handled) return
}
```

#### 6. 修复初始化顺序
**问题**：defineExpose在变量定义之前被调用
```javascript
// 错误
defineExpose({ reportGenerated }) // ❌ reportGenerated未定义
const reportGenerated = ref(false)

// 正确
const reportGenerated = ref(false)
defineExpose({ reportGenerated }) // ✅
```

---

## ✅ 完整支持

### 设备兼容性
- ✅ **手势导航**：一加13、小米、OPPO等使用手势导航的设备（左右边缘滑动）
- ✅ **按钮导航**：传统三键导航（返回按钮）
- ✅ **模拟器**：Android模拟器（按钮和手势）

### 弹窗覆盖
**47个弹窗全部支持返回手势**，按正确层级关闭：

#### 第三层弹窗（最上层，30+个）
- 密码弹窗、手机号弹窗、周期选择、自定义日期
- 番茄钟统计、联系与支持、AI配置、版本更新
- 隐私政策、数据说明、使用指南、番茄钟规则
- 欢迎弹窗、备份提醒、通知引导、报告模板
- 报告历史、模板详情、模板编辑、自定义报告
- 周报、备份列表、导入预览、更新日志
- 剪贴板历史、AI建议卡片、AI预览、模板选择器
- 子任务建议、手动添加子任务、添加日志
- 任务预览、子任务预览、任务输入预览
- AI任务拆分、全屏描述编辑、AI菜单、AI任务预览

#### 第二层弹窗（中层，10+个）
- 教程模式、番茄钟计时器、统一报告中心
- 任务详情、AI问答、个人主页
- 高级筛选、回收站、数据统计
- 今日总结、数据报告、AI结果
- AI建议、AI报告、任务拆分

#### 子弹窗处理
- 任务详情 → 添加日志
- 任务详情 → 等待任务选择器
- 个人主页 → 统计中心
- 统一报告中心 → 查看报告 → 选择页

#### 表单状态清空
- 任务描述 → 任务标题 → 表单默认值 → 筛选状态

---

## 📊 返回层级结构

```
特殊状态: AI加载中
  ↓
第三层弹窗（最上层）
  ↓
第二层弹窗（中层）
  ├─ 任务详情
  │   ├─ 添加日志（子弹窗）
  │   └─ 等待任务选择器（子弹窗）
  ├─ 个人主页
  │   └─ 统计中心（子弹窗）
  └─ 统一报告中心
      └─ 查看报告（内部状态）
  ↓
第一层：表单状态清空
  ↓
路由返回或退出应用
```

---

## 🐛 Bug修复列表

1. ✅ 修复showPomodoroStats变量未定义导致返回手势崩溃
2. ✅ 修复返回手势在手势导航设备上不工作的问题
3. ✅ 修复统计中心返回时跳过个人主页直接回到首页的问题
4. ✅ 修复UnifiedReportModal初始化错误（defineExpose在变量定义前）
5. ✅ 修复showReportHistoryModal在第二层的重复判断
6. ✅ 修复UnifiedReportModal的独立监听器导致冲突

---

## 📝 提交记录

```
2f9a55a release: v0.8.1 - Android返回手势全面修复
4361ae8 fix: 修复个人主页子弹窗的返回层级
0d8e5c6 fix: 修复defineExpose初始化顺序错误
e25334b fix: 补全所有弹窗的返回手势支持
e87577e fix: 添加缺失的返回手势处理
8a1bc32 fix: 正确处理UnifiedReportModal的内部返回逻辑
6d9a02e fix: 修复Android返回手势冲突问题
```

---

## 🎯 测试验证

### 测试设备
- ✅ Google Pixel模拟器（按钮导航）
- ✅ 一加13真机（手势导航）

### 测试场景
1. ✅ 打开统一报告中心 → 选择报告 → 查看报告 → 按返回 → 返回选择页 → 再按返回 → 关闭
2. ✅ 打开个人主页 → 打开统计中心 → 按返回 → 返回个人主页 → 再按返回 → 关闭
3. ✅ 打开任务详情 → 添加日志 → 按返回 → 返回任务详情 → 再按返回 → 关闭
4. ✅ 所有47个弹窗的返回手势测试

---

## 📦 升级说明

### 版本号变更
- package.json: `0.7.9` → `0.8.1`
- README.md: 更新版本号和版本历史
- TodoView.vue: 更新页脚版本号和版本历史弹窗

### 兼容性
- ✅ 向下兼容v0.8.0的所有功能
- ✅ 数据结构无变化，无需迁移
- ✅ 用户无感知升级

---

## 🚀 下一步计划

v0.8.1是一个稳定的修复版本，建议所有用户升级。下一个版本（v0.8.2或v0.9.0）将专注于：
- 新功能开发
- 性能优化
- UI/UX改进

---

## 📞 反馈与支持

如果在使用过程中遇到任何问题，请通过以下方式反馈：
- GitHub Issues
- 应用内"联系与支持"
- 邮件反馈

---

**感谢使用 TO-DO App！** 🎉
