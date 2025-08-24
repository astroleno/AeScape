# 天气球架构设计文档

## 项目概述

本文档描述了天气球应用的架构设计，该应用将作为 AeScape 扩展的数据服务层，专注于提供丰富的 3D 天气体验和环境影响模拟。

## 架构设计

### 整体架构
```
┌─────────────────────────────────────┐
│          天气球应用 (独立项目)        │
├─────────────────────────────────────┤
│  • 3D渲染引擎                        │
│  • 物理模拟                          │
│  • 用户交互                          │
│  • 视觉效果                          │
└─────────────────────────────────────┘
           ↕ API调用
┌─────────────────────────────────────┐
│        AeScape扩展 (数据服务)        │
├─────────────────────────────────────┤
│  • 天气数据获取                      │
│  • 天文数据计算                      │
│  • 数据缓存管理                      │
│  • API接口提供                      │
└─────────────────────────────────────┘
```

### 职责分离

#### AeScape 扩展 (数据服务层)
- **数据获取**: 从 OpenWeatherMap API 获取实时天气数据
- **天文计算**: 计算太阳方位角、高度角、月相等天文数据
- **数据缓存**: 管理数据缓存，优化 API 调用
- **接口提供**: 为天气球应用提供标准化的数据接口
- **实时更新**: 提供数据变化的事件通知机制

#### 天气球应用 (渲染层)
- **3D 渲染**: 使用 Three.js 或类似引擎进行 3D 渲染
- **物理模拟**: 模拟天气对环境的物理影响
- **用户交互**: 处理用户输入和交互操作
- **视觉效果**: 实现大气效果、粒子系统等视觉特效
- **性能优化**: 确保流畅的渲染性能

## 数据接口设计

### 1. 基础天气数据接口

```javascript
// 扩展提供的天气数据 API
const weatherAPI = {
  // 获取当前天气数据
  getCurrentWeather() {
    return {
      temperature: 25,           // 温度 (°C)
      humidity: 60,              // 湿度 (%)
      pressure: 1013,            // 气压 (hPa)
      windSpeed: 5,              // 风速 (m/s)
      windDirection: 180,        // 风向 (度)
      visibility: 10,            // 能见度 (km)
      weatherCode: 'clear',      // 天气代码
      weatherDescription: '晴朗', // 天气描述
      feelsLike: 27,             // 体感温度 (°C)
      uvIndex: 6,                // 紫外线指数
      cloudCover: 20             // 云量 (%)
    };
  },

  // 获取天气预报数据
  getForecast() {
    return {
      hourly: [...],    // 24小时预报
      daily: [...],     // 7天预报
      alerts: [...]     // 天气预警
    };
  }
};
```

### 2. 天文数据接口

```javascript
// 天文数据 API
const astronomicalAPI = {
  // 获取太阳数据
  getSunData() {
    return {
      azimuth: 180,      // 方位角 (0-360°)
      altitude: 45,      // 高度角 (-90° 到 90°)
      intensity: 0.8,    // 光照强度 (0-1)
      isVisible: true,   // 是否可见
      sunrise: '06:30',  // 日出时间
      sunset: '18:30',   // 日落时间
      solarNoon: '12:30' // 正午时间
    };
  },

  // 获取月球数据
  getMoonData() {
    return {
      phase: 0.5,        // 月相 (0-1)
      phaseName: '满月',  // 月相名称
      azimuth: 90,       // 方位角
      altitude: 30,      // 高度角
      isVisible: true,   // 是否可见
      moonrise: '20:30', // 月出时间
      moonset: '08:30',  // 月落时间
      illumination: 0.8  // 照明度 (0-1)
    };
  },

  // 获取星空数据
  getStarsData() {
    return {
      visible: true,     // 是否可见星星
      brightness: 0.3,   // 亮度 (0-1)
      constellations: [  // 可见星座
        { name: '大熊座', visible: true },
        { name: '小熊座', visible: true }
      ]
    };
  }
};
```

### 3. 环境数据接口

```javascript
// 环境数据 API
const environmentalAPI = {
  // 获取环境数据
  getEnvironmentalData() {
    return {
      airQuality: 75,      // 空气质量指数
      pollenCount: 2,      // 花粉指数
      airPressure: 1013,   // 气压 (hPa)
      humidity: 60,        // 湿度 (%)
      dewPoint: 17,        // 露点温度 (°C)
      heatIndex: 28,       // 热指数
      windChill: 23        // 风寒指数
    };
  },

  // 获取大气数据
  getAtmosphericData() {
    return {
      visibility: 10,      // 能见度 (km)
      cloudBase: 2000,     // 云底高度 (m)
      precipitation: 0,    // 降水量 (mm)
      snowDepth: 0,        // 积雪深度 (cm)
      fogDensity: 0        // 雾密度 (0-1)
    };
  }
};
```

