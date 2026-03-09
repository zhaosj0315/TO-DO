# MySQL混合存储方案

## 📋 方案概述

在保持现有Capacitor Preferences存储方案不变的基础上，新增可选的MySQL数据库同步功能。

## 🎯 核心特性

1. **本地优先**: Preferences永远是主数据源
2. **可选同步**: 配置MySQL后可手动同步
3. **向下兼容**: 未配置数据库时完全不影响现有功能
4. **数据备份**: MySQL作为数据持久化备份方案

## 🏗️ 架构设计

```
Vue组件 → Store(Preferences) → 同步服务 → MySQL
                ↓
            现有逻辑不变
```

## 📦 文件清单

1. `src/services/mysqlConfig.js` - MySQL配置管理
2. `src/services/mysqlSync.js` - 数据同步服务
3. `src/components/MySQLConfigModal.vue` - 配置界面
4. `mysql-server.js` - Node.js后端服务
5. `mysql-package.json` - 后端依赖

## 🚀 使用步骤

### 1. 启动MySQL同步服务

```bash
# 安装依赖
cd /Users/zhaosj/Desktop/TO-DO
npm install --prefix . express mysql2 cors

# 启动服务
node mysql-server.js
```

### 2. 配置数据库

在个人主页添加"🗄️ 数据库配置"按钮，打开配置弹窗：

- 主机: localhost
- 端口: 3306
- 用户: root
- 密码: 66315066
- 数据库: todo_app

### 3. 测试连接

点击"🔍 测试连接"按钮，验证数据库连接。

### 4. 同步数据

点击"⬆️ 立即同步"按钮，将本地数据同步到MySQL。

## 📊 数据库表结构

### tasks表
- id: 任务ID
- username: 用户名
- text: 任务标题
- description: 任务描述
- type/category/priority/status: 任务属性
- created_at/completed_at: 时间戳
- collection_id/parent_task_id: 关联ID
- data: 完整JSON数据

### collections表
- id: 文件夹ID
- username: 用户名
- name: 文件夹名称
- icon: 图标
- parent_id: 父文件夹ID
- order_num: 排序
- is_encrypted: 是否加密
- data: 完整JSON数据

## 🔧 集成到TodoView

在TodoView.vue的个人主页部分添加：

```vue
<button @click="showMySQLConfig = true">🗄️ 数据库配置</button>
<MySQLConfigModal :show="showMySQLConfig" @close="showMySQLConfig = false" />
```

## ⚠️ 注意事项

1. MySQL服务需要单独运行 (node mysql-server.js)
2. 仅支持手动同步，不会自动同步
3. 数据库需要提前创建 (CREATE DATABASE todo_app)
4. 表结构会自动创建

## 🎉 测试配置

```
Host: localhost
Port: 3306
User: root
Password: 66315066
Database: todo_app
```
