# AeScape 视频模块交接文档

## 🎯 项目概述

AeScape 视频模块是 Chrome 扩展插件 `chrome_store` 的核心功能组件，提供"天气驱动的沉浸式抽卡系统"。当用户打开新标签页时，根据当前天气状况播放1.5秒的沉浸式视频动画，实现"天空扑面而来 → 迅速退场，回归极简"的体验。

### 架构关系
```
chrome_store/ (主插件)
├── newtab.html (新标签页)
├── js/newtab.js (新标签页逻辑) ← 调用视频模块
├── popup.html (弹窗设置)
└── 其他插件文件...

video_module/ (视频功能模块) ← 服务提供者
├── 各种视频组件
├── 抽卡系统
└── 供插件调用的API
```

## 📊 当前状态

### ✅ 已完成组件

#### 1. VideoIntroAnimation 组件 ✅
```javascript
// 已封装完成
class VideoIntroAnimation {
  constructor(containerSelector, options = {})
  play(videoPath, config = {})
  stop()
  setVideoSource(src)
  updateOpacity()
  hideVideo()
}
```

#### 2. VideoWeatherManager 组件 ✅
```javascript
// 已封装完成
class VideoWeatherManager {
  constructor(containerSelector, options = {})
  playWeatherVideo(weatherType, config = {})
  stopVideo()
  setVideoSource(src)
}
```

#### 3. WeatherVideoMapper 组件 ✅
```javascript
// 已封装完成
class WeatherVideoMapper {
  getVideoForWeather(weatherType)
  getSupportedWeatherTypes()
  hasVideoForWeather(weatherType)
}
```

#### 4. 样式系统 ✅
- `video-intro.css` - 完整的视频样式系统
- 支持混合模式（lighten/screen/overlay）
- 全屏覆盖和过渡动画

#### 5. 核心抽卡系统 ✅
```javascript
// 已封装完成
class WeatherTriggerManager {
  shouldTriggerAnimation(currentWeather)
  checkWeatherChange(currentWeather)
  checkDurationTrigger(currentWeather)
  reset()
  getStatus()
}

class AnimationCardSystem {
  drawCard(weatherType)
  getAnimationPool(weatherType)
  filterAvailableVideos(pool, weatherType)
  updatePlayHistory(weatherType, video)
  reset()
  getStats()
}
```

#### 6. 视频模块管理器 ✅
```javascript
// 已封装完成
class TabIntegrationManager {
  async initializeTab(data, callbacks = {})  // 插件调用的主要接口
  shouldPlayAnimation(weather, settings)     // 判断是否播放动画
  async playAnimation(video, weather, theme) // 播放动画
  manualTrigger(weatherType, theme)          // 手动触发（测试用）
  stop()                                     // 停止播放
  reset()                                    // 重置状态
  getStatus()                                // 获取状态
  destroy()                                  // 销毁实例
}
```

#### 7. 配置文件 ✅
- `config/trigger-rules.json` - 触发规则配置
- 支持性能阈值、天气类型配置

### ❌ 待开发组件

#### 1. 沉浸式过渡系统
```javascript
// 需要创建：ImmersiveTransition.js
class ImmersiveTransition {
  createSeamlessTransition()
  extractVideoFrame()
  applyDynamicBackground()
}
```

#### 2. 用户体验控制器
```javascript
// 需要创建：UserExperienceController.js
class UserExperienceController {
  shouldPlayAnimation(weatherState)
  recordPlay(weatherType, videoId)
  loadUserPreferences()
}
```

#### 3. 存储管理系统
```javascript
// 需要创建：StorageManager.js
class StorageManager {
  savePlayHistory(playRecord)
  getUserPreferences()
  getDefaultPreferences()
}
```

#### 4. 特效系统
```javascript
// 需要创建：SpecialEffectsManager.js
class SpecialEffectsManager {
  createRainGlassEffect()
  createCloudTunnelEffect()
  createLightningEffect()
}
```

## 🔌 插件调用接口

### 插件如何调用视频模块
```javascript
// 在 chrome_store/js/newtab.js 中
import { TabIntegrationManager } from '../video_module/TabIntegrationManager.js';

// 1. 创建视频模块实例
const videoManager = new TabIntegrationManager('#video-container', {
  duration: 1500,
  enhanceEffects: true
});

// 2. 插件获取天气数据后，调用视频模块
const result = await videoManager.initializeTab({
  weather: {
    type: 'rain', // clear, cloudy, rain, snow, fog, thunderstorm
    temperature: 15,
    humidity: 80
  },
  theme: {
    primaryColor: '#4A90E2',
    backgroundColor: '#1A1A1A',
    textColor: '#FFFFFF'
  },
  settings: {
    animationEnabled: true,
    maxDailyPlays: 10,
    preferredDuration: 1500
  }
}, {
  // 3. 设置回调函数，接收视频模块的通知
  onVideoStart: (weatherType, videoInfo) => {
    console.log('视频开始播放:', weatherType);
    // 插件可以在这里隐藏其他UI元素
  },
  onVideoEnd: (weatherType, videoInfo) => {
    console.log('视频播放结束:', weatherType);
    // 插件可以在这里显示其他UI元素
  },
  onAnimationComplete: () => {
    console.log('动画完全结束');
    // 插件可以在这里显示完整的tab内容
  },
  onError: (error) => {
    console.error('视频模块错误:', error);
    // 插件可以在这里处理错误
  }
});
```

