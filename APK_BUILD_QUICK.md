# APK打包快速指南

## 一键打包（推荐）

```bash
./build-apk.sh
```

**就这么简单！** 脚本会自动完成以下步骤：
1. 构建Vue项目
2. 同步到Android
3. 修复Java版本配置
4. 构建APK
5. 复制到项目根目录

打包完成后，APK文件位于：`TODO-App.apk`

---

## 环境要求

- **Node.js**: 已安装
- **Java 17**: 已配置在 `android/gradle.properties`
- **Android SDK**: 已安装

---

## 常见问题

### Q: 提示 Java 版本错误？
A: 脚本会自动修复。如果仍有问题，检查 `android/gradle.properties` 中的 `org.gradle.java.home` 配置。

### Q: 构建失败？
A: 运行 `cd android && ./gradlew clean` 清理后重试。

### Q: 想手动打包？
A: 参考 [APK_BUILD_GUIDE.md](APK_BUILD_GUIDE.md) 详细文档。

---

## 输出文件

- **APK文件**: `TODO-App.apk` (约4.6M)
- **位置**: 项目根目录
- **类型**: Debug版本

---

## 版本记录

每次打包后建议：
1. 测试APK功能
2. 更新版本号（如需要）
3. 提交代码（不包含APK）

---

**提示**: APK是构建产物，遵循"非必要不推送"原则，不提交到Git。
