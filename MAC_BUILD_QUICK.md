# macOS 打包快速参考

## 🚀 一键打包
```bash
./build-mac.sh
```

## 📦 输出文件
```
TODO-App-1.6.0-mac.dmg  # 最终安装包
```

## ⚙️ 关键配置

### vite.config.js
```javascript
base: './'  // ⚠️ 必须：使用相对路径
```

### electron/main.js
```javascript
// 打包后加载路径
win.loadFile(path.join(__dirname, '../dist/index.html'))
```

### package.json
```json
{
  "mac": {
    "target": [{"target": "dmg", "arch": ["x64"]}],
    "hardenedRuntime": false
  }
}
```

## 🐛 常见问题

| 问题 | 解决方案 |
|------|---------|
| 白屏 | 添加 `base: './'` 到 vite.config.js |
| CSS/JS 404 | 确保使用相对路径 |
| arm64 失败 | 正常，x64 可通过 Rosetta 2 运行 |
| 无法打开 | 右键 → 打开 → 确认 |

## 📚 完整文档
- [MAC_BUILD_GUIDE.md](./MAC_BUILD_GUIDE.md) - 详细指南
- [MAC_VERSION_README.md](./MAC_VERSION_README.md) - 用户说明

---
**更新**: 2026-02-21
