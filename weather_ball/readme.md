一、PRD（产品需求文档）
1. 产品愿景

让新标签页不再冰冷，而是化身为一颗「天气水晶球」，实时映射你所在城市的天气与天文状态。它既是数据可视化，也是日常的情绪小装置。

2. 用户价值

直观：通过 3D 球体看到天气状况（晴/雨/雪/雾/雷电）。

氛围：球体具备光影变化、云雾流动、昼夜切换，形成冥想般的氛围。

轻量：不会像 iOS18 那样全屏压迫，而是小而美的“天气挂件”。

3. 功能范围

天气数据获取：实时获取温度、湿度、风速、天气代码等。

天文数据：太阳高度角、方位角、月相。

渲染效果：云层、雨雪粒子、光照、雾气、大气层。

交互：点击切换模式（真实/艺术），悬停时球体高亮。

性能优化：后台 Tab 暂停动画，低端设备自动降级画质。

4. 非功能性需求

性能目标：桌面端 60FPS，低配自动降到 30FPS。

体积目标：打包后 ≤ 2MB。

扩展兼容：Chrome MV3。

二、技术框架
1. 架构设计
┌───────────────────────────────┐
│   Chrome 扩展 (数据服务层)       │
│ - OpenWeather API 获取天气       │
│ - SunCalc.js 计算太阳位置        │
│ - 缓存 & 降级策略                │
│ - 向渲染层提供统一参数            │
└───────────────────────────────┘
                ↕
┌───────────────────────────────┐
│   Weather Ball 渲染层            │
│ - Three.js + WebGL             │
│ - 着色器: 云层、Fresnel、高光    │
│ - 粒子系统: 雨、雪、雾           │
│ - 光照系统: 太阳/月亮/环境光     │
│ - 性能优化: LOD, RAF, Worker     │
└───────────────────────────────┘

2. 技术栈

3D 渲染: Three.js + GLSL Shader

天文计算: SunCalc.js

天气数据: OpenWeather API

性能优化: RequestAnimationFrame, LOD, Web Worker

扩展框架: Chrome MV3 + Vite

三、快速开始
1. 安装依赖
npm install three suncalc

2. 初始化天气球
import { initWeatherBall } from './weather-ball.js';

// 在 HTML 里准备一个 canvas
const canvas = document.getElementById('weather-ball');

const weatherParams = {
  cloudDensity: 0.3,
  humidity: 0.6,
  turbulence: 0.4,
  iceLevel: 0.1,
  rain: 0,
  snow: 0,
  daylight: 0.8,
  sunAzimuth: 180,
  sunAltitude: 45
};

const ball = initWeatherBall(canvas, weatherParams);

// 动态更新参数（例如每次天气数据变化时）
ball.update({ rain: 1, cloudDensity: 0.7 });

3. API
const handle = initWeatherBall(canvas, params);

// 更新参数
handle.update(newParams);

// 响应窗口变化
handle.resize(window.innerWidth, window.innerHeight);

// 暂停/恢复（后台 tab 节能）
document.addEventListener('visibilitychange', () => {
  if (document.hidden) handle.pause();
  else handle.resume();
});

// 销毁
handle.destroy();

四、数据映射示例
const WEATHER_MAP = {
  clear:   { cloudDensity: 0.05, humidity: 0.2, turbulence: 0.1, rain: 0, snow: 0 },
  clouds:  { cloudDensity: 0.4,  humidity: 0.5, turbulence: 0.3, rain: 0, snow: 0 },
  rain:    { cloudDensity: 0.7,  humidity: 0.9, turbulence: 0.6, rain: 1, snow: 0 },
  snow:    { cloudDensity: 0.5,  humidity: 0.8, turbulence: 0.2, rain: 0, snow: 1 },
  fog:     { cloudDensity: 0.6,  humidity: 0.95,turbulence: 0.15,rain: 0, snow: 0 }
};

五、注意事项（结合你的需求补充）

不要在渲染层里写 fetch/localStorage/chrome API，全部由扩展壳负责。

资源路径用相对或 base64，避免 CSP 出错。

粒子数量在低端 GPU 上自动减少。

HDR/纹理要压缩（KTX2），保证体积。

Tab 后台必须暂停动画，否则审核容易不过。

六、开发阶段

阶段 1：独立天气球渲染库（本地 demo 网页测试参数）

阶段 2：接 OpenWeather API，完成 Chrome 新标签页扩展

阶段 3：打磨美学（光照/云层/材质）+ 性能优化

阶段 4：移动端适配，沉浸模式