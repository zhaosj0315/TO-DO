# 项目开发管理规范

**制定日期**: 2026-03-03  
**适用范围**: TO-DO App 全体开发人员  
**版本**: v1.0

---

## 📋 目录
1. [代码规范](#代码规范)
2. [Git工作流](#git工作流)
3. [文档规范](#文档规范)
4. [测试规范](#测试规范)
5. [发布流程](#发布流程)
6. [Code Review](#code-review)

---

## 一、代码规范

### 1.1 命名规范

#### 文件命名
```
✅ 组件文件: PascalCase
TaskDetailModal.vue
AIChat.vue
LoadingSpinner.vue

✅ 工具文件: camelCase
excelFormat.js
autoBackup.js
smartTaskParser.js

✅ 测试文件: *.spec.js
offlineTaskStore.spec.js
smartTaskParser.spec.js
```

#### 变量命名
```javascript
// ✅ 常量: UPPER_SNAKE_CASE
const MAX_TASK_LENGTH = 100
const API_BASE_URL = 'https://api.example.com'

// ✅ 变量/函数: camelCase
const currentUser = 'john'
function getUserTasks() {}

// ✅ 类/组件: PascalCase
class TaskManager {}
const TaskDetailModal = {}

// ✅ 私有变量: _前缀
const _internalState = {}

// ✅ 布尔值: is/has/can前缀
const isLoggedIn = true
const hasPermission = false
const canEdit = true
```

#### 函数命名
```javascript
// ✅ 动词开头
function getTask() {}
function setTask() {}
function createTask() {}
function updateTask() {}
function deleteTask() {}
function toggleStatus() {}
function validateInput() {}

// ✅ 事件处理: handle前缀
function handleClick() {}
function handleSubmit() {}
function handleChange() {}

// ✅ 生命周期: on前缀
function onMounted() {}
function onBeforeUnmount() {}
```

### 1.2 代码风格

#### ESLint配置
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'plugin:vue/vue3-recommended',
    'eslint:recommended'
  ],
  rules: {
    'vue/multi-word-component-names': 'off',
    'vue/max-attributes-per-line': ['error', {
      singleline: 3,
      multiline: 1
    }],
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'never'],
    'no-console': 'warn',
    'no-debugger': 'error'
  }
}
```

#### Prettier配置
```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "none",
  "printWidth": 100,
  "arrowParens": "avoid"
}
```

### 1.3 注释规范

#### JSDoc注释
```javascript
/**
 * 创建新任务
 * @param {Object} taskData - 任务数据
 * @param {string} taskData.text - 任务标题
 * @param {string} taskData.type - 任务类型
 * @param {string} taskData.priority - 优先级
 * @returns {Promise<Object>} 创建的任务对象
 * @throws {Error} 当任务数据无效时抛出错误
 * @example
 * const task = await createTask({
 *   text: '完成报告',
 *   type: 'today',
 *   priority: 'high'
 * })
 */
async function createTask(taskData) {
  // 实现
}
```

#### 单行注释
```javascript
// ✅ 良好实践
// 计算任务完成率
const completionRate = (completed / total) * 100

// ❌ 避免
const completionRate = (completed / total) * 100 // 计算完成率（注释在行尾）
```

#### 块注释
```javascript
/*
 * 任务排序算法
 * 1. 置顶任务优先
 * 2. 按优先级排序
 * 3. 按创建时间排序
 */
function sortTasks(tasks) {
  // 实现
}
```

### 1.4 组件规范

#### Vue组件结构
```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup>
// 1. 导入
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '@/stores/taskStore'

// 2. Props定义
const props = defineProps({
  taskId: {
    type: Number,
    required: true
  },
  editable: {
    type: Boolean,
    default: false
  }
})

// 3. Emits定义
const emit = defineEmits(['update', 'delete'])

// 4. 响应式数据
const loading = ref(false)
const task = ref(null)

// 5. 计算属性
const isOverdue = computed(() => {
  // 实现
})

// 6. 方法
function handleUpdate() {
  emit('update', task.value)
}

// 7. 生命周期
onMounted(() => {
  loadTask()
})
</script>

<style scoped>
/* 样式 */
</style>
```

#### 组件大小限制
```
单个组件: <500行（推荐）
最大限制: <1000行（强制）
超过限制: 必须拆分
```

### 1.5 Store规范

```javascript
// stores/taskStore.js
import { defineStore } from 'pinia'

export const useTaskStore = defineStore('task', {
  // 1. State
  state: () => ({
    tasks: [],
    loading: false,
    error: null
  }),

  // 2. Getters
  getters: {
    pendingTasks: (state) => {
      return state.tasks.filter(t => t.status === 'pending')
    },
    
    completionRate: (state) => {
      const total = state.tasks.length
      const completed = state.tasks.filter(t => t.status === 'completed').length
      return total > 0 ? (completed / total) * 100 : 0
    }
  },

  // 3. Actions
  actions: {
    async fetchTasks() {
      this.loading = true
      try {
        const data = await api.getTasks()
        this.tasks = data
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    addTask(task) {
      this.tasks.push(task)
    }
  }
})
```

---

## 二、Git工作流

### 2.1 分支策略（Git Flow）

```
main (生产环境)
  ↑
release/* (发布分支)
  ↑
develop (开发环境)
  ↑
feature/* (功能分支)
hotfix/* (紧急修复)
```

#### 分支命名
```bash
# 功能分支
feature/task-dependency
feature/ai-chat
feature/pomodoro-timer

# 修复分支
fix/task-delete-bug
fix/login-error

# 紧急修复
hotfix/critical-data-loss

# 发布分支
release/v0.8.0
```

### 2.2 提交规范（Conventional Commits）

#### 提交格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type类型
```
feat: 新功能
fix: Bug修复
docs: 文档更新
style: 代码格式（不影响功能）
refactor: 重构
perf: 性能优化
test: 测试相关
chore: 构建/工具链
```

#### 示例
```bash
# 新功能
git commit -m "feat(task): 添加任务依赖功能"

# Bug修复
git commit -m "fix(login): 修复手机号登录失败问题"

# 文档
git commit -m "docs(readme): 更新安装说明"

# 重构
git commit -m "refactor(store): 拆分taskStore为多个模块"

# 破坏性变更
git commit -m "feat(api): 重构API接口

BREAKING CHANGE: API路径从/api/v1改为/api/v2"
```

### 2.3 工作流程

#### 开发新功能
```bash
# 1. 从develop创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/new-feature

# 2. 开发并提交
git add .
git commit -m "feat: 添加新功能"

# 3. 推送到远程
git push origin feature/new-feature

# 4. 创建Pull Request
# 在GitHub上创建PR: feature/new-feature → develop

# 5. Code Review通过后合并
# 6. 删除功能分支
git branch -d feature/new-feature
```

#### 发布流程
```bash
# 1. 从develop创建发布分支
git checkout develop
git checkout -b release/v0.8.0

# 2. 更新版本号
# package.json: "version": "0.8.0"
# README.md: 更新版本号

# 3. 提交版本更新
git commit -m "chore(release): bump version to 0.8.0"

# 4. 合并到main
git checkout main
git merge release/v0.8.0
git tag -a v0.8.0 -m "Release v0.8.0"
git push origin main --tags

# 5. 合并回develop
git checkout develop
git merge release/v0.8.0
git push origin develop

# 6. 删除发布分支
git branch -d release/v0.8.0
```

### 2.4 Commit Message模板

```bash
# .gitmessage
# <type>(<scope>): <subject>
# |<----  最多50字符  ---->|

# <body>
# |<----  每行最多72字符  ---->|

# <footer>
# 关联Issue: #123
# BREAKING CHANGE: 描述破坏性变更

# Type类型:
#   feat:     新功能
#   fix:      Bug修复
#   docs:     文档
#   style:    格式
#   refactor: 重构
#   perf:     性能
#   test:     测试
#   chore:    构建/工具

# 配置模板:
# git config commit.template .gitmessage
```

---

## 三、文档规范

### 3.1 文档结构

```
docs/
├── README.md                    # 项目概述
├── ARCHITECTURE.md              # 架构设计
├── API_REFERENCE.md             # API文档
├── DEVELOPER.md                 # 开发指南
├── USER_MANUAL.md               # 用户手册
├── TESTING_GUIDE.md             # 测试指南
├── CHANGELOG.md                 # 变更日志
├── CONTRIBUTING.md              # 贡献指南
├── features/                    # 功能文档
│   ├── task-dependency.md
│   ├── ai-chat.md
│   └── pomodoro-timer.md
└── guides/                      # 操作指南
    ├── installation.md
    ├── configuration.md
    └── deployment.md
```

### 3.2 文档模板

#### 功能文档模板
```markdown
# 功能名称

## 概述
简要描述功能的目的和价值

## 功能详情
详细说明功能的工作原理

## 使用方法
1. 步骤1
2. 步骤2
3. 步骤3

## 技术实现
- 使用的技术栈
- 关键代码位置
- 数据结构

## 测试用例
- 测试场景1
- 测试场景2

## 已知问题
- 问题1
- 问题2

## 未来计划
- 改进1
- 改进2
```

### 3.3 README规范

```markdown
# 项目名称

简短描述（一句话）

## 特性
- 特性1
- 特性2
- 特性3

## 快速开始
\`\`\`bash
npm install
npm run dev
\`\`\`

## 文档
- [用户手册](docs/USER_MANUAL.md)
- [开发指南](docs/DEVELOPER.md)
- [API文档](docs/API_REFERENCE.md)

## 贡献
查看 [CONTRIBUTING.md](CONTRIBUTING.md)

## 许可证
MIT
```

---

## 四、测试规范

### 4.1 测试分类

```
单元测试 (Unit Tests)
  - 测试单个函数/方法
  - 覆盖率目标: 80%
  - 工具: Vitest

集成测试 (Integration Tests)
  - 测试模块间交互
  - 覆盖率目标: 60%
  - 工具: Vitest

E2E测试 (End-to-End Tests)
  - 测试完整用户流程
  - 覆盖率目标: 主流程100%
  - 工具: Playwright
```

### 4.2 测试命名

```javascript
// ✅ 良好实践
describe('TaskStore', () => {
  describe('addTask', () => {
    it('应该成功添加任务', () => {
      // 测试代码
    })

    it('应该在任务名称为空时抛出错误', () => {
      // 测试代码
    })

    it('应该自动生成任务ID', () => {
      // 测试代码
    })
  })
})
```

### 4.3 测试结构（AAA模式）

```javascript
it('应该正确计算完成率', () => {
  // Arrange（准备）
  const store = useTaskStore()
  store.tasks = [
    { id: 1, status: 'completed' },
    { id: 2, status: 'pending' },
    { id: 3, status: 'completed' }
  ]

  // Act（执行）
  const rate = store.completionRate

  // Assert（断言）
  expect(rate).toBe(66.67)
})
```

### 4.4 测试覆盖率要求

```
核心模块: 80%+
  - stores/
  - services/
  - utils/

业务组件: 60%+
  - components/

页面组件: 40%+
  - views/
```

---

## 五、发布流程

### 5.1 版本号规范（Semantic Versioning）

```
格式: MAJOR.MINOR.PATCH

MAJOR: 不兼容的API变更
MINOR: 向后兼容的功能新增
PATCH: 向后兼容的Bug修复

示例:
v0.7.10 → v0.8.0 (新功能)
v0.8.0 → v0.8.1 (Bug修复)
v0.8.1 → v1.0.0 (重大变更)
```

### 5.2 发布检查清单

```markdown
## 发布前检查

### 代码质量
- [ ] 所有测试通过
- [ ] ESLint无错误
- [ ] 代码已Review
- [ ] 无console.log/debugger

### 文档
- [ ] README更新
- [ ] CHANGELOG更新
- [ ] API文档更新
- [ ] 版本号更新

### 构建
- [ ] 生产环境构建成功
- [ ] APK构建成功
- [ ] Windows安装包构建成功
- [ ] macOS安装包构建成功

### 测试
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] E2E测试通过
- [ ] 手动测试通过

### 发布
- [ ] Git tag创建
- [ ] GitHub Release创建
- [ ] 安装包上传
- [ ] 发布说明编写
```

### 5.3 CHANGELOG格式

```markdown
# Changelog

## [0.8.0] - 2026-03-10

### Added
- 新增任务依赖功能
- 新增AI智能问答
- 新增番茄钟统计

### Changed
- 优化任务列表性能
- 改进UI交互体验

### Fixed
- 修复任务删除bug
- 修复登录失败问题

### Deprecated
- 废弃旧版API接口

### Removed
- 移除无用的依赖包

### Security
- 修复XSS漏洞
```

---

## 六、Code Review

### 6.1 Review检查项

#### 代码质量
```
- [ ] 代码符合规范
- [ ] 命名清晰易懂
- [ ] 注释充分
- [ ] 无重复代码
- [ ] 无魔法数字
- [ ] 错误处理完善
```

#### 功能实现
```
- [ ] 功能符合需求
- [ ] 边界条件处理
- [ ] 性能考虑
- [ ] 安全性考虑
- [ ] 兼容性考虑
```

#### 测试
```
- [ ] 单元测试覆盖
- [ ] 测试用例充分
- [ ] 测试通过
```

### 6.2 Review流程

```
1. 开发者提交PR
   ↓
2. 自动化检查（CI）
   - ESLint
   - 单元测试
   - 构建测试
   ↓
3. Code Review
   - 至少1人Review
   - 提出修改意见
   ↓
4. 修改代码
   ↓
5. 再次Review
   ↓
6. 批准合并
   ↓
7. 合并到目标分支
```

### 6.3 Review评论模板

```markdown
## 优点
- 代码结构清晰
- 测试覆盖充分

## 问题
### P0 (必须修改)
- [ ] 函数过长，需要拆分
- [ ] 缺少错误处理

### P1 (建议修改)
- [ ] 变量命名可以更清晰
- [ ] 可以添加注释

### P2 (可选)
- [ ] 可以考虑性能优化

## 总体评价
LGTM (Looks Good To Me) / 需要修改
```

---

## 七、工具配置

### 7.1 VSCode配置

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "vue"
  ],
  "[vue]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### 7.2 推荐插件

```
必装:
- ESLint
- Prettier
- Volar (Vue3)
- GitLens

推荐:
- Error Lens
- Auto Rename Tag
- Path Intellisense
- Import Cost
```

---

## 八、常见问题

### Q1: 如何处理紧急Bug？
```
1. 从main创建hotfix分支
2. 修复bug并测试
3. 合并到main和develop
4. 发布补丁版本
```

### Q2: 如何回滚版本？
```bash
# 回滚到上一个版本
git revert HEAD

# 回滚到指定版本
git revert <commit-hash>

# 强制回滚（慎用）
git reset --hard <commit-hash>
git push -f origin main
```

### Q3: 如何处理合并冲突？
```bash
# 1. 拉取最新代码
git pull origin develop

# 2. 解决冲突
# 编辑冲突文件

# 3. 标记为已解决
git add .

# 4. 完成合并
git commit
```

---

## 附录

### A. 快捷命令

```bash
# 安装依赖
npm install

# 开发
npm run dev

# 测试
npm test
npm run test:coverage

# 构建
npm run build

# 打包
./build-apk.sh
./build-windows.sh
./build-mac.sh

# 代码检查
npm run lint
npm run lint:fix

# 格式化
npm run format
```

### B. 参考资源

- [Vue3官方文档](https://vuejs.org/)
- [Pinia文档](https://pinia.vuejs.org/)
- [Capacitor文档](https://capacitorjs.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

---

**文档维护**: 每季度更新一次  
**最后更新**: 2026-03-03  
**维护人**: 开发团队
