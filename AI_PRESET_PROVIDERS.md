# AI模型配置 - 预设厂商快速配置指南

## 📋 版本信息
- **版本**: v0.8.3
- **更新日期**: 2026-03-07
- **新功能**: 预设17个主流AI厂商，一键选择+输入API Key即可使用

---

## 🎯 功能亮点

### 旧版流程（繁琐）
1. 选择模型类型（本地/OpenAI/自定义）
2. 手动输入厂商地址（容易出错）
3. 输入API Key
4. 点击获取模型
5. 选择模型

### 新版流程（简化）
1. **选择预设厂商**（下拉菜单）
2. **输入API Key**（如需要）
3. **自动获取模型**
4. **选择模型**

**节省步骤**: 5步 → 4步  
**出错概率**: 大幅降低（地址预设，无需手动输入）

---

## 📦 预设厂商列表（17个）

### 🏠 本地模型（1个）
| 厂商 | 地址 | 需要API Key |
|------|------|-------------|
| Ollama | `http://localhost:11434` | ❌ 不需要 |

### 🌐 OpenAI 官方（1个）
| 厂商 | 地址 | 需要API Key |
|------|------|-------------|
| OpenAI | `https://api.openai.com` | ✅ 需要 |

### 🇨🇳 国内中转站（3个）
| 厂商 | 地址 | 需要API Key |
|------|------|-------------|
| GPTApi.asia | `https://cn.gptapi.asia` | ✅ 需要 |
| API2D | `https://api.api2d.com` | ✅ 需要 |
| CloseAI | `https://api.closeai-proxy.xyz` | ✅ 需要 |

### 🤖 国产大模型（7个）
| 厂商 | 地址 | 需要API Key |
|------|------|-------------|
| 智谱AI (GLM) | `https://open.bigmodel.cn` | ✅ 需要 |
| 月之暗面 (Kimi) | `https://api.moonshot.cn` | ✅ 需要 |
| 百川智能 | `https://api.baichuan-ai.com` | ✅ 需要 |
| MiniMax | `https://api.minimax.chat` | ✅ 需要 |
| DeepSeek | `https://api.deepseek.com` | ✅ 需要 |
| 零一万物 (Yi) | `https://api.lingyiwanwu.com` | ✅ 需要 |
| 阶跃星辰 | `https://api.stepfun.com` | ✅ 需要 |

### ☁️ 云服务商（2个）
| 厂商 | 地址 | 需要API Key |
|------|------|-------------|
| 阿里云 (通义千问) | `https://dashscope.aliyuncs.com` | ✅ 需要 |
| 腾讯云 (混元) | `https://api.hunyuan.cloud.tencent.com` | ✅ 需要 |

### 🔗 开源平台（2个）
| 厂商 | 地址 | 需要API Key |
|------|------|-------------|
| Together AI | `https://api.together.xyz` | ✅ 需要 |
| LongCat | `https://api.longcat.chat/openai` | ✅ 需要 |

### 🔧 自定义（1个）
| 选项 | 说明 |
|------|------|
| 自定义厂商 | 手动输入地址和API Key |

---

## 🚀 使用教程

### 场景1: 使用本地Ollama（最简单）

1. 选择厂商：`🏠 Ollama (本地)`
2. 点击：`🔄 获取可用模型`
3. 选择模型：如 `gemma2:2b`
4. 点击：`➕ 添加模型`

**无需API Key，3步完成！**

---

### 场景2: 使用国内中转站（推荐）

1. 选择厂商：`🇨🇳 GPTApi.asia (国内可用)`
2. 输入API Key：`sk-xxxxx`（失焦自动获取模型）
3. 选择模型：如 `chatgpt-4o-latest`
4. 点击：`🔍 测试连接`（可选）
5. 点击：`➕ 添加模型`

**4-5步完成，地址自动填充！**

---

### 场景3: 使用国产大模型

1. 选择厂商：`🌙 月之暗面 (Kimi)`
2. 输入API Key：`sk-xxxxx`
3. 选择模型：如 `moonshot-v1-8k`
4. 点击：`➕ 添加模型`

