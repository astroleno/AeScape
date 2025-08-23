# 天景 AeScape - Claude 开发指南

## 项目概述
天景 AeScape 是一款 Chrome 扩展，将新标签页转变为实时天气的沉浸式动态画布，并添加常驻天气悬浮球。

## 技术栈
- **核心框架**: 原生 JavaScript (ES6+) - 不使用 TypeScript
- **构建工具**: Vite (仅打包，无类型检查)
- **3D渲染**: Three.js (WebGL)
- **天空渲染**: THREE.Sky (内置天空着色器)
- **云朵效果**: 分层广告牌 (Layered Billboards)
- **粒子系统**: THREE.Points (雨雪效果)
- **天气 API**: OpenWeatherMap
- **UI 框架**: 原生 HTML/CSS
- **图标库**: Feather / Tabler (SVG)
- **代码规范**: ESLint + Prettier

## 开发原则

### 1. 技术选择
- ✅ 使用原生 JavaScript，避免 TypeScript
- ✅ 保持轻量化，无框架依赖
- ✅ 优先使用原生 Web API
- ✅ 模块化开发，但保持简单

### 2. Chrome 扩展规范
- ✅ 使用 Manifest V3
- ✅ 权限最小化原则
- ✅ 使用 `chrome.storage.local` 缓存数据
- ✅ 后台 Service Worker 定时更新
- ✅ 标签页隐藏时自动暂停动画

### 3. 性能优化
- ✅ GPU 加速渲染
- ✅ 使用 `requestAnimationFrame`
- ✅ 内存管理：及时清理 WebGL 上下文
- ✅ 支持 `prefers-reduced-motion`
- ✅ 30 分钟天气更新频率

### 4. 代码规范
- ✅ 使用 ESLint + Prettier
- ✅ ES6 模块化组织
- ✅ 清晰的注释和文档
- ✅ 避免全局变量污染

## 项目结构
```
src/
├── js/
│   ├── weather.js      // 天气数据管理
│   ├── three/
│   │   ├── sky.js     // THREE.Sky 天空渲染
│   │   ├── clouds.js  // 分层广告牌云朵
│   │   ├── particles.js // THREE.Points 粒子系统
│   │   └── scene.js   // Three.js 场景管理
│   ├── ui.js          // UI 交互逻辑
│   ├── storage.js     // 本地存储管理
│   └── utils.js       // 工具函数
├── css/
│   └── style.css      // 样式文件
├── assets/
│   ├── textures/      // 云朵、雨雪纹理
│   └── icons/         // SVG 图标
├── index.html         // 新标签页主页面
├── floating-ball.html // 悬浮球页面
└── manifest.json      // Chrome 扩展配置
```

## 开发命令
```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 代码格式化
npm run format
```

## Chrome Store 审核要求
- ✅ 无广告，无追踪
- ✅ 明确的隐私政策
- ✅ 权限使用说明
- ✅ 开源项目
- ✅ 符合 Chrome 扩展政策

## Three.js 实现方案

### 核心组件
1. **THREE.Sky**: 使用内置天空着色器，支持动态光照和太阳位置
2. **分层广告牌云朵**: 多层半透明平面，通过视差产生深度感
3. **THREE.Points 粒子**: 高效的雨雪粒子系统
4. **动态光照**: 方向光模拟太阳，与天空同步

### 性能优化策略
- **云朵层数控制**: 根据设备性能动态调整 (3-8层)
- **粒子数量优化**: 雨/雪粒子控制在 5000-10000 个
- **纹理压缩**: 使用合适尺寸的压缩纹理
- **按需渲染**: 标签页失焦时暂停动画
- **质量设置**: 提供流畅/均衡/高画质选项

### 天气效果实现优先级
1. **P0 (必须实现)**: 晴、云、雨、雪
2. **P1 (重要)**: 雾、雷暴
3. **P2 (未来)**: 更复杂的视觉效果

## 架构设计
- **新标签页**: 沉浸式天气背景 + 时间信息
- **悬浮球**: 右下角常驻，显示天气状态
- **数据流**: Service Worker → 存储缓存 → UI 渲染