### 4. 实时数据更新机制

```javascript
// 数据更新事件系统
class WeatherDataService {
  constructor() {
    this.listeners = new Map();
    this.updateInterval = 60000; // 1分钟更新间隔
  }

  // 订阅数据更新
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  // 取消订阅
  unsubscribe(eventType, callback) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // 发布数据更新
  publish(eventType, data) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Data update callback error:', error);
        }
      });
    }
  }

  // 启动数据更新服务
  startUpdateService() {
    setInterval(() => {
      this.updateWeatherData();
      this.updateAstronomicalData();
      this.updateEnvironmentalData();
    }, this.updateInterval);
  }

  // 更新天气数据
  async updateWeatherData() {
    try {
      const data = await this.getCurrentWeather();
      this.publish('weatherUpdate', data);
    } catch (error) {
      console.error('Weather data update failed:', error);
    }
  }

  // 更新天文数据
  async updateAstronomicalData() {
    try {
      const sunData = await this.getSunData();
      const moonData = await this.getMoonData();
      const starsData = await this.getStarsData();
      
      this.publish('sunUpdate', sunData);
      this.publish('moonUpdate', moonData);
      this.publish('starsUpdate', starsData);
    } catch (error) {
      console.error('Astronomical data update failed:', error);
    }
  }

  // 更新环境数据
  async updateEnvironmentalData() {
    try {
      const data = await this.getEnvironmentalData();
      this.publish('environmentalUpdate', data);
    } catch (error) {
      console.error('Environmental data update failed:', error);
    }
  }
}
```

## 环境影响模拟

### 1. 光照系统

```javascript
// 天气球中的光照计算系统
class LightingSystem {
  constructor(scene) {
    this.scene = scene;
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
    this.moonLight = new THREE.DirectionalLight(0x7b68ee, 0.3);
    this.ambientLight = new THREE.AmbientLight(0x404040, 0.1);
    
    this.scene.add(this.sunLight);
    this.scene.add(this.moonLight);
    this.scene.add(this.ambientLight);
  }

  // 更新光照系统
  updateLighting(astronomicalData, weatherData) {
    // 太阳光照
    if (astronomicalData.sun.isVisible) {
      this.updateSunLight(astronomicalData.sun, weatherData);
    } else {
      this.sunLight.intensity = 0;
    }

    // 月光
    if (astronomicalData.moon.isVisible) {
      this.updateMoonLight(astronomicalData.moon, weatherData);
    } else {
      this.moonLight.intensity = 0;
    }

    // 环境光
    this.updateAmbientLight(astronomicalData, weatherData);
  }

  // 更新太阳光照
  updateSunLight(sunData, weatherData) {
    // 根据太阳高度角调整光照强度
    const altitudeFactor = Math.max(0, Math.sin(sunData.altitude * Math.PI / 180));
    const weatherFactor = this.getWeatherLightFactor(weatherData.weatherCode);
    
    this.sunLight.intensity = sunData.intensity * altitudeFactor * weatherFactor;
    
    // 设置太阳位置
    this.sunLight.position.setFromSphericalCoords(
      1000, // 距离
      (90 - sunData.altitude) * Math.PI / 180, // 仰角
      sunData.azimuth * Math.PI / 180 // 方位角
    );

    // 根据时间调整太阳颜色
    const sunColor = this.getSunColor(sunData.altitude);
    this.sunLight.color.setHex(sunColor);
  }

  // 更新月光
  updateMoonLight(moonData, weatherData) {
    const altitudeFactor = Math.max(0, Math.sin(moonData.altitude * Math.PI / 180));
    const phaseFactor = moonData.phase;
    const weatherFactor = this.getWeatherLightFactor(weatherData.weatherCode);
    
    this.moonLight.intensity = 0.3 * altitudeFactor * phaseFactor * weatherFactor;
    
    // 设置月球位置
    this.moonLight.position.setFromSphericalCoords(
      1000,
      (90 - moonData.altitude) * Math.PI / 180,
      moonData.azimuth * Math.PI / 180
    );
  }

  // 更新环境光
  updateAmbientLight(astronomicalData, weatherData) {
    let ambientIntensity = 0.1;
    
    // 根据太阳高度角调整环境光
    if (astronomicalData.sun.isVisible) {
      const altitudeFactor = Math.max(0, Math.sin(astronomicalData.sun.altitude * Math.PI / 180));
      ambientIntensity += 0.2 * altitudeFactor;
    }
    
    // 根据月相调整夜间环境光
    if (astronomicalData.moon.isVisible) {
      ambientIntensity += 0.1 * astronomicalData.moon.phase;
    }
    
    // 根据天气调整环境光
    const weatherFactor = this.getWeatherLightFactor(weatherData.weatherCode);
    ambientIntensity *= weatherFactor;
    
    this.ambientLight.intensity = ambientIntensity;
  }

  // 获取天气对光照的影响因子
  getWeatherLightFactor(weatherCode) {
    const factors = {
      'clear': 1.0,
      'cloudy': 0.6,
      'rain': 0.3,
      'snow': 0.7,
      'fog': 0.4,
      'thunderstorm': 0.2
    };
    return factors[weatherCode] || 1.0;
  }

  // 根据太阳高度角获取太阳颜色
  getSunColor(altitude) {
    if (altitude > 10) {
      return 0xffffff; // 白色
    } else if (altitude > 0) {
      return 0xffa500; // 橙色
    } else if (altitude > -6) {
      return 0xff4500; // 红橙色
    } else {
      return 0x8b0000; // 深红色
    }
  }
}
```

