# 死代码检测分析报告

**检测时间**: 2026-03-10 07:15  
**检测范围**: src/ 目录下所有 .js 和 .vue 文件

---

## 📊 检测统计

| 指标 | 数值 |
|------|------|
| 扫描文件数 | 82个 |
| 检测函数总数 | 420个 |
| 疑似死代码 | 190个 |
| 误报率（估计） | ~95% |

---

## ⚠️ 重要说明

### **为什么误报率这么高？**

当前检测脚本**无法识别以下调用方式**：

1. **Vue模板调用**（最常见）
   ```vue
   <button @click="handleClick">点击</button>
   <input @blur="onApiKeyBlur" />
   ```

2. **动态调用**
   ```js
   this[methodName]()
   obj[funcName]()
   ```

3. **字符串引用**
   ```js
   emit('update', 'handleUpdate')
   ```

4. **计算属性/侦听器**
   ```js
   computed: {
     value() { return this.getValue() }
   }
   ```

5. **生命周期钩子**
   ```js
   onMounted(() => loadData())
   ```

---

## 🎯 真正的死代码判断标准

### **100%确定是死代码的条件**：
1. ✅ 函数定义存在
2. ✅ 0次JS代码引用
3. ✅ 0次Vue模板引用（`@click`、`v-on:`等）
4. ✅ 不是生命周期钩子
5. ✅ 不是暴露给父组件的方法（`defineExpose`）
6. ✅ 不是事件处理器（`emit`相关）

---

## 🔍 手动审查建议

### **优先审查的文件**（可能有真死代码）

#### 1. 工具函数文件
```
src/utils/userLocalStorage.js - 5个未使用函数
  - getUserLocalStorage
  - setUserLocalStorage
  - removeUserLocalStorage
  - getUserLocalStorageSync
  - setUserLocalStorageSync
```

**判断方法**：
- 这些是纯工具函数，不在Vue模板中调用
- 如果JS代码中0引用，很可能是真死代码

#### 2. 服务文件
```
src/services/notificationService.js - 2个未使用函数
  - hideNotification
  - showConfirm
```

**判断方法**：
- 服务函数通常被其他JS文件导入使用
- 需要检查是否有 `import { hideNotification } from ...`

#### 3. Composables
```
src/composables/useTextSelection.js - 4个未使用函数
  - handleMouseUp
  - handleClickOutside
  - closeMenu
  - replaceSelectedText
```

**判断方法**：
- Composable返回的函数可能在模板中使用
- 需要检查返回对象中是否包含这些函数

---

## 🚀 改进方案

### **方案1：增强检测脚本**
- 解析Vue模板中的事件绑定（`@click`、`v-on:`）
- 解析`defineExpose`暴露的方法
- 解析`emit`事件名称

### **方案2：手动审查**
- 只审查工具函数和服务函数
- Vue组件方法暂不处理（误报太多）

### **方案3：使用专业工具**
- ESLint插件：`eslint-plugin-vue`
- 静态分析工具：`ts-prune`（需TypeScript）
- IDE功能：WebStorm的"Find Usages"

---

## 📋 建议行动

### **立即执行**（低风险）
1. 审查 `src/utils/userLocalStorage.js`
2. 审查 `src/services/notificationService.js`
3. 审查 `src/composables/useTextSelection.js`

### **暂缓执行**（高风险）
- Vue组件中的方法（190个中的~180个）
- 需要改进检测脚本后再处理

---

## 🎯 下一步选择

**选项A**：手动审查3个工具文件（预计10分钟）  
**选项B**：改进检测脚本支持Vue模板解析（预计30分钟）  
**选项C**：暂停死代码清理，标记为"需要专业工具"

**建议**：选择A，快速处理明确的死代码
