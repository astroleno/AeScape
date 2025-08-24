/**
 * 天气球渲染引擎
 * 3D天气可视化核心类
 */

import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { LightingSystem } from './systems/lighting-system.js';
import { AtmosphereSystem } from './systems/atmosphere-system.js';
import { CloudSystem } from './systems/cloud-system.js';
import { ParticleSystem } from './systems/particle-system.js';
import { WeatherAnimationSystem } from './systems/weather-animation-system.js';
// import { PostProcessingSystem } from './systems/post-processing-system.js'; // 暂时禁用
import { createSkyGradient } from './utils/sky-gradient.js';

export class WeatherBall {
  constructor(canvas, params = {}) {
    this.canvas = canvas;
    this.params = this.mergeDefaultParams(params);
    
    // 渲染状态
    this.isRunning = false;
    this.isPaused = false;
    this.frameCount = 0;
    
    // 初始化渲染器
    this.initRenderer();
    
    // 初始化场景
    this.initScene();
    
    // 初始化系统
    this.initSystems();
    
    // 开始渲染
    this.start();
  }

  /**
   * 合并默认参数
   */
  mergeDefaultParams(params) {
    return {
      // 基础天气数据
      weather: {
        code: 'clear',
        temperature: 25,
        humidity: 60,
        pressure: 1013,
        visibility: 10,
        windSpeed: 5,
        windDirection: 180,
        cloudCover: 20,
        ...params.weather
      },
      
      // 天文数据
      astronomical: {
        sun: {
          azimuth: 180,
          altitude: 45,
          intensity: 0.8,
          isVisible: true,
          ...params.astronomical?.sun
        },
        moon: {
          phase: 0.5,
          phaseName: '满月',
          azimuth: 90,
          altitude: 30,
          isVisible: true,
          ...params.astronomical?.moon
        },
        ...params.astronomical
      },
      
      // 环境数据
      environmental: {
        airQuality: 75,
        timeOfDay: 'day',
        season: 'summer',
        ...params.environmental
      },
      
      // 渲染设置
      render: {
        size: 400,
        quality: 'high',
        ...params.render
      }
    };
  }

