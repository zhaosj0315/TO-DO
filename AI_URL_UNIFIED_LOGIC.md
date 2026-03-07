# AI模型配置 - URL统一处理逻辑

## 📋 版本信息
- **版本**: v0.8.3
- **更新日期**: 2026-03-07
- **修复内容**: 统一所有AI功能的URL处理逻辑

---

## 🎯 核心原则

### 统一规则
**所有保存的URL都是基础URL（不带API路径），使用时根据场景动态添加路径**

---

## 🔧 URL处理规范

### 1. 基础URL（保存到数据库）

#### Ollama (本地模型)
```
✅ 正确: http://192.168.31.159:11434
❌ 错误: http://192.168.31.159:11434/api/generate
❌ 错误: http://192.168.31.159:11434/api/tags
```

#### OpenAI 兼容 API
```
✅ 正确: https://cn.gptapi.asia
✅ 正确: https://api.openai.com
❌ 错误: https://cn.gptapi.asia/v1
❌ 错误: https://cn.gptapi.asia/v1/chat/completions
❌ 错误: https://cn.gptapi.asia/v1/models
```

---

### 2. 使用时的完整URL

#### 场景1: 获取模型列表

**Ollama**
```javascript
基础URL: http://192.168.31.159:11434
完整URL: http://192.168.31.159:11434/api/tags
```

**OpenAI**
```javascript
基础URL: https://cn.gptapi.asia
完整URL: https://cn.gptapi.asia/v1/models
```

#### 场景2: 测试连接 / 实际调用

**Ollama**
```javascript
基础URL: http://192.168.31.159:11434
完整URL: http://192.168.31.159:11434/api/generate
```

**OpenAI**
```javascript
基础URL: https://cn.gptapi.asia
完整URL: https://cn.gptapi.asia/v1/chat/completions
```

---

## 🛠️ 工具函数

### normalizeBaseUrl(url, type)
**功能**: 规范化基础URL，移除所有API路径

```javascript
// Ollama 示例
normalizeBaseUrl('http://192.168.31.159:11434/api/generate', 'local')
// 返回: 'http://192.168.31.159:11434'

normalizeBaseUrl('http://192.168.31.159:11434/api/tags', 'local')
// 返回: 'http://192.168.31.159:11434'

// OpenAI 示例
normalizeBaseUrl('https://cn.gptapi.asia/v1/chat/completions', 'openai')
// 返回: 'https://cn.gptapi.asia'

normalizeBaseUrl('https://cn.gptapi.asia/v1/models', 'openai')
// 返回: 'https://cn.gptapi.asia'

normalizeBaseUrl('https://cn.gptapi.asia/v1', 'openai')
// 返回: 'https://cn.gptapi.asia'
```

### getApiUrl(baseUrl, type, endpoint)
**功能**: 根据场景获取完整API URL

```javascript
// Ollama - 获取模型列表
getApiUrl('http://192.168.31.159:11434', 'local', 'models')
// 返回: 'http://192.168.31.159:11434/api/tags'

// Ollama - 调用模型
getApiUrl('http://192.168.31.159:11434', 'local', 'generate')
// 返回: 'http://192.168.31.159:11434/api/generate'

// OpenAI - 获取模型列表
getApiUrl('https://cn.gptapi.asia', 'openai', 'models')
// 返回: 'https://cn.gptapi.asia/v1/models'

// OpenAI - 调用模型
getApiUrl('https://cn.gptapi.asia', 'openai', 'chat')
// 返回: 'https://cn.gptapi.asia/v1/chat/completions'
```

---

## 📦 数据结构

### 厂商配置 (providerConfigs)
```javascript
{
  id: "1709876543210",
  type: "openai",                    // 'local' | 'openai' | 'custom'
  url: "https://cn.gptapi.asia",     // ✅ 基础URL（不带/v1）
  apiKey: "sk-xxx",
  createdAt: "2026-03-07T10:00:00.000Z"
}
```

