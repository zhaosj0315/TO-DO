# 🔗 拖拽连线功能设计文档

## 📋 功能概述

在任务关系图谱中实现类似 **Obsidian Canvas** 的自由拖拽连线功能，用户可以：
- 鼠标悬浮到节点时显示连接点
- 拖拽连接点创建任务关系
- 拖拽到空白处创建新任务

## 🎯 核心交互流程

### 1️⃣ 悬浮显示连接点
```
鼠标移动到节点圆圈
  ↓
四周出现 4 个小圆点（上下左右）
  ↓
小圆点样式：半透明紫色，悬浮时高亮放大
```

**实现细节**：
- 监听 ECharts 的 `mouseover` 事件
- 计算节点像素坐标
- 在四个方向（上下左右）生成连接点
- 距离节点中心 35px

### 2️⃣ 拖拽连线
```
按住小圆点开始拖拽
  ↓
出现跟随鼠标的虚线（紫色虚线 + 圆点）
  ↓
实时显示连线预览
  ↓
松开鼠标判断落点
```

**两种情况**：
- **落在其他节点上** → 建立两个任务的关系
- **落在空白处** → 创建新任务并建立关系

### 3️⃣ 关系类型选择
```
连线成功后弹出菜单
  ↓
选择关系类型：
  - 📎 引用关系（[[任务名]]）
  - 🔗 依赖关系（waitFor）
  - 👨‍👧 父子关系（parentTask）
  - 💬 日志关联
```

### 4️⃣ 新任务快速创建
```
拖拽到空白处
  ↓
弹出输入框（在松开鼠标的位置）
  ↓
输入任务名称 → Enter 创建
  ↓
自动显示关系类型选择菜单
```

## 🛠️ 技术实现

### 核心状态变量
```javascript
const isDragging = ref(false)              // 是否正在拖拽
const dragStart = ref({ x, y, nodeId })    // 拖拽起点
const dragEnd = ref({ x, y })              // 拖拽终点
const visibleAnchors = ref([])             // 可见的连接点
const hoveredNodeId = ref(null)            // 悬浮的节点ID
const showQuickCreate = ref(false)         // 显示快速创建弹窗
const showRelationMenu = ref(false)        // 显示关系类型菜单
const pendingRelation = ref({})            // 待创建的关系
```

### 核心方法

#### 1. 显示连接点
```javascript
function showAnchorsForNode(nodeId, event) {
  // 获取节点像素坐标
  const nodePixel = chartInstance.convertToPixel('grid', [nodeData.x, nodeData.y])
  
  // 生成四个方向的连接点
  visibleAnchors.value = [
    { nodeId, position: 'top', x: nodePixel[0], y: nodePixel[1] - 35 },
    { nodeId, position: 'right', x: nodePixel[0] + 35, y: nodePixel[1] },
    { nodeId, position: 'bottom', x: nodePixel[0], y: nodePixel[1] + 35 },
    { nodeId, position: 'left', x: nodePixel[0] - 35, y: nodePixel[1] }
  ]
}
```

#### 2. 开始拖拽
```javascript
function startDrag(anchor) {
  isDragging.value = true
  dragStart.value = { x: anchor.x, y: anchor.y, nodeId: anchor.nodeId }
  
  // 添加全局鼠标监听
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}
```

#### 3. 拖拽移动
```javascript
function onDragMove(event) {
  // 更新拖拽终点坐标
  dragEnd.value = { x: event.clientX - rect.left, y: event.clientY - rect.top }
  
  // 检测是否悬浮在其他节点上
  const hoveredNode = detectNodeAtPosition(dragEnd.value.x, dragEnd.value.y)
}
```

#### 4. 结束拖拽
```javascript
function onDragEnd(event) {
  const targetNode = detectNodeAtPosition(endX, endY)
  
  if (targetNode) {
    // 连接到现有节点 → 显示关系类型菜单
    showRelationMenu.value = true
  } else {
    // 创建新任务 → 显示快速创建弹窗
    showQuickCreate.value = true
  }
}
```

