/**
 * 粒子系统
 * 处理雨、雪、雾等粒子效果
 */

import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);
    this.envMap = null;
  }

  init(params) {
    // 获取环境贴图
    this.envMap = this.scene.environment;
    this.createParticles(params);
    console.log('Particle system initialized with', this.particles.length, 'particles');
  }

  /**
   * 创建粒子
   */
  createParticles(params) {
    const weatherCode = params.weather.code;
    
    // 清理现有粒子
    this.clearParticles();
    
    switch(weatherCode) {
      case 'rain':
        this.createRainDrops();
        break;
      case 'snow':
        this.createSnowFlakes();
        break;
      case 'fog':
        this.createFogParticles();
        break;
      case 'thunderstorm':
        this.createStormParticles();
        break;
      default:
        // clear/cloudy 不需要粒子
        break;
    }
  }

  /**
   * 创建雨滴（参考图效果）
   */
  createRainDrops() {
    const dropCount = 15; // 减少数量但增大尺寸
    
    for (let i = 0; i < dropCount; i++) {
      // 创建水滴几何体（放大3倍）
      const dropGeometry = new THREE.SphereGeometry(0.35 + Math.random() * 0.30, 16, 16);
      
      // 创建水滴材质（高反射透明）
      const dropMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.0,
        roughness: 0.0,
        transparent: true,
        opacity: 0.8,
        transmission: 0.9,
        ior: 1.33, // 水的折射率
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        envMap: this.envMap,
        envMapIntensity: 2.0
      });
      
      const dropMesh = new THREE.Mesh(dropGeometry, dropMaterial);
      
      // 随机位置（球内约束）
      const position = this.getRandomPositionInSphere(0.8);
      dropMesh.position.copy(position);
      
      // 添加到粒子组
      this.particleGroup.add(dropMesh);
      
      // 存储粒子信息
      this.particles.push({
        mesh: dropMesh,
        type: 'raindrop',
        basePosition: position.clone(),
        floatSpeed: Math.random() * 0.5 + 0.2,
        floatPhase: Math.random() * Math.PI * 2
      });
    }
  }

  /**
   * 创建雪花
   */
  createSnowFlakes() {
    const flakeCount = 20; // 减少数量但增大尺寸
    
    for (let i = 0; i < flakeCount; i++) {
      // 雪花几何体（放大）
      const flakeGeometry = new THREE.SphereGeometry(0.25 + Math.random() * 0.25, 12, 12);
      
      const flakeMaterial = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
      });
      
      const flakeMesh = new THREE.Mesh(flakeGeometry, flakeMaterial);
      
      const position = this.getRandomPositionInSphere(0.85);
      flakeMesh.position.copy(position);
      
      this.particleGroup.add(flakeMesh);
      
      this.particles.push({
        mesh: flakeMesh,
        type: 'snowflake',
        basePosition: position.clone(),
        floatSpeed: Math.random() * 0.3 + 0.1,
        floatPhase: Math.random() * Math.PI * 2
      });
    }
  }

  /**
   * 创建雾粒子
   */
  createFogParticles() {
    const fogCount = 40; // 增加雾粒子数量
    
    for (let i = 0; i < fogCount; i++) {
      const fogGeometry = new THREE.SphereGeometry(0.15 + Math.random() * 0.25, 8, 8); // 更大的雾团
      
      const fogMaterial = new THREE.MeshLambertMaterial({
        color: 0xdddddd,
        transparent: true,
        opacity: 0.6 // 更不透明
      });
      
      const fogMesh = new THREE.Mesh(fogGeometry, fogMaterial);
      
      const position = this.getRandomPositionInSphere(0.9);
      fogMesh.position.copy(position);
      
      this.particleGroup.add(fogMesh);
      
      this.particles.push({
        mesh: fogMesh,
        type: 'fog',
        basePosition: position.clone(),
        floatSpeed: Math.random() * 0.1 + 0.05,
        floatPhase: Math.random() * Math.PI * 2
      });
    }
  }

  /**
   * 创建暴风粒子（包含闪电效果）
   */
  createStormParticles() {
    // 结合雨滴和一些更大的粒子
    this.createRainDrops();
    
    const stormCount = 15;
    for (let i = 0; i < stormCount; i++) {
      const stormGeometry = new THREE.SphereGeometry(0.06 + Math.random() * 0.1, 8, 8);
      
      const stormMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x333333,
        metalness: 0.0,
        roughness: 0.1,
        transparent: true,
        opacity: 0.7
      });
      
      const stormMesh = new THREE.Mesh(stormGeometry, stormMaterial);
      
      const position = this.getRandomPositionInSphere(0.8);
      stormMesh.position.copy(position);
      
      this.particleGroup.add(stormMesh);
      
      this.particles.push({
        mesh: stormMesh,
        type: 'storm',
        basePosition: position.clone(),
        floatSpeed: Math.random() * 0.8 + 0.4,
        floatPhase: Math.random() * Math.PI * 2
      });
    }
    
    // 创建闪电效果
    this.createLightning();
  }
  
  /**
   * 创建闪电效果
   */
  createLightning() {
    const lightningCount = 8; // 增加闪电数量
    
    for (let i = 0; i < lightningCount; i++) {
      // 创建闪电几何体（更大更粗的线条）
      const lightningGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8);
      
      const lightningMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1.0,
        emissive: 0x88aaff,
        emissiveIntensity: 5.0 // 更强发光
      });
      
      const lightningMesh = new THREE.Mesh(lightningGeometry, lightningMaterial);
      
      // 随机位置和旋转
      const position = this.getRandomPositionInSphere(0.7);
      lightningMesh.position.copy(position);
      lightningMesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      // 默认隐藏，通过闪烁显示
      lightningMesh.visible = false;
      
      this.particleGroup.add(lightningMesh);
      
      this.particles.push({
        mesh: lightningMesh,
        type: 'lightning',
        basePosition: position.clone(),
        floatSpeed: Math.random() * 2.0 + 1.0,
        floatPhase: Math.random() * Math.PI * 2,
        flashInterval: Math.random() * 1500 + 500, // 0.5-2秒闪烁一次，更频繁
        lastFlash: Date.now()
      });
    }
  }

  /**
   * 获取球内随机位置
   */
  getRandomPositionInSphere(radius) {
    const phi = Math.random() * Math.PI * 2;
    const costheta = Math.random() * 2 - 1;
    const theta = Math.acos(costheta);
    const r = Math.cbrt(Math.random()) * radius;
    
    return new THREE.Vector3(
      r * Math.sin(theta) * Math.cos(phi),
      r * Math.sin(theta) * Math.sin(phi),
      r * Math.cos(theta)
    );
  }

  /**
   * 更新粒子动画
   */
  update(params) {
    if (this.particles.length === 0) {
      this.createParticles(params);
      return;
    }

    const time = Date.now() * 0.001;
    
    this.particles.forEach(particle => {
      // 浮动动画
      const floatOffset = Math.sin(time * particle.floatSpeed + particle.floatPhase) * 0.05;
      particle.mesh.position.copy(particle.basePosition);
      particle.mesh.position.y += floatOffset;
      
      // 轻微旋转
      particle.mesh.rotation.x += 0.01 * particle.floatSpeed;
      particle.mesh.rotation.y += 0.01 * particle.floatSpeed;
      
      // 闪电特殊效果（简化版本）
      if (particle.type === 'lightning') {
        const now = Date.now();
        const timeSinceFlash = now - particle.lastFlash;
        
        if (timeSinceFlash > particle.flashInterval) {
          particle.lastFlash = now;
        }
        
        // 闪电显示逻辑：短暂强烈闪烁
        const flashDuration = 300; // 更长的闪烁时间
        const showFlash = (timeSinceFlash % particle.flashInterval) < flashDuration;
        particle.mesh.visible = showFlash;
        
        // 闪烁时大幅增加强度和透明度
        if (showFlash) {
          particle.mesh.material.emissiveIntensity = 8.0 + Math.random() * 4.0;
          particle.mesh.material.opacity = 1.0;
          // 随机改变颜色使闪电更生动
          const colors = [0x88aaff, 0xaabbff, 0xccddff, 0xffffff];
          particle.mesh.material.emissive.setHex(colors[Math.floor(Math.random() * colors.length)]);
        } else {
          particle.mesh.material.opacity = 0.0;
        }
      }
      
      // 更新环境贴图（如果有）
      if (particle.mesh.material.envMap !== this.scene.environment) {
        particle.mesh.material.envMap = this.scene.environment;
        particle.mesh.material.needsUpdate = true;
      }
    });
  }

  updateParams(params) {
    // 检查天气是否改变
    const newWeatherCode = params.weather.code;
    if (this.currentWeather !== newWeatherCode) {
      this.currentWeather = newWeatherCode;
      this.createParticles(params);
    }
    this.update(params);
  }

  /**
   * 清理粒子
   */
  clearParticles() {
    this.particles.forEach(particle => {
      this.particleGroup.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      particle.mesh.material.dispose();
    });
    this.particles = [];
  }

  destroy() {
    this.clearParticles();
    this.scene.remove(this.particleGroup);
  }
}
