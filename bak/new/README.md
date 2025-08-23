# 天景 AeScape - 精简版

一个简洁优雅的Chrome扩展，为您的浏览体验增添一丝天气的诗意。

## ✨ 特性

- 🌤️ **实时天气显示** - 自动获取当前位置的天气信息
- 📍 **位置管理** - 支持手动设置城市位置
- 🔄 **自动更新** - 每30分钟自动刷新天气数据
- 🎨 **优雅设计** - 现代化的UI设计，支持深色模式
- 📱 **响应式布局** - 完美适配各种屏幕尺寸
- 🌍 **全球支持** - 基于Open-Meteo API，覆盖全球城市

## 📦 安装

1. 下载或克隆此仓库
2. 打开Chrome浏览器，进入 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `new` 文件夹

## 🔧 功能说明

### 弹出窗口 (Popup)
- 点击扩展图标打开天气信息面板
- 显示当前天气状况、温度和更新时间
- 支持手动刷新天气数据
- 可以手动设置城市位置

### 页面小部件 (Content Script)
- 在所有网页右上角显示简洁的天气信息
- 实时更新，每5分钟自动刷新
- 支持点击交互
- 自动适应页面主题

### 后台服务 (Background)
- 定期获取天气数据
- 管理位置信息
- 处理扩展间通信

## 🛠️ 技术栈

- **Manifest V3** - 最新的Chrome扩展标准
- **Vanilla JavaScript** - 无框架依赖，轻量高效
- **OpenWeatherMap API** - 专业天气数据服务
- **Chrome Storage API** - 本地数据存储
- **CSS3** - 现代化样式，支持毛玻璃效果

## 📁 文件结构

```
new/
├── manifest.json          # 扩展配置文件
├── popup.html            # 弹出窗口页面
├── popup.js              # 弹出窗口逻辑
├── background.js         # 后台服务脚本
├── content.js            # 页面注入脚本
├── css/
│   └── floating-ball.css # 样式文件
├── icon16.png           # 16x16 图标
├── icon32.png           # 32x32 图标
├── icon48.png           # 48x48 图标
└── icon128.png          # 128x128 图标
```

## 🔌 API使用

本扩展使用 [OpenWeatherMap](https://openweathermap.org/) 天气API：

### 📝 API Key配置

**重要**: 使用前需要获取OpenWeatherMap API Key：

1. 访问 [OpenWeatherMap](https://home.openweathermap.org/api_keys)
2. 注册免费账户
3. 获取API Key
4. 在以下文件中替换 `YOUR_API_KEY_HERE`：
   - `background.js` 第189行
   - `popup.js` 第207行

### 🌐 API功能

- **当前天气**: 获取实时天气状况
- **地理编码**: 将城市名称转换为坐标
- **多城市支持**: 覆盖全球20万个城市

## ⚙️ 权限说明

扩展需要以下权限：
- `storage` - 存储用户设置和缓存数据
- `geolocation` - 获取用户位置（可选）
- `https://api.openweathermap.org/*` - 访问天气API

## 🎨 自定义

您可以通过修改以下文件来自定义扩展：

- `popup.html` - 修改弹出窗口布局
- `css/floating-ball.css` - 调整小部件样式
- `popup.js` - 添加新的功能逻辑

## 🐛 问题反馈

如果您遇到任何问题或有改进建议，请：

1. 检查浏览器控制台是否有错误信息
2. 确认网络连接正常
3. 验证API服务是否可用

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [OpenWeatherMap](https://openweathermap.org/) - 提供专业的天气API服务
- Chrome扩展开发者社区 - 技术支持和灵感

---

**让数字生活多一份宁静与美感** 🌸