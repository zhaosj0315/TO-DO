# AI Prompt 统一配置说明

## 📋 概述

所有AI任务提取服务现在使用统一的Prompt配置（`aiPromptConfig.js`），确保：
- ✅ 时间提取逻辑一致
- ✅ 分类和优先级判断标准统一
- ✅ 任务类型智能推断
- ✅ JSON解析容错处理统一
- ✅ 数据标准化流程一致

## 🎯 统一提取的属性

### 核心属性（所有模式）
- **title** - 任务标题（10-30字）
- **description** - 任务描述（详细说明）
- **priority** - 优先级（high/medium/low）
- **category** - 分类（work/study/life）
- **type** - 任务类型（today/tomorrow/this_week/custom_date/daily/weekday/weekly）

### 时间属性（新增）
- **deadline** - 截止时间（YYYY-MM-DD HH:MM）
- **startTime** - 开始时间（YYYY-MM-DD HH:MM）
- **customDate** - 指定日期（YYYY-MM-DD）
- **customTime** - 指定时间（HH:MM）

## 🔧 4个AI服务模式

### 1. Extract 模式（AITaskExtractor）
**用途**: 从长文本中批量提取多个任务

**触发场景**:
- 任务输入框输入超过20字
- 文本选中菜单点击"提取任务"

**返回格式**: JSON数组
```json
[
  {
    "title": "完成项目报告",
    "description": "整理数据并撰写分析报告",
    "priority": "high",
    "category": "work",
    "type": "custom_date",
    "deadline": "2026-02-28 18:00",
    "startTime": "2026-02-27 09:00",
    "customDate": "2026-02-28",
    "customTime": "18:00"
  }
]
```

### 2. Enhance 模式（AITextEnhancer）
**用途**: 增强OCR识别的文本，提取单个任务的完整信息

**触发场景**:
- 拍照OCR识别后

**返回格式**: JSON对象
```json
{
  "title": "完成项目报告",
  "description": "整理数据并撰写分析报告",
  "priority": "high",
  "category": "work",
  "type": "custom_date",
  "deadline": "2026-02-28 18:00",
  "startTime": "2026-02-27 09:00",
  "customDate": "2026-02-28",
  "customTime": "18:00"
}
```

### 3. Classify 模式（AIClassifier）
**用途**: 智能分类已有任务，补充时间信息

**触发场景**:
- 任务标题输入框失焦时自动触发

**返回格式**: JSON对象
```json
{
  "category": "work",
  "priority": "high",
  "type": "custom_date",
  "deadline": "2026-02-28 18:00",
  "startTime": "2026-02-27 09:00",
  "customDate": "2026-02-28",
  "customTime": "18:00",
  "reason": "工作相关且有明确截止时间"
}
```

### 4. Chat 模式（AIChatService）
**用途**: 从对话中提取待办任务

**触发场景**:
- AI助手对话模式

**返回格式**: JSON数组（同Extract模式）

## 📐 统一规则

### 时间提取规则
```
1. 识别明确的日期时间表达：
   - 绝对时间：2月28日、3月1日、2026-02-28
   - 相对时间：今天、明天、后天、下周一、3天后、一周后
   - 时间点：上午9点、下午3点、15:00、晚上8点

2. 识别截止时间关键词：截止、deadline、due、before、之前

3. 识别开始时间关键词：开始、start、from、明天开始、下周开始

4. 时间格式要求：
   - 完整格式：YYYY-MM-DD HH:MM
   - 只有日期没有时间：默认 23:59
   - 只有时间没有日期：使用今天日期

5. 年份必须是当前年份

6. 如果没有明确时间信息，返回 null

7. 开始时间早于截止时间
```

### 分类规则
```
- work（工作）：工作、会议、报告、项目、客户、合同、邮件、文档、汇报
- study（学习）：学习、考试、作业、课程、阅读、研究、复习、预习、论文
- life（生活）：生活、购物、健身、娱乐、家务、社交、约会、旅行、休闲
```

### 优先级规则
```
- high（高）：紧急重要、有明确deadline且时间紧迫、影响重大、领导要求
- medium（中）：一般任务、可延后1-3天、常规工作
- low（低）：不紧急、可随时处理、琐事、可选任务
```

