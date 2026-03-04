# Android 返回手势支持修复报告

## 问题描述

用户反馈：合并统一报告中心后，Android 返回手势（从左右向中间滑动）不再支持以下功能：
1. 统一报告中心（UnifiedReportModal）
2. 报告历史（ReportHistoryModal）
3. 报告类型切换的层层返回逻辑

## 问题原因

1. **TodoView.vue 中缺少监听**：
   - 返回手势监听中没有包含 `showUnifiedReport`
   - 返回手势监听中 `showReportHistoryModal` 的位置不正确（在第三层，应该在第二层）

2. **UnifiedReportModal 内部缺少返回手势支持**：
   - 组件内部没有监听 Android 返回手势
   - 没有实现"层层返回"逻辑（报告内容 → 报告类型选择 → 关闭弹窗）

## 修复方案

### 1. TodoView.vue 修复

在 Android 返回手势监听的**第二层弹窗**中添加：

```javascript
} else if (showUnifiedReport.value) {
  console.log('✅ 关闭统一报告中心')
  showUnifiedReport.value = false
  historyReportData.value = null
} else if (showReportHistoryModal.value) {
  console.log('✅ 关闭报告历史')
  showReportHistoryModal.value = false
}
```

**位置**：在 `showPomodoroTimer` 之后，`showTaskDetail` 之前

### 2. UnifiedReportModal.vue 修复

#### 2.1 导入 Capacitor 模块

```javascript
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
```

#### 2.2 添加返回手势监听

```javascript
// Android 返回手势支持
let backButtonListener = null

onMounted(() => {
  if (Capacitor.getPlatform() === 'android') {
    backButtonListener = App.addListener('backButton', () => {
      if (props.visible) {
        console.log('🔙 UnifiedReportModal 返回手势触发')
        handleBackButton()
      }
    })
  }
})

onUnmounted(() => {
  if (backButtonListener) {
    backButtonListener.remove()
  }
})
```

#### 2.3 实现层层返回逻辑

```javascript
const handleBackButton = () => {
  // 层层返回逻辑
  if (reportGenerated.value) {
    // 如果已生成报告，返回到报告类型选择
    console.log('✅ 返回到报告类型选择')
    reportGenerated.value = false
    visualData.value = null
    textData.value = null
  } else {
    // 如果在报告类型选择页，关闭整个弹窗
    console.log('✅ 关闭统一报告中心')
    emit('close')
  }
}
```

## 返回逻辑层级

### 统一报告中心（UnifiedReportModal）

```
第1层：报告类型选择（日报/周报/月报/季报/半年报/年报/自定义）
  ↓ 选择类型
第2层：报告内容显示（可视化视图 ↔ 文本视图）
  ↓ 返回手势
第1层：报告类型选择
  ↓ 返回手势
关闭弹窗
```

### TodoView 返回手势优先级

```
第三层（最上层）：
- 密码弹窗、手机号弹窗、周期选择、自定义日期
- 番茄钟统计、联系与支持、AI配置、版本更新
- 隐私政策、数据说明、使用指南、番茄钟规则
- 欢迎弹窗、备份提醒、通知引导、报告模板
- 模板详情、模板编辑、自定义报告、周报
- 备份列表、导入预览、更新日志、剪贴板历史
- AI建议卡片、AI预览、模板选择器、子任务建议
- 添加日志、任务预览、子任务预览、任务输入预览
- AI任务拆分、全屏描述编辑

第二层（中层）：
- 教程模式、番茄钟计时器
- **统一报告中心** ← 新增
- **报告历史** ← 新增
- 任务详情、AI问答、个人主页
- 高级筛选、回收站、数据统计
- 今日总结、数据报告、AI结果
- AI建议、AI报告、任务拆分

第一层（底层）：
- 表单状态清空（描述 → 标题 → 属性）
```

## 测试验证

### 测试步骤

1. **统一报告中心基本返回**：
   - 打开统一报告中心
   - 从左右向中间滑动
   - 预期：关闭弹窗

2. **报告内容层层返回**：
   - 打开统一报告中心
   - 选择任意报告类型（如周报）
   - 等待报告生成完成
   - 从左右向中间滑动
   - 预期：返回到报告类型选择页
   - 再次从左右向中间滑动
   - 预期：关闭弹窗

3. **报告历史返回**：
   - 打开统一报告中心
   - 点击"📚 历史"按钮
   - 从左右向中间滑动
   - 预期：关闭报告历史弹窗

### 预期日志

```
🔙 返回手势触发
🔙 UnifiedReportModal 返回手势触发
✅ 返回到报告类型选择
```

或

```
🔙 返回手势触发
✅ 关闭统一报告中心
```

## 修复文件

- ✅ `src/views/TodoView.vue` - 添加 showUnifiedReport 和 showReportHistoryModal 监听
- ✅ `src/components/UnifiedReportModal.vue` - 添加内部返回手势支持和层层返回逻辑

## 构建状态

✅ 构建成功，无错误

## 注意事项

1. **监听器清理**：组件卸载时必须移除监听器，避免内存泄漏
2. **弹窗可见性检查**：只在弹窗可见时处理返回手势
3. **优先级顺序**：确保返回手势按正确的层级顺序处理
4. **状态重置**：返回时需要清理相关状态（如 historyReportData）

## 相关文档

- UI_STANDARDS.md - UI规范文档
- UNIFIED_REPORT_GUIDE.md - 统一报告中心使用指南
