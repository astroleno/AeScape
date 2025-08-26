# AeScape 天气驱动沉浸式抽卡系统 - 技术实现方案

## 🎯 系统概述

基于 `mech.md` 的设计理念，实现一套"天气驱动的沉浸式抽卡系统"，让用户在新标签页打开时获得"天井仪式"般的体验。

## 🏗️ 系统架构

### 核心模块
```
video_module/
├── WeatherTriggerManager.js     # 天气触发管理器
├── AnimationCardSystem.js       # 动画抽卡系统
├── VideoPoolManager.js          # 视频池管理器
├── UserExperienceController.js  # 用户体验控制器
├── StorageManager.js            # 存储管理器
└── config/
    ├── animation-pools.json     # 动画池配置
    ├── trigger-rules.json       # 触发规则配置
    └── user-preferences.json    # 用户偏好配置
```

## 🔄 双触发路由实现

### 1. 天气变化触发
```javascript
// WeatherTriggerManager.js
class WeatherTriggerManager {
  constructor() {
    this.lastWeatherState = null;
    this.weatherChangeThreshold = 5 * 60 * 1000; // 5分钟变化阈值
  }

  // 检测天气变化
  checkWeatherChange(currentWeather) {
    const hasChanged = this.lastWeatherState !== currentWeather;
    const timeSinceLastChange = Date.now() - this.lastChangeTime;
    
    if (hasChanged && timeSinceLastChange > this.weatherChangeThreshold) {
      this.lastWeatherState = currentWeather;
      this.lastChangeTime = Date.now();
      return { shouldTrigger: true, reason: 'weather_change' };
    }
    
    return { shouldTrigger: false, reason: 'no_change' };
  }
}
```

### 2. 天气持续触发
```javascript
// 长时间同一天气的触发机制
checkDurationTrigger(currentWeather) {
  const timeSinceLastTrigger = Date.now() - this.lastTriggerTime;
  const durationThreshold = 30 * 60 * 1000; // 30分钟
  
  if (timeSinceLastTrigger > durationThreshold) {
    return { shouldTrigger: true, reason: 'duration_trigger' };
  }
  
  return { shouldTrigger: false, reason: 'too_soon' };
}
```

## 🎲 动画抽卡机制

### 1. 动画池配置
```json
// animation-pools.json
{
  "clear": {
    "name": "晴天动画池",
    "videos": [
      {
        "id": "clear_001",
        "path": "../video/tab/c/cloudy_1.webm",
        "weight": 80,
        "type": "normal",
        "description": "底视角云层扑面"
      },
      {
        "id": "clear_002", 
        "path": "../video/tab/c/cloudy_2.webm",
        "weight": 15,
        "type": "special",
        "description": "云层穿越彩蛋"
      },
      {
        "id": "clear_003",
        "path": "../video/tab/c/cloudy_3.webm", 
        "weight": 5,
        "type": "rare",
        "description": "极光云层特效"
      }
    ]
  },
  "rain": {
    "name": "雨天动画池",
    "videos": [
      {
        "id": "rain_001",
        "path": "../video/tab/r/rain_4.webm",
        "weight": 70,
        "type": "normal", 
        "description": "底视角雨滴扑面"
      },
      {
        "id": "rain_002",
        "path": "../video/tab/r/rain_5.webm",
        "weight": 20,
        "type": "special",
        "description": "雨打玻璃效果"
      },
      {
        "id": "rain_003", 
        "path": "../video/tab/r/rain_6.webm",
        "weight": 10,
        "type": "rare",
        "description": "雷雨交加特效"
      }
    ]
  }
}
```

