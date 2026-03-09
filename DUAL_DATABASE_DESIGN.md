# 双数据库同步方案设计

## 🎯 目标

支持两种数据库选项，满足不同用户需求：
1. **SQLite** - 本地文件数据库（推荐，零配置）
2. **MySQL** - 远程服务器数据库（高级，需配置）

## 📊 架构设计

```
┌─────────────────────────────────────────┐
│         Capacitor Preferences           │
│        (主数据源，永远可用)              │
└──────────────┬──────────────────────────┘
               │
               ├─────────────┬─────────────┐
               │             │             │
         ┌─────▼─────┐ ┌────▼─────┐ ┌────▼─────┐
         │  SQLite   │ │  MySQL   │ │   无     │
         │  (本地)   │ │ (远程)   │ │  (默认)  │
         └───────────┘ └──────────┘ └──────────┘
```

## 🔧 技术方案

### 1. SQLite方案（Capacitor插件）

**插件**: `@capacitor-community/sqlite`

**优势**:
- ✅ 本地文件，无需网络
- ✅ 打包进APK，零配置
- ✅ 性能优秀
- ✅ 支持Android/iOS/Web

**实现**:
```javascript
import { CapacitorSQLite } from '@capacitor-community/sqlite'

// 创建数据库
await CapacitorSQLite.createConnection({
  database: 'todo_app.db',
  version: 1
})

// 同步数据
await CapacitorSQLite.execute({
  database: 'todo_app.db',
  statements: [
    'INSERT INTO tasks ...'
  ]
})
```

### 2. MySQL方案（已实现）

**实现**: Node.js后端服务 + HTTP API

**优势**:
- ✅ 远程备份
- ✅ 多设备共享
- ✅ 数据分析

**缺点**:
- ❌ 需要配置服务器
- ❌ 需要网络连接

## 📱 用户界面设计

### 数据库配置页面

```
┌─────────────────────────────────────┐
│  🗄️ 数据库配置                      │
├─────────────────────────────────────┤
│                                     │
│  选择数据库类型:                     │
│  ○ 无 (仅使用本地存储)              │
│  ● SQLite (推荐，本地数据库)        │
│  ○ MySQL (高级，远程服务器)         │
│                                     │
│  ┌─ SQLite配置 ─────────────────┐  │
│  │ ✅ 自动配置，无需设置          │  │
│  │ 📁 数据库位置: 应用内部存储    │  │
│  │ 💾 大小: 约10MB               │  │
│  └───────────────────────────────┘  │
│                                     │
│  [🔍 测试连接]  [⬆️ 立即同步]      │
│                                     │
└─────────────────────────────────────┘
```

## 🚀 实施步骤

### Phase 1: 安装SQLite插件
```bash
npm install @capacitor-community/sqlite
npx cap sync
```

### Phase 2: 创建SQLite服务
- `src/services/sqliteConfig.js` - SQLite配置
- `src/services/sqliteSync.js` - 数据同步

### Phase 3: 统一配置界面
- 修改 `MySQLConfigModal.vue` → `DatabaseConfigModal.vue`
- 支持切换数据库类型
- SQLite/MySQL共用同步逻辑

### Phase 4: 表结构统一
```sql
-- 两种数据库使用相同的表结构
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  username TEXT,
  text TEXT,
  description TEXT,
  type TEXT,
  category TEXT,
  priority TEXT,
  status TEXT,
  created_at TEXT,
  completed_at TEXT,
  collection_id INTEGER,
  parent_task_id INTEGER,
  data TEXT  -- JSON字符串
)
```

## 📊 对比表

| 特性 | Preferences | SQLite | MySQL |
|------|------------|--------|-------|
| 配置难度 | ⭐ 零配置 | ⭐ 零配置 | ⭐⭐⭐ 需配置 |
| 性能 | ⭐⭐⭐ 快 | ⭐⭐⭐⭐ 很快 | ⭐⭐ 依赖网络 |
| 数据量 | ⭐⭐ 有限 | ⭐⭐⭐⭐ 大 | ⭐⭐⭐⭐⭐ 无限 |
| 查询能力 | ⭐ 弱 | ⭐⭐⭐⭐ 强 | ⭐⭐⭐⭐⭐ 最强 |
| 多设备同步 | ❌ | ❌ | ✅ |
| 离线使用 | ✅ | ✅ | ❌ |

## 🎯 推荐策略

1. **默认**: Preferences（现有方案）
2. **推荐**: SQLite（本地增强）
3. **高级**: MySQL（远程备份）

## ⚠️ 注意事项

1. **数据迁移**: 三种存储方式数据格式统一
2. **向下兼容**: 不影响现有Preferences用户
3. **性能优化**: SQLite批量插入，避免逐条
4. **错误处理**: 同步失败不影响应用使用

## 📝 下一步

需要我开始实现SQLite方案吗？
