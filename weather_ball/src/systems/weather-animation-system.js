/**
 * 天气动画系统
 * 在玻璃球内部渲染天气动画效果
 */

import * as THREE from 'three';

export class WeatherAnimationSystem {
  constructor(scene, sphere) {
    this.scene = scene;
    this.sphere = sphere;
    this.animationGroup = new THREE.Group();
    this.scene.add(this.animationGroup);
    
    // 动画时钟
    this.clock = new THREE.Clock();
    
    // 天气效果
    this.effects = {};
    
    this.init();
  }

  init() {
    // 创建各种天气效果
    this.createRainEffect();
    this.createSnowEffect();
    this.createCloudEffect();
    this.createFogEffect();
    this.createThunderstormEffect();
  }

  /**
   * 创建雨效果
   */
  createRainEffect() {
    const rainCount = 1000;
    const rainGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);
    const velocities = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      const i3 = i * 3;
      
      // 在球体内部随机分布
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 0.3 + Math.random() * 0.6; // 0.3 到 0.9 之间
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.cos(phi);
      positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      // 下落速度
      velocities[i3] = 0;
      velocities[i3 + 1] = -0.01 - Math.random() * 0.02;
      velocities[i3 + 2] = 0;
    }

    rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    rainGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const rainMaterial = new THREE.PointsMaterial({
      color: 0x87ceeb,
      size: 0.002,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.effects.rain = new THREE.Points(rainGeometry, rainMaterial);
    this.effects.rain.visible = false;
    this.animationGroup.add(this.effects.rain);
  }

  /**
   * 创建雪效果
   */
  createSnowEffect() {
    const snowCount = 500;
    const snowGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(snowCount * 3);
    const velocities = new Float32Array(snowCount * 3);

    for (let i = 0; i < snowCount; i++) {
      const i3 = i * 3;
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 0.3 + Math.random() * 0.6;
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.cos(phi);
      positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      // 缓慢下落和轻微摆动
      velocities[i3] = (Math.random() - 0.5) * 0.001;
      velocities[i3 + 1] = -0.005 - Math.random() * 0.005;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.001;
    }

    snowGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    snowGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const snowMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.004,
      transparent: true,
      opacity: 0.9
    });

    this.effects.snow = new THREE.Points(snowGeometry, snowMaterial);
    this.effects.snow.visible = false;
    this.animationGroup.add(this.effects.snow);
  }

  /**
   * 创建云效果
   */
  createCloudEffect() {
    const cloudGroup = new THREE.Group();
    
    // 创建多个云层
    for (let i = 0; i < 3; i++) {
      const cloudGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const cloudMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        fog: false
      });
      
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloud.position.set(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 1.5
      );
      cloud.scale.set(
        1 + Math.random(),
        0.5 + Math.random() * 0.5,
        1 + Math.random()
      );
      
      cloudGroup.add(cloud);
    }
    
    this.effects.clouds = cloudGroup;
    this.effects.clouds.visible = false;
    this.animationGroup.add(this.effects.clouds);
  }

  /**
   * 创建雾效果
   */
  createFogEffect() {
    const fogGeometry = new THREE.SphereGeometry(0.9, 32, 32);
    const fogMaterial = new THREE.MeshBasicMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    
    this.effects.fog = new THREE.Mesh(fogGeometry, fogMaterial);
    this.effects.fog.visible = false;
    this.animationGroup.add(this.effects.fog);
  }

  /**
   * 创建雷暴效果
   */
  createThunderstormEffect() {
    // 组合雨效果和闪电效果
    const thunderGroup = new THREE.Group();
    
    // 闪电效果用发光材质模拟
    const lightningGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const lightningMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      emissive: 0xffffff,
      emissiveIntensity: 0
    });
    
    this.effects.lightning = new THREE.Mesh(lightningGeometry, lightningMaterial);
    this.effects.lightning.position.set(0, 0.5, 0);
    thunderGroup.add(this.effects.lightning);
    
    this.effects.thunderstorm = thunderGroup;
    this.effects.thunderstorm.visible = false;
    this.animationGroup.add(this.effects.thunderstorm);
  }

  /**
   * 更新动画
   */
  update(params) {
    const elapsedTime = this.clock.getElapsedTime();
    const weatherCode = params.weather.code;
    
    // 隐藏所有效果
    Object.values(this.effects).forEach(effect => {
      if (effect.visible !== undefined) {
        effect.visible = false;
      }
    });
    
    // 根据天气类型显示对应效果
    switch (weatherCode) {
      case 'rain':
        this.updateRainEffect(elapsedTime);
        break;
      case 'snow':
        this.updateSnowEffect(elapsedTime);
        break;
      case 'cloudy':
        this.updateCloudEffect(elapsedTime);
        break;
      case 'fog':
        this.updateFogEffect(elapsedTime, params);
        break;
      case 'thunderstorm':
        this.updateThunderstormEffect(elapsedTime);
        break;
      case 'clear':
        // 晴天显示轻微的大气效果
        this.updateClearEffect(elapsedTime);
        break;
    }
  }

  /**
   * 更新雨效果
   */
  updateRainEffect(time) {
    if (!this.effects.rain) return;
    
    this.effects.rain.visible = true;
    const positions = this.effects.rain.geometry.attributes.position.array;
    const velocities = this.effects.rain.geometry.attributes.velocity.array;
    
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += velocities[i];
      positions[i + 1] += velocities[i + 1];
      positions[i + 2] += velocities[i + 2];
      
      // 重置超出边界的粒子
      const distance = Math.sqrt(
        positions[i] * positions[i] +
        positions[i + 1] * positions[i + 1] +
        positions[i + 2] * positions[i + 2]
      );
      
      if (distance > 0.95 || positions[i + 1] < -0.9) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const radius = 0.3 + Math.random() * 0.4;
        
        positions[i] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = 0.8 + Math.random() * 0.1;
        positions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
      }
    }
    
    this.effects.rain.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * 更新雪效果
   */
  updateSnowEffect(time) {
    if (!this.effects.snow) return;
    
    this.effects.snow.visible = true;
    const positions = this.effects.snow.geometry.attributes.position.array;
    const velocities = this.effects.snow.geometry.attributes.velocity.array;
    
    for (let i = 0; i < positions.length; i += 3) {
      // 添加轻微的摆动
      velocities[i] = Math.sin(time + i) * 0.0005;
      velocities[i + 2] = Math.cos(time + i) * 0.0005;
      
      positions[i] += velocities[i];
      positions[i + 1] += velocities[i + 1];
      positions[i + 2] += velocities[i + 2];
      
      // 重置超出边界的粒子
      if (positions[i + 1] < -0.9) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const radius = 0.3 + Math.random() * 0.4;
        
        positions[i] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = 0.8 + Math.random() * 0.1;
        positions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
      }
    }
    
    this.effects.snow.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * 更新云效果
   */
  updateCloudEffect(time) {
    if (!this.effects.clouds) return;
    
    this.effects.clouds.visible = true;
    
    // 缓慢旋转云层
    this.effects.clouds.rotation.y = time * 0.1;
    
    // 让云层有轻微的上下浮动
    this.effects.clouds.children.forEach((cloud, index) => {
      cloud.position.y += Math.sin(time + index) * 0.001;
    });
  }

  /**
   * 更新雾效果
   */
  updateFogEffect(time, params) {
    if (!this.effects.fog) return;
    
    this.effects.fog.visible = true;
    
    // 根据能见度调整雾的透明度
    const visibility = params.weather.visibility || 10;
    const fogOpacity = Math.max(0.05, Math.min(0.4, (10 - visibility) / 10 * 0.4));
    this.effects.fog.material.opacity = fogOpacity;
    
    // 缓慢旋转雾气
    this.effects.fog.rotation.y = time * 0.05;
    this.effects.fog.rotation.x = Math.sin(time * 0.3) * 0.1;
  }

  /**
   * 更新雷暴效果
   */
  updateThunderstormEffect(time) {
    if (!this.effects.thunderstorm) return;
    
    this.effects.thunderstorm.visible = true;
    
    // 首先显示雨效果
    this.updateRainEffect(time);
    this.effects.rain.visible = true;
    
    // 随机闪电效果
    if (Math.random() < 0.02) { // 2% 概率闪电
      this.triggerLightning();
    }
  }

  /**
   * 更新晴天效果
   */
  updateClearEffect(time) {
    // 晴天可以有轻微的大气粒子效果
    // 暂时留空，后续可以添加灰尘粒子等
  }

  /**
   * 触发闪电效果
   */
  triggerLightning() {
    if (!this.effects.lightning) return;
    
    // 随机位置
    this.effects.lightning.position.set(
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5
    );
    
    // 闪电动画
    const material = this.effects.lightning.material;
    material.opacity = 1;
    material.emissiveIntensity = 2;
    
    // 快速衰减
    const fadeOut = () => {
      material.opacity *= 0.8;
      material.emissiveIntensity *= 0.8;
      
      if (material.opacity > 0.01) {
        requestAnimationFrame(fadeOut);
      } else {
        material.opacity = 0;
        material.emissiveIntensity = 0;
      }
    };
    
    fadeOut();
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
    if (this.animationGroup) {
      this.scene.remove(this.animationGroup);
      
      // 清理几何体和材质
      this.animationGroup.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
  }
}
