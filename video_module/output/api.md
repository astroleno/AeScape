# 天景 AeScape - 视频模块 API 文档

## 概述

视频模块是天景 AeScape 的核心组件，提供天气相关的视频动画效果。模块采用单层播放模式，支持晚消失背景过渡，确保平滑的用户体验。

## 核心特性

- ✅ **单层视频播放** - 性能优化，避免双层播放的复杂性
- ✅ **晚消失背景** - 黑幕背景在视频完全消失后才消失，确保自然过渡
- ✅ **统一内容控制** - 黑幕同时控制所有tab内容的显示时机
- ✅ **智能混合模式** - 根据天气类型自动应用合适的CSS混合模式
- ✅ **平滑动画** - 使用requestAnimationFrame确保60fps的流畅动画

## 文件结构

```
video_module/
├── VideoIntroAnimation.js      # 核心动画控制器
├── VideoWeatherManager.js      # 天气视频管理器
├── WeatherTriggerManager.js    # 天气触发管理器
├── AnimationCardSystem.js      # 动画卡片系统
├── TabIntegrationManager.js    # Tab集成管理器
├── weather-video-mapper.js     # 天气视频映射表
├── theme-system.js             # 主题系统（预留）
├── video-intro.css             # 样式文件
├── example.html                # 使用示例
├── README.md                   # 模块说明
└── HANDOVER_DOCUMENT.md        # 交接文档
```

## 核心类

### VideoIntroAnimation

主要的视频动画控制器，负责视频播放、透明度控制和过渡效果。

#### 构造函数

```javascript
const animation = new VideoIntroAnimation(containerId, options);
```

**参数：**
- `containerId` (string): 视频容器的DOM ID
- `options` (object): 配置选项
  - `duration` (number): 视频播放时长（毫秒），默认1500
  - `enhanceEffects` (boolean): 是否启用增强效果，默认false
  - `onStart` (function): 播放开始回调
  - `onEnd` (function): 播放结束回调
  - `onError` (function): 错误回调
  - `onProgress` (function): 进度回调

#### 主要方法

##### play()
开始播放视频动画

```javascript
animation.play();
```

##### pause()
暂停视频播放

```javascript
animation.pause();
```

##### resume()
恢复视频播放

```javascript
animation.resume();
```

##### stop()
停止视频播放

```javascript
animation.stop();
```

##### setVideoSource(src)
设置视频源

```javascript
animation.setVideoSource('../video/tab/r/rain_4.webm');
```

##### destroy()
销毁模块，清理资源

```javascript
animation.destroy();
```

##### getStatus()
获取当前状态

```javascript
const status = animation.getStatus();
// 返回: { isInitialized, isPlaying, useDoubleLayer, enhanceEffects, currentTime, duration, progress }
```

### VideoWeatherManager

天气视频管理器，负责根据天气类型选择合适的视频。

#### 构造函数

```javascript
const weatherManager = new VideoWeatherManager();
```

#### 主要方法

##### init(containerId)
初始化管理器

```javascript
weatherManager.init('video-container');
```

##### playWeatherVideo(weatherType, intensity)
播放指定天气的视频

```javascript
weatherManager.playWeatherVideo('rain', 'medium');
```

**参数：**
- `weatherType` (string): 天气类型 ('clear', 'cloudy', 'rain', 'snow', 'fog', 'thunderstorm')
- `intensity` (string): 强度级别 ('light', 'medium', 'heavy')

##### stopVideo()
停止当前视频

```javascript
weatherManager.stopVideo();
```

### WeatherTriggerManager

天气触发管理器，负责根据天气数据自动触发视频播放。

#### 构造函数

```javascript
const triggerManager = new WeatherTriggerManager(weatherManager);
```

#### 主要方法

##### updateWeather(weatherData)
更新天气数据并触发相应视频

```javascript
triggerManager.updateWeather({
  type: 'rain',
  intensity: 'medium',
  temperature: 15
});
```

##### setAutoPlay(enabled)
设置是否自动播放

```javascript
triggerManager.setAutoPlay(true);
```

### AnimationCardSystem

动画卡片系统，管理多个动画实例。

#### 构造函数

```javascript
const cardSystem = new AnimationCardSystem();
```

#### 主要方法

##### createCard(id, config)
创建动画卡片

```javascript
cardSystem.createCard('card1', {
  containerId: 'container1',
  weatherType: 'rain'
});
```

##### playCard(id)
播放指定卡片

```javascript
cardSystem.playCard('card1');
```

##### destroyCard(id)
销毁指定卡片

```javascript
cardSystem.destroyCard('card1');
```

### TabIntegrationManager

Tab集成管理器，负责与Tab系统的集成。

#### 构造函数

```javascript
const tabManager = new TabIntegrationManager();
```

#### 主要方法

##### init()
初始化Tab集成

```javascript
tabManager.init();
```

##### onTabChange(tabData)
处理Tab切换事件

