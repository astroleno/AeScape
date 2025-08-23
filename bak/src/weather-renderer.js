// Three.js 天气渲染模块
// 专门处理Three.js相关的渲染逻辑

class WeatherRenderer {
  constructor(container) {
    this.container = container;
    
    // Three.js 核心对象
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.composer = null;
    
    // 光源
    this.ambientLight = null;
    this.directionalLight = null;
    this.lightningLight = null;
    
    // 场景对象
    this.skySphere = null;
    this.cloudGroup = null;
    this.cloud1 = null;
    this.cloud2 = null;
    this.cloudTex = null;
    
    // 天气效果对象
    this.rainMesh = null;
    this.splashMesh = null;
    
    // 渲染参数
    this.renderParams = {
      fogDensity: 0.03,
      fogColor: 0x8ec5df,
      ambientIntensity: 0.8,
      directionalIntensity: 1.0,
      sunPosition: { x: 0, y: 10, z: 0 },
      cameraFov: 75,
      cameraDistance: 0
    };
    
    // 动画相关
    this.animationId = null;
    this.lastTime = 0;
    
    // 事件监听器
    this.eventListeners = [];
  }
  
  // 初始化渲染器
  init() {
    console.log('初始化Three.js渲染器...');
    
    // 检查 Three.js 是否可用
    if (typeof THREE === 'undefined') {
      throw new Error('Three.js not loaded');
    }
    
    this.setupRenderer();
    this.setupScene();
    this.setupCamera();
    this.setupLighting();
    this.setupSky();
    this.setupClouds();
    this.setupPostProcessing();
    this.setupEventListeners();
    
    console.log('Three.js渲染器初始化完成');
  }
  