### 2. 大气效果系统

```javascript
// 大气散射和折射效果
class AtmosphereEffect {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.atmosphereMaterial = this.createAtmosphereMaterial();
    this.atmosphereMesh = this.createAtmosphereMesh();
    this.scene.add(this.atmosphereMesh);
  }

  // 创建大气材质
  createAtmosphereMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        sunDirection: { value: new THREE.Vector3() },
        sunIntensity: { value: 1.0 },
        scatteringIntensity: { value: 0.5 },
        transparency: { value: 0.8 },
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        
        void main() {
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 sunDirection;
        uniform float sunIntensity;
        uniform float scatteringIntensity;
        uniform float transparency;
        uniform float time;
        
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        
        void main() {
          vec3 viewDirection = normalize(vWorldPosition - cameraPosition);
          float cosTheta = dot(viewDirection, sunDirection);
          
          // 瑞利散射
          vec3 rayleigh = vec3(0.1, 0.3, 0.7) * (1.0 + cosTheta * cosTheta);
          
          // 米氏散射
          float mie = (1.0 - 0.992) / (1.0 - 0.992 * cosTheta);
          vec3 mieScattering = vec3(0.8, 0.8, 0.8) * mie;
          
          // 大气颜色
          vec3 atmosphereColor = rayleigh + mieScattering;
          atmosphereColor *= sunIntensity * scatteringIntensity;
          
          // 透明度
          float alpha = transparency * (1.0 - dot(viewDirection, vNormal));
          
          gl_FragColor = vec4(atmosphereColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.BackSide
    });
  }

  // 创建大气网格
  createAtmosphereMesh() {
    const geometry = new THREE.SphereGeometry(1.1, 64, 64);
    return new THREE.Mesh(geometry, this.atmosphereMaterial);
  }

  // 更新大气效果
  updateAtmosphere(astronomicalData, weatherData, time) {
    // 更新太阳方向
    const sunDirection = new THREE.Vector3();
    sunDirection.setFromSphericalCoords(
      1,
      (90 - astronomicalData.sun.altitude) * Math.PI / 180,
      astronomicalData.sun.azimuth * Math.PI / 180
    );
    
    this.atmosphereMaterial.uniforms.sunDirection.value.copy(sunDirection);
    this.atmosphereMaterial.uniforms.sunIntensity.value = astronomicalData.sun.intensity;
    this.atmosphereMaterial.uniforms.time.value = time;

    // 根据天气调整散射强度
    const scatteringIntensity = this.calculateScatteringIntensity(
      astronomicalData.sun.altitude,
      weatherData.visibility,
      weatherData.weatherCode
    );
    this.atmosphereMaterial.uniforms.scatteringIntensity.value = scatteringIntensity;

    // 根据空气质量调整透明度
    const transparency = this.calculateTransparency(weatherData.airQuality);
    this.atmosphereMaterial.uniforms.transparency.value = transparency;
  }

  // 计算散射强度
  calculateScatteringIntensity(sunAltitude, visibility, weatherCode) {
    let baseIntensity = 0.5;
    
    // 根据太阳高度角调整
    const altitudeFactor = Math.max(0, Math.sin(sunAltitude * Math.PI / 180));
    baseIntensity *= altitudeFactor;
    
    // 根据能见度调整
    const visibilityFactor = Math.min(1, visibility / 10);
    baseIntensity *= visibilityFactor;
    
    // 根据天气类型调整
    const weatherFactors = {
      'clear': 1.0,
      'cloudy': 1.2,
      'rain': 1.5,
      'snow': 1.3,
      'fog': 2.0,
      'thunderstorm': 1.8
    };
    
    return baseIntensity * (weatherFactors[weatherCode] || 1.0);
  }

  // 计算透明度
  calculateTransparency(airQuality) {
    // 空气质量指数转换为透明度 (0-1)
    if (airQuality <= 50) return 0.9;      // 优
    if (airQuality <= 100) return 0.8;     // 良
    if (airQuality <= 150) return 0.7;     // 轻度污染
    if (airQuality <= 200) return 0.6;     // 中度污染
    if (airQuality <= 300) return 0.5;     // 重度污染
    return 0.4;                            // 严重污染
  }
}
```

