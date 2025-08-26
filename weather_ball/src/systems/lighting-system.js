/**
 * 光照系统
 * 处理太阳光、月光、环境光等
 */

import * as THREE from 'three';

export class LightingSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.lights = {};
  }

  init(params) {
    this.createLights();
    this.update(params);
  }

  /**
   * 创建光源
   */
  createLights() {
    // 主要太阳光 - 极强光照产生明显效果
    this.lights.sun = new THREE.DirectionalLight(0xffffff, 5.0);
    this.lights.sun.position.set(2, 3, 1);
    this.lights.sun.castShadow = false; // 暂时禁用阴影
    // this.lights.sun.shadow.mapSize.width = 2048;
    // this.lights.sun.shadow.mapSize.height = 2048;
    this.scene.add(this.lights.sun);

    // 补充光源 - 模拟天空散射
    this.lights.skyLight = new THREE.DirectionalLight(0x87ceeb, 1.5);
    this.lights.skyLight.position.set(-2, 3, 1);
    this.scene.add(this.lights.skyLight);

    // 边缘光 - 增强轮廓
    this.lights.rimLight = new THREE.DirectionalLight(0xffffff, 2.0);
    this.lights.rimLight.position.set(2, 1, -2);
    this.scene.add(this.lights.rimLight);

    // 月光
    this.lights.moon = new THREE.DirectionalLight(0x7b68ee, 0.8);
    this.lights.moon.castShadow = false; // 暂时禁用阴影
    // this.lights.moon.shadow.mapSize.width = 2048;
    // this.lights.moon.shadow.mapSize.height = 2048;
    this.scene.add(this.lights.moon);

    // 环境光 - 增加强度确保可见性
    this.lights.ambient = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(this.lights.ambient);

    // 半球光（天空光）
    this.lights.hemisphere = new THREE.HemisphereLight(0x87ceeb, 0x2c3e50, 0.4);
    this.scene.add(this.lights.hemisphere);
  }

  /**
   * 更新光照
   */
  update(params) {
    this.updateSunLight(params);
    this.updateMoonLight(params);
    this.updateAmbientLight(params);
  }

  /**
   * 更新太阳光
   */
  updateSunLight(params) {
    const sunData = params.astronomical.sun;
    const weatherCode = params.weather.code;
    
    // 简化并加强光照强度
    let intensity = 8.0; // 基础强度很高
    let color = 0xffffff;
    
    // 根据天气显著调整
    switch(weatherCode) {
      case 'rain':
      case 'thunderstorm':
        intensity = 3.0;
        color = 0x6b8e9d;
        break;
      case 'cloudy':
        intensity = 5.0;
        color = 0x9db4c7;
        break;
      case 'snow':
        intensity = 6.0;
        color = 0xc7d8e8;
        break;
      case 'fog':
        intensity = 2.0;
        color = 0x8a9ba8;
        break;
      default: // clear
        intensity = 10.0;
        color = 0xffffff;
    }
    
    this.lights.sun.intensity = intensity;
    this.lights.sun.color.setHex(color);
    
    // 简化位置设置
    this.lights.sun.position.set(3, 4, 2);
    this.lights.sun.visible = true;
  }

  /**
   * 更新月光
   */
  updateMoonLight(params) {
    const moonData = params.astronomical.moon;
    
    if (moonData.isVisible) {
      const altitudeFactor = Math.max(0, Math.sin(moonData.altitude * Math.PI / 180));
      const phaseFactor = moonData.phase;
      const weatherFactor = this.getWeatherLightFactor(params.weather.code);
      const intensity = 0.3 * altitudeFactor * phaseFactor * weatherFactor;
      
      this.lights.moon.intensity = intensity;
      
      // 设置月球位置
      this.lights.moon.position.setFromSphericalCoords(
        10,
        (90 - moonData.altitude) * Math.PI / 180,
        moonData.azimuth * Math.PI / 180
      );
      
      this.lights.moon.visible = true;
    } else {
      this.lights.moon.visible = false;
    }
  }

  /**
   * 更新环境光
   */
  updateAmbientLight(params) {
    let ambientIntensity = 0.1;
    
    // 根据太阳高度角调整环境光
    if (params.astronomical.sun.isVisible) {
      const altitudeFactor = Math.max(0, Math.sin(params.astronomical.sun.altitude * Math.PI / 180));
      ambientIntensity += 0.2 * altitudeFactor;
    }
    
    // 根据月相调整夜间环境光
    if (params.astronomical.moon.isVisible) {
      ambientIntensity += 0.1 * params.astronomical.moon.phase;
    }
    
    // 根据天气调整环境光
    const weatherFactor = this.getWeatherLightFactor(params.weather.code);
    ambientIntensity *= weatherFactor;
    
    this.lights.ambient.intensity = ambientIntensity;
    
    // 更新半球光
    this.updateHemisphereLight(params);
  }

  /**
   * 更新半球光
   */
  updateHemisphereLight(params) {
    const timeOfDay = params.environmental.timeOfDay;
    const sunAltitude = params.astronomical.sun.altitude;
    
    let skyColor, groundColor, intensity;
    
    if (timeOfDay === 'dawn' || (sunAltitude > -6 && sunAltitude < 10)) {
      // 日出/日落
      skyColor = 0xffa500;
      groundColor = 0x8b4513;
      intensity = 0.3;
    } else if (timeOfDay === 'day' || sunAltitude > 10) {
      // 白天
      skyColor = 0x87ceeb;
      groundColor = 0x90ee90;
      intensity = 0.4;
    } else if (timeOfDay === 'dusk' || (sunAltitude < 10 && sunAltitude > -6)) {
      // 黄昏
      skyColor = 0xff6347;
      groundColor = 0x8b4513;
      intensity = 0.2;
    } else {
      // 夜晚
      skyColor = 0x2c3e50;
      groundColor = 0x1a1a1a;
      intensity = 0.1;
    }
    
    this.lights.hemisphere.color.setHex(skyColor);
    this.lights.hemisphere.groundColor.setHex(groundColor);
    this.lights.hemisphere.intensity = intensity;
  }

  /**
   * 获取天气对光照的影响因子
   */
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

  /**
   * 根据太阳高度角获取太阳颜色
   */
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

  /**
   * 更新参数
   */
  updateParams(params) {
    this.update(params);
  }

  /**
   * 销毁资源
   */
  destroy() {
    Object.values(this.lights).forEach(light => {
      if (light.dispose) {
        light.dispose();
      }
      this.scene.remove(light);
    });
  }
}