  /**
   * 初始化渲染器
   */
  initRenderer() {
    // 检查并清理Canvas上下文
    if (this.canvas.getContext) {
      console.log('Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
      console.log('Canvas existing context:', this.canvas.getContext('webgl') || this.canvas.getContext('webgl2') || this.canvas.getContext('2d'));
    }
    
    // 重置Canvas属性
    this.canvas.width = this.params.render.size;
    this.canvas.height = this.params.render.size;
    
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true
      });
      console.log('WebGL Renderer created successfully');
    } catch (error) {
      console.error('Failed to create WebGL renderer:', error);
      // 尝试不使用现有canvas
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      // 替换canvas
      this.canvas.parentNode.replaceChild(this.renderer.domElement, this.canvas);
      this.canvas = this.renderer.domElement;
      console.log('Fallback: Created new canvas');
    }
    
    this.renderer.setSize(this.params.render.size, this.params.render.size);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // 启用物理正确的光照
    this.renderer.physicallyCorrectLights = true;
    
    // 按qa.md建议设置色调映射
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    // 阴影设置
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // 输出编码
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    
    // 伽马因子
    this.renderer.gammaFactor = 2.2;
    
    // 设置透明背景
    // 透明背景让HTML的渐变背景显示
    this.renderer.setClearColor(0x000000, 0); // 透明背景
    
    // 确保支持透明材质排序
    this.renderer.sortObjects = true;
    
    // 安全检查WebGL上下文
    const gl = this.renderer.getContext();
    if (gl) {
      console.log('Renderer setup - alpha:', gl.getContextAttributes().alpha);
    } else {
      console.log('Renderer setup - WebGL context not available');
    }
    
    // 初始化PMREM生成器用于环境贴图
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();
  }

  /**
   * 初始化场景
   */
  initScene() {
    this.scene = new THREE.Scene();
    
    // 设置相机
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.params.render.size / this.params.render.size,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 3);
    this.camera.lookAt(0, 0, 0);
    
    console.log('Camera position:', this.camera.position);
    console.log('Camera looking at origin');
    
    // 添加基础环境光和方向光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);
    
    // 添加方向光增强反射可见性
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);
    
    console.log('Added enhanced lighting for better material visibility');
    
    // 创建基础球体
    this.createBaseSphere();
    
    // 暂时移除地面平面以简化效果
    // this.createGroundPlane();
    
    // 设置天空渐变背景
    this.setSkyBackground();
  }

  /**
   * 创建基础球体
   */
  createBaseSphere() {
    const geometry = new THREE.SphereGeometry(1, 32, 16); // 减少顶点数用于调试
    console.log('Sphere geometry created - vertices:', geometry.attributes.position.count);
    
    // 创建玻璃球材质
    this.createGlassMaterial();
    
    this.sphere = new THREE.Mesh(geometry, this.glassMaterial);
    this.sphere.castShadow = false; // 暂时禁用阴影
    this.sphere.receiveShadow = false;
    this.sphere.position.set(0, 0, 0); // 明确设置位置
    this.scene.add(this.sphere);
    
    console.log('Sphere created with material:', this.glassMaterial.type, 'opacity:', this.glassMaterial.opacity);
    console.log('Sphere material details:', {
      transparent: this.glassMaterial.transparent,
      transmission: this.glassMaterial.transmission,
      envMap: !!this.glassMaterial.envMap,
      color: this.glassMaterial.color.getHex().toString(16),
      emissive: this.glassMaterial.emissive?.getHex().toString(16),
      wireframe: this.glassMaterial.wireframe
    });
    console.log('Sphere position:', this.sphere.position);
    console.log('Sphere scale:', this.sphere.scale);
    console.log('Sphere visible:', this.sphere.visible);
  }

  /**
   * 创建玻璃材质
   */
  createGlassMaterial() {
    try {
      // 尝试创建真正的Three.js Sky HDRI环境
      this.createProperSkyHDRI();
    } catch (error) {
      console.error('Sky HDRI creation failed, using fallback:', error);
    }
    
    // 高反射玻璃球材质（增强太阳高光）
    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,        // 白色基色
      metalness: 1.0,         // 最大金属感增强反射
      roughness: 0.05,        // 极低粗糙度增强锐利反射
      transparent: true,      // 透明
      opacity: 0.3,           // 降低不透明度突出反射
      transmission: 0.7,      // 高透射率
      thickness: 1.0,         // 厚度
      ior: 1.5,              // 玻璃折射率
      clearcoat: 1.0,        // 启用清漆层增强反射
      clearcoatRoughness: 0.0, // 清漆完全光滑
      envMapIntensity: 3.0,   // 大幅提高环境反射强度
      side: THREE.DoubleSide  // 双面渲染
    });
    
    // 延迟设置环境贴图，确保scene.environment已设置
    setTimeout(() => {
      if (this.scene.environment) {
        this.glassMaterial.envMap = this.scene.environment;
        this.glassMaterial.needsUpdate = true;
        console.log('Environment map applied to glass material');
      }
    }, 100);
    
    console.log('PBR glass ball created with proper Sky HDRI');
    console.log('Material metalness:', this.glassMaterial.metalness);
    console.log('Material roughness:', this.glassMaterial.roughness);
    console.log('Material envMapIntensity:', this.glassMaterial.envMapIntensity);
    
    // 暂时移除测试球以简化调试
    // this.createTestBall();
  }
  
  /**
   * 创建测试球确认反射效果（按qa.md建议）
   */
  createTestBall() {
    const geo = new THREE.SphereGeometry(0.3, 64, 64);
    const mat = new THREE.MeshPhysicalMaterial({
      metalness: 1.0,
      roughness: 0.15,
      envMapIntensity: 1.2,
      clearcoat: 0.0,
      color: 0xffffff
    });
    this.testBall = new THREE.Mesh(geo, mat);
    this.testBall.position.set(1.5, 0, 0); // 放在主球旁边
    this.scene.add(this.testBall);
    
    console.log('Test ball added to verify reflections');
    
    // 如果简单材质工作，我们再恢复复杂材质
    // this.glassMaterial = new THREE.MeshPhysicalMaterial({
    //   color: 0xffffff,
    //   metalness: 0.0,
    //   roughness: 0.1,
    //   ior: 1.5,
    //   transparent: true,
    //   opacity: 0.3,
    //   transmission: 0.8,
    //   thickness: 0.2,
    //   reflectivity: 0.5,
    //   envMap: this.hdriTexture,
    //   envMapIntensity: 1.0,
    //   side: THREE.DoubleSide
    // });
  }

  /**
   * 创建表面纹理
   */
  createSurfaceTextures() {
    // 创建法线贴图模拟水滴和气泡
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // 绘制随机的水滴和气泡
    ctx.fillStyle = '#8080ff'; // 法线贴图的中性色
    ctx.fillRect(0, 0, 512, 512);
    
    // 添加水滴效果
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const radius = 5 + Math.random() * 15;
      
      // 水滴高光
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.3, '#c0c0ff');
      gradient.addColorStop(0.7, '#8080ff');
      gradient.addColorStop(1, '#4040ff');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 添加气泡效果
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const radius = 3 + Math.random() * 10;
      
      // 气泡环形
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // 气泡内部
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();
    }
    
    this.surfaceNormalMap = new THREE.CanvasTexture(canvas);
    this.surfaceNormalMap.wrapS = THREE.RepeatWrapping;
    this.surfaceNormalMap.wrapT = THREE.RepeatWrapping;
  }

  /**
   * 创建环境贴图
   */
  createEnvironmentMap() {
    // 创建立方体相机用于实时环境贴图
    const renderTarget = new THREE.WebGLCubeRenderTarget(512);
    this.cubeCamera = new THREE.CubeCamera(0.1, 1000, renderTarget);
    this.cubeCamera.position.copy(this.sphere?.position || new THREE.Vector3(0, 0, 0));
    
    // 创建环境贴图
    this.envMap = renderTarget.texture;
    this.envMap.mapping = THREE.CubeReflectionMapping;
    
    this.scene.add(this.cubeCamera);
  }

  /**
   * 创建地面平面
   */
  createGroundPlane() {
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const groundMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.1,
      transparent: true,
      opacity: 0.1,
      reflectivity: 0.8
    });
    
    this.groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundPlane.rotation.x = -Math.PI / 2; // 水平放置
    this.groundPlane.position.y = -1.5; // 球体下方
    this.groundPlane.receiveShadow = true;
    
    this.scene.add(this.groundPlane);
  }

  /**
   * 设置双层背景系统
   */
  setSkyBackground() {
    // 透明场景背景，让HTML渐变显示
    this.scene.background = null;
    console.log('Scene background set to transparent - HTML gradient visible');
    // 注意：环境贴图现在由createProperSkyHDRI()中的bakeEnvironmentFromSky()设置
  }
  
  /**
   * 创建正确的Three.js Sky HDRI系统
   */
  createProperSkyHDRI() {
    try {
      // 1) 创建天空
      console.log('Creating Sky object...');
      this.sky = new Sky();
      this.sky.scale.setScalar(10000);
      console.log('Sky object created successfully');
      
          // 2) 设置天空参数（增强太阳可见度）
    const uniforms = this.sky.material.uniforms;
    uniforms.turbidity.value = 1.0;      // 降低浑浊度，增强太阳
    uniforms.rayleigh.value = 2.0;       // 增加瑞利散射
    uniforms.mieCoefficient.value = 0.008; // 增加Mie散射
    uniforms.mieDirectionalG.value = 0.8; // 增强太阳方向性
      console.log('Sky parameters set');
    
    // 3) 设置太阳位置
    this.sun = new THREE.Vector3();
    const elevation = 20; // 太阳高度角
    const azimuth = 130;  // 太阳方位角
    
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);
    this.sun.setFromSphericalCoords(1, phi, theta);
    uniforms.sunPosition.value.copy(this.sun);
    
    console.log('Sun position set:', this.sun);
    
      // 4) 从Sky烘焙PMREM环境贴图
      this.bakeEnvironmentFromSky();
      
      console.log('Proper Three.js Sky HDRI system created');
    } catch (error) {
      console.error('Failed to create Sky HDRI system:', error);
      throw error; // 重新抛出给上级处理
    }
  }
  
  /**
   * 从Sky烘焙PMREM环境贴图
   */
  bakeEnvironmentFromSky() {
    try {
      console.log('Starting environment bake from Sky...');
      
      // 创建临时场景只包含Sky来烘焙
      const tempScene = new THREE.Scene();
      tempScene.add(this.sky);
      
      console.log('Baking environment texture from Sky...');
      // 使用PMREMGenerator从临时场景烘焙环境贴图（降低sigma避免警告）
      const envTexture = this.pmremGenerator.fromScene(tempScene, 0.1).texture;
      
      // 设置主场景环境
      this.scene.environment = envTexture;
      
      // 清理临时场景
      tempScene.remove(this.sky);
      
      console.log('Environment baked from Sky using PMREM');
      console.log('ENV OK?', !!this.scene.environment, 
                 this.renderer.outputColorSpace, 
                 this.renderer.toneMapping, 
                 this.renderer.toneMappingExposure);
    } catch (error) {
      console.error('Failed to bake environment from Sky:', error);
      // 降级方案：设置一个基础环境
      this.scene.environment = null;
      console.log('Using fallback: no environment map');
    }
  }

  /**
   * 创建基于Three.js Sky的HDRI环境系统
   */
  createHDRIEnvironment(weatherCode = 'clear') {
    // 创建天空
    this.sky = new Sky();
    this.sky.scale.setScalar(10000);
    
    // 获取天空材质的uniforms
    this.skyUniforms = this.sky.material.uniforms;
    
    // 设置基础天空参数
    this.setupSkyParameters(weatherCode);
    
    // 创建太阳向量
    this.sunVector = new THREE.Vector3();
    
    // 生成环境贴图
    this.bakeEnvironmentFromSky();
    
    console.log('HDRI Environment created with Sky');
  }
  
  /**
   * 根据天气设置天空参数
   */
  setupSkyParameters(weatherCode) {
    switch(weatherCode) {
      case 'clear':
        this.skyUniforms.turbidity.value = 2.0;        // 清澈
        this.skyUniforms.rayleigh.value = 1.5;         // 蓝天效果
        this.skyUniforms.mieCoefficient.value = 0.004; // 少雾霾
        this.skyUniforms.mieDirectionalG.value = 0.7;
        break;
      case 'cloudy':
        this.skyUniforms.turbidity.value = 8.0;        // 多云
        this.skyUniforms.rayleigh.value = 2.0;
        this.skyUniforms.mieCoefficient.value = 0.01;
        this.skyUniforms.mieDirectionalG.value = 0.8;
        break;
      case 'rain':
      case 'thunderstorm':
        this.skyUniforms.turbidity.value = 15.0;       // 阴天
        this.skyUniforms.rayleigh.value = 1.0;
        this.skyUniforms.mieCoefficient.value = 0.02;
        this.skyUniforms.mieDirectionalG.value = 0.9;
        break;
      case 'fog':
        this.skyUniforms.turbidity.value = 20.0;       // 大雾
        this.skyUniforms.rayleigh.value = 0.5;
        this.skyUniforms.mieCoefficient.value = 0.05;
        this.skyUniforms.mieDirectionalG.value = 0.95;
        break;
      default: // snow等
        this.skyUniforms.turbidity.value = 5.0;
        this.skyUniforms.rayleigh.value = 1.8;
        this.skyUniforms.mieCoefficient.value = 0.008;
        this.skyUniforms.mieDirectionalG.value = 0.75;
    }
  }
  
  /**
   * 设置太阳位置
   */
  setSunPosition(elevation = 20, azimuth = 130) {
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);
    this.sunVector.setFromSphericalCoords(1, phi, theta);
    this.skyUniforms.sunPosition.value.copy(this.sunVector);
  }
  


  // 旧的Canvas HDRI生成代码已移除，现在使用Three.js Sky + PMREMGenerator

  /**
   * 创建显示用的渐变背景
   */
  createDisplayBackground() {
    // Three.js场景背景设置为透明，让HTML的CSS背景显示
    this.scene.background = null; // 透明背景，显示HTML的CSS背景
  }

  /**
   * 初始化渲染系统
   */
  initSystems() {
    this.systems = {
      lighting: new LightingSystem(this.scene, this.camera),
      atmosphere: new AtmosphereSystem(this.scene, this.camera),
      clouds: new CloudSystem(this.scene),
      particles: new ParticleSystem(this.scene),
      weatherAnimation: new WeatherAnimationSystem(this.scene, this.sphere)
      // 暂时禁用后处理系统以修复shader错误
      // postProcessing: new PostProcessingSystem(this.renderer, this.scene, this.camera)
    };
    
    // 初始化所有系统
    Object.values(this.systems).forEach(system => {
      if (system.init) {
        system.init(this.params);
      }
    });
  }

  /**
   * 开始渲染循环
   */
  start() {
    this.isRunning = true;
    this.animate();
  }

  /**
   * 渲染循环
   */
  animate() {
    if (!this.isRunning || this.isPaused) return;
    
    requestAnimationFrame(() => this.animate());
    
    // 更新所有系统
    this.updateSystems();
    
    // 直接渲染，暂时不使用后处理
    this.renderer.render(this.scene, this.camera);
    
    // 每隔100帧输出一次调试信息
    if (this.frameCount++ % 100 === 0) {
      console.log('Rendering - Scene objects:', this.scene.children.length, 'Sphere visible:', this.sphere?.visible);
    }
  }

  /**
   * 更新所有系统
   */
  updateSystems() {
    Object.values(this.systems).forEach(system => {
      if (system.update) {
        system.update(this.params);
      }
    });
    
    // 更新环境贴图（实时反射）
    this.updateEnvironmentMap();
  }

  /**
   * 更新环境贴图
   */
  updateEnvironmentMap() {
    if (this.cubeCamera && this.sphere) {
      // 隐藏球体以避免递归反射
      this.sphere.visible = false;
      
      // 更新立方体相机位置
      this.cubeCamera.position.copy(this.sphere.position);
      
      // 渲染环境贴图
      this.cubeCamera.update(this.renderer, this.scene);
      
      // 恢复球体可见性
      this.sphere.visible = true;
      
      // 更新材质的环境贴图
      if (this.glassMaterial && this.envMap) {
        this.glassMaterial.envMap = this.envMap;
        this.glassMaterial.needsUpdate = true;
      }
    }
  }

  /**
   * 更新参数
   */
  update(newParams) {
    this.params = this.mergeDefaultParams(newParams);
    
    // 更新太阳位置（如果提供了时间或太阳参数）
    if (newParams.time || newParams.sun) {
      this.updateSunPosition(newParams);
    }
    
    // 更新HDRI环境贴图
    this.updateHDRIEnvironment();
    
    // 更新天空背景
    this.setSkyBackground();
    
    // 更新所有系统
    Object.values(this.systems).forEach(system => {
      if (system.update) {
        system.update(this.params);
      } else if (system.updateParams) {
        system.updateParams(this.params);
      }
    });
  }
  
  /**
   * 更新太阳位置
   */
  updateSunPosition(params) {
    if (!this.sky) return;
    
    let elevation = 20;
    let azimuth = 130;
    
    // 根据时间设置太阳位置
    if (params.time) {
      switch (params.time) {
        case 'dawn':
          elevation = 5;
          azimuth = 90;
          break;
        case 'day':
          elevation = 60;
          azimuth = 180;
          break;
        case 'dusk':
          elevation = 5;
          azimuth = 270;
          break;
        case 'night':
          elevation = -10;
          azimuth = 0;
          break;
      }
    }
    
    // 根据太阳位置参数设置
    if (params.sun) {
      switch (params.sun) {
        case 'high':
          elevation = 80;
          break;
        case 'medium':
          elevation = 45;
          break;
        case 'low':
          elevation = 10;
          break;
        case 'below':
          elevation = -15;
          break;
      }
    }
    
    // 更新太阳位置
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);
    this.sun.setFromSphericalCoords(1, phi, theta);
    
    const uniforms = this.sky.material.uniforms;
    uniforms.sunPosition.value.copy(this.sun);
    
    console.log(`Sun updated: elevation=${elevation}°, azimuth=${azimuth}°`);
    
    // 重新烘焙环境贴图以反映太阳位置变化
    setTimeout(() => this.bakeEnvironmentFromSky(), 100);
  }

  /**
   * 更新HDRI环境贴图
   */
  updateHDRIEnvironment() {
    const weatherCode = this.params.weather.code;
    const sunData = this.params.astronomical.sun;
    
    // 更新天空参数
    if (this.skyUniforms) {
      this.setupSkyParameters(weatherCode);
      
      // 更新太阳位置
      this.setSunPosition(sunData.altitude || 20, sunData.azimuth || 130);
      
      // 重新烘焙环境贴图
      this.bakeEnvironmentFromSky();
      
      // 更新玻璃材质
      if (this.glassMaterial) {
        this.glassMaterial.envMap = this.hdriTexture;
        this.glassMaterial.needsUpdate = true;
      }
      
      console.log('HDRI Environment updated for weather:', weatherCode);
    }
  }

  /**
   * 暂停渲染
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * 恢复渲染
   */
  resume() {
    this.isPaused = false;
    this.animate();
  }

  /**
   * 调整大小
   */
  resize(width, height) {
    const size = Math.min(width, height);
    this.params.render.size = size;
    
    this.camera.aspect = 1;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(size, size);
  }

  /**
   * 销毁资源
   */
  destroy() {
    this.isRunning = false;
    
    // 销毁所有系统
    Object.values(this.systems).forEach(system => {
      if (system.destroy) {
        system.destroy();
      }
    });
    
    // 清理PMREM生成器
    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
    }
    
    // 清理环境贴图
    if (this.hdriTexture) {
      this.hdriTexture.dispose();
    }
    
    // 清理天空对象
    if (this.sky) {
      this.sky.material.dispose();
      this.sky.geometry.dispose();
    }
    
    // 销毁渲染器
    this.renderer.dispose();
    
    // 清理场景
    this.scene.clear();
  }
}

/**
 * 创建天气球实例的工厂函数
 */
export function createWeatherBall(canvas, params) {
  return new WeatherBall(canvas, params);
}
