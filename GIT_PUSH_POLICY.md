# Git 推送规范 - 非必要不推送原则

**版本**: v1.0  
**生效日期**: 2026-02-25  
**适用范围**: TO-DO App 项目全体开发人员

---

## 📜 核心原则

### "非必要不推送"定义

**推送的必要性判断标准**:
1. ✅ **功能完整性**: 新功能已完整实现并通过测试
2. ✅ **Bug 修复**: 修复了影响用户体验的关键 Bug
3. ✅ **文档同步**: 代码变更后文档已同步更新
4. ✅ **版本里程碑**: 达到版本发布标准（如 v1.7.0）
5. ✅ **紧急修复**: 生产环境严重问题的热修复

**不应推送的情况**:
- ❌ 代码未经测试
- ❌ 功能实现一半
- ❌ 临时调试代码
- ❌ 个人实验性修改
- ❌ 文档未同步更新

---

## 🌳 分支策略

### 主要分支

```
main (生产分支)
  ├── develop (开发分支)
  ├── feature/* (功能分支)
  ├── bugfix/* (Bug 修复分支)
  └── hotfix/* (紧急修复分支)
```

### 分支规则

1. **main 分支**
   - 只接受经过完整测试的代码
   - 每次合并必须打 tag（如 v1.7.0）
   - 需要至少 1 人代码审查

2. **develop 分支**
   - 日常开发的集成分支
   - 功能分支合并到此分支
   - 定期合并到 main

3. **feature 分支**
   - 命名: `feature/功能名称`（如 `feature/task-logs`）
   - 从 develop 分支创建
   - 完成后合并回 develop

4. **bugfix 分支**
   - 命名: `bugfix/问题描述`（如 `bugfix/notification-error`）
   - 从 develop 分支创建
   - 修复后合并回 develop

5. **hotfix 分支**
   - 命名: `hotfix/紧急问题`（如 `hotfix/crash-on-startup`）
   - 从 main 分支创建
   - 修复后同时合并到 main 和 develop

---

## 📝 提交信息规范

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具链相关

### 示例

```bash
# 好的提交信息
feat(task-logs): 添加任务执行日志功能

- 实现 6 种日志类型（开始/进展/阻碍/方案/里程碑/完成）
- 添加日志统计和进度追踪
- 集成到任务详情 Bottom Sheet

Closes #123

# 不好的提交信息
update code
fix bug
修改了一些东西
```

---

## 🔍 推送前检查清单

### 代码质量检查

- [ ] 代码已通过本地测试
- [ ] 没有 console.log 等调试代码
- [ ] 没有注释掉的代码块
- [ ] 代码符合项目风格规范
- [ ] 没有硬编码的敏感信息

### 功能完整性检查

- [ ] 新功能已完整实现
- [ ] 相关 Bug 已修复
- [ ] 边界情况已处理
- [ ] 错误处理已完善

### 文档同步检查

- [ ] README.md 已更新（如有功能变更）
- [ ] CHANGELOG.md 已更新
- [ ] 相关技术文档已更新
- [ ] 注释已添加/更新

### 版本管理检查

- [ ] package.json 版本号已更新（如需要）
- [ ] Git tag 已创建（如发布版本）
- [ ] 发布说明已准备（如发布版本）

---

## 🚀 推送流程

### 1. 功能开发完成

```bash
# 1. 确保在正确的分支
git checkout feature/your-feature

# 2. 提交代码
git add .
git commit -m "feat(scope): 功能描述"

# 3. 推送到远程
git push origin feature/your-feature
```

### 2. 合并到 develop

```bash
# 1. 切换到 develop 分支
git checkout develop

# 2. 拉取最新代码
git pull origin develop

# 3. 合并功能分支
git merge feature/your-feature

# 4. 推送到远程
git push origin develop
```

### 3. 发布版本（合并到 main）

```bash
# 1. 确保 develop 分支已测试通过
git checkout develop
git pull origin develop

# 2. 切换到 main 分支
git checkout main
git pull origin main

# 3. 合并 develop 分支
git merge develop

# 4. 创建版本 tag
git tag -a v1.7.0 -m "Release v1.7.0: 任务执行日志功能"

# 5. 推送代码和 tag
git push origin main
git push origin v1.7.0
```

---

## ⚠️ 特殊情况处理

### 紧急修复（Hotfix）

```bash
# 1. 从 main 创建 hotfix 分支
git checkout main
git checkout -b hotfix/critical-bug

# 2. 修复 Bug
# ... 修改代码 ...

# 3. 提交修复
git commit -m "fix(critical): 修复严重 Bug"

# 4. 合并到 main
git checkout main
git merge hotfix/critical-bug
git tag -a v1.7.1 -m "Hotfix v1.7.1"
git push origin main
git push origin v1.7.1

# 5. 同步到 develop
git checkout develop
git merge hotfix/critical-bug
git push origin develop

# 6. 删除 hotfix 分支
git branch -d hotfix/critical-bug
```

### 回滚错误推送

```bash
# 1. 查看提交历史
git log --oneline

# 2. 回滚到指定提交
git revert <commit-hash>

# 3. 推送回滚
git push origin <branch-name>
```

---

## 📊 推送统计

### 推送频率建议

- **功能开发**: 每完成一个子功能推送一次
- **Bug 修复**: 修复后立即推送
- **文档更新**: 与代码变更一起推送
- **版本发布**: 每个版本里程碑推送一次

### 推送时间建议

- ✅ **推荐**: 工作日白天（便于团队协作）
- ⚠️ **谨慎**: 周五下午（避免周末问题）
- ❌ **避免**: 深夜/凌晨（除非紧急修复）

---

## 🔒 安全规范

### 敏感信息检查

**禁止推送的内容**:
- ❌ API 密钥、Token
- ❌ 数据库密码
- ❌ 私钥文件
- ❌ 用户数据
- ❌ 内部配置文件

**使用 .gitignore**:
```
# 环境变量
.env
.env.local

# 密钥文件
*.key
*.pem

# 配置文件
config/secrets.json

# 用户数据
data/users/
```

---

## 📚 参考资料

- [Git 官方文档](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow 工作流](https://nvie.com/posts/a-successful-git-branching-model/)

---

**文档维护**: 开发团队  
**最后更新**: 2026-02-25
