# 天景 AeScape - 视频模块集成指南

## 概述

本文档详细说明如何将视频模块集成到现有项目中，包括文件引入、初始化配置、API调用和最佳实践。

## 快速开始

### 1. 文件引入

将以下文件复制到你的项目中：

```bash
# 核心文件
VideoIntroAnimation.js      # 核心动画控制器
VideoWeatherManager.js      # 天气视频管理器
WeatherTriggerManager.js    # 天气触发管理器
weather-video-mapper.js     # 天气视频映射表
video-intro.css             # 样式文件

# 可选文件
AnimationCardSystem.js      # 动画卡片系统（多实例管理）
TabIntegrationManager.js    # Tab集成管理器
theme-system.js             # 主题系统（预留）
```

### 2. HTML结构

在你的HTML页面中添加视频容器：

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>你的项目</title>
    
    <!-- 引入视频模块样式 -->
    <link rel="stylesheet" href="path/to/video-intro.css">
</head>
<body>
    <!-- 你的页面内容 -->
    <div class="your-content">
        <h1>天气信息</h1>
        <div class="weather-info">
            <!-- 天气相关内容 -->
        </div>
    </div>
    
    <!-- 视频容器（固定定位，覆盖整个页面） -->
    <div id="video-container"></div>
    
    <!-- 引入视频模块脚本 -->
    <script src="path/to/VideoIntroAnimation.js"></script>
    <script src="path/to/VideoWeatherManager.js"></script>
    <script src="path/to/weather-video-mapper.js"></script>
    
    <script>
        // 你的集成代码
    </script>
</body>
</html>
```

### 3. 基础集成

```javascript
// 创建视频管理器实例
const weatherManager = new VideoWeatherManager();

// 初始化
weatherManager.init('video-container');

// 播放雨天效果
weatherManager.playWeatherVideo('rain', 'medium');
```

## 详细集成步骤

### 步骤1：环境准备

确保你的项目环境满足以下要求：

```javascript
// 检查浏览器支持
function checkBrowserSupport() {
    const video = document.createElement('video');
    
    const support = {
        webm: video.canPlayType('video/webm'),
        vp9: video.canPlayType('video/webm; codecs="vp9"'),
        requestAnimationFrame: !!window.requestAnimationFrame
    };
    
    if (!support.webm || !support.requestAnimationFrame) {
        console.warn('浏览器可能不完全支持视频模块功能');
    }
    
    return support;
}

// 在页面加载时检查
document.addEventListener('DOMContentLoaded', checkBrowserSupport);
```

### 步骤2：模块初始化

```javascript
// 创建全局管理器实例
let weatherManager = null;
let triggerManager = null;

