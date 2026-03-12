# 安全手动删除指南

## ⚠️ 重要教训

**自动注释脚本失败原因**：
1. 简单的大括号匹配无法处理Vue单文件组件
2. 箭头函数、computed属性结构复杂
3. 可能注释过多或过少，破坏代码结构
4. 导致应用蓝屏，无法启动

**结论**：死代码删除必须手动进行，不能自动化！

---

## ✅ 正确的删除流程

### 第1步：选择最安全的函数（5个）

从 `verified_safe_delete.json` 中选择最简单、最独立的函数：

#### 推荐删除列表（第一批）

1. **formatTimestamp** (AIChat.vue:319)
   - 简单的时间格式化函数
   - 无依赖，纯工具函数

2. **getCurrentUsername** (AIModelConfig.vue:289)
   - 获取用户名的简单函数
   - 无副作用

3. **resizeChart** (EChart.vue:30)
   - 图表大小调整
   - 独立函数

4. **processTable** (AIPreviewModal.vue:110)
   - 表格处理函数
   - 独立逻辑

5. **getUrlPlaceholder** (AIModelConfig.vue:603)
   - 获取占位符
   - 纯函数

---

### 第2步：手动删除单个函数

#### 示例：删除 formatTimestamp

```bash
# 1. 打开文件
code src/components/AIChat.vue

# 2. 跳转到第319行
# 3. 找到函数定义：
const formatTimestamp = (timestamp) => {
  // ... 函数体
}

# 4. 选中整个函数（包括注释）
# 5. 删除
# 6. 保存文件
```

---

### 第3步：立即测试

```bash
# 启动开发服务器
npm run dev

# 测试相关功能
# - 如果是AI相关函数，测试AI功能
# - 如果是图表函数，测试图表显示
# - 如果是工具函数，测试相关页面
```

---

### 第4步：提交Git

```bash
git add src/components/AIChat.vue
git commit -m "refactor: 删除未使用的formatTimestamp函数"
```

---

### 第5步：重复上述步骤

每次删除5-10个函数，测试通过后再继续。

---

## 📋 分批删除计划

### 第1批：纯工具函数（5个）
- [ ] formatTimestamp (AIChat.vue:319)
- [ ] getCurrentUsername (AIModelConfig.vue:289)
- [ ] resizeChart (EChart.vue:30)
- [ ] processTable (AIPreviewModal.vue:110)
- [ ] getUrlPlaceholder (AIModelConfig.vue:603)

### 第2批：配置相关（5个）
- [ ] saveAIConfig (AIAssistButton.vue:40)
- [ ] loadProviderConfig (AIModelConfig.vue:468)
- [ ] selectPresetProvider (AIModelConfig.vue:449)
- [ ] setDefault (AIModelConfig.vue:1088)
- [ ] loadModelsFromStorage (AIChat.vue:185)

### 第3批：AI功能（5个）
- [ ] callAI (AIAssistButton.vue:90)
- [ ] callOllama (AIChat.vue:1652)
- [ ] detectIntent (AIChat.vue:1044)
- [ ] generateSuggestion (AISuggestionCard.vue:67)
- [ ] generateAIInsight (DailySummaryModal.vue:180)

### 第4批：对话历史（5个）
- [ ] loadAllChats (AIChat.vue:340)
- [ ] loadChatHistory (AIChat.vue:528)
- [ ] clearChatHistory (AIChat.vue:550)
- [ ] groupedChats (AIChat.vue:463) - computed
- [ ] formatChatTime (AIChat.vue:450)

---

## 🔍 删除前检查清单

每个函数删除前必须确认：

- [ ] 在 `verified_safe_delete.json` 中确认通过6项检查
- [ ] 手动搜索函数名：`grep -r "functionName" src/`
- [ ] 检查Vue模板：`grep -r "@.*functionName" src/`
- [ ] 查看函数定义，确认是完整的独立函数
- [ ] 确认不是被动态调用的函数

---

## ⚠️ 不要删除的函数

即使在列表中，以下类型也要谨慎：

1. **事件处理器** - handleXxx, onXxx
2. **生命周期钩子** - onMounted, onUnmounted
3. **Composables** - useXxx
4. **导出函数** - export的函数
5. **在模板中使用** - @click等绑定的函数

---

## 📊 预期进度

- **第1周**：删除第1-2批（10个函数）
- **第2周**：删除第3-4批（10个函数）
- **第3周**：删除第5-6批（10个函数）
- **第4周**：删除剩余函数（107个）

**总耗时**：约1个月，每周删除10-30个函数

---

## 🚨 如果出现问题

```bash
# 立即恢复
git checkout src/components/AIChat.vue

# 或回退到上一个commit
git reset --hard HEAD~1
```

---

## 💡 经验教训

1. ✅ **不要使用自动化脚本删除代码**
2. ✅ **必须手动review每个函数**
3. ✅ **一次只删除少量函数**
4. ✅ **每次删除后立即测试**
5. ✅ **使用Git保护每一步**

---

**当前状态**: 已回滚到安全版本  
**下一步**: 手动删除第1批5个函数  
**预计完成**: 2026-04-13
