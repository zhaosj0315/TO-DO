# TO-DO App UI 规范

## 🎨 统一UI规范（强制执行）

### 1. 弹窗通知规范

**规则**：所有弹窗通知必须使用 Bottom Sheet 样式

#### ✅ 正确做法
```javascript
import { showSuccess, showError, showConfirm } from '@/services/notificationService'

// 成功提示
showSuccess('操作成功', '详细信息')

// 错误提示
showError('操作失败', '错误详情')

// 确认对话框
const confirmed = await showConfirm('确定删除吗？', '此操作不可恢复')
```

#### ❌ 禁止做法
```javascript
// 禁止使用原生 alert
alert('操作成功')

// 禁止使用原生 confirm
if (confirm('确定删除吗？')) { }
```

#### 样式特征
- 底部滑出动画（slideUp 0.3s）
- 左右全屏（width: 100%）
- 紫色渐变头部（#667eea → #764ba2）
- 顶部小横条（40px × 4px）
- 圆角顶部（20px 20px 0 0）

---

### 2. 加载动画规范

**规则**：所有超过1秒的异步操作必须显示加载动画

#### ✅ 正确做法
```javascript
import LoadingSpinner from '@/components/LoadingSpinner.vue'

// 在模板中
<LoadingSpinner
  :visible="loading"
  text="正在加载..."
  subText="请稍候"
/>

// 在脚本中
const loading = ref(false)

async function fetchData() {
  loading.value = true
  try {
    await someAsyncOperation()
  } finally {
    loading.value = false
  }
}
```

#### 样式特征
- 全屏遮罩（rgba(0, 0, 0, 0.5)）
- 居中显示
- 紫色渐变背景
- 旋转动画
- 主文本 + 副文本

---

### 3. Modal 弹窗规范

**规则**：所有 Modal 必须使用 Bottom Sheet 样式

#### 标准结构
```vue
<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="xxx-bottom-sheet">
      <!-- 头部 -->
      <div class="modal-header">
        <button class="back-btn" @click="$emit('close')">
          <span>← 返回</span>
        </button>
        <h3>标题</h3>
        <div style="width: 80px;"></div>
      </div>

      <!-- 内容 -->
      <div class="modal-body">
        <!-- 内容区域 -->
      </div>

      <!-- 底部（可选）-->
      <div class="modal-footer">
        <button class="btn btn-secondary">取消</button>
        <button class="btn btn-primary">确定</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 标准样式 */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 2000;
  animation: fadeIn 0.2s ease-out;
}

.xxx-bottom-sheet {
  width: 100%;
  max-height: 92vh;
  background: white;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

.modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
  position: relative;
}

.modal-header::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}
</style>
```

---

### 4. 按钮规范

#### 主要按钮（Primary）
```css
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
```

#### 次要按钮（Secondary）
```css
.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}
```

#### 危险按钮（Danger）
```css
.btn-danger {
  background: #ef4444;
  color: white;
}
```

---

### 5. 颜色规范

#### 主色调
- 紫色渐变：`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- 主紫色：`#667eea`
- 深紫色：`#764ba2`

#### 状态颜色
- 成功：`#10b981` (绿色)
- 错误：`#ef4444` (红色)
- 警告：`#f59e0b` (橙色)
- 信息：`#3b82f6` (蓝色)

#### 文字颜色
- 主文字：`#1f2937`
- 次文字：`#6b7280`
- 辅助文字：`#9ca3af`

#### 背景颜色
- 主背景：`#ffffff`
- 次背景：`#f9fafb`
- 边框：`#e5e7eb`

---

### 6. 动画规范

#### 淡入动画
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
animation: fadeIn 0.2s ease-out;
```

#### 滑入动画
```css
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

#### 悬停动画
```css
transition: all 0.2s;
&:hover {
  transform: translateY(-2px);
}
```

---

### 7. 间距规范

- 超小：`0.25rem` (4px)
- 小：`0.5rem` (8px)
- 中：`1rem` (16px)
- 大：`1.5rem` (24px)
- 超大：`2rem` (32px)

---

### 8. 圆角规范

- 小圆角：`4px`
- 中圆角：`8px`
- 大圆角：`12px`
- 超大圆角：`20px`
- 圆形：`50%`

---

## 📋 检查清单

### 新增功能时必须检查

- [ ] 是否使用了原生 `alert()`？→ 替换为 `showSuccess/showError/showInfo`
- [ ] 是否使用了原生 `confirm()`？→ 替换为 `showConfirm`
- [ ] 异步操作是否超过1秒？→ 添加 `LoadingSpinner`
- [ ] Modal 是否使用 Bottom Sheet 样式？→ 检查样式是否符合规范
- [ ] 按钮是否使用统一样式？→ 使用 `btn-primary/btn-secondary`
- [ ] 颜色是否符合规范？→ 使用规范中的颜色值
- [ ] 动画是否统一？→ 使用 `fadeIn/slideUp`

---

## 🔧 快速替换工具

### 查找所有 alert
```bash
grep -r "alert(" src/
```

### 查找所有 confirm
```bash
grep -r "confirm(" src/
```

### 批量替换示例
```javascript
// 替换前
alert('操作成功')

// 替换后
showSuccess('操作成功')

// 替换前
if (confirm('确定删除吗？')) {
  deleteItem()
}

// 替换后
const confirmed = await showConfirm('确定删除吗？', '此操作不可恢复')
if (confirmed) {
  deleteItem()
}
```

---

## 🎯 强制执行

**所有新代码必须遵守此规范！**

违反规范的代码将被要求重构。