#### 5. 创建关系
```javascript
async function createRelation(type) {
  switch (type) {
    case 'link':
      // 引用关系：在源任务描述中添加 [[目标任务名]]
      sourceTask.linkedTasks.push(targetId)
      sourceTask.description += `\n[[${targetTask.text}]]`
      break
      
    case 'dependency':
      // 依赖关系：源任务等待目标任务完成
      sourceTask.waitFor.push(targetId)
      break
      
    case 'subtask':
      // 父子关系：目标任务成为源任务的子任务
      targetTask.parentTaskId = sourceId
      sourceTask.subtasks.push(targetId)
      break
      
    case 'log':
      // 日志关联：在目标任务的日志中添加关联
      targetTask.logs.push({ content: `关联任务：${sourceTask.text}` })
      break
  }
  
  await taskStore.saveTasks()
  updateChart()
}
```

## 🎨 UI 组件

### 1. 拖拽连线层（SVG）
```vue
<svg v-if="isDragging" class="drag-line-layer">
  <line
    :x1="dragStart.x" :y1="dragStart.y"
    :x2="dragEnd.x" :y2="dragEnd.y"
    stroke="#8b5cf6"
    stroke-width="3"
    stroke-dasharray="5,5"
  />
  <circle :cx="dragEnd.x" :cy="dragEnd.y" r="8" fill="#8b5cf6" />
</svg>
```

### 2. 连接点
```vue
<div 
  v-for="anchor in visibleAnchors"
  class="anchor-point"
  :style="{ left: anchor.x + 'px', top: anchor.y + 'px' }"
  @mousedown.stop="startDrag(anchor)"
></div>
```

### 3. 快速创建弹窗
```vue
<div v-if="showQuickCreate" class="quick-create-modal">
  <input
    v-model="quickTaskName"
    placeholder="输入新任务名称..."
    @keyup.enter="createTaskAndLink"
  />
  <button @click="createTaskAndLink">✓ 创建</button>
  <button @click="cancelQuickCreate">✕ 取消</button>
</div>
```

### 4. 关系类型菜单
```vue
<div v-if="showRelationMenu" class="relation-menu">
  <div class="menu-title">选择关系类型</div>
  <button @click="createRelation('link')">
    📎 引用关系 <span class="desc">[[任务名]]</span>
  </button>
  <button @click="createRelation('dependency')">
    🔗 依赖关系 <span class="desc">等待完成</span>
  </button>
  <button @click="createRelation('subtask')">
    👨‍👧 父子关系 <span class="desc">子任务</span>
  </button>
  <button @click="createRelation('log')">
    💬 日志关联 <span class="desc">阻碍-方案</span>
  </button>
</div>
```

## 🎯 使用场景

### 场景 1：连接现有任务
```
1. 鼠标悬浮到"项目A"节点
2. 四周出现连接点
3. 按住右侧连接点拖拽
4. 拖拽到"项目B"节点
5. 松开鼠标
6. 选择"依赖关系"
7. 完成！项目A 等待 项目B 完成
```

### 场景 2：创建新任务
```
1. 鼠标悬浮到"项目A"节点
2. 按住下方连接点拖拽
3. 拖拽到空白处
4. 松开鼠标
5. 输入"子任务1"
6. 按 Enter
7. 选择"父子关系"
8. 完成！创建了项目A的子任务
```

### 场景 3：快速建立引用
```
1. 悬浮到"需求文档"节点
2. 拖拽到"开发任务"节点
3. 选择"引用关系"
4. 完成！开发任务描述中自动添加 [[需求文档]]
```

## ✨ 优势特性

### 1. 直观的可视化操作
- 所见即所得，拖拽即连接
- 无需打开任务详情页
- 实时预览连线效果

### 2. 灵活的关系类型
- 支持 4 种关系类型
- 每种关系有清晰的语义
- 自动更新任务数据结构

