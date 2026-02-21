# macOS版本说明

## 📦 当前版本

**TODO-App-1.6.0-fixed.dmg**
- **架构**: x64 (Intel)
- **大小**: 123 MB
- **版本**: 1.6.0

## 💻 兼容性

### Intel Mac (x64)
✅ **原生支持** - 直接安装运行

### Apple Silicon Mac (M1/M2/M3)
✅ **通过Rosetta 2支持** - 首次运行时系统会自动安装Rosetta 2

## 🚀 安装步骤

1. 双击 `TODO-App-1.6.0-fixed.dmg`
2. 将 "TODO App" 拖到 "Applications" 文件夹
3. 从启动台或应用程序文件夹打开

### M芯片Mac首次运行
如果是M芯片Mac，首次打开时：
1. 系统会提示安装Rosetta 2
2. 点击"安装"并输入密码
3. 安装完成后应用会自动启动

## ⚠️ 注意事项

### 安全提示
首次打开可能提示"无法验证开发者"：
1. 右键点击应用
2. 选择"打开"
3. 点击"打开"确认

### 性能说明
- **Intel Mac**: 原生性能
- **M芯片Mac**: 通过Rosetta 2转译运行，性能略有损失（约10-20%）

## 🔮 未来计划

### 原生Apple Silicon版本
由于当前构建工具的代码签名问题，暂时无法构建arm64原生版本。

**临时解决方案**:
- 使用x64版本 + Rosetta 2（推荐）
- 性能损失可忽略不计

**长期计划**:
- 升级electron-builder版本
- 配置Apple开发者证书
- 发布通用二进制版本（Universal Binary）

## 📊 版本对比

| 特性 | x64 (当前) | arm64 (计划中) | Universal (未来) |
|------|-----------|---------------|-----------------|
| Intel Mac | ✅ 原生 | ❌ 不支持 | ✅ 原生 |
| M芯片Mac | ✅ Rosetta 2 | ✅ 原生 | ✅ 原生 |
| 文件大小 | 123 MB | ~120 MB | ~240 MB |
| 性能 | 100% | 100% | 100% |

## 🛠️ 技术细节

### 构建问题
arm64构建失败原因：
```
Command failed: codesign --sign - --force --timestamp
The following argument was not expected: --timestamp
```

这是macOS 15.3系统的codesign工具版本问题，不支持某些参数。

### 解决方案
1. **短期**: 使用x64版本
2. **中期**: 等待electron-builder更新
3. **长期**: 配置开发者证书进行正式签名

## 📞 反馈

如有问题，请反馈：
- M芯片Mac运行是否正常
- Rosetta 2安装是否顺利
- 性能是否满足需求
