@echo off
chcp 65001 >nul
REM Windows Electron 一键打包脚本
REM 用途：自动构建 TODO App 的 Windows 安装程序

REM 获取版本号
for /f "tokens=*" %%i in ('node -p "require('./package.json').version"') do set VERSION=%%i

echo ==========================================
echo   TODO App - Windows 安装包打包脚本 v%VERSION%
echo ==========================================
echo.

REM 步骤 1: 清理旧文件
echo 🧹 步骤 1/3: 清理旧文件...
if exist release rmdir /s /q release
if exist dist rmdir /s /q dist
echo ✅ 清理完成
echo.

REM 步骤 2: 构建前端代码
echo 🔨 步骤 2/3: 构建前端代码...
call npm run build
if errorlevel 1 (
    echo ❌ 错误: 前端构建失败
    pause
    exit /b 1
)
echo ✅ 前端构建完成
echo.

REM 步骤 3: 打包 Windows 安装程序
echo 📦 步骤 3/3: 打包 Windows 安装程序...
call npx electron-builder --win
if errorlevel 1 (
    echo ❌ 错误: Windows 打包失败
    pause
    exit /b 1
)
echo ✅ Windows 打包完成
echo.

echo ==========================================
echo   ✅ 打包成功！
echo ==========================================
echo.
echo 📦 安装包位置: release\TODO App Setup %VERSION%.exe
echo.
echo 🚀 安装方式:
echo    1. 双击运行 Setup 安装程序
echo    2. 选择安装目录
echo    3. 完成安装后从桌面快捷方式启动
echo.
pause
