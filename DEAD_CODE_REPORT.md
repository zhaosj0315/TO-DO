# 死代码检测报告

**生成时间**: 1772515704.6280107
**扫描目录**: /Users/zhaosj/Desktop/TO-DO/src
**扫描函数总数**: 487

---

## ❌ 确认未使用的函数 (0)

**建议**: 可以安全删除


## ⚠️  可疑函数 (5)

**建议**: 需要人工审核

### showNotify
- **文件**: `/src/App.vue`
- **行号**: 33
- **类型**: arrow function
- **引用次数**: 2
- **动态调用**: 否
- **引用位置**:
  - `/src/App.vue:16`
  - `/src/App.vue:33`

### getLastBackupDate
- **文件**: `/src/utils/autoBackup.js`
- **行号**: 21
- **类型**: function declaration
- **引用次数**: 2
- **动态调用**: 否
- **引用位置**:
  - `/src/utils/autoBackup.js:21`
  - `/src/utils/autoBackup.js:85`

### setLastBackupDate
- **文件**: `/src/utils/autoBackup.js`
- **行号**: 27
- **类型**: function declaration
- **引用次数**: 2
- **动态调用**: 否
- **引用位置**:
  - `/src/utils/autoBackup.js:27`
  - `/src/utils/autoBackup.js:122`

### getLastBackupDate
- **文件**: `/src/utils/autoBackup.js`
- **行号**: 21
- **类型**: async function
- **引用次数**: 2
- **动态调用**: 否
- **引用位置**:
  - `/src/utils/autoBackup.js:21`
  - `/src/utils/autoBackup.js:85`

### setLastBackupDate
- **文件**: `/src/utils/autoBackup.js`
- **行号**: 27
- **类型**: async function
- **引用次数**: 2
- **动态调用**: 否
- **引用位置**:
  - `/src/utils/autoBackup.js:27`
  - `/src/utils/autoBackup.js:122`


## 📊 统计信息

- 扫描函数总数: 487
- 确认未使用: 0
- 可疑函数: 5
- 正常使用: 482
- 清理潜力: 5 个函数

---

## ⚠️  注意事项

1. **动态调用**: 标记为"可能"的函数可能通过动态方式调用，删除前需仔细检查
2. **模板使用**: Vue模板中使用的函数可能未被检测到，需人工确认
3. **导出函数**: 导出的函数可能被外部模块使用，不应删除
4. **测试代码**: 测试文件中的函数可能只在测试时使用

