# 天景 AeScape - 视频动画模块

一个独立的视频开幕动画模块，专为Chrome扩展新标签页设计，支持精确的基于视频时长的过渡控制。

## 🌟 特性

- **精确过渡控制**：基于视频时长的精确过渡效果
- **Alpha通道支持**：完美处理带透明通道的视频
- **模块化设计**：独立模块，易于集成和维护
- **响应式设计**：支持不同屏幕尺寸和设备
- **完整错误处理**：优雅的错误处理和状态管理
- **可配置选项**：丰富的配置选项和回调函数

## 📁 文件结构

```
video_module/
├── VideoIntroAnimation.js    # 核心动画模块
├── video-intro.css          # 样式文件
├── demo.html                # 演示页面
├── example.html             # 简单示例
├── README.md               # 使用文档
└── weather-animations.md   # 天气动画建议
```

## 🚀 快速开始

### 1. 引入文件

```html
<!-- 引入CSS样式 -->
<link rel="stylesheet" href="video_module/video-intro.css">

<!-- 引入JavaScript模块 -->
<script src="video_module/VideoIntroAnimation.js"></script>
```

### 2. HTML结构

```html
<!-- 背景界面层 -->
<div class="background-layer">
  <!-- 你的主界面内容 -->
</div>

<!-- 视频层 -->
<div class="intro-video-container" id="intro-video-container">
  <video class="intro-video" id="intro-video" muted playsinline>
    <source src="path/to/your/video.webm" type="video/webm">
  </video>
</div>
```

### 3. 初始化模块

```javascript
// 基础用法
const videoAnimation = new VideoIntroAnimation();

// 高级用法 - 带配置选项
const videoAnimation = new VideoIntroAnimation({
  containerId: 'intro-video-container',
  videoId: 'intro-video',
  autoPlay: true,
  onStart: () => console.log('视频开始播放'),
  onEnd: () => console.log('视频播放结束'),
  onError: (error) => console.error('播放错误:', error),
  onProgress: (currentTime, duration) => {
    console.log(`播放进度: ${currentTime}/${duration}`);
  }
});

// 播放视频
videoAnimation.play();
```

## 🎯 过渡效果

模块实现了精确的过渡控制：

1. **阶段1 (0-50%)**：背景保持纯黑
2. **阶段2 (50-67%)**：Tab逐渐出现
3. **阶段3 (67-100%)**：淡出效果

## 📖 完整文档

查看 `demo.html` 和 `example.html` 获取更多使用示例。

## 🌤️ 天气动画建议

关于在tab中使用云雾雪雨动画的建议，请查看 `weather-animations.md`。

**总结**：这是一个非常合理和创新的想法，将大大提升用户体验！