# 项目材料清理与维护方案

## 📋 任务概述

**执行时间**: 2026-03-10 00:10  
**任务范围**: 
1. 过程性材料清理
2. 文档材料维护
3. 无用代码清理

---

## 阶段1：过程性材料识别与清理

### 🔍 识别标准

**可删除的过程性材料**：
1. ✅ 临时测试脚本（check-*.js, test-*.js, query-*.js）
2. ✅ 数据库临时操作脚本（drop_*.js, fix-*.js）
3. ✅ 过程性审查报告（*_AUDIT.md, *_FIX_REPORT.md, *_COMPLETE.md）
4. ✅ 临时HTML测试文件（*.html）
5. ✅ 旧版本安装包（TODO-App-0.8.2-*.zip）
6. ✅ 日志文件（*.log）
7. ✅ 系统文件（.DS_Store）

**必须保留的材料**：
1. ❌ 核心文档（README.md, CHANGELOG.md）
2. ❌ 规范文档（*_STANDARDS.md, *_POLICY.md）
3. ❌ 用户文档（USER_MANUAL.md, QUICK_START.md）
4. ❌ 开发文档（DEVELOPER.md, ARCHITECTURE.md, API_REFERENCE.md）
5. ❌ 功能文档（FEATURES.md, *_GUIDE.md）
6. ❌ 最新版本安装包（TODO-App-0.8.6-*.zip）
7. ❌ 生产脚本（build-*.sh, start-*.sh, optimize-*.js）

---

## 📊 待清理文件清单

### **临时测试脚本（9个）**
```
check_localstorage.html
check-data.js
check-db-info.js
check-latest-tasks.js
query-db.js
test-mysql.js
test-mysql-connection.js
show-table-structure.js
test-report.html
```

### **数据库临时操作脚本（4个）**
```
drop_db.js
drop_db_api.js
drop_db_now.js
drop_with_grant.js
fix-tables.js
```

### **过程性审查报告（30+个）**
```
ALL_FIXES_COMPLETE.md
AUTO_BACKUP_AUDIT.md
AUTO_BACKUP_FIX_REPORT.md
AUTO_INIT_SUMMARY.md
CLEAN_DATABASE_TEST.md
CLEANUP_REPORT_FINAL_v0.8.1.md
CLEANUP_WORK_SUMMARY.md
DATA_MANAGEMENT_AUDIT.md
DATA_MANAGEMENT_FIX_REPORT.md
DATABASE_CONFIG_AUDIT.md
DATABASE_DESIGN_CRITIQUE.md
DATABASE_TAKEOVER_AUDIT.md
FIX_PROGRESS_REPORT.md
MYSQL_INDEX_OPTIMIZATION_REPORT.md
POMODORO_REMOVAL_REPORT.md
REPORT_CENTER_BACK_GESTURE_AUDIT.md
REPORT_DATA_ACCURACY_AUDIT.md
REPORT_DATE_FIX.md
SQLITE_INTEGRATION_REPORT.md
SYNC_ISSUE_ANALYSIS.md
SYNC_LOGIC_AUDIT.md
TAKEOVER_COMPLETE_AUDIT.md
TAKEOVER_COMPLETE_REPORT.md
TAKEOVER_COVERAGE_REPORT.md
TAKEOVER_LOGIC_FINAL_CONFIRMATION.md
TAKEOVER_MODE_COMPLETE_LOGIC.md
TASK_RELATIONSHIP_AUDIT.md
USER_DATA_ISOLATION_AUDIT.md
V0.8.6_AUDIT_REPORT.md
VERSION_0.8.6_RELEASE_NOTES.md
VERSION_UPDATE_IMPROVEMENT.md
WEEK1_STEP1_COMPLETE.md
```

### **旧版本安装包（2个，~275MB）**
```
TODO-App-0.8.2-mac-x64.zip (139MB)
TODO-App-0.8.2-mac-arm64.zip (135MB)
```

### **日志文件（1个）**
```
mysql-server.log
```

### **系统文件（1个）**
```
.DS_Store
```

---

## ⚠️ 清理前确认

### **总计**：
- 临时脚本：13个
- 过程性报告：32个
- 旧版本包：2个（275MB）
- 日志/系统文件：2个

**总文件数**：49个  
**释放空间**：约275MB

---

## 🎯 清理策略

### **安全原则**：
1. ✅ 只删除明确的过程性材料
2. ✅ 保留所有生产脚本和工具
3. ✅ 保留最新版本安装包
4. ✅ 保留所有规范和用户文档

### **执行方式**：
1. 创建备份清单
2. 逐个确认删除
3. 生成清理报告

---

**准备开始清理，需要您的最终确认！**
