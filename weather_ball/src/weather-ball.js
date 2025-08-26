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
import { createTrueFresnelGlassMaterial, createVolumeCloudMaterial } from './utils/shader-loader.js';

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
        size: 600,
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
    
    // 强制设置大尺寸确保可见性
    const targetSize = 800; // 更大的尺寸确保清晰可见
    this.renderer.setSize(targetSize, targetSize);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // 同时设置canvas的CSS样式
    this.canvas.style.width = targetSize + 'px';
    this.canvas.style.height = targetSize + 'px';
    this.params.render.size = targetSize;
    
    // 启用物理正确的光照
    this.renderer.physicallyCorrectLights = true;
    
    // 按qa.md建议设置色调映射
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    // 阴影设置（暂时禁用以排除外圈阴影问题）
    this.renderer.shadowMap.enabled = false;
    // this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
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
    
    // 添加基础环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    // 主要方向光
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(5, 5, 5);
    this.scene.add(mainLight);
    
    // 边缘高光专用环形光源
    this.createRimLights();
    
    console.log('Added enhanced lighting system with rim lights');
    
    // 创建基础球体
    this.createBaseSphere();
    
    // 暂时移除地面平面以简化效果
    // this.createGroundPlane();
    
    // 设置天空渐变背景
    this.setSkyBackground();
  }

  /**
   * 创建双层球体结构
   */
  createBaseSphere() {
    // 创建高质量球体几何体
    const outerGeometry = new THREE.SphereGeometry(1, 64, 64);
    const innerGeometry = new THREE.SphereGeometry(0.95, 64, 64); // 稍小避免z-fighting
    
    console.log('Double-layer sphere geometry created');
    
    // 创建双层材质
    this.createDualLayerMaterials();
    
    // 外层：透明玻璃球壳
    this.outerSphere = new THREE.Mesh(outerGeometry, this.glassMaterial);
    this.outerSphere.name = 'outer-glass-shell';
    this.outerSphere.position.set(0, 0, 0);
    this.scene.add(this.outerSphere);
    
    // 内层：天气内容球
    this.innerSphere = new THREE.Mesh(innerGeometry, this.contentMaterial);
    this.innerSphere.name = 'inner-weather-content';
    this.innerSphere.position.set(0, 0, 0);
    this.scene.add(this.innerSphere);
    
    // 保留原sphere引用指向外层（兼容现有代码）
    this.sphere = this.outerSphere;
    
    console.log('Dual-layer sphere structure created:');
    console.log('- Outer shell (glass):', this.outerSphere.name);
    console.log('- Inner content:', this.innerSphere.name);
  }

  /**
   * 创建双层材质系统
   */
  createDualLayerMaterials() {
    try {
      // 创建HDRI环境
      this.createProperSkyHDRI();
    } catch (error) {
      console.error('Sky HDRI creation failed, using fallback:', error);
    }
    
    // 先创建基础材质，稍后替换为自定义着色器
    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.0,
      transparent: true,
      opacity: 0.15,
      transmission: 0.85,
      thickness: 0.5,
      ior: 1.52,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      envMapIntensity: 2.0,
      reflectivity: 1.0,
      side: THREE.DoubleSide
    });
    
    // 内层：体积云层材质
    this.contentMaterial = createVolumeCloudMaterial({
      cloudColor: new THREE.Color(this.getWeatherColor()),
      weatherColor: new THREE.Color(this.getWeatherAccentColor()),
      cloudDensity: this.getCloudDensity(),
      swirl: this.getSwirlIntensity(),
      weather: this.getWeatherIntensity()
    });
    
    // 立即创建简单透明玻璃材质
    try {
      // 创建基本透明材质替换灰色球体
      this.simpleGlassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.0,
        roughness: 0.1,
        transparent: true,
        opacity: 0.15,
        transmission: 0.85,
        thickness: 0.1,
        ior: 1.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        side: THREE.DoubleSide
      });
      
      // 立即应用到外层球体
      if (this.outerSphere) {
        this.outerSphere.material = this.simpleGlassMaterial;
        console.log('Applied simple glass material immediately');
      }
      
      // 延迟应用高级着色器
      setTimeout(() => {
        this.applyAdvancedShader();
      }, 500);
      
    } catch (error) {
      console.error('Failed to create simple glass material:', error);
    }
    
    console.log('Dual-layer materials created:');
    console.log('- Glass shell opacity:', this.glassMaterial.opacity);
    console.log('- Content opacity:', this.contentMaterial.opacity);
  }
  
  /**
   * 应用高级着色器材质
   */
  applyAdvancedShader() {
    try {
      // 创建或获取环境贴图
      let envMap = this.scene.environment;
      if (!envMap) {
        // 创建简单的程序化环境贴图
        envMap = this.createSimpleEnvMap();
      }
      
      // 创建真正的菲涅尔玻璃材质
      this.trueFresnelGlassMaterial = createTrueFresnelGlassMaterial(envMap, {
        glassStrength: 1.0,
        refractionStrength: 1.0,
        glassColor: new THREE.Color(0xffffff)
      });
      
      // 检查着色器编译
      console.log('Fresnel material created:', this.trueFresnelGlassMaterial);
      console.log('Uniforms:', Object.keys(this.trueFresnelGlassMaterial.uniforms));
      
      // 监听着色器编译错误
      this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
        console.error('WebGL context lost:', e);
      });
      
      // 应用到外层球体
      if (this.outerSphere) {
        this.outerSphere.material = this.trueFresnelGlassMaterial;
        console.log('Applied advanced Fresnel shader material');
        
        // 强制渲染一帧检查着色器编译
        this.renderer.render(this.scene, this.camera);
        
        // 检查WebGL错误
        const gl = this.renderer.getContext();
        const error = gl.getError();
        if (error !== gl.NO_ERROR) {
          console.error('WebGL error after applying shader:', error);
          // 回退到简单材质
          this.outerSphere.material = this.simpleGlassMaterial;
          console.log('Reverted to simple glass material due to shader error');
        }
      }
      
    } catch (error) {
      console.warn('Failed to apply advanced shader, keeping simple material:', error);
    }
  }
  
  /**
   * 创建简单环境贴图
   */
  createSimpleEnvMap() {
    const size = 64;
    const data = new Uint8Array(size * size * 4);
    
    for (let i = 0; i < size * size; i++) {
      const index = i * 4;
      // 简单的天蓝色渐变
      data[index] = 135;     // R
      data[index + 1] = 206; // G 
      data[index + 2] = 235; // B
      data[index + 3] = 255; // A
    }
    
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.needsUpdate = true;
    
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(size);
    cubeRenderTarget.texture.format = THREE.RGBFormat;
    
    return cubeRenderTarget.texture;
  }
  
  /**
   * 根据天气获取主要云层颜色（参考图优化）
   */
  getWeatherColor() {
    const weatherCode = this.params.weather.code;
    const colors = {
      'clear': 0x87CEEB,      // 天蓝色
      'cloudy': 0xB0C4DE,     // 浅钢蓝
      'rain': 0xCD853F,       // 秘鲁橙（参考图的暖橙色）
      'snow': 0xF0F8FF,       // 爱丽丝蓝
      'fog': 0xD3D3D3,        // 浅灰色
      'thunderstorm': 0x2F4F4F // 暗岩灰色
    };
    return colors[weatherCode] || colors['clear'];
  }
  
  /**
   * 根据天气获取强调色（漩涡深色部分）
   */
  getWeatherAccentColor() {
    const weatherCode = this.params.weather.code;
    const colors = {
      'clear': 0x4169E1,      // 皇家蓝
      'cloudy': 0x778899,     // 淡板岩灰
      'rain': 0x8B4513,       // 马鞍棕（参考图的深色部分）
      'snow': 0xB0C4DE,       // 浅钢蓝
      'fog': 0xA9A9A9,        // 暗灰色
      'thunderstorm': 0x191970 // 午夜蓝
    };
    return colors[weatherCode] || colors['clear'];
  }
  
  /**
   * 根据天气获取云层密度
   */
  getCloudDensity() {
    const weatherCode = this.params.weather.code;
    const densities = {
      'clear': 0.2,           // 很少云层
      'cloudy': 0.6,          // 中等云层
      'rain': 0.8,            // 密集云层
      'snow': 0.7,            // 较密云层
      'fog': 0.9,             // 非常密集
      'thunderstorm': 0.85    // 暴风云
    };
    return densities[weatherCode] || 0.5;
  }
  
  /**
   * 根据天气获取漩涡强度
   */
  getSwirlIntensity() {
    const weatherCode = this.params.weather.code;
    const intensities = {
      'clear': 0.5,           // 轻微漩涡
      'cloudy': 1.0,          // 中等漩涡
      'rain': 1.5,            // 强烈漩涡
      'snow': 0.8,            // 缓慢漩涡
      'fog': 0.3,             // 几乎静止
      'thunderstorm': 2.0     // 最强烈漩涡
    };
    return intensities[weatherCode] || 1.0;
  }
  
  /**
   * 根据天气获取天气强度
   */
  getWeatherIntensity() {
    const weatherCode = this.params.weather.code;
    const intensities = {
      'clear': 0.3,           // 轻微效果
      'cloudy': 0.6,          // 中等效果
      'rain': 0.9,            // 强烈效果
      'snow': 0.7,            // 中强效果
      'fog': 0.8,             // 强效果
      'thunderstorm': 1.0     // 最强效果
    };
    return intensities[weatherCode] || 0.5;
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
   * 创建边缘高光环形光源
   */
  createRimLights() {
    this.rimLights = [];
    const lightCount = 6;
    const radius = 4;
    
    for (let i = 0; i < lightCount; i++) {
      const angle = (i / lightCount) * Math.PI * 2;
      
      // 创建点光源
      const light = new THREE.PointLight(0xffffff, 0.8, 10);
      light.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.3, // 稍微压扁以形成环形
        Math.sin(angle) * radius
      );
      
      this.scene.add(light);
      this.rimLights.push(light);
    }
    
    // 添加一个顶部强光源
    const topLight = new THREE.PointLight(0xffffff, 1.5, 8);
    topLight.position.set(0, 3, 2);
    this.scene.add(topLight);
    this.rimLights.push(topLight);
    
    console.log(`Created ${this.rimLights.length} rim lights for edge enhancement`);
  }

  /**
   * 设置双层背景系统
   */
  setSkyBackground() {
    // 完全透明场景背景，让HTML蓝色背景透过玻璃显示（匹配参考图）
    this.scene.background = null;
    
    // 设置渲染器透明
    this.renderer.setClearColor(0x000000, 0); // 完全透明
    
    console.log('Scene background set to fully transparent - HTML background shows through glass');
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
      
      // 2) 设置天空参数（优化用于边缘反射）
      const uniforms = this.sky.material.uniforms;
      uniforms.turbidity.value = 2.0;      // 适中浑浊度
      uniforms.rayleigh.value = 1.0;       // 适中瑞利散射  
      uniforms.mieCoefficient.value = 0.01; // 轻微雾霾
      uniforms.mieDirectionalG.value = 0.8; // 适中方向性
      console.log('Sky parameters optimized for edge reflection');
    
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
      
      // 确保Sky不在主场景中
      if (this.scene.children.includes(this.sky)) {
        this.scene.remove(this.sky);
        console.log('Removed Sky from main scene');
      }
      
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
    
    // 更新环形光源动画
    this.updateRimLights();
    
    // 更新体积云层着色器时间
    this.updateVolumeCloudShader();
    
    // 更新环境贴图（实时反射）
    this.updateEnvironmentMap();
  }
  
  /**
   * 更新环形光源动画
   */
  updateRimLights() {
    if (!this.rimLights) return;
    
    const time = Date.now() * 0.001; // 转换为秒
    const lightCount = this.rimLights.length - 1; // 排除顶部光源
    
    for (let i = 0; i < lightCount; i++) {
      const light = this.rimLights[i];
      const baseAngle = (i / lightCount) * Math.PI * 2;
      const animatedAngle = baseAngle + time * 0.2; // 慢速旋转
      
      const radius = 4;
      light.position.set(
        Math.cos(animatedAngle) * radius,
        Math.sin(animatedAngle) * radius * 0.3,
        Math.sin(animatedAngle) * radius
      );
      
      // 添加光强度变化
      light.intensity = 0.6 + Math.sin(time * 2 + i) * 0.2;
    }
  }
  
  /**
   * 更新体积云层着色器
   */
  updateVolumeCloudShader() {
    if (this.contentMaterial && this.contentMaterial.uniforms) {
      const time = Date.now() * 0.001;
      this.contentMaterial.uniforms.time.value = time;
    }
  }

  /**
   * 更新环境贴图
   */
  updateEnvironmentMap() {
    if (this.cubeCamera && (this.outerSphere || this.sphere)) {
      // 隐藏双层球体以避免递归反射
      if (this.outerSphere) this.outerSphere.visible = false;
      if (this.innerSphere) this.innerSphere.visible = false;
      
      // 更新立方体相机位置
      const position = this.outerSphere?.position || this.sphere?.position;
      if (position) {
        this.cubeCamera.position.copy(position);
        
        // 渲染环境贴图
        this.cubeCamera.update(this.renderer, this.scene);
      }
      
      // 恢复球体可见性
      if (this.outerSphere) this.outerSphere.visible = true;
      if (this.innerSphere) this.innerSphere.visible = true;
      
      // 更新所有材质的环境贴图
      if (this.glassMaterial && this.envMap) {
        this.glassMaterial.envMap = this.envMap;
        this.glassMaterial.needsUpdate = true;
      }
      
      // 更新真正的菲涅尔材质的环境贴图
      if (this.trueFresnelGlassMaterial && this.scene.environment) {
        this.trueFresnelGlassMaterial.uniforms.envMap.value = this.scene.environment;
        this.trueFresnelGlassMaterial.needsUpdate = true;
      }
    }
  }

  /**
   * 更新参数
   */
  update(newParams) {
    this.params = this.mergeDefaultParams(newParams);
    
    // 更新体积云层着色器参数
    if (this.contentMaterial && this.contentMaterial.uniforms) {
      this.contentMaterial.uniforms.cloudColor.value.setHex(this.getWeatherColor());
      this.contentMaterial.uniforms.weatherColor.value.setHex(this.getWeatherAccentColor());
      this.contentMaterial.uniforms.cloudDensity.value = this.getCloudDensity();
      this.contentMaterial.uniforms.swirl.value = this.getSwirlIntensity();
      this.contentMaterial.uniforms.weather.value = this.getWeatherIntensity();
      this.contentMaterial.needsUpdate = true;
    }
    
    // 更新太阳位置（如果提供了天文或环境参数）
    if (newParams.astronomical || newParams.environmental) {
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
    
    // 从参数中获取太阳位置和时间信息
    const sunData = params.astronomical?.sun || {};
    const timeOfDay = params.environmental?.timeOfDay;
    
    let elevation = sunData.altitude || 20;
    let azimuth = sunData.azimuth || 130;
    
    // 根据时间段调整太阳位置
    if (timeOfDay) {
      switch (timeOfDay) {
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
    
    // 如果有具体的太阳高度角数据，优先使用
    if (sunData.altitude !== undefined) {
      elevation = sunData.altitude;
    }
    if (sunData.azimuth !== undefined) {
      azimuth = sunData.azimuth;
    }
    
    // 更新太阳位置
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);
    this.sun.setFromSphericalCoords(1, phi, theta);
    
    const uniforms = this.sky.material.uniforms;
    uniforms.sunPosition.value.copy(this.sun);
    
    console.log(`Sun updated: elevation=${elevation}°, azimuth=${azimuth}°`);
    
    // 立即重新烘焙环境贴图以反映太阳位置变化
    this.bakeEnvironmentFromSky();
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
    
    // 清理双层球体材质
    if (this.glassMaterial) {
      this.glassMaterial.dispose();
    }
    if (this.contentMaterial) {
      this.contentMaterial.dispose();
    }
    
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