### 3. 粒子系统

```javascript
// 天气粒子效果系统
class WeatherParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particleSystems = {
      rain: new RainParticleSystem(),
      snow: new SnowParticleSystem(),
      fog: new FogParticleSystem(),
      clouds: new CloudParticleSystem()
    };
    
    // 初始化所有粒子系统
    Object.values(this.particleSystems).forEach(system => {
      this.scene.add(system.group);
    });
  }

  // 更新粒子系统
  updateParticles(weatherData, windData, time) {
    // 更新雨滴
    if (weatherData.weatherCode === 'rain' || weatherData.weatherCode === 'thunderstorm') {
      this.particleSystems.rain.update({
        intensity: weatherData.humidity / 100,
        windSpeed: windData.windSpeed,
        windDirection: windData.windDirection,
        time: time
      });
    } else {
      this.particleSystems.rain.hide();
    }

    // 更新雪花
    if (weatherData.weatherCode === 'snow') {
      this.particleSystems.snow.update({
        intensity: weatherData.humidity / 100,
        temperature: weatherData.temperature,
        windSpeed: windData.windSpeed,
        windDirection: windData.windDirection,
        time: time
      });
    } else {
      this.particleSystems.snow.hide();
    }

    // 更新雾
    if (weatherData.weatherCode === 'fog' || weatherData.visibility < 5) {
      const fogDensity = Math.max(0, (10 - weatherData.visibility) / 10);
      this.particleSystems.fog.update({
        density: fogDensity,
        time: time
      });
    } else {
      this.particleSystems.fog.hide();
    }

    // 更新云层
    if (weatherData.cloudCover > 20) {
      this.particleSystems.clouds.update({
        coverage: weatherData.cloudCover / 100,
        windSpeed: windData.windSpeed,
        windDirection: windData.windDirection,
        time: time
      });
    } else {
      this.particleSystems.clouds.hide();
    }
  }
}

// 雨滴粒子系统
class RainParticleSystem {
  constructor() {
    this.group = new THREE.Group();
    this.particles = [];
    this.maxParticles = 1000;
    this.initParticles();
  }

  initParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxParticles * 3);
    const velocities = new Float32Array(this.maxParticles * 3);
    
    for (let i = 0; i < this.maxParticles; i++) {
      // 随机位置
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = Math.random() * 100 + 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
      
      // 初始速度
      velocities[i * 3] = 0;
      velocities[i * 3 + 1] = -Math.random() * 10 - 5;
      velocities[i * 3 + 2] = 0;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0x87ceeb,
      size: 0.5,
      transparent: true,
      opacity: 0.7
    });
    
    this.points = new THREE.Points(geometry, material);
    this.group.add(this.points);
  }

  update(params) {
    const positions = this.points.geometry.attributes.position.array;
    const velocities = this.points.geometry.attributes.velocity.array;
    
    for (let i = 0; i < this.maxParticles; i++) {
      // 更新位置
      positions[i * 3] += velocities[i * 3] * params.intensity;
      positions[i * 3 + 1] += velocities[i * 3 + 1] * params.intensity;
      positions[i * 3 + 2] += velocities[i * 3 + 2] * params.intensity;
      
      // 添加风力影响
      const windAngle = params.windDirection * Math.PI / 180;
      positions[i * 3] += Math.sin(windAngle) * params.windSpeed * 0.1;
      positions[i * 3 + 2] += Math.cos(windAngle) * params.windSpeed * 0.1;
      
      // 重置超出边界的粒子
      if (positions[i * 3 + 1] < -50) {
        positions[i * 3 + 1] = Math.random() * 50 + 100;
        positions[i * 3] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
      }
    }
    
    this.points.geometry.attributes.position.needsUpdate = true;
    this.group.visible = true;
  }

  hide() {
    this.group.visible = false;
  }
}
```