### 接口说明
- **插件是调用方**：插件主动调用视频模块的API
- **视频模块是服务方**：视频模块提供动画播放服务
- **数据流向**：插件 → 视频模块（天气数据、主题设置）
- **通知流向**：视频模块 → 插件（播放状态、错误信息）

## 🎨 沉浸感实现方案

### 视觉层次设计
```
层级结构（从下到上）：
1. 视频背景层 (z-index: 1) - 天气视频效果
2. 渐变融合层 (z-index: 2) - 视频到tab的过渡
3. Tab背景层 (z-index: 3) - 提取的视频帧背景
4. 内容层 (z-index: 4) - 时间、天气、搜索框等
```

### 过渡流程设计
```
时间轴（1.5秒）：
0ms    → 黑色背景，视频开始
750ms  → 视频效果，背景渐变出现
1000ms → 视频淡出，tab背景融合
1500ms → 完全显示tab界面
```

## 🌟 沉浸感提升建议

### 1. 感官体验增强
- **动态视差效果**：视频播放时的轻微视差移动
- **光效增强**：根据天气类型的动态光效
- **色彩渐变**：保持天气相关的色彩主题

### 2. 交互体验优化
- **鼠标跟随**：背景的轻微响应
- **悬停效果**：重要元素的视觉反馈
- **点击涟漪**：点击时的扩散效果

### 3. 心理体验设计
- **期待感营造**：预加载提示和渐进式显示
- **仪式感强化**：独特的开场和优雅收尾

## 🚀 开发路径规划

### 第一阶段：核心抽卡系统（1-2天）
1. **创建 `WeatherTriggerManager.js`**
   - 双触发路由（天气变化+持续时间）
   - 集成现有视频系统

2. **创建 `AnimationCardSystem.js`**
   - 智能抽卡算法
   - 权重随机选择，避免重复

### 第二阶段：插件接口对接（1-2天）
1. **创建 `TabIntegrationManager.js`**
   - 视频模块的主要入口类
   - 集成所有组件
   - 提供插件调用的API接口

2. **创建配置文件**
   - `config/animation-pools.json` - 动画池配置
   - `config/trigger-rules.json` - 触发规则

### 第三阶段：沉浸感增强（1周）
1. **创建 `ImmersiveTransition.js`**
   - 视频帧提取
   - 背景融合系统

2. **创建 `SpecialEffectsManager.js`**
   - 彩蛋特效系统
   - 动态滤镜

### 第四阶段：Chrome扩展集成（1周）
1. **修改 `chrome_store/js/newtab.js`**
   - 集成视频模块调用
   - 处理天气数据获取
   - 管理视频播放流程

2. **修改 `chrome_store/popup.html`**
   - 添加视频模块设置选项
   - 用户偏好配置

### 第五阶段：用户体验优化（1周）
1. **创建 `UserExperienceController.js`**
   - 智能触发逻辑
   - 用户偏好管理

2. **创建 `StorageManager.js`**
   - 播放历史记录
   - 数据清理机制

### 第六阶段：测试和优化（1周）
1. **单元测试**
2. **性能优化**
3. **用户体验测试**

## 🔧 技术实现要点

### 1. 视频帧提取
```javascript
function extractVideoFrame(videoElement) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  ctx.drawImage(videoElement, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.8);
}
```

### 2. 沉浸感增强技术
```javascript
// 视差效果
function createParallaxEffect() {
  document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    document.querySelector('.video-background').style.transform = 
      `translate(${x}px, ${y}px)`;
  });
}
```

## 📋 文件清单

### 已完成文件 ✅
- `VideoIntroAnimation.js` - 视频播放核心
- `VideoWeatherManager.js` - 天气视频管理
- `weather-video-mapper.js` - 视频映射
- `video-intro.css` - 基础样式
- `example.html` - 测试页面
- `WeatherTriggerManager.js` - 天气触发管理 ✅
- `AnimationCardSystem.js` - 抽卡算法 ✅
- `TabIntegrationManager.js` - Tab集成管理器（主要入口）✅
- `config/trigger-rules.json` - 触发规则 ✅
- `test-integration.html` - 集成测试页面 ✅

### 待创建文件 🔄
- `ImmersiveTransition.js` - 沉浸式过渡
- `UserExperienceController.js` - 用户体验控制
- `StorageManager.js` - 存储管理
- `SpecialEffectsManager.js` - 特效系统
- `config/animation-pools.json` - 动画池配置

## 🎯 成功标准

### 功能标准
- [ ] 双触发路由正常工作
- [ ] 抽卡算法避免重复
- [ ] 视频与tab无缝集成
- [ ] 沉浸式过渡效果
- [ ] 插件API接口完整

### 性能标准
- [ ] 动画流畅度 > 60fps
- [ ] 加载时间 < 500ms
- [ ] 内存使用 < 100MB
- [ ] 不影响tab打开速度

### 用户体验标准
- [ ] 视觉冲击力强
- [ ] 操作响应及时
- [ ] 整体体验沉浸
- [ ] 用户满意度 > 4.5/5

## 🔄 交接建议

1. **优先实现 `TabIntegrationManager.js`** - 这是视频模块的主要入口类
2. **逐步完善抽卡系统** - 从触发到抽卡到播放
3. **持续测试优化** - 每个阶段都要充分测试
4. **保持模块化设计** - 便于插件调用

---

**总结**：当前视频播放核心已完成，需要实现抽卡系统和插件接口对接。重点是创建 `TabIntegrationManager.js` 作为视频模块的主要入口，通过清晰的API接口供插件调用。