### 2. 抽卡算法
```javascript
// AnimationCardSystem.js
class AnimationCardSystem {
  constructor() {
    this.lastPlayedVideo = null;
    this.consecutivePlays = {};
  }

  // 智能抽卡算法
  drawCard(weatherType) {
    const pool = this.getAnimationPool(weatherType);
    const availableVideos = this.filterAvailableVideos(pool, weatherType);
    
    // 权重计算
    const totalWeight = availableVideos.reduce((sum, video) => sum + video.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const video of availableVideos) {
      random -= video.weight;
      if (random <= 0) {
        return video;
      }
    }
    
    return availableVideos[0]; // 兜底
  }

  // 避免连续重复
  filterAvailableVideos(pool, weatherType) {
    const lastVideo = this.lastPlayedVideo;
    const consecutiveCount = this.consecutivePlays[weatherType] || 0;
    
    return pool.videos.filter(video => {
      // 如果连续播放3次相同视频，强制换一个
      if (video.id === lastVideo?.id && consecutiveCount >= 3) {
        return false;
      }
      return true;
    });
  }
}
```

## 🎮 用户体验控制器

### 1. 体验节奏管理
```javascript
// UserExperienceController.js
class UserExperienceController {
  constructor() {
    this.dailyPlayCount = 0;
    this.lastPlayDate = null;
    this.userPreferences = this.loadUserPreferences();
  }

  // 决定是否播放动画
  shouldPlayAnimation(weatherState) {
    // 检查用户偏好
    if (this.userPreferences.animationDisabled) {
      return false;
    }

    // 检查每日播放限制
    if (this.dailyPlayCount >= this.userPreferences.maxDailyPlays) {
      return false;
    }

    // 检查触发条件
    const weatherTrigger = this.weatherTriggerManager.checkWeatherChange(weatherState);
    const durationTrigger = this.weatherTriggerManager.checkDurationTrigger(weatherState);

    return weatherTrigger.shouldTrigger || durationTrigger.shouldTrigger;
  }

  // 记录播放
  recordPlay(weatherType, videoId) {
    this.dailyPlayCount++;
    this.lastPlayDate = new Date().toDateString();
    this.storageManager.savePlayHistory({
      date: this.lastPlayDate,
      weatherType,
      videoId,
      timestamp: Date.now()
    });
  }
}
```

## 💾 存储管理

### 1. 本地存储结构
```javascript
// StorageManager.js
class StorageManager {
  constructor() {
    this.storageKey = 'aescape_animation_data';
  }

  // 保存播放历史
  savePlayHistory(playRecord) {
    const history = this.getPlayHistory();
    history.push(playRecord);
    
    // 只保留最近30天的记录
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const filteredHistory = history.filter(record => record.timestamp > thirtyDaysAgo);
    
    localStorage.setItem(this.storageKey, JSON.stringify(filteredHistory));
  }

  // 获取播放历史
  getPlayHistory() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  // 获取用户偏好
  getUserPreferences() {
    const data = localStorage.getItem('aescape_user_preferences');
    return data ? JSON.parse(data) : this.getDefaultPreferences();
  }

  // 默认偏好设置
  getDefaultPreferences() {
    return {
      animationEnabled: true,
      maxDailyPlays: 10,
      preferredDuration: 1500, // 1.5秒
      soundEnabled: false,
      quality: 'high' // high, medium, low
    };
  }
}
```

## 🎨 视觉效果增强

### 1. 彩蛋特效系统
```javascript
// SpecialEffectsManager.js
class SpecialEffectsManager {
  constructor() {
    this.effects = {
      'rain_glass': this.createRainGlassEffect,
      'cloud_tunnel': this.createCloudTunnelEffect,
      'lightning_storm': this.createLightningEffect
    };
  }

  // 雨打玻璃效果
  createRainGlassEffect(videoElement) {
    const overlay = document.createElement('div');
    overlay.className = 'rain-glass-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
      animation: rainGlass 2s infinite;
      pointer-events: none;
      z-index: 1000;
    `;
    
    videoElement.parentElement.appendChild(overlay);
  }

  // 云层穿越效果
  createCloudTunnelEffect(videoElement) {
    // 添加径向模糊和速度线效果
    videoElement.style.filter = 'blur(2px) brightness(1.2)';
    
    const speedLines = document.createElement('div');
    speedLines.className = 'speed-lines';
    // 实现速度线动画...
  }
}
```

## 🔧 集成到Chrome扩展

### 1. 新标签页集成
```javascript
// 在chrome_store/js/newtab.js中集成
class AeScapeNewTab {
  constructor() {
    this.weatherManager = new WeatherTriggerManager();
    this.cardSystem = new AnimationCardSystem();
    this.experienceController = new UserExperienceController();
    this.videoManager = new VideoWeatherManager();
  }

