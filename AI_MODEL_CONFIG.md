# AI模型配置中心使用指南

## 📍 功能位置
个人主页（右上角头像）→ AI配置

## 🎯 核心功能
统一管理所有AI模型，一处配置，全局复用。

## 🚀 快速开始

### 1. 打开配置
1. 点击右上角头像
2. 点击"✨ AI配置"

### 2. 添加模型
- **本地Ollama**: 点击"本地Ollama"快速配置
- **OpenAI**: 点击"OpenAI"，填写API Key
- **自定义**: 手动输入模型名称和地址

### 3. 设置默认
点击"设为默认"按钮，该模型将用于所有AI功能

## 📋 模型管理

### 添加本地Ollama
```
类型: 本地Ollama
名称: 本地Gemma 2B
地址: http://192.168.31.159:11434/api/generate
```

### 添加OpenAI
```
类型: OpenAI
名称: GPT-3.5
地址: https://api.openai.com/v1/chat/completions
API Key: sk-your-key-here
```

### 添加Ngrok隧道
```
类型: 自定义
名称: Ngrok隧道
地址: https://xxx.ngrok-free.dev/ollama/api/generate
```

## 🔄 全局复用

配置后，以下功能自动使用默认模型：
- ✅ AI问答（🤖按钮）
- ✅ 任务总结（任务详情页AI摘要）
- ✅ 未来的其他AI功能

## 💡 使用场景

### 场景1：本地开发
配置本地Ollama，速度快且免费

### 场景2：公网访问
配置Ngrok隧道，手机也能用

### 场景3：高质量回答
配置OpenAI，回答质量更高

## ⚙️ 高级功能

### 多模型切换
1. 添加多个模型
2. 在AI问答中切换使用
3. 或更改默认模型

### 编辑模型
点击"编辑"按钮，修改配置后重新添加

### 删除模型
点击"删除"按钮，确认后删除

## 📊 数据存储
所有配置保存在localStorage：
- `ai_models`: 模型列表
- `ai_default_model`: 默认模型ID

## 🔧 技术细节

### 组件
- `AIModelConfig.vue`: 配置界面
- `AIChat.vue`: 使用配置
- `TaskDetailModal.vue`: 使用配置

### 数据格式
```javascript
{
  id: "unique-id",
  type: "local|openai|custom",
  name: "模型名称",
  url: "API地址",
  apiKey: "API密钥（可选）"
}
```

## ❓ 常见问题

**Q: 如何切换模型？**
A: AI问答界面下拉选择，或在配置中设置默认

**Q: 配置会丢失吗？**
A: 不会，保存在浏览器localStorage

**Q: 可以添加多少个模型？**
A: 无限制

**Q: 如何测试模型是否可用？**
A: 在AI问答中发送测试问题

---
版本: v1.7.4  
更新: 2026-02-25
