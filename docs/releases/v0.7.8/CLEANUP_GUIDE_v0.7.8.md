# TO-DO App v0.7.8 文档审计与清理执行指南

**生成时间**: 2026-03-02 00:40  
**审计原则**: 代码已封板，文档必须无条件适配代码  
**执行原则**: 非必要不推送，只清理过时和临时文件

---

## 📋 审计结果概览

### 🔴 发现的严重问题
1. **过时构建产物** (~1GB): release/目录存在v1.7.8和v1.6.x版本
2. **版本号体系不统一**: CHANGELOG.md使用v1.x.x，代码使用v0.7.8
3. **根目录遗留文件**: 大量旧版本安装包和iOS构建产物

### 🟡 发现的中等问题
4. **过程性报告散落**: 4个报告文档在根目录，应归档
5. **测试脚本残留**: scripts/目录存在5个测试脚本
6. **临时文件**: AI_CHAT_TEST.html, ollama-proxy.py等

### 🟢 发现的轻微问题
7. **.DS_Store文件**: macOS系统临时文件
8. **废弃server目录**: 已在README说明，保留作为历史参考

---

## 🚀 执行步骤

### 步骤1：查看审计报告（必读）

```bash
cat AUDIT_REPORT_v0.7.8.md
```

**重点关注**:
- 🔴 严重问题清单
- 📊 统计数据（~1GB过时文件）
- 📝 建议执行顺序

---

### 步骤2：执行清理脚本（推荐）

```bash
# 执行清理（自动备份+日志记录）
./cleanup-v0.7.8.sh

# 查看清理日志
cat CLEANUP_EXECUTION_LOG_*.md
```

**清理内容**:
- ✅ 删除根目录所有v1.6.x安装包（~500MB）
- ✅ 删除release/目录v1.7.8构建产物（~280MB）
- ✅ 删除App.app目录（iOS模拟器构建）
- ✅ 归档过程性报告到docs/audits/
- ✅ 删除测试脚本和临时文件
- ✅ 清理.DS_Store文件
- ✅ 更新.gitignore

**预期结果**:
- 释放磁盘空间: ~1GB
- 删除文件数: ~20个
- 归档文档数: 4个

---

### 步骤3：统一版本号体系（必须）

```bash
# 执行版本号统一（自动备份）
./fix-version-numbers.sh

# 查看差异（前50行）
diff CHANGELOG.md.backup_* CHANGELOG.md | head -50
```

**替换规则**:
- v1.7.x → v0.7.x
- v1.6.x → v0.6.x
- [1.7.x] → [0.7.x]
- [1.6.x] → [0.6.x]

**预期结果**:
- CHANGELOG.md版本号统一为v0.x.x体系
- 与package.json、README.md、代码保持一致

---

### 步骤4：验证清理结果

```bash
# 检查是否还有v1.x.x版本号
grep -r "1\.[67]\.\d\+" *.md | grep -v "docs/audits" | grep -v "docs/archive"

# 检查是否还有过时构建产物
ls -lh | grep "1\.6\."
ls -lh release/ | grep "1\.7\."

# 检查过程性报告是否已归档
ls -lh docs/audits/ | grep "REPORT"

# 检查磁盘空间释放
du -sh release/
```

**预期输出**:
- ✅ 核心文档无v1.x.x版本号
- ✅ 根目录无v1.6.x文件
- ✅ release/目录无v1.7.8文件
- ✅ docs/audits/包含4个归档报告
- ✅ release/目录大小 ~450MB（仅v0.7.8）

---

### 步骤5：提交清理结果（可选）

```bash
# 查看变更
git status

# 提交清理结果
git add .
git commit -m "chore: 清理过时构建产物和临时文件

✨ 清理内容
- 删除根目录v1.6.x安装包（~500MB）
- 删除release/目录v1.7.8构建产物（~280MB）
- 删除App.app目录（iOS模拟器构建）
- 归档过程性报告到docs/audits/
- 删除测试脚本和临时文件
- 清理.DS_Store文件
- 统一CHANGELOG.md版本号体系为v0.x.x

📊 统计
- 释放空间: ~1GB
- 删除文件: ~20个
- 归档文档: 4个

📄 相关文档
- AUDIT_REPORT_v0.7.8.md
- CLEANUP_EXECUTION_LOG_*.md"

# 推送到远程（可选）
git push origin main
```

---

## 📊 清理前后对比

### 清理前
```
项目总大小: ~2.5GB
├── release/: ~1.2GB
│   ├── v0.7.8: ~450MB ✅
│   ├── v1.7.8: ~280MB ❌
│   └── v1.6.x: ~470MB ❌
├── 根目录v1.6.x: ~500MB ❌
├── App.app/: ~50MB ❌
└── 其他: ~800MB
```

### 清理后
```
项目总大小: ~1.5GB
├── release/: ~450MB
│   └── v0.7.8: ~450MB ✅
├── docs/audits/: +4个归档报告 ✅
└── 其他: ~1GB
```

**释放空间**: ~1GB (40%)

---

## ⚠️ 注意事项

### 安全措施
1. ✅ 所有脚本都会自动备份原文件
2. ✅ 生成详细的执行日志
3. ✅ 可随时回滚（备份文件保留）

### 不会删除的内容
- ✅ release/目录中的v0.7.8构建产物（4个文件）
- ✅ docs/audits/和docs/archive/中的历史文档
- ✅ server/目录（README已说明为历史参考）
- ✅ 所有核心文档（README, CHANGELOG等）

### 如需回滚
```bash
# 回滚CHANGELOG.md
mv CHANGELOG.md.backup_* CHANGELOG.md

# 查看清理日志找回删除的文件
cat CLEANUP_EXECUTION_LOG_*.md
```

---

## 📝 相关文档

1. **AUDIT_REPORT_v0.7.8.md** - 完整审计报告
2. **CLEANUP_EXECUTION_LOG_*.md** - 清理执行日志（执行后生成）
3. **VERSION_ADJUSTMENT_REPORT.md** - 版本号调整说明（已归档）
4. **DOC_MAINTENANCE_FINAL_REPORT_V0.7.8.md** - 文档维护报告（已归档）

---

## ✅ 执行检查清单

- [ ] 步骤1: 查看审计报告
- [ ] 步骤2: 执行清理脚本
- [ ] 步骤3: 统一版本号体系
- [ ] 步骤4: 验证清理结果
- [ ] 步骤5: 提交清理结果（可选）

---

**生成工具**: Kiro AI  
**最后更新**: 2026-03-02 00:40