## 数据流设计

### 1. 数据获取流程
```
扩展后台服务 → 数据计算 → 缓存存储 → API接口 → 天气球应用
```

### 2. 实时更新机制
```
天气数据变化 → 扩展检测 → 计算天文数据 → 推送更新 → 天气球响应
```

### 3. 缓存策略
```javascript
const cacheStrategy = {
  weatherData: {
    ttl: 5 * 60 * 1000,    // 5分钟
    priority: 'high',
    maxSize: '10MB'
  },
  astronomicalData: {
    ttl: 60 * 1000,        // 1分钟
    priority: 'high',
    maxSize: '5MB'
  },
  environmentalData: {
    ttl: 10 * 60 * 1000,   // 10分钟
    priority: 'medium',
    maxSize: '5MB'
  },
  forecastData: {
    ttl: 30 * 60 * 1000,   // 30分钟
    priority: 'medium',
    maxSize: '20MB'
  }
};
```

## 性能优化策略

### 1. 渲染优化
```javascript
const performanceConfig = {
  // 自适应质量
  adaptiveQuality: {
    high: {
      resolution: 1.0,
      shadowQuality: 'high',
      particleCount: 1000,
      textureQuality: 'high'
    },
    medium: {
      resolution: 0.75,
      shadowQuality: 'medium',
      particleCount: 500,
      textureQuality: 'medium'
    },
    low: {
      resolution: 0.5,
      shadowQuality: 'low',
      particleCount: 200,
      textureQuality: 'low'
    }
  },
  
  // 视锥体裁剪
  frustumCulling: true,
  
  // LOD系统
  levelOfDetail: {
    near: 100,    // 近距离高精度
    medium: 500,  // 中距离中等精度
    far: 1000     // 远距离低精度
  },
  
  // 帧率控制
  frameRate: {
    target: 60,
    min: 30,
    adaptive: true
  }
};
```

### 2. 内存管理
```javascript
class ResourceManager {
  constructor() {
    this.textureCache = new Map();
    this.geometryCache = new Map();
    this.materialCache = new Map();
    this.maxCacheSize = 100 * 1024 * 1024; // 100MB
    this.currentCacheSize = 0;
  }

  // 智能缓存
  getTexture(url) {
    if (!this.textureCache.has(url)) {
      const texture = new THREE.TextureLoader().load(url);
      this.textureCache.set(url, texture);
      this.currentCacheSize += this.estimateTextureSize(texture);
      this.cleanupCache();
    }
    return this.textureCache.get(url);
  }

  // 缓存清理
  cleanupCache() {
    if (this.currentCacheSize > this.maxCacheSize) {
      // 清理最旧的资源
      const entries = Array.from(this.textureCache.entries());
      entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed);
      
      while (this.currentCacheSize > this.maxCacheSize * 0.8 && entries.length > 0) {
        const [url, texture] = entries.shift();
        texture.dispose();
        this.textureCache.delete(url);
        this.currentCacheSize -= this.estimateTextureSize(texture);
      }
    }
  }

  // 估算纹理大小
  estimateTextureSize(texture) {
    if (texture.image) {
      return texture.image.width * texture.image.height * 4; // RGBA
    }
    return 1024 * 1024; // 默认1MB
  }
}
```

## 实现建议

### 阶段一：扩展API完善 (1-2周)
1. 添加天文数据计算
2. 完善数据接口
3. 实现实时更新机制
4. 添加数据缓存

### 阶段二：天气球基础 (2-3周)
1. 搭建3D环境
2. 实现基础渲染
3. 连接扩展API
4. 基础环境影响

### 阶段三：高级效果 (3-4周)
1. 复杂光照系统
2. 大气效果
3. 粒子系统
4. 性能优化

### 阶段四：优化完善 (1-2周)
1. 移动端适配
2. 电池优化
3. 错误处理
4. 用户体验优化

## 技术栈推荐

### 核心框架
- **Three.js**: 3D渲染引擎
- **WebGL**: 硬件加速渲染
- **Web Workers**: 后台计算

### 天文计算
- **SunCalc.js**: 太阳位置计算
- **LunarPhase.js**: 月相计算
- **自定义算法**: 高精度天文计算

### 性能优化
- **RequestAnimationFrame**: 动画循环
- **对象池**: 内存管理
- **LOD系统**: 细节层次

### 数据源
- **OpenWeatherMap API**: 天气数据
- **NOAA API**: 天文数据
- **自定义缓存**: 本地数据存储

---

**注意**: 本文档为架构设计规划，具体实现时可根据实际需求和资源调整技术方案和实现细节。
