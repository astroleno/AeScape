# 天景 AeScape - 安装和开发指南

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 开发模式
```bash
npm run dev
```

### 3. 构建生产版本
```bash
npm run build
```

### 4. 代码检查
```bash
npm run lint
npm run format
```

## Chrome 扩展安装

### 方法一：开发者模式安装

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的 "开发者模式"
4. 点击 "加载已解压的扩展程序"
5. 选择项目的 `dist` 文件夹

### 方法二：本地开发测试

1. 运行 `npm run dev`
2. 在 Chrome 扩展页面加载 `src` 文件夹
3. 新建标签页即可看到效果

## 项目结构

```
src/
├── js/
│   ├── weather/           # Three.js 天气渲染引擎
│   │   ├── engine.js      # 主渲染引擎
│   │   └── ...            # 其他渲染模块
│   ├── data/              # 数据获取模块
│   │   ├── sun.js         # 太阳位置计算
│   │   └── weather.js     # 天气数据获取
│   ├── background.js      # Service Worker 后台服务
│   ├── content.js         # 悬浮球注入脚本
│   └── ui.js              # UI 交互逻辑
├── css/
│   └── floating-ball.css  # 悬浮球样式
├── index.html             # 新标签页
├── floating-ball.html     # 悬浮球页面
└── popup.html            # 扩展弹出页面
```

## 功能特性

### 核心功能
- ✅ 实时天气渲染（Three.js）
- ✅ 真实太阳位置计算
- ✅ 空气质量显示
- ✅ 跨页面悬浮球
- ✅ 智能缓存机制

### 天气效果
- ✅ 晴天、多云、雨天、雪天
- ✅ 雾天、雷暴
- ✅ 动态光照
- ✅ 粒子系统

### 性能优化
- ✅ 后台标签页自动暂停
- ✅ 动态质量调整
- ✅ 智能缓存策略
- ✅ GPU 加速渲染

## 技术栈

- **前端**: 原生 JavaScript (ES6+)
- **3D渲染**: Three.js
- **数据源**: Open-Meteo (免费)
- **太阳计算**: suncalc
- **构建工具**: Vite
- **代码规范**: ESLint + Prettier

## API 文档

### 天气状态接口
```javascript
interface WeatherState {
  location: {
    lat: number;
    lon: number;
    name: string;
    timezone: string;
  };
  sun: {
    altitudeDeg: number;
    azimuthDeg: number;
  };
  weather: {
    code: 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog' | 'thunderstorm';
    precipIntensity: number;
    precipType: 'rain' | 'snow';
    visibilityKm: number;
    windSpeedMps: number;
    windDirDeg: number;
    thunderProb: number;
  };
  air: {
    aqi: number;
    pm25: number;
    pm10: number;
  };
  env: {
    isNight: boolean;
    temperature: number;
  };
}
```

### 消息接口
```javascript
// 获取当前天气
chrome.runtime.sendMessage({
  type: 'weather.getCurrent'
})

// 设置位置
chrome.runtime.sendMessage({
  type: 'location.set',
  location: { lat: 39.9042, lon: 116.4074, name: '北京' }
})

// 强制更新天气数据
chrome.runtime.sendMessage({
  type: 'weather.forceUpdate'
})
```

## 常见问题

### Q: 为什么天气数据不准确？
A: Open-Meteo 是免费的天气数据源，精度可能不如付费服务。可以在设置中手动调整位置。

### Q: 悬浮球不显示怎么办？
A: 检查扩展权限是否正确授予，确保在扩展设置中启用了"在所有网站上运行"。

### Q: 性能太差怎么办？
A: 在设置中降低质量等级，或关闭复杂的天气效果。

### Q: 如何调试？
A: 打开 Chrome 开发者工具，查看 Console 和 Network 面板的错误信息。

## 开发指南

### 添加新的天气效果
1. 在 `src/js/weather/` 目录下创建新的效果模块
2. 在 `engine.js` 中注册新的效果
3. 更新 `applyWeatherState` 方法

### 修改数据源
1. 在 `src/js/data/weather.js` 中修改 API 调用
2. 更新数据转换方法
3. 测试新的数据格式

### 自定义样式
1. 修改 `src/css/` 目录下的 CSS 文件
2. 更新 HTML 模板
3. 测试不同屏幕尺寸

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

- GitHub Issues: [提交问题](https://github.com/your-repo/aescape/issues)
- 邮箱: your-email@example.com

---

**最后更新**: 2025-08-22