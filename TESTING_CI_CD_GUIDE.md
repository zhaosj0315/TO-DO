# 测试与CI/CD指南

## 📋 目录
- [单元测试](#单元测试)
- [运行测试](#运行测试)
- [CI/CD流程](#cicd流程)
- [测试覆盖率](#测试覆盖率)

## 单元测试

### 技术栈
- **测试框架**: Vitest
- **Vue测试**: @vue/test-utils
- **DOM环境**: happy-dom

### 测试结构
```
src/
├── stores/
│   ├── offlineTaskStore.js
│   └── __tests__/
│       └── offlineTaskStore.spec.js
├── services/
│   ├── smartTaskParser.js
│   └── __tests__/
│       └── smartTaskParser.spec.js
└── components/
    └── __tests__/
        └── *.spec.js
```

### 已实现测试

#### 1. Store测试 (offlineTaskStore.spec.js)
- ✅ 任务创建
- ✅ 任务状态管理
- ✅ 任务筛选
- ✅ 任务删除与恢复
- ✅ 统计功能

#### 2. 服务测试 (smartTaskParser.spec.js)
- ✅ 列表项识别（5种格式）
- ✅ 空行过滤
- ✅ 边界条件处理

## 运行测试

### 基础命令
```bash
# 运行所有测试
npm test

# 监听模式（开发时使用）
npm test -- --watch

# UI界面
npm run test:ui

# 生成覆盖率报告
npm run test:coverage
```

### 运行特定测试
```bash
# 只测试Store
npm test stores

# 只测试Services
npm test services

# 运行单个文件
npm test offlineTaskStore.spec.js
```

### 查看覆盖率
```bash
npm run test:coverage
# 报告位置: coverage/index.html
```

## CI/CD流程

### GitHub Actions工作流

#### 触发条件
- Push到 `main` 或 `develop` 分支
- Pull Request到 `main` 或 `develop` 分支

#### 流程阶段

**1. 测试阶段 (test)**
- 运行单元测试
- 生成覆盖率报告
- 上传到Codecov

**2. 代码检查 (lint)**
- ESLint检查
- 代码风格验证

**3. 构建阶段 (build-*)**
- Web版本构建
- Android APK构建（仅main分支）
- Windows安装包（仅main分支）
- macOS安装包（仅main分支）

#### 产物保留
- Web构建产物: 7天
- APK文件: 30天
- 桌面安装包: 30天

### 本地CI测试
```bash
# 模拟CI流程
npm ci              # 清洁安装
npm test            # 运行测试
npm run build       # 构建项目
```

## 测试覆盖率

### 当前覆盖率目标
- **Phase 1**: 核心Store和Service >60%
- **Phase 2**: 所有业务逻辑 >70%
- **Phase 3**: 完整覆盖 >80%

### 覆盖率报告
```bash
npm run test:coverage

# 查看详细报告
open coverage/index.html
```

### 排除项
- `node_modules/`
- `dist/`
- `android/`
- `ios/`
- `electron/`
- 测试文件本身

## 编写测试指南

### 测试文件命名
```
源文件: src/stores/taskStore.js
测试文件: src/stores/__tests__/taskStore.spec.js
```

### 测试模板
```javascript
import { describe, it, expect, beforeEach } from 'vitest'

describe('功能模块名', () => {
  beforeEach(() => {
    // 每个测试前的准备工作
  })

  describe('子功能1', () => {
    it('应该做某事', () => {
      // Arrange: 准备数据
      const input = 'test'
      
      // Act: 执行操作
      const result = someFunction(input)
      
      // Assert: 验证结果
      expect(result).toBe('expected')
    })
  })
})
```

### 最佳实践
1. **测试独立性**: 每个测试互不影响
2. **清晰命名**: 测试名称描述预期行为
3. **AAA模式**: Arrange → Act → Assert
4. **边界测试**: 测试边界条件和异常情况
5. **Mock外部依赖**: 隔离测试单元

## 持续集成徽章

在README.md中添加：
```markdown
![Tests](https://github.com/your-username/TO-DO/workflows/CI%2FCD%20Pipeline/badge.svg)
![Coverage](https://codecov.io/gh/your-username/TO-DO/branch/main/graph/badge.svg)
```

## 下一步计划

### Phase 2: 组件测试
- [ ] TaskDetailModal组件测试
- [ ] AIChat组件测试
- [ ] 表单组件测试

### Phase 3: 集成测试
- [ ] 用户登录流程
- [ ] 任务创建到完成流程
- [ ] 数据导入导出流程

### Phase 4: E2E测试
- [ ] Playwright配置
- [ ] 关键用户路径测试
- [ ] 跨平台兼容性测试

## 故障排查

### 测试失败
```bash
# 查看详细错误
npm test -- --reporter=verbose

# 调试单个测试
npm test -- --inspect-brk offlineTaskStore.spec.js
```

### CI失败
1. 检查GitHub Actions日志
2. 本地运行 `npm ci && npm test`
3. 确保所有依赖已提交

## 参考资源
- [Vitest文档](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [GitHub Actions文档](https://docs.github.com/actions)
