# 标签自动补全优化方案

## 当前实现
- 输入 `#` 后需要继续输入标签名才会触发补全
- 需要匹配已有标签才显示建议

## 优化目标
**输入 `#` 时立即显示常用标签推荐**

## 实现方案

### 1. 触发逻辑优化
```javascript
// 当前：检测到 # 后等待用户继续输入
if (text.includes('#')) {
  const tagMatch = text.match(/#(\w+)$/)
  if (tagMatch) {
    // 显示匹配的标签
  }
}

// 优化后：检测到 # 立即显示推荐
if (text.endsWith('#')) {
  // 立即显示常用标签推荐
  showTopTags()
}
```

### 2. 推荐标签来源
**优先级排序：**
1. **使用频率最高的标签**（Top 10）
2. **最近使用的标签**（Last 5）
3. **预设常用标签**（如果没有历史数据）

**预设标签示例：**
```javascript
const defaultTags = [
  { path: 'work', icon: '💼', count: 0 },
  { path: 'work/urgent', icon: '🔥', count: 0 },
  { path: 'study', icon: '📚', count: 0 },
  { path: 'life', icon: '🏠', count: 0 },
  { path: 'personal', icon: '👤', count: 0 }
]
```

### 3. 统计标签使用频率
```javascript
// 统计所有任务中的标签使用次数
function getTagFrequency() {
  const tagCount = {}
  
  taskStore.tasks.forEach(task => {
    task.tags?.forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1
    })
  })
  
  // 按使用次数排序
  return Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10) // 取前10个
    .map(([path, count]) => ({
      path,
      icon: getTagIcon(path),
      count
    }))
}
```

### 4. UI 展示优化
```
输入 # 后立即显示：

┌─────────────────────────┐
│ 💼 work (15)            │  ← 使用最多
│ 💼 work/urgent (8)      │
│ 📚 study (12)           │
│ 🏠 life (6)             │
│ 👤 personal (3)         │
│ ─────────────────────   │
│ 🆕 创建新标签...        │  ← 底部选项
└─────────────────────────┘
```

### 5. 交互优化
- **方向键**：上下选择标签
- **Enter**：插入选中的标签
- **继续输入**：实时过滤标签列表
- **Esc**：关闭补全菜单

## 实现步骤

1. ✅ 修改触发条件：检测到 `#` 立即显示
2. ✅ 添加标签统计功能
3. ✅ 实现推荐标签排序
4. ✅ 优化 UI 显示（显示使用次数）
5. ✅ 添加"创建新标签"选项

## 预期效果
- 用户输入 `#` 后立即看到推荐
- 减少输入成本，提升效率
- 引导用户使用已有标签，保持标签体系一致性