### 模型配置 (models)
```javascript
{
  id: "1709876543211",
  type: "openai",
  name: "OpenAI - chatgpt-4o-latest",
  url: "https://cn.gptapi.asia",     // ✅ 基础URL（不带/v1）
  apiKey: "sk-xxx",
  modelName: "chatgpt-4o-latest",
  providerId: "1709876543210"
}
```

---

## 🔄 完整流程示例

### 用户输入 → 保存 → 使用

#### 示例1: 用户输入完整URL
```javascript
// 1. 用户输入
用户输入: "https://cn.gptapi.asia/v1/chat/completions"

// 2. 规范化保存
normalizeBaseUrl("https://cn.gptapi.asia/v1/chat/completions", "openai")
保存到数据库: "https://cn.gptapi.asia"

// 3. 获取模型列表
getApiUrl("https://cn.gptapi.asia", "openai", "models")
请求URL: "https://cn.gptapi.asia/v1/models"

// 4. 测试连接
getApiUrl("https://cn.gptapi.asia", "openai", "chat")
请求URL: "https://cn.gptapi.asia/v1/chat/completions"

// 5. 实际调用
getApiUrl("https://cn.gptapi.asia", "openai", "chat")
请求URL: "https://cn.gptapi.asia/v1/chat/completions"
```

#### 示例2: 用户输入基础URL
```javascript
// 1. 用户输入
用户输入: "https://cn.gptapi.asia"

// 2. 规范化保存
normalizeBaseUrl("https://cn.gptapi.asia", "openai")
保存到数据库: "https://cn.gptapi.asia"

// 3-5. 使用流程同上
```

---

## ✅ 修复的文件

### 核心配置文件
- `src/components/AIModelConfig.vue` - 新增工具函数，统一所有URL处理

### AI功能文件
- `src/components/AIChat.vue` - 统一问答功能的URL处理
- `src/components/TaskDetailModal.vue` - 统一任务总结的URL处理
- `src/components/UnifiedReportModal.vue` - 统一报告生成的URL处理

---

## 🎯 测试检查清单

### 1. 添加模型
- [ ] 输入完整URL（带/v1/chat/completions）能正确保存为基础URL
- [ ] 输入基础URL能正常工作
- [ ] 点击"🔄 获取模型"能成功获取模型列表
- [ ] 选择模型后点击"🔍 测试连接"能成功

### 2. 使用模型
- [ ] AI问答功能正常
- [ ] 任务AI总结功能正常
- [ ] 报告生成功能正常
- [ ] 任务AI拆分功能正常

### 3. 边界情况
- [ ] URL末尾有斜杠能正确处理
- [ ] URL包含多个/v1路径能正确处理
- [ ] Ollama和OpenAI两种类型都能正常工作

---

## 🐛 常见问题

### Q1: 为什么要统一URL格式？
**A**: 避免在不同场景下URL处理逻辑不一致，导致：
- 获取模型列表时URL错误
- 测试连接时URL错误
- 实际调用时URL错误

### Q2: 用户输入完整URL会怎样？
**A**: 系统会自动规范化为基础URL保存，使用时再动态添加路径

### Q3: 旧数据会受影响吗？
**A**: 不会。旧数据如果保存的是完整URL，使用时会自动规范化

---

## 📝 开发者注意事项

### 新增AI功能时
1. 从localStorage获取模型配置
2. 使用 `model.url`（这是基础URL）
3. 根据场景调用 `getApiUrl(model.url, model.type, endpoint)`
4. 不要手动拼接URL路径

### 示例代码
```javascript
// ❌ 错误做法
let apiUrl = model.url + '/v1/chat/completions'

// ✅ 正确做法
let baseUrl = model.url.replace(/\/$/, '')
let apiUrl = model.type === 'local'
  ? `${baseUrl}/api/generate`
  : `${baseUrl}/v1/chat/completions`
```

---

## 🎉 总结

通过统一URL处理逻辑，实现了：
1. **一致性**: 所有AI功能使用相同的URL处理规则
2. **可维护性**: 集中管理URL处理逻辑，易于修改
3. **容错性**: 自动处理各种URL格式，用户体验更好
4. **可扩展性**: 新增AI功能时只需复用工具函数

---

**最后更新**: 2026-03-07 by Kiro AI Assistant
