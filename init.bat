@echo off
chcp 65001 >nul
title 天景 AeScape - 初始化脚本

echo 🌤️  天景 AeScape - 初始化脚本
echo ==================================

REM 检查 Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查 npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 请先安装 npm
    pause
    exit /b 1
)

echo ✅ Node.js 版本:
node --version
echo ✅ npm 版本:
npm --version

REM 安装依赖
echo.
echo 📦 安装项目依赖...
npm install
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)
echo ✅ 依赖安装完成

REM 创建必要的目录
echo.
echo 📁 创建项目目录...
if not exist "dist" mkdir dist
if not exist "src\assets\textures" mkdir src\assets\textures
if not exist "src\assets\icons" mkdir src\assets\icons
echo ✅ 目录创建完成

REM 复制图标文件（如果存在）
if exist "icons" (
    echo.
    echo 🎨 复制图标文件...
    xcopy /E /I /Y icons\* src\assets\icons\ >nul 2>&1
    copy icons\*.png . >nul 2>&1
    echo ✅ 图标文件复制完成
)

REM 构建项目
echo.
echo 🔨 构建项目...
npm run build
if %errorlevel% neq 0 (
    echo ⚠️  构建失败，但可以继续开发
) else (
    echo ✅ 构建完成
)

REM 显示使用说明
echo.
echo 🎉 初始化完成！
echo.
echo 📋 使用说明：
echo 1. 开发模式: npm run dev
echo 2. 构建生产版本: npm run build
echo 3. 代码检查: npm run lint
echo 4. 格式化代码: npm run format
echo.
echo 🌐 Chrome 扩展安装：
echo 1. 打开 Chrome 浏览器
echo 2. 访问 chrome://extensions/
echo 3. 开启 "开发者模式"
echo 4. 点击 "加载已解压的扩展程序"
echo 5. 选择 "dist" 文件夹
echo.
echo 🔧 开发调试：
echo 1. 运行 "npm run dev"
echo 2. 在 Chrome 扩展页面加载 "src" 文件夹
echo 3. 新建标签页查看效果
echo.
echo 📚 更多信息请查看 INSTALL.md
echo.
echo 🚀 开始开发吧！
echo.
pause