  // 设置渲染器
  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      powerPreference: 'high-performance' 
    });
    
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.physicallyCorrectLights = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    // 设置渲染器样式
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.zIndex = '1';
    
    // 将渲染器添加到容器
    const host = this.container || document.getElementById('weather-container') || document.body;
    host.appendChild(this.renderer.domElement);
    
    console.log('渲染器设置完成');
  }
  
  // 设置场景
  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(this.renderParams.fogColor, 1, 1000);
    console.log('场景设置完成');
  }
  
  // 设置相机
  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      this.renderParams.cameraFov, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      2000
    );
    
    // 设置相机位置
    this.camera.position.set(0, 0, this.renderParams.cameraDistance);
    this.camera.rotation.set(0, 0, 0);
    
    console.log('相机设置完成 - FOV:', this.renderParams.cameraFov);
  }
  
  // 设置光照
  setupLighting() {
    // 环境光
    this.ambientLight = new THREE.AmbientLight(0xffffff, this.renderParams.ambientIntensity);
    this.scene.add(this.ambientLight);
    
    // 方向光（太阳光）
    this.directionalLight = new THREE.DirectionalLight(0xffffff, this.renderParams.directionalIntensity);
    this.directionalLight.position.set(
      this.renderParams.sunPosition.x,
      this.renderParams.sunPosition.y,
      this.renderParams.sunPosition.z
    );
    this.scene.add(this.directionalLight);
    
    // 闪电光
    this.lightningLight = new THREE.PointLight(0xffffff, 0, 100);
    this.lightningLight.position.set(0, 50, 0);
    this.scene.add(this.lightningLight);
    
    console.log('光照设置完成');
  }
  
  // 设置天空
  setupSky() {
    this.createSkySphere();
    console.log('天空设置完成');
  }
  
  // 创建天空球
  createSkySphere() {
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x87CEEB,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.8
    });
    
    this.skySphere = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(this.skySphere);
    
    console.log('天空球创建完成');
  }
  
  // 设置云层
  setupClouds() {
    this.cloudTex = this.makeNoiseTex(256);
    this.cloudGroup = new THREE.Group();
    this.scene.add(this.cloudGroup);
    
    const geo = new THREE.PlaneGeometry(300, 300);
    
    // 第一层云
    const m1 = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: this.cloudTex,
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    });
    m1.map.wrapS = m1.map.wrapT = THREE.RepeatWrapping;
    m1.map.repeat.set(2, 2);
    this.cloud1 = new THREE.Mesh(geo, m1);
    this.cloud1.position.set(0, 0, -100);
    this.cloudGroup.add(this.cloud1);
    
    // 第二层云
    const m2 = new THREE.MeshBasicMaterial({
      color: 0xe8edf2,
      map: this.cloudTex,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    });
    m2.map.wrapS = m2.map.wrapT = THREE.RepeatWrapping;
    m2.map.repeat.set(1.5, 1.5);
    this.cloud2 = new THREE.Mesh(geo, m2);
    this.cloud2.position.set(0, 20, -80);
    this.cloudGroup.add(this.cloud2);
    
    this.cloudGroup.visible = false;
    
    console.log('云层设置完成');
  }
  
  // 设置后期处理
  setupPostProcessing() {
    // 简化的后期处理
    this.composer = {
      render: () => {
        if (this.renderer && this.scene && this.camera) {
          this.renderer.render(this.scene, this.camera);
        }
      },
      setSize: (width, height) => {
        if (this.renderer) {
          this.renderer.setSize(width, height);
        }
      }
    };
    
    console.log('后期处理设置完成');
  }
  
  // 设置事件监听器
  setupEventListeners() {
    const resizeHandler = () => this.onWindowResize();
    window.addEventListener('resize', resizeHandler);
    this.eventListeners.push({ event: 'resize', handler: resizeHandler });
    
    console.log('事件监听器设置完成');
  }
  
  // 生成噪声纹理
  makeNoiseTex(size = 256) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);
    
    function addLayer(alpha) {
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255;
        img.data[i] = img.data[i] * (1 - alpha) + v * alpha;
        img.data[i + 1] = img.data[i + 1] * (1 - alpha) + v * alpha;
        img.data[i + 2] = img.data[i + 2] * (1 - alpha) + v * alpha;
        img.data[i + 3] = 255;
      }
    }
    
    addLayer(0.6);
    addLayer(0.25);
    addLayer(0.15);
    
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }
  
  // 更新渲染参数
  updateRenderParams(params) {
    const oldParams = { ...this.renderParams };
    
    if (params.fogDensity !== undefined) {
      this.renderParams.fogDensity = params.fogDensity;
      if (this.scene.fog) {
        this.scene.fog.density = params.fogDensity;
      }
    }
    
    if (params.fogColor !== undefined) {
      this.renderParams.fogColor = params.fogColor;
      if (this.scene.fog) {
        this.scene.fog.color.setHex(params.fogColor);
      }
    }
    
    if (params.ambientIntensity !== undefined) {
      this.renderParams.ambientIntensity = params.ambientIntensity;
      if (this.ambientLight) {
        this.ambientLight.intensity = params.ambientIntensity;
      }
    }
    
    if (params.directionalIntensity !== undefined) {
      this.renderParams.directionalIntensity = params.directionalIntensity;
      if (this.directionalLight) {
        this.directionalLight.intensity = params.directionalIntensity;
      }
    }
    
    if (params.sunPosition !== undefined) {
      this.renderParams.sunPosition = { ...params.sunPosition };
      if (this.directionalLight) {
        this.directionalLight.position.set(
          params.sunPosition.x,
          params.sunPosition.y,
          params.sunPosition.z
        );
      }
    }
    
    if (params.cameraFov !== undefined) {
      this.renderParams.cameraFov = params.cameraFov;
      if (this.camera) {
        this.camera.fov = params.cameraFov;
        this.camera.updateProjectionMatrix();
      }
    }
    
    if (params.cameraDistance !== undefined) {
      this.renderParams.cameraDistance = params.cameraDistance;
      if (this.camera) {
        this.camera.position.z = params.cameraDistance;
      }
    }
    
    console.log('渲染参数更新:', oldParams, '→', this.renderParams);
  }
  
  // 更新云层
  updateClouds(opacity, speed, deltaTime) {
    if (!this.cloudGroup || !this.cloudGroup.visible) return;
    
    // 更新云层透明度
    if (this.cloud1 && this.cloud1.material) {
      this.cloud1.material.opacity = opacity * 0.4;
    }
    if (this.cloud2 && this.cloud2.material) {
      this.cloud2.material.opacity = opacity * 0.6;
    }
    
    // 更新云层移动
    const moveSpeed = speed * deltaTime * 10;
    if (this.cloud1 && this.cloud1.material.map) {
      this.cloud1.material.map.offset.x += moveSpeed * 0.001;
    }
    if (this.cloud2 && this.cloud2.material.map) {
      this.cloud2.material.map.offset.x += moveSpeed * 0.0015;
    }
  }
  
  // 设置云层可见性
  setCloudsVisible(visible) {
    if (this.cloudGroup) {
      this.cloudGroup.visible = visible;
    }
  }
  
  // 更新天空颜色
  updateSkyColor(topColor, bottomColor) {
    if (this.skySphere && this.skySphere.material) {
      // 创建渐变材质
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      const gradient = ctx.createLinearGradient(0, 0, 0, 256);
      gradient.addColorStop(0, `#${topColor.toString(16).padStart(6, '0')}`);
      gradient.addColorStop(1, `#${bottomColor.toString(16).padStart(6, '0')}`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
      
      const texture = new THREE.CanvasTexture(canvas);
      this.skySphere.material.map = texture;
      this.skySphere.material.needsUpdate = true;
    }
  }
  
  // 设置闪电效果
  setLightning(active, intensity = 1.0) {
    if (this.lightningLight) {
      this.lightningLight.intensity = active ? intensity * 2 : 0;
    }
  }
  
  // 开始渲染循环
  startRenderLoop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    const animate = (currentTime) => {
      this.animationId = requestAnimationFrame(animate);
      
      const deltaTime = Math.min(0.05, (this.lastTime ? (currentTime - this.lastTime) : 16) / 1000);
      this.lastTime = currentTime;
      
      // 执行渲染
      this.render(deltaTime);
    };
    
    this.animationId = requestAnimationFrame(animate);
    console.log('渲染循环开始');
  }
  
  // 渲染一帧
  render(deltaTime) {
    if (this.composer) {
      this.composer.render();
    } else if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
  
  // 窗口大小调整
  onWindowResize() {
    if (this.camera) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }
    
    if (this.renderer) {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    if (this.composer) {
      this.composer.setSize(window.innerWidth, window.innerHeight);
    }
    
    console.log('窗口大小调整:', window.innerWidth, 'x', window.innerHeight);
  }
  
  // 销毁渲染器
  destroy() {
    // 停止渲染循环
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // 移除事件监听器
    this.eventListeners.forEach(listener => {
      window.removeEventListener(listener.event, listener.handler);
    });
    this.eventListeners = [];
    
    // 移除渲染器
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
    }
    
    // 清理资源
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.composer = null;
    
    console.log('Three.js渲染器已销毁');
  }
  
  // 获取渲染状态
  getRenderState() {
    return {
      initialized: !!(this.renderer && this.scene && this.camera),
      objectsCount: this.scene ? this.scene.children.length : 0,
      renderParams: { ...this.renderParams },
      camera: this.camera ? {
        position: this.camera.position.clone(),
        rotation: this.camera.rotation.clone(),
        fov: this.camera.fov
      } : null
    };
  }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WeatherRenderer;
} else if (typeof window !== 'undefined') {
  window.WeatherRenderer = WeatherRenderer;
}