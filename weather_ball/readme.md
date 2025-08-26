# 天气球 (Weather Ball)

3D天气球渲染引擎 - 实时天气可视化

## 项目概述

天气球是一个基于Three.js的3D天气可视化引擎，能够根据天气数据实时渲染具有光照、大气效果、云层和粒子系统的天气球体。

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```
访问 http://localhost:3001/ 查看测试页面

### 构建
```bash
npm run build
```

## 使用方法

### 基础使用
```javascript
import { createWeatherBall } from './src/weather-ball.js';

// 创建canvas元素
const canvas = document.getElementById('weather-ball');

// 配置参数
const params = {
  weather: {
    code: 'clear',           // 天气代码: clear/cloudy/rain/snow/fog/thunderstorm
    temperature: 25,         // 温度 (°C)
    humidity: 60,            // 湿度 (%)
    visibility: 10           // 能见度 (km)
  },
  astronomical: {
    sun: {
      azimuth: 180,          // 太阳方位角 (0-360°)
      altitude: 45,          // 太阳高度角 (-90° 到 90°)
      intensity: 0.8,        // 光照强度 (0-1)
      isVisible: true        // 是否可见
    },
    moon: {
      phase: 0.5,            // 月相 (0-1)
      phaseName: '满月',      // 月相名称
      azimuth: 90,           // 方位角
      altitude: 30,          // 高度角
      isVisible: true        // 是否可见
    }
  },
  environmental: {
    airQuality: 75,          // 空气质量指数
    timeOfDay: 'day',        // 时间段: dawn/day/dusk/night
    season: 'summer'         // 季节: spring/summer/autumn/winter
  }
};

// 创建天气球实例
const weatherBall = createWeatherBall(canvas, params);

// 更新参数
weatherBall.update(newParams);

// 暂停/恢复渲染
weatherBall.pause();
weatherBall.resume();

// 调整大小
weatherBall.resize(width, height);

// 销毁资源
weatherBall.destroy();
```

## 测试场景

测试页面包含以下典型场景：

### 天气类型
- **晴天** - 明亮的光照，清晰的天空
- **多云** - 柔和的光照，云层覆盖
- **雨天** - 昏暗的光照，雨滴效果
- **雪天** - 冷色调光照，雪花效果
- **雾天** - 低能见度，雾气效果
- **雷暴** - 强烈的对比，闪电效果

### 时间段
- **白天** - 明亮的太阳光
- **日出** - 温暖的橙色光照
- **黄昏** - 红橙色光照
- **夜晚** - 月光和星空

### 太阳位置
- **高角度** - 正午时分的光照
- **中角度** - 上午/下午的光照
- **低角度** - 日出/日落时分
- **地平线下** - 夜晚状态

### 月相
- **新月** - 无月光
- **上弦月** - 部分月光
- **满月** - 最大月光
- **下弦月** - 部分月光

## 技术架构

### 核心系统
- **WeatherBall** - 主渲染类
- **LightingSystem** - 光照系统（太阳光、月光、环境光）
- **AtmosphereSystem** - 大气效果系统
- **CloudSystem** - 云层渲染系统
- **ParticleSystem** - 粒子效果系统（雨、雪、雾）

### 渲染流程
1. 初始化Three.js场景和相机
2. 创建基础球体几何
3. 设置天空渐变背景
4. 初始化各个渲染系统
5. 开始渲染循环
6. 根据参数更新各个系统

### 性能优化
- 后台Tab自动暂停渲染
- 自适应帧率控制
- 资源管理和清理
- 视锥体裁剪

## 降级策略

当浏览器不支持WebGL或性能不足时，整个插件会降级到2D渲染模式：

1. **检测WebGL支持**
2. **性能基准测试**
3. **自动降级到2D模式**
4. **保持数据接口一致**

## 开发计划

### 阶段1: 基础光照 ✅
- [x] 太阳光照系统
- [x] 月光系统
- [x] 环境光系统
- [x] 天空渐变背景

### 阶段2: 大气效果 🚧
- [ ] 大气散射效果
- [ ] 折射和反射
- [ ] 空气质量影响

### 阶段3: 云层系统 📋
- [ ] 动态云层渲染
- [ ] 云层密度控制
- [ ] 云层移动动画

### 阶段4: 粒子系统 📋
- [ ] 雨滴粒子效果
- [ ] 雪花粒子效果
- [ ] 雾气粒子效果

### 阶段5: 天文效果 📋
- [ ] 月相显示
- [ ] 星空背景
- [ ] 极光效果

## 技术栈

- **Three.js** - 3D渲染引擎
- **WebGL** - 硬件加速渲染
- **Vite** - 构建工具
- **ES6 Modules** - 模块化开发

## 许可证

MIT License