// 初始化函数
function initVideoModule() {
    try {
        // 创建天气管理器
        weatherManager = new VideoWeatherManager();
        weatherManager.init('video-container');
        
        // 创建触发管理器
        triggerManager = new WeatherTriggerManager(weatherManager);
        triggerManager.setAutoPlay(true);
        
        console.log('视频模块初始化成功');
        
    } catch (error) {
        console.error('视频模块初始化失败:', error);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initVideoModule);
```

### 步骤3：天气数据集成

```javascript
// 假设你有一个天气API
async function updateWeather(weatherData) {
    try {
        // 更新你的天气显示
        updateWeatherDisplay(weatherData);
        
        // 触发视频播放
        if (triggerManager) {
            triggerManager.updateWeather(weatherData);
        }
        
    } catch (error) {
        console.error('更新天气失败:', error);
    }
}

// 示例：从API获取天气数据
async function fetchWeatherData(city) {
    const response = await fetch(`/api/weather/${city}`);
    const weatherData = await response.json();
    
    // 转换数据格式
    return {
        type: weatherData.condition, // 'rain', 'snow', 'clear', etc.
        intensity: weatherData.intensity, // 'light', 'medium', 'heavy'
        temperature: weatherData.temperature,
        humidity: weatherData.humidity
    };
}

// 定期更新天气
setInterval(async () => {
    const weatherData = await fetchWeatherData('beijing');
    updateWeather(weatherData);
}, 300000); // 每5分钟更新一次
```

### 步骤4：事件处理

```javascript
// 监听视频模块事件
weatherManager.on('start', () => {
    console.log('天气视频开始播放');
    // 可以在这里添加UI反馈
});

weatherManager.on('end', () => {
    console.log('天气视频播放结束');
    // 可以在这里清理状态
});

weatherManager.on('error', (error) => {
    console.error('天气视频播放错误:', error);
    // 可以在这里显示错误信息
});
```

## 高级集成

### 多实例管理

如果你的项目需要多个视频实例：

```javascript
// 使用动画卡片系统
const cardSystem = new AnimationCardSystem();

// 创建多个视频容器
const containers = ['container1', 'container2', 'container3'];

containers.forEach((containerId, index) => {
    cardSystem.createCard(`card_${index}`, {
        containerId: containerId,
        weatherType: ['rain', 'snow', 'clear'][index]
    });
});

// 播放指定卡片
function playCard(cardId) {
    cardSystem.playCard(cardId);
}

// 销毁指定卡片
function destroyCard(cardId) {
    cardSystem.destroyCard(cardId);
}
```

### Tab系统集成

如果你的项目有Tab切换功能：

```javascript
// 使用Tab集成管理器
const tabManager = new TabIntegrationManager();

// 初始化
tabManager.init();

// 监听Tab切换事件
function onTabChange(tabData) {
    // 更新Tab内容
    updateTabContent(tabData);
    
    // 触发视频播放
    tabManager.onTabChange(tabData);
}

// 示例Tab数据结构
const tabData = {
    tabId: 'weather',
    weatherData: {
        type: 'rain',
        intensity: 'medium',
        temperature: 15
    }
};
```

### 主题系统集成

```javascript
// 主题系统集成（预留功能）
const themeSystem = new ThemeSystem();

// 设置主题
themeSystem.setTheme('dark');

// 监听主题变化
themeSystem.on('themeChange', (theme) => {
    // 更新视频模块主题
    updateVideoTheme(theme);
});
```

## 配置选项

### 基础配置

```javascript
// 视频管理器配置
const weatherManagerConfig = {
    // 播放时长
    duration: 2000,
    
    // 是否启用增强效果
    enhanceEffects: false,
    
    // 自动播放
    autoPlay: true,
    
    // 预加载策略
    preload: 'metadata'
};

// 创建管理器时传入配置
const weatherManager = new VideoWeatherManager(weatherManagerConfig);
```

### 高级配置

```javascript
// 高级配置选项
const advancedConfig = {
    // 性能配置
    performance: {
        enableMonitoring: true,
        sampleRate: 0.1
    },
    
    // 错误处理
    errorHandling: {
        enableReporting: true,
        fallbackVideo: '../video/tab/c/cloudy_1.webm'
    },
    
    // 缓存配置
    cache: {
        enableCache: true,
        cacheDuration: 3600
    }
};
```

## 最佳实践

### 1. 性能优化

```javascript
// 预加载常用视频
function preloadVideos() {
    const commonVideos = [
        '../video/tab/r/rain_4.webm',
        '../video/tab/s/snow_1.webm',
        '../video/tab/c/cloudy_1.webm'
    ];
    
    commonVideos.forEach(src => {
        const video = document.createElement('video');
        video.src = src;
        video.preload = 'metadata';
    });
}

// 页面加载时预加载
document.addEventListener('DOMContentLoaded', preloadVideos);
```

### 2. 错误处理

```javascript
// 全局错误处理
window.addEventListener('error', (event) => {
    if (event.target.tagName === 'VIDEO') {
        console.error('视频错误:', event.error);
        
        // 使用备用视频
        const fallbackVideo = '../video/tab/c/cloudy_1.webm';
        event.target.src = fallbackVideo;
    }
});
```

### 3. 内存管理

```javascript
// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    if (weatherManager) {
        weatherManager.destroy();
    }
    
    if (cardSystem) {
        cardSystem.destroyAll();
    }
});
```

### 4. 响应式设计

```css
/* 移动端适配 */
@media (max-width: 768px) {
    #video-container {
        /* 移动端特定样式 */
    }
}

/* 高分辨率屏幕 */
@media (min-resolution: 2dppx) {
    .intro-video {
        /* 高分辨率优化 */
    }
}
```

## 常见问题

### Q1: 视频无法播放
**A**: 检查以下几点：
1. 视频文件路径是否正确
2. 浏览器是否支持WebM格式
3. 视频文件是否损坏
4. 网络连接是否正常

### Q2: 视频加载缓慢
**A**: 优化建议：
1. 使用CDN加速
2. 启用视频预加载
3. 压缩视频文件
4. 使用适当的视频格式

### Q3: 内存占用过高
**A**: 解决方案：
1. 及时销毁不需要的实例
2. 避免同时播放多个视频
3. 使用单层播放模式
4. 定期清理缓存

### Q4: 混合模式不生效
**A**: 检查：
1. CSS混合模式是否正确设置
2. 父元素是否影响混合模式
3. 浏览器是否支持该混合模式
4. 视频格式是否支持透明度

## 调试技巧

### 启用调试模式

```javascript
// 调试模式配置
const DEBUG_MODE = true;

if (DEBUG_MODE) {
    // 启用详细日志
    console.log('视频模块调试模式已启用');
    
    // 监控所有事件
    weatherManager.on('*', (event, data) => {
        console.log(`事件: ${event}`, data);
    });
    
    // 监控性能
    setInterval(() => {
        const status = weatherManager.getStatus();
        console.log('模块状态:', status);
    }, 1000);
}
```

### 性能监控

```javascript
// 性能监控
function monitorPerformance() {
    const startTime = performance.now();
    
    weatherManager.on('start', () => {
        const loadTime = performance.now() - startTime;
        console.log(`视频加载时间: ${loadTime}ms`);
    });
}
```

## 部署检查清单

### 生产环境部署前检查：

- [ ] 所有视频文件已上传到CDN
- [ ] 视频文件路径配置正确
- [ ] 浏览器兼容性测试通过
- [ ] 性能测试达标
- [ ] 错误监控已配置
- [ ] 缓存策略已设置
- [ ] 移动端适配完成
- [ ] 文档已更新

### 监控指标：

- [ ] 视频加载成功率 > 95%
- [ ] 平均加载时间 < 2秒
- [ ] 内存使用率 < 100MB
- [ ] 错误率 < 1%

---

*集成指南最后更新：2025年8月27日*