#!/bin/bash

# 天景 AeScape 初始化脚本
# 自动设置开发环境和依赖

echo "🌤️  天景 AeScape - 初始化脚本"
echo "=================================="

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 请先安装 Node.js"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 请先安装 npm"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"

# 安装依赖
echo ""
echo "📦 安装项目依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装完成"

# 创建必要的目录
echo ""
echo "📁 创建项目目录..."
mkdir -p dist
mkdir -p src/assets/textures
mkdir -p src/assets/icons

echo "✅ 目录创建完成"

# 复制图标文件（如果存在）
if [ -d "icons" ]; then
    echo ""
    echo "🎨 复制图标文件..."
    cp -r icons/* src/assets/icons/ 2>/dev/null || true
    cp icons/*.png . 2>/dev/null || true
    echo "✅ 图标文件复制完成"
fi

# 构建项目
echo ""
echo "🔨 构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "⚠️  构建失败，但可以继续开发"
else
    echo "✅ 构建完成"
fi

# 显示使用说明
echo ""
echo "🎉 初始化完成！"
echo ""
echo "📋 使用说明："
echo "1. 开发模式: npm run dev"
echo "2. 构建生产版本: npm run build"
echo "3. 代码检查: npm run lint"
echo "4. 格式化代码: npm run format"
echo ""
echo "🌐 Chrome 扩展安装："
echo "1. 打开 Chrome 浏览器"
echo "2. 访问 chrome://extensions/"
echo "3. 开启 '开发者模式'"
echo "4. 点击 '加载已解压的扩展程序'"
echo "5. 选择 'dist' 文件夹"
echo ""
echo "🔧 开发调试："
echo "1. 运行 'npm run dev'"
echo "2. 在 Chrome 扩展页面加载 'src' 文件夹"
echo "3. 新建标签页查看效果"
echo ""
echo "📚 更多信息请查看 INSTALL.md"
echo ""
echo "🚀 开始开发吧！"