```javascript
tabManager.onTabChange({
  tabId: 'weather',
  weatherData: { type: 'rain', intensity: 'medium' }
});
```

## 使用示例

### 基础使用

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="video-intro.css">
</head>
<body>
    <div id="video-container"></div>
    
    <script src="VideoIntroAnimation.js"></script>
    <script src="VideoWeatherManager.js"></script>
    <script src="weather-video-mapper.js"></script>
    
    <script>
        // 创建动画实例
        const animation = new VideoIntroAnimation('video-container', {
            duration: 2000,
            onStart: () => console.log('动画开始'),
            onEnd: () => console.log('动画结束')
        });
        
        // 设置视频源并播放
        animation.setVideoSource('../video/tab/r/rain_4.webm');
        animation.play();
    </script>
</body>
</html>
```

### 天气系统集成

```javascript
// 初始化天气管理器
const weatherManager = new VideoWeatherManager();
weatherManager.init('video-container');

// 播放雨天效果
weatherManager.playWeatherVideo('rain', 'medium');

// 使用触发管理器
const triggerManager = new WeatherTriggerManager(weatherManager);
triggerManager.setAutoPlay(true);

// 更新天气数据
triggerManager.updateWeather({
    type: 'snow',
    intensity: 'heavy',
    temperature: -5
});
```

### 多卡片系统

```javascript
// 创建卡片系统
const cardSystem = new AnimationCardSystem();

// 创建多个动画卡片
cardSystem.createCard('card1', {
    containerId: 'container1',
    weatherType: 'rain'
});

cardSystem.createCard('card2', {
    containerId: 'container2',
    weatherType: 'snow'
});

// 播放指定卡片
cardSystem.playCard('card1');
```

## 配置选项

### 视频播放配置

```javascript
const config = {
    duration: 2000,           // 播放时长（毫秒）
    enhanceEffects: false,    // 增强效果
    useDoubleLayer: false,    // 单层模式（固定）
    backgroundTiming: 'late'  // 晚消失模式（固定）
};
```

### 天气类型配置

```javascript
const weatherConfig = {
    clear: {
        blendMode: 'lighten',
        hasAlpha: true
    },
    rain: {
        blendMode: 'screen',
        hasAlpha: false
    },
    snow: {
        blendMode: 'screen',
        hasAlpha: false
    },
    thunderstorm: {
        blendMode: 'overlay',
        hasAlpha: false
    }
};
```

## 事件系统

### 事件监听

```javascript
animation.on('start', () => console.log('动画开始'));
animation.on('end', () => console.log('动画结束'));
animation.on('error', (error) => console.error('动画错误', error));
```

### 自定义事件

```javascript
// 触发自定义事件
animation.trigger('weatherChange', { type: 'rain', intensity: 'medium' });

// 监听自定义事件
animation.on('weatherChange', (data) => {
    console.log('天气变化:', data);
});
```

## 错误处理

### 常见错误

1. **视频加载失败**
   ```javascript
   animation.on('error', (error) => {
       console.error('视频加载失败:', error);
       // 使用备用视频或显示错误信息
   });
   ```

2. **容器不存在**
   ```javascript
   try {
       const animation = new VideoIntroAnimation('non-existent-container');
   } catch (error) {
       console.error('容器不存在:', error);
   }
   ```

3. **视频格式不支持**
   ```javascript
   // 检查浏览器支持
   if (!document.createElement('video').canPlayType('video/webm')) {
       console.warn('浏览器不支持WebM格式');
   }
   ```

## 性能优化

### 最佳实践

1. **预加载视频**
   ```javascript
   // 预加载常用视频
   const preloadVideos = [
       '../video/tab/r/rain_4.webm',
       '../video/tab/s/snow_1.webm'
   ];
   
   preloadVideos.forEach(src => {
       const video = document.createElement('video');
       video.src = src;
       video.preload = 'metadata';
   });
   ```

2. **及时销毁**
   ```javascript
   // 页面卸载时清理资源
   window.addEventListener('beforeunload', () => {
       animation.destroy();
   });
   ```

3. **避免频繁创建**
   ```javascript
   // 重用动画实例
   const animation = new VideoIntroAnimation('container');
   
   // 切换视频源而不是重新创建
   animation.setVideoSource(newSrc);
   animation.play();
   ```

## 浏览器兼容性

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

### 特性检测

```javascript
// 检查requestAnimationFrame支持
if (!window.requestAnimationFrame) {
    console.warn('浏览器不支持requestAnimationFrame');
}

// 检查WebM支持
const video = document.createElement('video');
if (!video.canPlayType('video/webm')) {
    console.warn('浏览器不支持WebM格式');
}
```

## 更新日志

### v1.0.0 (当前版本)
- ✅ 实现单层视频播放
- ✅ 实现晚消失背景过渡
- ✅ 实现统一内容控制
- ✅ 实现智能混合模式
- ✅ 实现平滑动画效果
- ✅ 完成API文档

---

*本文档最后更新：2025年8月27日*