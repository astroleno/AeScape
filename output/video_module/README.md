# AeScape 视频模块 - 天气驱动沉浸式抽卡系统

## 🎯 项目概述

AeScape 视频模块是一个创新的"天气驱动的沉浸式抽卡系统"，为新标签页提供"天井仪式"般的体验。当用户打开新标签页时，系统会根据当前天气状态智能触发相应的动画效果，营造沉浸式的视觉体验。

## ✨ 核心特性

### 🎲 智能抽卡系统
- **天气变化触发**：天气状态改变时自动播放动画
- **持续时间触发**：长时间同一天气时偶尔触发动画
- **权重随机选择**：避免重复，增加新鲜感
- **彩蛋机制**：稀有动画增加惊喜感

### 🎨 视觉效果
- **双层视频播放**：核心层 + 光晕层
- **混合模式优化**：解决云层黑边问题
- **黑色背景过渡**：从黑屏到透明的流畅过渡
- **彩蛋特效**：雨打玻璃、云层穿越等特殊效果

### 🎮 用户体验
- **1.5秒沉浸体验**：短时但强烈的视觉冲击
- **智能触发控制**：避免过度打扰
- **个性化设置**：用户可调整播放频率和偏好
- **极简常驻背景**：日常使用不干扰

## 🏗️ 系统架构

```
video_module/
├── 核心模块/
│   ├── WeatherTriggerManager.js     # 天气触发管理（待实现）
│   ├── AnimationCardSystem.js       # 抽卡算法（待实现）
│   ├── VideoPoolManager.js          # 视频池管理（待实现）
│   ├── UserExperienceController.js  # 用户体验控制（待实现）
│   └── StorageManager.js            # 存储管理（待实现）
├── 视频播放/
│   ├── VideoIntroAnimation.js       # 视频动画核心 ✅
│   ├── VideoWeatherManager.js       # 天气视频管理 ✅
│   └── weather-video-mapper.js      # 视频映射 ✅
├── 配置/
│   ├── animation-pools.json         # 动画池配置（待实现）
│   ├── trigger-rules.json           # 触发规则（待实现）
│   └── user-preferences.json        # 用户偏好（待实现）
├── 样式/
│   └── video-intro.css              # 视频样式 ✅
├── 测试/
│   └── example.html                 # 功能演示 ✅
├── 参考文档/
│   ├── advice.md                    # 增强建议 ✅
│   └── video-index.md               # 视频索引 ✅
├── 开发文档/
│   └── HANDOVER_DOCUMENT.md         # 完整交接文档 ✅
├── archived/                        # 归档文件
│   ├── README.md                    # 归档说明
│   ├── DEVELOPMENT_PLAN.md          # 初始开发计划
│   ├── TECHNICAL_IMPLEMENTATION.md  # 技术实现方案
│   ├── IMPLEMENTATION_ROADMAP.md    # 实现路线图
│   ├── mech.md                      # 机制设计
│   ├── demo.html                    # 完整演示页面
│   ├── test-*.html                  # 专项测试页面
│   ├── log.md                       # 开发日志
│   └── weather-animations.md        # 动画参考文档
└── chrome_store/                    # Chrome扩展参考
```

## 🚀 快速开始

### 1. 基础使用
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
    <script>
        const videoManager = new VideoWeatherManager('#video-container');
        videoManager.playWeatherVideo('rain');
    </script>
</body>
</html>
```

### 2. 抽卡系统使用
```javascript
// 初始化抽卡系统
const cardSystem = new AnimationCardSystem();
const triggerManager = new WeatherTriggerManager();

