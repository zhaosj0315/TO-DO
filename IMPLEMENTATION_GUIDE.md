# 项目规范化实施指南

**目标**: 在2周内将项目从7.8/10提升到8.5/10  
**实施日期**: 2026-03-03开始

---

## 📅 实施计划

### Week 1: 代码规范化

#### Day 1-2: 工具配置
```bash
# 1. 安装ESLint和Prettier
npm install -D eslint prettier eslint-plugin-vue @vue/eslint-config-prettier

# 2. 创建配置文件
# .eslintrc.js
# .prettierrc
# .editorconfig

# 3. 配置VSCode
# .vscode/settings.json

# 4. 添加npm scripts
# package.json: "lint", "lint:fix", "format"

# 5. 运行格式化
npm run format
npm run lint:fix
```

#### Day 3-4: 拆分TodoView.vue
```
目标: 20,865行 → 10个组件

拆分方案:
1. TaskList.vue (任务列表)
2. TaskFilters.vue (筛选器)
3. TaskStats.vue (统计卡片)
4. TaskInput.vue (任务输入)
5. TaskCard.vue (任务卡片)
6. TaskActions.vue (操作按钮)
7. TaskSort.vue (排序逻辑)
8. TaskNotifications.vue (通知)
9. TaskModals.vue (弹窗管理)
10. TaskUtils.vue (工具函数)

步骤:
1. 创建新组件文件
2. 移动相关代码
3. 更新import/export
4. 测试功能
5. 删除旧代码
```

#### Day 5: 清理文档
```bash
# 1. 备份现有文档
cp -r docs docs_backup_20260303

# 2. 删除冗余文档
rm -rf docs/drafts/*
rm -rf docs/archive/*

# 3. 保留核心文档（50个）
docs/
├── README.md
├── ARCHITECTURE.md
├── API_REFERENCE.md
├── DEVELOPER.md
├── USER_MANUAL.md
├── TESTING_GUIDE.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── PROJECT_AUDIT_REPORT.md
├── PROJECT_MANAGEMENT_STANDARDS.md
├── features/ (10个核心功能文档)
└── guides/ (5个操作指南)

# 4. 创建文档索引
# DOCS_INDEX.md
```

### Week 2: Git规范化

#### Day 6-7: Git Flow配置
```bash
# 1. 创建分支
git checkout -b develop
git push origin develop

# 2. 设置默认分支
# GitHub: Settings → Branches → Default branch → develop

# 3. 配置分支保护
# GitHub: Settings → Branches → Branch protection rules
# - Require pull request reviews
# - Require status checks to pass
# - Require branches to be up to date

# 4. 配置commit模板
git config commit.template .gitmessage
```

#### Day 8-9: CI/CD优化
```yaml
# .github/workflows/ci-cd.yml 增强

jobs:
  lint:
    - ESLint检查
    - Prettier检查
    - 类型检查
  
  test:
    - 单元测试
    - 覆盖率检查（>60%）
  
  build:
    - 构建检查
    - 包体积检查
  
  deploy:
    - 自动部署（仅main分支）
```

#### Day 10: 文档完善
```markdown
# 创建缺失文档

1. CONTRIBUTING.md
   - 如何贡献代码
   - 开发环境搭建
   - 提交PR流程

2. CODE_OF_CONDUCT.md
   - 行为准则

3. SECURITY.md
   - 安全政策
   - 漏洞报告流程

4. API_REFERENCE.md
   - Store API
   - Service API
   - Utils API
```

---

## 🛠️ 具体操作步骤

### 步骤1: 安装工具

```bash
# 1. 安装依赖
npm install -D \
  eslint \
  prettier \
  eslint-plugin-vue \
  @vue/eslint-config-prettier \
  eslint-config-prettier \
  @commitlint/cli \
  @commitlint/config-conventional \
  husky \
  lint-staged

# 2. 初始化ESLint
npx eslint --init

# 3. 初始化Husky
npx husky-init && npm install
```

### 步骤2: 创建配置文件

#### .eslintrc.js
```javascript
module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true
  },
  extends: [
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'vue/multi-word-component-names': 'off',
    'vue/max-attributes-per-line': ['error', {
      singleline: 3,
      multiline: 1
    }]
  }
}
```

#### .prettierrc
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "none",
  "printWidth": 100,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

#### .editorconfig
```ini
root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

#### commitlint.config.js
```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'revert'
      ]
    ]
  }
}
```

#### .husky/commit-msg
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx --no-install commitlint --edit "$1"
```

#### .husky/pre-commit
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

#### package.json (添加)
```json
{
  "scripts": {
    "lint": "eslint --ext .js,.vue src",
    "lint:fix": "eslint --ext .js,.vue src --fix",
    "format": "prettier --write \"src/**/*.{js,vue,json,css,md}\""
  },
  "lint-staged": {
    "*.{js,vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
```

### 步骤3: 拆分TodoView.vue

#### 创建组件目录结构
```bash
mkdir -p src/components/todo
cd src/components/todo

# 创建组件文件
touch TaskList.vue
touch TaskFilters.vue
touch TaskStats.vue
touch TaskInput.vue
touch TaskCard.vue
```