**支持7个国产大模型，一键切换！**

---

### 场景4: 使用自定义厂商

1. 选择厂商：`🔧 自定义厂商`
2. 输入地址：`https://api.example.com`
3. 输入API Key：`sk-xxxxx`
4. 点击：`🔄 获取可用模型`
5. 选择模型
6. 点击：`➕ 添加模型`

**兼容任何OpenAI格式的API！**

---

## 💡 智能特性

### 1. 自动获取模型
- **Ollama**: 选择厂商后自动获取（无需API Key）
- **其他厂商**: 输入API Key后失焦自动获取

### 2. 地址自动填充
- 选择预设厂商后，地址自动填充
- 只读显示，避免误修改

### 3. 分组显示
- 按类型分组（本地/官方/中转/国产/云/开源）
- 清晰明了，快速定位

### 4. 智能提示
- 显示是否需要API Key
- 显示厂商地址（只读）
- 实时状态反馈

---

## 🎨 UI优化

### 下拉菜单分组
```
选择厂商
├─ 本地模型
│  └─ 🏠 Ollama (本地)
├─ OpenAI 官方
│  └─ 🌐 OpenAI 官方
├─ 国内中转站
│  ├─ 🇨🇳 GPTApi.asia (国内可用)
│  ├─ 🇨🇳 API2D (国内可用)
│  └─ 🇨🇳 CloseAI (国内可用)
├─ 国产大模型
│  ├─ 🤖 智谱AI (GLM)
│  ├─ 🌙 月之暗面 (Kimi)
│  ├─ 🏔️ 百川智能
│  ├─ 🎯 MiniMax
│  ├─ 🔍 DeepSeek
│  ├─ 🎨 零一万物 (Yi)
│  └─ ⭐ 阶跃星辰
├─ 云服务商
│  ├─ ☁️ 阿里云 (通义千问)
│  └─ ☁️ 腾讯云 (混元)
├─ 开源平台
│  ├─ 🔗 Together AI
│  └─ 🐱 LongCat
└─ 其他
   └─ 🔧 自定义厂商
```

### 地址显示
```
厂商地址: https://cn.gptapi.asia
```
- 灰色背景，紫色文字
- 只读显示，避免误修改

---

## 📊 对比数据

| 指标 | 旧版 | 新版 | 提升 |
|------|------|------|------|
| 预设厂商 | 0个 | 17个 | ∞ |
| 配置步骤 | 5步 | 4步 | 20% |
| 出错概率 | 高 | 低 | 显著降低 |
| 用户体验 | 需要查文档 | 一键选择 | 零学习成本 |

---

## 🔧 开发者备注

### 新增预设厂商
编辑 `PRESET_PROVIDERS` 数组：

```javascript
const PRESET_PROVIDERS = [
  {
    id: 'new-provider',           // 唯一ID
    name: '🎯 新厂商',            // 显示名称
    type: 'openai',               // 类型: local/openai/custom
    url: 'https://api.new.com',   // 基础URL
    needApiKey: true              // 是否需要API Key
  }
]
```

### 分组规则
在模板中使用 `filter()` 过滤：

```vue
<optgroup label="新分组">
  <option v-for="p in PRESET_PROVIDERS.filter(x => x.id === 'new-provider')" 
          :key="p.id" :value="p.id">
    {{ p.name }}
  </option>
</optgroup>
```

---

## 🎉 总结

### 用户体验提升
- ✅ 预设17个主流厂商
- ✅ 一键选择，自动填充地址
- ✅ 智能获取模型列表
- ✅ 分组显示，清晰明了
- ✅ 零学习成本

### 技术优势
- ✅ 地址预设，避免输入错误
- ✅ 自动规范化URL
- ✅ 统一处理逻辑
- ✅ 易于扩展新厂商

### 适用场景
- ✅ 新手用户：快速上手
- ✅ 高级用户：自定义厂商
- ✅ 企业用户：私有部署

---

**最后更新**: 2026-03-07 by Kiro AI Assistant
