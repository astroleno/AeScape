# 天景 AeScape 🌤️

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-repo/aescape)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**让每一次打开新标签页，都成为一次与自然的诗意邂逅。**

天景 AeScape 是一款开源的 Chrome 扩展，它将您的新标签页转变为实时天气的沉浸式动态画布，并在页面中加入常驻天气悬浮球，随时感受天空的变化。

---

## ✨ 功能特性

- **实时天气背景**：根据当地天气自动切换动态场景（晴、云、雨、雪、雾、雷暴）
- **沉浸式动画**：WebGL/Three.js 渲染，流畅且低功耗
- **极简信息展示**：显示当前时间、城市与温度
- **自动位置检测**：首次使用时自动请求位置，缓存本地
- **常驻悬浮球**：在右下角显示天气状态（图标+温度），点击展开更多详情
- **轻量高效**：CPU 占用低，后台标签页自动暂停
- **完全开源**：无广告，无追踪

---

## 🚀 安装与使用

### 1. Chrome 商店安装 (待发布)

### 2. 本地开发版本

```bash
git clone https://github.com/your-repo/aescape.git
cd aescape
npm install
npm run dev
打开 Chrome → chrome://extensions

启用 “开发者模式”

点击 “加载已解压的扩展程序”

选择 dist/

现在新建一个标签页，即可体验天景 AeScape！

🛠️ 技术栈
前端: HTML5, CSS3, JavaScript (ES6+)

动画渲染: WebGL (Three.js)

天气 API: OpenWeatherMap

构建工具: Vite

图标: Feather / Tabler

🗺️ 路线图
 v1.0: 动态天气背景 + 悬浮球基础功能

 v1.2: 手动城市设置、更多视觉主题

 v1.5: 搜索框 + 常用链接

 v2.0: 小组件系统（待办事项、笔记等）

🤝 贡献
欢迎提交 Issue 或 PR，一起让 天景 AeScape 更加美好。

📄 许可证
MIT License