#### TaskStats.vue (示例)
```vue
<template>
  <div class="task-stats">
    <div class="stat-card" @click="$emit('filter', 'all')">
      <div class="stat-value">{{ stats.total }}</div>
      <div class="stat-label">全部</div>
    </div>
    
    <div class="stat-card" @click="$emit('filter', 'completed')">
      <div class="stat-value">{{ stats.completed }}</div>
      <div class="stat-label">已完成</div>
    </div>
    
    <div class="stat-card" @click="$emit('filter', 'pending')">
      <div class="stat-value">{{ stats.pending }}</div>
      <div class="stat-label">待办</div>
    </div>
    
    <div class="stat-card" @click="$emit('filter', 'overdue')">
      <div class="stat-value">{{ stats.overdue }}</div>
      <div class="stat-label">已逾期</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tasks: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['filter'])

const stats = computed(() => ({
  total: props.tasks.length,
  completed: props.tasks.filter(t => t.status === 'completed').length,
  pending: props.tasks.filter(t => t.status === 'pending').length,
  overdue: props.tasks.filter(t => t.status === 'overdue').length
}))
</script>

<style scoped>
/* 样式 */
</style>
```

#### 更新TodoView.vue
```vue
<template>
  <div class="todo-view">
    <TaskStats :tasks="tasks" @filter="handleFilter" />
    <TaskFilters v-model="filters" />
    <TaskInput @add="handleAddTask" />
    <TaskList :tasks="filteredTasks" @update="handleUpdateTask" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTaskStore } from '@/stores/offlineTaskStore'
import TaskStats from '@/components/todo/TaskStats.vue'
import TaskFilters from '@/components/todo/TaskFilters.vue'
import TaskInput from '@/components/todo/TaskInput.vue'
import TaskList from '@/components/todo/TaskList.vue'

const taskStore = useTaskStore()
const filters = ref({})

const tasks = computed(() => taskStore.tasks)
const filteredTasks = computed(() => {
  // 筛选逻辑
})

function handleFilter(type) {
  // 处理筛选
}

function handleAddTask(task) {
  taskStore.addTask(task)
}

function handleUpdateTask(task) {
  taskStore.updateTask(task)
}
</script>
```

### 步骤4: 清理文档

```bash
# 1. 创建清理脚本
cat > cleanup-docs.sh << 'EOF'
#!/bin/bash

# 备份
cp -r docs docs_backup_$(date +%Y%m%d)

# 删除冗余
rm -rf docs/drafts
rm -rf docs/archive/audits
rm -rf docs/archive/misc

# 保留核心
mkdir -p docs_new/{features,guides}
cp docs/README.md docs_new/
cp docs/features/*.md docs_new/features/ 2>/dev/null || true
cp docs/guides/*.md docs_new/guides/ 2>/dev/null || true

# 替换
rm -rf docs
mv docs_new docs

echo "✅ 文档清理完成"
EOF

chmod +x cleanup-docs.sh
./cleanup-docs.sh
```

### 步骤5: 配置Git Flow

```bash
# 1. 创建develop分支
git checkout -b develop
git push -u origin develop

# 2. 设置Git别名
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status

# 3. 配置commit模板
cat > .gitmessage << 'EOF'
# <type>(<scope>): <subject>

# <body>

# <footer>

# Type: feat, fix, docs, style, refactor, perf, test, chore
EOF

git config commit.template .gitmessage
```

---

## ✅ 验收标准

### Week 1完成标准
- [ ] ESLint配置完成，无错误
- [ ] Prettier配置完成，代码格式统一
- [ ] TodoView.vue拆分为10个组件
- [ ] 文档数量从419个减少到50个
- [ ] 所有测试通过

### Week 2完成标准
- [ ] Git Flow分支策略实施
- [ ] Commit规范强制执行（Husky）
- [ ] CI/CD增强（Lint + Test + Build）
- [ ] 核心文档完善（8个）
- [ ] 代码覆盖率>60%

### 最终验收
- [ ] 项目成熟度: 7.8/10 → 8.5/10
- [ ] 代码质量: 6/10 → 8/10
- [ ] 文档质量: 6/10 → 8/10
- [ ] 工程化: 7/10 → 9/10

---

## 📊 进度追踪

### 每日检查清单
```markdown
## Day X - YYYY-MM-DD

### 今日目标
- [ ] 任务1
- [ ] 任务2
- [ ] 任务3

### 完成情况
- ✅ 任务1 (2小时)
- ✅ 任务2 (3小时)
- ⏳ 任务3 (进行中)

### 遇到的问题
1. 问题描述
   - 解决方案

### 明日计划
- [ ] 任务4
- [ ] 任务5
```

---

## 🆘 常见问题

### Q1: ESLint报错太多怎么办？
```bash
# 1. 先自动修复
npm run lint:fix

# 2. 逐步修复
npm run lint -- --fix-dry-run

# 3. 临时禁用规则
// eslint-disable-next-line rule-name
```

### Q2: 拆分组件后功能异常？
```
1. 检查props传递
2. 检查emit事件
3. 检查import路径
4. 运行测试验证
```

### Q3: Git提交被拒绝？
```bash
# 检查commit message格式
git log -1

# 修改最后一次提交
git commit --amend

# 跳过hooks（不推荐）
git commit --no-verify
```

---

## 📚 参考资源

- [ESLint规则](https://eslint.org/docs/rules/)
- [Prettier配置](https://prettier.io/docs/en/options.html)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Vue3风格指南](https://vuejs.org/style-guide/)

---

**开始日期**: 2026-03-03  
**预计完成**: 2026-03-17  
**负责人**: 开发团队