### 3. 快速创建新任务
- 拖拽到空白处即可创建
- 自动建立关系
- 减少操作步骤

### 4. 优雅的交互体验
- 悬浮显示连接点（不干扰视图）
- 拖拽时虚线预览
- 弹窗式菜单选择
- 动画过渡流畅

## 🔧 技术亮点

### 1. 坐标转换
```javascript
// ECharts 图表坐标 ↔ 像素坐标
const nodePixel = chartInstance.convertToPixel('grid', [nodeData.x, nodeData.y])
const chartCoord = chartInstance.convertFromPixel('grid', [pixelX, pixelY])
```

### 2. 节点检测
```javascript
function detectNodeAtPosition(x, y) {
  const threshold = 40 // 检测半径
  for (const node of nodes.value) {
    const distance = Math.sqrt((nodePos[0] - x)² + (nodePos[1] - y)²)
    if (distance < threshold) return node
  }
}
```

### 3. 事件委托
```javascript
// 全局监听鼠标移动和松开
document.addEventListener('mousemove', onDragMove)
document.addEventListener('mouseup', onDragEnd)

// 拖拽结束后移除监听
document.removeEventListener('mousemove', onDragMove)
document.removeEventListener('mouseup', onDragEnd)
```

### 4. 防抖优化
```javascript
// 延迟隐藏连接点，避免移动到连接点时消失
chartInstance.on('mouseout', () => {
  setTimeout(hideAnchors, 200)
})
```

## 📊 数据流

```
用户拖拽
  ↓
检测落点（节点 or 空白）
  ↓
显示菜单/输入框
  ↓
选择关系类型
  ↓
更新任务数据
  ├─ linkedTasks[]
  ├─ waitFor[]
  ├─ parentTaskId
  └─ logs[]
  ↓
保存到 Store
  ↓
刷新图谱
```

## 🎨 样式设计

### 连接点
- 尺寸：16x16px
- 颜色：紫色半透明（rgba(139, 92, 246, 0.3)）
- 边框：2px 紫色实线
- 悬浮：放大 1.3 倍 + 紫色光晕

### 拖拽线
- 颜色：紫色（#8b5cf6）
- 宽度：3px
- 样式：虚线（5,5）
- 终点：8px 半透明圆点

### 弹窗
- 背景：白色
- 圆角：12px
- 阴影：0 8px 32px rgba(0,0,0,0.15)
- 动画：popIn（缩放 + 淡入）

## 🚀 未来优化

### 1. 多选连接
- 按住 Shift 选择多个节点
- 批量建立关系

### 2. 连线样式自定义
- 不同关系类型不同颜色
- 可调整连线粗细

### 3. 智能建议
- 根据任务内容推荐关系类型
- 自动检测潜在关联

### 4. 撤销/重做
- 支持 Ctrl+Z 撤销连线
- 历史记录管理

## 📝 测试清单

- [ ] 悬浮显示连接点
- [ ] 拖拽到现有节点建立关系
- [ ] 拖拽到空白处创建新任务
- [ ] 4 种关系类型都能正常创建
- [ ] 取消操作正常工作
- [ ] 连接点位置计算准确
- [ ] 节点检测准确（40px 阈值）
- [ ] 拖拽线实时跟随鼠标
- [ ] 弹窗位置正确
- [ ] 输入框自动聚焦
- [ ] Enter 键创建任务
- [ ] Esc 键取消操作
- [ ] 图谱自动刷新
- [ ] 移动端兼容性

## 🎉 总结

这个功能将任务关系图谱从**只读可视化**升级为**可交互编辑**，用户可以：
- 像画图一样建立任务关系
- 快速创建关联任务
- 直观理解任务网络

**核心价值**：
- 降低操作门槛（拖拽 vs 手动输入）
- 提升效率（1 步 vs 5 步）
- 增强体验（可视化 vs 文本）

这是一个**极简但强大**的功能，完美契合 Obsidian Canvas 的设计理念！
