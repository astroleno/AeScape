怎么用（Chrome 新标签页插件内）

确保你在 importmap.json 里把 three 和这个文件映射好，例如：

{
  "imports": {
    "three": "./libs/three.module.js",
    "WeatherRenderer": "./scripts/WeatherRenderer.js"
  }
}


在你的新标签页入口（例如 scripts/main.js）里这样写（示例）：

import WeatherRenderer, { WEATHER_TEMPLATES } from 'WeatherRenderer';

const root = document.getElementById('weather-root');
const renderer = new WeatherRenderer();
renderer.init(root, { dpr: Math.min(devicePixelRatio||1, 2) });

// 打开时挑一个场景（你也可以根据时间/城市/数据映射来选）
const hour = new Date().getHours();
const key = (hour >= 18 || hour < 6) ? 'night-clear' : 'cloudy-day';
renderer.applyTemplate(key);

// 后面如果接入 OpenWeather/你的引擎，就在拿到数据后：renderer.applyTemplate('storm') 等。

小结

这份 WeatherRenderer 自带：

全屏天空（近似物理散射）、程序化云（两层 FBM 复合）、雨/雪粒子、闪电全屏脉冲、雾/曝光；

参数模版列表 WEATHER_TEMPLATES：一键切换到“晴、多云、阴、雨、暴风、雪、黄昏、夜晚、夜雷暴”等完整场景；

无需额外 examples，仅依赖 three ESM，适合 Chrome 插件 CSP 环境；

可独立运行，也可以被你的“引擎层”调用 render(state) 叠加实时效果（比如外部雷暴能量/能见度）。