  async initialize() {
    // 获取当前天气
    const weatherState = await this.getCurrentWeather();
    
    // 检查是否应该播放动画
    if (this.experienceController.shouldPlayAnimation(weatherState)) {
      // 抽卡选择视频
      const selectedVideo = this.cardSystem.drawCard(weatherState.type);
      
      // 播放动画
      await this.playAnimation(selectedVideo);
      
      // 记录播放
      this.experienceController.recordPlay(weatherState.type, selectedVideo.id);
    }
    
    // 显示极简渐变背景
    this.showMinimalBackground();
  }

  async playAnimation(videoConfig) {
    return new Promise((resolve) => {
      this.videoManager.playWeatherVideo(videoConfig.path, {
        duration: 1500,
        onEnd: () => {
          resolve();
        }
      });
    });
  }
}
```

## 📊 数据分析和优化

### 1. 播放统计
```javascript
// AnalyticsManager.js
class AnalyticsManager {
  constructor() {
    this.stats = {
      totalPlays: 0,
      weatherDistribution: {},
      videoPopularity: {},
      userEngagement: {}
    };
  }

  // 记录播放统计
  recordPlayStats(weatherType, videoId, userReaction) {
    this.stats.totalPlays++;
    this.stats.weatherDistribution[weatherType] = 
      (this.stats.weatherDistribution[weatherType] || 0) + 1;
    this.stats.videoPopularity[videoId] = 
      (this.stats.videoPopularity[videoId] || 0) + 1;
    
    // 保存到本地存储
    this.saveStats();
  }

  // 获取热门视频
  getPopularVideos(limit = 5) {
    return Object.entries(this.stats.videoPopularity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([videoId, count]) => ({ videoId, count }));
  }
}
```

## 🚀 部署和测试

### 1. 测试策略
```javascript
// test/animation-system-test.js
describe('动画抽卡系统测试', () => {
  test('天气变化触发', () => {
    const triggerManager = new WeatherTriggerManager();
    const result = triggerManager.checkWeatherChange('rain');
    expect(result.shouldTrigger).toBe(true);
  });

  test('避免连续重复', () => {
    const cardSystem = new AnimationCardSystem();
    const video1 = cardSystem.drawCard('rain');
    const video2 = cardSystem.drawCard('rain');
    expect(video1.id).not.toBe(video2.id);
  });
});
```

### 2. 性能优化
- 视频预加载策略
- 内存管理（及时释放视频资源）
- 网络请求优化（天气API缓存）
- 动画性能监控

## 📈 未来扩展

### 1. 个性化系统
- 用户偏好学习
- 天气敏感度调整
- 动画风格定制

### 2. 社交功能
- 分享精彩动画
- 用户评分系统
- 社区推荐算法

### 3. 高级特效
- WebGL粒子系统
- 3D天气效果
- 动态光照变化

---

## 🎯 实现优先级

### 第一阶段（核心功能）
1. ✅ 基础视频播放系统
2. 🔄 天气触发检测
3. 🎲 简单抽卡算法
4. 💾 基础存储管理

### 第二阶段（体验优化）
1. 🎨 彩蛋特效系统
2. 📊 播放统计
3. ⚙️ 用户偏好设置
4. 🔧 Chrome扩展集成

### 第三阶段（高级功能）
1. 🤖 智能推荐
2. 📱 移动端适配
3. 🌐 云端同步
4. 🎮 社交功能

这个技术方案将把 AeScape 打造成一个真正有生命力的"天气驱动的沉浸式抽卡系统"！