### 任务类型推断
```
- today：今天截止（deadline是今天）
- tomorrow：明天截止（deadline是明天）
- this_week：本周内截止（deadline在本周内）
- custom_date：指定日期（有明确的deadline）
- daily：每天重复（明确提到"每天"）
- weekday：工作日重复（明确提到"每个工作日"）
- weekly：每周重复（明确提到"每周"）
```

## 🔄 数据标准化流程

所有AI返回的数据都会经过 `normalizeTaskData()` 标准化：

1. **字段验证**: 确保所有必填字段存在且格式正确
2. **长度限制**: title≤50字，description≤500字
3. **枚举验证**: category/priority/type必须是有效值
4. **时间解析**: 将deadline拆分为customDate和customTime
5. **类型推断**: 根据deadline智能推断type
6. **默认值**: 缺失字段使用合理默认值

## 📊 改进效果对比

### 改进前
- ❌ 3个AI服务Prompt逻辑不一致
- ❌ 只提取title、description、priority、category、deadline
- ❌ 缺少开始时间提取
- ❌ 缺少任务类型智能推断
- ❌ 时间字段未拆分为customDate/customTime
- ❌ 每个服务独立实现JSON解析

### 改进后
- ✅ 统一Prompt配置，逻辑一致
- ✅ 提取所有8个核心属性
- ✅ 支持开始时间和截止时间
- ✅ 智能推断任务类型（7种）
- ✅ 自动拆分时间字段
- ✅ 统一JSON解析和容错处理
- ✅ 统一数据标准化流程

## 🧪 测试示例

### 示例1: 拍照OCR
**输入**: "明天下午3点前完成项目报告"

**AI返回**:
```json
{
  "title": "完成项目报告",
  "description": "明天下午3点前完成",
  "priority": "high",
  "category": "work",
  "type": "tomorrow",
  "deadline": "2026-03-01 15:00",
  "customDate": "2026-03-01",
  "customTime": "15:00"
}
```

### 示例2: 长文本提取
**输入**: "下周一开始准备考试，周五前完成复习，周六参加考试"

**AI返回**:
```json
[
  {
    "title": "准备考试",
    "description": "下周一开始准备",
    "priority": "high",
    "category": "study",
    "type": "custom_date",
    "startTime": "2026-03-03 09:00",
    "deadline": "2026-03-07 23:59",
    "customDate": "2026-03-07",
    "customTime": "23:59"
  },
  {
    "title": "参加考试",
    "description": "周六参加考试",
    "priority": "high",
    "category": "study",
    "type": "custom_date",
    "deadline": "2026-03-08 23:59",
    "customDate": "2026-03-08",
    "customTime": "23:59"
  }
]
```

### 示例3: 智能分类
**输入**: 
- 标题: "写周报"
- 描述: "总结本周工作"

**AI返回**:
```json
{
  "category": "work",
  "priority": "medium",
  "type": "this_week",
  "deadline": "2026-03-02 18:00",
  "customDate": "2026-03-02",
  "customTime": "18:00",
  "reason": "工作相关的周报，本周五下班前完成"
}
```

## 🚀 使用方法

### 开发者
```javascript
import { buildTaskExtractionPrompt, parseAIResponse, normalizeTaskData } from './aiPromptConfig'

// 构建Prompt
const prompt = buildTaskExtractionPrompt(text, { 
  mode: 'extract',  // extract | enhance | classify | chat
  maxTasks: 10,
  includeReason: false
})

// 解析AI响应
const data = parseAIResponse(aiResponse, 'array') // 'array' | 'object'

// 标准化数据
const normalized = normalizeTaskData(data[0])
```

### 用户
无需任何操作，所有AI功能自动使用统一配置。

## 📝 维护指南

如需修改AI提取逻辑，只需修改 `aiPromptConfig.js` 中的规则，所有4个AI服务会自动同步更新。

**修改位置**:
- 时间提取规则: `TIME_EXTRACTION_RULES`
- 分类规则: `CATEGORY_RULES`
- 优先级规则: `PRIORITY_RULES`
- 任务类型规则: `TASK_TYPE_RULES`
- 标准化逻辑: `normalizeTaskData()`