// 检查是否应该播放动画
const shouldPlay = triggerManager.checkWeatherChange('rain');
if (shouldPlay.shouldTrigger) {
    // 抽卡选择视频
    const selectedVideo = cardSystem.drawCard('rain');
    // 播放动画
    videoManager.playWeatherVideo(selectedVideo.path);
}
```

## 📋 支持的天气类型

| 天气类型 | 视频数量 | 混合模式 | 描述 |
|---------|---------|---------|------|
| 晴天 (clear) | 8个 | lighten | 与多云共用云层视频 |
| 多云 (cloudy) | 8个 | lighten | 云层扑面效果 |
| 雾天 (fog) | 8个 | lighten | 与多云共用云层视频 |
| 雨天 (rain) | 8个 | screen | 雨滴扑面效果 |
| 雪天 (snow) | 9个 | screen | 雪花飘落效果 |
| 雷暴 (thunderstorm) | 1个 | overlay | 闪电特效 |

## ⚙️ 配置选项

### 触发规则配置
```json
{
  "weatherChangeThreshold": 300000,  // 天气变化阈值（5分钟）
  "durationThreshold": 1800000,      // 持续时间阈值（30分钟）
  "maxDailyPlays": 10,               // 每日最大播放次数
  "animationDuration": 1500          // 动画持续时间（1.5秒）
}
```

### 动画池配置
```json
{
  "clear": {
    "videos": [
      {
        "id": "clear_001",
        "path": "../video/tab/c/cloudy_1.webm",
        "weight": 80,
        "type": "normal",
        "description": "底视角云层扑面"
      }
    ]
  }
}
```

## 🎨 视觉效果说明

### 混合模式策略
- **lighten模式**：用于云层视频，解决黑边问题
- **screen模式**：用于雨滴和雪花，保持粒子效果
- **overlay模式**：用于雷暴，增强视觉效果

### 播放流程
1. **黑色背景阶段 (0-50%)**：纯黑背景，视频开始播放
2. **透明背景阶段 (50-67%)**：背景变透明，tab界面可见
3. **淡出阶段 (67-100%)**：视频淡出，完全显示tab界面

## 🔧 API 参考

### VideoWeatherManager
```javascript
class VideoWeatherManager {
  constructor(containerSelector, options = {})
  playWeatherVideo(weatherType, config = {})
  stopVideo()
  setVideoSource(src)
}
```

### AnimationCardSystem
```javascript
class AnimationCardSystem {
  constructor()
  drawCard(weatherType)
  filterAvailableVideos(pool, weatherType)
  updatePlayHistory(videoId)
}
```

### WeatherTriggerManager
```javascript
class WeatherTriggerManager {
  constructor()
  checkWeatherChange(currentWeather)
  checkDurationTrigger(currentWeather)
  shouldTriggerAnimation(weatherState)
}
```

## 🧪 测试

### 功能测试
```bash
# 打开测试页面
open example.html

# 测试不同天气类型
# 1. 点击天气按钮
# 2. 观察视频播放效果
# 3. 检查混合模式效果
# 4. 验证黑色背景过渡
```

### 专项测试
- `test-video-paths.html` - 视频路径测试
- `test-rain-videos.html` - 雨天视频测试
- `test-blend-modes.html` - 混合模式测试

## 📊 性能优化

### 视频优化
- 1080p视频全屏覆盖
- 预加载策略
- 内存管理
- 网络请求优化

### 动画优化
- CSS硬件加速
- 60fps流畅度
- 响应式适配
- 性能监控

## 🔮 未来规划

### 短期目标 (1-2个月)
- [ ] 用户行为分析
- [ ] 动画效果优化
- [ ] 性能监控系统
- [ ] 用户反馈收集

### 中期目标 (3-6个月)
- [ ] 个性化推荐
- [ ] 社交分享功能
- [ ] 更多天气类型
- [ ] 移动端适配

### 长期愿景 (6个月+)
- [ ] AI驱动的动画生成
- [ ] 云端同步系统
- [ ] 社区内容平台
- [ ] 商业化探索

## 📝 开发文档

- [技术实现方案](./TECHNICAL_IMPLEMENTATION.md)
- [实现路线图](./IMPLEMENTATION_ROADMAP.md)
- [开发计划](./DEVELOPMENT_PLAN.md)
- [视频索引](./video-index.md)
- [增强建议](./advice.md)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

**AeScape** - 让每一次打开新标签页都成为一次"天井仪式" 🎭