# macOS 版本打包指南

## 📦 一键打包

### 快速打包
```bash
./build-mac.sh
```

### 手动打包
```bash
# 1. 清理旧文件
rm -rf dist release

# 2. 构建前端
npm run build

# 3. 打包 DMG
CSC_IDENTITY_AUTO_DISCOVERY=false npm run electron:build-mac

# 4. 复制到根目录
cp "release/TODO App-1.6.0.dmg" ./TODO-App-1.6.0-mac.dmg
```

---

## 🔧 关键配置

### 1. package.json
```json
{
  "scripts": {
    "electron:build-mac": "npm run build && electron-builder --mac"
  },
  "build": {
    "appId": "com.todo.app",
    "productName": "TODO App",
    "files": [
      "dist/**/*",
      "electron/**/*",
      "!node_modules/**/android/**/*",
      "!node_modules/**/*.dex",
      "!node_modules/**/*.jar"
    ],
    "mac": {
      "target": [
        {
          "target": "dmg",
          "arch": ["x64"]
        }
      ],
      "category": "public.app-category.productivity",
      "hardenedRuntime": false,
      "gatekeeperAssess": false
    },
    "dmg": {
      "title": "TODO App",
      "window": {
        "width": 540,
        "height": 380
      },
      "contents": [
        {
          "x": 144,
          "y": 150,
          "type": "file"
        },
        {
          "x": 396,
          "y": 150,
          "type": "link",
          "path": "/Applications"
        }
      ]
    }
  }
}
```

### 2. vite.config.js
```javascript
export default defineConfig({
  plugins: [vue()],
  base: './', // ⚠️ 关键：使用相对路径，适配Electron
})
```

### 3. electron/main.js
```javascript
// 加载构建后的 index.html
if (app.isPackaged) {
  win.loadFile(path.join(__dirname, '../dist/index.html'))
} else {
  win.loadURL('http://localhost:5173')
  win.webContents.openDevTools()
}
```

---

## 🐛 常见问题

### 问题1: 白屏
**原因**: Vite 使用绝对路径，Electron 需要相对路径  
**解决**: 在 `vite.config.js` 中添加 `base: './'`

### 问题2: CSS/JS 加载失败
**原因**: 资源路径错误  
**解决**: 确保 `base: './'` 配置正确

### 问题3: arm64 构建失败
**原因**: macOS codesign 工具版本问题  
**解决**: 只构建 x64 版本，M芯片通过 Rosetta 2 运行

### 问题4: 无法验证开发者
**原因**: 未签名的应用  
**解决**: 右键点击应用 → 打开 → 确认打开

---

## 📊 架构支持

| 架构 | 支持方式 | 性能 |
|------|---------|------|
| Intel (x64) | ✅ 原生支持 | 100% |
| Apple Silicon (M1/M2/M3) | ✅ Rosetta 2 | ~90% |

---

## 🔐 代码签名（可选）

### 开发测试（当前方式）
```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run electron:build-mac
```

### 正式发布（需要证书）
1. 申请 Apple Developer 账号（$99/年）
2. 创建开发者证书
3. 配置环境变量：
```bash
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your_password
```
4. 构建：
```bash
npm run electron:build-mac
```

---

## 📁 输出文件

### 构建产物
```
release/
├── TODO App-1.6.0.dmg          # DMG 安装包
├── TODO App-1.6.0.dmg.blockmap # 增量更新映射
├── mac/                         # x64 应用包
│   └── TODO App.app
└── builder-debug.yml            # 构建日志
```

### 最终交付
```
TODO-App-1.6.0-mac.dmg  # 复制到项目根目录
```

---

## 🚀 发布流程

### 1. 本地测试
```bash
./build-mac.sh
# 安装并测试 DMG
```

### 2. 版本发布
```bash
# 更新版本号
npm version patch  # 1.6.0 → 1.6.1
npm version minor  # 1.6.0 → 1.7.0
npm version major  # 1.6.0 → 2.0.0

# 重新打包
./build-mac.sh
```

### 3. GitHub Release
```bash
# 提交代码
git add .
git commit -m "release: v1.6.0 macOS版本"
git tag v1.6.0
git push origin main --tags

# 上传 DMG 到 GitHub Releases
```

---

## 📝 版本历史

### v1.6.0 (2026-02-21)
- ✅ 首个 macOS 版本
- ✅ 支持 Intel Mac (x64)
- ✅ 支持 Apple Silicon (通过 Rosetta 2)
- ✅ 修复白屏问题
- ✅ 修复资源加载问题

---

## 🔗 相关文档

- [Electron Builder 文档](https://www.electron.build/)
- [macOS 代码签名指南](https://www.electron.build/code-signing)
- [Vite 配置文档](https://vitejs.dev/config/)

---

## 💡 优化建议

### 短期
- [x] 基础打包功能
- [x] 一键打包脚本
- [ ] 添加应用图标
- [ ] 优化 DMG 背景图

### 中期
- [ ] 支持自动更新
- [ ] 添加崩溃报告
- [ ] 性能监控

### 长期
- [ ] Apple Developer 证书签名
- [ ] App Store 上架
- [ ] 原生 arm64 支持
- [ ] 通用二进制版本

---

**维护者**: AI Agent  
**最后更新**: 2026-02-21  
**文档版本**: 1.0
