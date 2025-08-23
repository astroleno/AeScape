// 完整的 Three.js 天气渲染引擎
// 基于 weather.html 的完整实现

class FullWeatherEngine {
  constructor(container) {
    this.container = container;
    this.currentWeather = null;
    this.currentLocation = null;
    
    // 控制面板参数
    this.controlParams = {
      cloudOpacity: 0.4,
      cloudSpeed: 1.0,
      sunAltitude: 30,
      sunAzimuth: 180,
      timeOfDay: 'day',
      weatherType: 'clear',
      fogDensity: 0.03,
      // 时间控制参数 (0-24小时)
      timeOfDayHours: 12,
      // 基本视角控制参数
      cameraFov: 75,
      cameraDistance: 0,
      // 位置参数（用于太阳位置计算）
      latitude: 31.2304,  // 默认上海
      longitude: 121.4737,
    };
    
    // Three.js 核心对象
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.composer = null;
    // 移除了bloomPass相关代码
    this.afterimagePass = null;
    
    // 光源
    this.ambientLight = null;
    this.directionalLight = null;
    this.lightningLight = null;
    
    // 地面
    this.ground = null;
    this.groundMat = null;
    
    // 云层
    this.cloudGroup = null;
    this.cloud1 = null;
    this.cloud2 = null;
    this.cloudTex = null;
    
    // 天气状态
    this.isRaining = false;
    this.isSnowing = false;
    this.currentTime = 'day';
    this.particleCount = (window.devicePixelRatio > 1.5) ? 2500 : 4000;
    this.particleSpeed = 10;
    this.lightBase = 0.6;
    
    // 雨滴
    this.rainMesh = null;
    this.RAIN_COUNT = 0;
    this.BASE_SPEED = 10;
    this.POS = null;
    this.VEL = null;
    this._M = null;
    this._Q = null;
    this._V = null;
    this._S = null;
    
    // 溅射
    this.splashMesh = null;
    this.SPL_LIFE = null;
    this.SPL_POS = null;
    this.MAX_SPL = 800;
    this.SPL_DT = 0.25;
    
    // 风
    this.WIND_BASE = 0.8;
    this.WIND_GUST = 0.6;
    this.WIND_DIR = 90;
    this.WIND_VEC = null;
    
    // 闪电
    this.lightningTimer = 0;
    this.lightningActive = false;
    this.lightningBias = 0.015;
    
    // 预设
    this.PRESET = {
      day: {
        fogCol: 0x8ec5df, fogDen: 0.03, amb: 0.8, dir: 1.0, dirCol: 0xffffff,
        bgTop: 0x87CEEB, bgBot: 0xE0F7FA, bloom: 0.45
      },
      night: {
        fogCol: 0x0b1a2e, fogDen: 0.055, amb: 0.22, dir: 0.55, dirCol: 0x8080ff,
        bgTop: 0x0A192F, bgBot: 0x112240, bloom: 0.75
      },
      cloudy: {
        fogCol: 0x6d93a7, fogDen: 0.045, amb: 0.6, dir: 0.7, dirCol: 0xeceff1,
        bgTop: 0x7fa7bd, bgBot: 0xa8c4d3, bloom: 0.50
      }
    };
    
    // 初始化Promise
    this.initializationPromise = this.init().then(() => {
      // 异步加载位置信息
      return this.loadLocationFromStorage();
    }).then(() => {
      console.log('Location loaded, updating sun position...');
      this.calculateSunPositionFromTime();
      this.updateSunPosition();
      this.applyControlParams();
    }).catch((error) => {
      console.error('Initialization error:', error);
    });
  }
  
  init() {
    console.log('=== FullWeatherEngine init started ===');
    
    return new Promise((resolve, reject) => {
      try {
        console.log('Step 1: Setting up Three.js...');
        this.setupThreeJS();
        console.log('Step 2: Three.js setup complete');
        
        console.log('Step 3: Getting location...');
        this.getCurrentLocation().then(() => {
          console.log('Step 4: Location obtained');
          
          console.log('Step 5: Loading weather data...');
          this.loadWeatherData().then(() => {
            console.log('Step 6: Weather data loaded');
            
            console.log('Step 7: Setting up message listener...');
            this.setupMessageListener();
            console.log('Step 8: Message listener setup');
            
            console.log('Step 9: Setting up data refresh...');
            this.setupDataRefresh();
            console.log('Step 10: Data refresh setup');
            
            console.log('Step 11: Control panel creation will be handled by caller...');
            console.log('Step 12: Init completed, control panel ready');
            
            console.log('=== FullWeatherEngine init completed ===');
            resolve();
          }).catch(reject);
        }).catch(reject);
        
      } catch (error) {
        console.error('初始化失败:', error);
        this.showError('初始化失败，请刷新页面重试');
        reject(error);
      }
    });
  }
  
  setupThreeJS() {
    console.log('Setting up Three.js scene...');
    
    // 检查 Three.js 是否可用
    if (typeof THREE === 'undefined') {
      console.error('Three.js not loaded');
      return;
    }
    
    // 创建渲染器
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
    console.log('Three.js renderer added to host:', host.tagName || host.id);
    console.log('Renderer size:', window.innerWidth, 'x', window.innerHeight);
    
    // 创建场景
    this.scene = new THREE.Scene();
    
    // 创建相机 - 固定位置用于天空场景
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.set(0, 0, 0);
    this.camera.rotation.set(0, 0, 0);
    
    console.log('Camera created - position:', this.camera.position.x, this.camera.position.y, this.camera.position.z);
    console.log('Camera fov:', this.camera.fov);
    console.log('Camera aspect:', this.camera.aspect);
    
    // 创建光源 - 调整为适合天空的光照
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(this.ambientLight);
    
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    this.directionalLight.position.set(0, 10, 0);
    this.scene.add(this.directionalLight);
    
    this.lightningLight = new THREE.PointLight(0xffffff, 0, 100);
    this.lightningLight.position.set(0, 50, 0);
    this.scene.add(this.lightningLight);
    
    // 创建天空球
    this.createSkySphere();
    
    // 初始化云层
    this.initClouds();
    
    // 创建后期处理
    this.setupPostProcessing();
    
    // 初始化溅射池
    this.initSplashPool();
    
    // 初始化风向量
    this.WIND_VEC = new THREE.Vector3(1, 0, 0);
    
    // 默认设置 - 纯天空场景默认显示晴天
    this.setupClear();
    this.applyEnv('day');
    
    // 设置窗口大小调整监听
    window.addEventListener('resize', () => this.onWindowResize());
    
    // 开始渲染循环
    this.animate();
    
    console.log('Three.js setup complete');
    console.log('Scene contains', this.scene.children.length, 'objects');
    
    // 记录场景中的主要对象
    this.scene.children.forEach((child, index) => {
      console.log(`Object ${index}:`, child.type, child.name || 'unnamed');
    });
  }
  
  createSkySphere() {
    // 创建天空球几何体
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    
    // 创建天空材质
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x87CEEB,
      side: THREE.BackSide, // 从内部看
      transparent: true,
      opacity: 0.8
    });
    
    // 创建天空球
    this.skySphere = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(this.skySphere);
    
    console.log('Sky sphere created');
  }
  
  setupPostProcessing() {
    // 简化的后期处理（如果需要完整效果，需要额外的 three.js 插件）
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
  }
  
  initClouds() {
    this.cloudTex = this.makeNoiseTex(256);
    this.cloudGroup = new THREE.Group();
    this.scene.add(this.cloudGroup);
    
    const geo = new THREE.PlaneGeometry(300, 300);
    
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
  }
  
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
  
  initSplashPool() {
    const g = new THREE.CircleGeometry(0.12, 12);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.MeshBasicMaterial({
      color: 0xaad4ff,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    this.splashMesh = new THREE.InstancedMesh(g, m, this.MAX_SPL);
    this.splashMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.splashMesh);
    
    this.SPL_LIFE = new Float32Array(this.MAX_SPL);
    this.SPL_POS = new Float32Array(this.MAX_SPL * 3);
    
    const M = new THREE.Matrix4();
    for (let i = 0; i < this.MAX_SPL; i++) {
      M.makeScale(0.0001, 0.0001, 0.0001);
      this.splashMesh.setMatrixAt(i, M);
      this.SPL_LIFE[i] = 0;
    }
    this.splashMesh.instanceMatrix.needsUpdate = true;
  }
  
  setupRain() {
    if (this.rainMesh) this.scene.remove(this.rainMesh);
    if (this.snowMesh) this.scene.remove(this.snowMesh);
    
    this.isRaining = true;
    this.isSnowing = false;
    this.RAIN_COUNT = this.particleCount;
    this.BASE_SPEED = this.particleSpeed;
    
    // 细长雨丝 + 顶点色（上端实、下端透明）
    const g = new THREE.PlaneGeometry(0.03, 0.6);
    const cols = [];
    for (let i = 0; i < g.attributes.position.count; i++) {
      const y = g.attributes.position.getY(i);
      const t = (y + 0.3) / 0.6;
      const a = THREE.MathUtils.lerp(1, 0, t);
      cols.push(1, 1, 1, a);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 4));
    
    const m = new THREE.MeshBasicMaterial({
      color: 0xaad4ff,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    
    this.rainMesh = new THREE.InstancedMesh(g, m, this.RAIN_COUNT);
    this.rainMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.rainMesh);
    
    this.POS = new Float32Array(this.RAIN_COUNT * 3);
    this.VEL = new Float32Array(this.RAIN_COUNT * 3);
    this._M = new THREE.Matrix4();
    this._Q = new THREE.Quaternion();
    this._V = new THREE.Vector3();
    this._S = new THREE.Vector3();
    
    const reset = (i, y = THREE.MathUtils.randFloat(15, 45)) => {
      const ix = i * 3;
      this.POS[ix] = THREE.MathUtils.randFloatSpread(100);
      this.POS[ix + 1] = y;
      this.POS[ix + 2] = THREE.MathUtils.randFloatSpread(100);
      this.VEL[ix + 1] = -THREE.MathUtils.randFloat(this.BASE_SPEED * 0.8, this.BASE_SPEED * 1.2) * 0.8;
    };
    
    for (let i = 0; i < this.RAIN_COUNT; i++) reset(i);
    
    // 在纯天空场景中不需要设置地面湿度
  }
  
  setupClear() {
    if (this.rainMesh) this.scene.remove(this.rainMesh);
    if (this.snowMesh) this.scene.remove(this.snowMesh);
    this.isRaining = false;
    this.isSnowing = false;
    if (this.cloudGroup) this.cloudGroup.visible = false;
    // 在纯天空场景中不需要设置地面湿度
  }
  
  setupCloudy() {
    if (this.rainMesh) this.scene.remove(this.rainMesh);
    if (this.snowMesh) this.scene.remove(this.snowMesh);
    this.isRaining = false;
    this.isSnowing = false;
    if (!this.cloudGroup) this.initClouds();
    this.cloudGroup.visible = true;
    this.applyEnv('cloudy');
    // 在纯天空场景中不需要设置地面湿度
  }
  
  applyEnv(kind) {
    const p = this.PRESET[kind];
    if (!p) return;
    
    // 更新天空球颜色
    if (this.skySphere) {
      this.skySphere.material.color.setHex(p.bgTop);
      this.skySphere.material.opacity = 0.9;
    }
    
    // 更新背景
    this.setBG(p.bgTop, p.bgBot);
    
    // 更新光照
    this.ambientLight.intensity = p.amb;
    this.directionalLight.intensity = p.dir;
    this.directionalLight.color.setHex(p.dirCol);
    
    // 雾：指数雾，颜色取预设 fogCol
    const fogColor = p.fogCol;
    if (!this.scene.fog) {
      this.scene.fog = new THREE.FogExp2(fogColor, p.fogDen);
    } else {
      this.scene.fog.color.setHex(fogColor);
      this.scene.fog.density = p.fogDen;
    }
    
    this.applyEnv._last = kind;
  }
  
  setBG(topHex, botHex) {
    const top = '#' + topHex.toString(16).padStart(6, '0');
    const bot = '#' + botHex.toString(16).padStart(6, '0');
    document.body.style.background = `linear-gradient(to bottom, ${top}, ${bot})`;
  }
  
  setWetness(intensity) {
    // 在纯天空场景中，地面已被移除，所以不需要设置地面湿度
    // 保留方法签名以避免调用错误，但不执行任何操作
    console.log('setWetness called with intensity:', intensity, '(no ground in sky scene)');
  }
  
  updateClouds() {
    if (!this.cloudGroup) return;
    
    // 云层可见性与透明度联动
    this.cloudGroup.visible = this.controlParams.cloudOpacity > 0.02;
    
    if (!this.cloudGroup.visible) return;
    
    // 更新云透明度
    if (this.cloud1 && this.cloud1.material) {
      this.cloud1.material.opacity = this.controlParams.cloudOpacity * 0.6;
      this.cloud1.material.needsUpdate = true;
    }
    
    if (this.cloud2 && this.cloud2.material) {
      this.cloud2.material.opacity = this.controlParams.cloudOpacity * 0.8;
      this.cloud2.material.needsUpdate = true;
    }
    
    const speed = this.controlParams.cloudSpeed;
    this.cloud1.material.map.offset.x += 0.0008 * speed;
    this.cloud2.material.map.offset.x -= 0.0012 * speed;
    this.cloud1.material.map.offset.y += 0.0003 * speed;
  }
  
  updateRain(dt) {
    if (!this.isRaining || !this.rainMesh) return;
    
    const now = performance.now();
    for (let i = 0; i < this.RAIN_COUNT; i++) {
      const ix = i * 3;
      const sway = Math.sin((this.POS[ix + 1] + ix) * 0.12 + now * 0.002) * 0.35;
      const vx = this.WIND_VEC.x + sway * 0.2;
      const vz = this.WIND_VEC.z + sway * 0.1;
      
      this.POS[ix] += vx * dt;
      this.POS[ix + 1] += this.VEL[ix + 1] * dt;
      this.POS[ix + 2] += vz * dt;
      
      if (this.POS[ix + 1] < 0) {
        this.spawnSplash(this.POS[ix], this.POS[ix + 2]);
        this.POS[ix] = THREE.MathUtils.randFloatSpread(100);
        this.POS[ix + 1] = THREE.MathUtils.randFloat(30, 45);
        this.POS[ix + 2] = THREE.MathUtils.randFloatSpread(100);
        this.VEL[ix + 1] = -THREE.MathUtils.randFloat(this.BASE_SPEED * 0.8, this.BASE_SPEED * 1.2) * 0.8;
      }
      
      const spd = Math.sqrt(vx * vx + this.VEL[ix + 1] * this.VEL[ix + 1] + vz * vz);
      const len = THREE.MathUtils.clamp(spd * 0.06, 0.4, 1.6);
      this._V.set(vx, this.VEL[ix + 1], vz).normalize();
      this._Q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this._V);
      this._S.set(1, len / 0.6, 1);
      this._M.compose(
        new THREE.Vector3(this.POS[ix], this.POS[ix + 1], this.POS[ix + 2]),
        this._Q,
        this._S
      );
      this.rainMesh.setMatrixAt(i, this._M);
    }
    this.rainMesh.instanceMatrix.needsUpdate = true;
  }
  
  spawnSplash(x, z) {
    for (let i = 0; i < this.MAX_SPL; i++) {
      if (this.SPL_LIFE[i] <= 0) {
        this.SPL_LIFE[i] = this.SPL_DT;
        const ix = i * 3;
        this.SPL_POS[ix] = x;
        this.SPL_POS[ix + 1] = 0.01;
        this.SPL_POS[ix + 2] = z;
        return;
      }
    }
  }
  
  updateSplash(dt) {
    if (!this.splashMesh) return;
    
    const M = new THREE.Matrix4();
    const P = new THREE.Vector3();
    const Q = new THREE.Quaternion();
    const S = new THREE.Vector3();
    
    for (let i = 0; i < this.MAX_SPL; i++) {
      if (this.SPL_LIFE[i] > 0) {
        this.SPL_LIFE[i] -= dt;
        const t = 1 - (this.SPL_LIFE[i] / this.SPL_DT);
        const scale = 0.3 + t * 1.2;
        const ix = i * 3;
        P.set(this.SPL_POS[ix], this.SPL_POS[ix + 1], this.SPL_POS[ix + 2]);
        Q.identity();
        S.set(scale, 1, scale);
        M.compose(P, Q, S);
      } else {
        M.makeScale(0.0001, 0.0001, 0.0001);
      }
      this.splashMesh.setMatrixAt(i, M);
    }
    this.splashMesh.instanceMatrix.needsUpdate = true;
  }
  
  noise1D(t) {
    return Math.sin(t) * 0.5 + Math.sin(t * 0.5) * 0.35 + Math.sin(t * 0.13) * 0.15;
  }
  
  onWindowResize() {
    if (this.camera && this.renderer && this.composer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.composer.setSize(window.innerWidth, window.innerHeight);
      console.log('Window resized to:', window.innerWidth, 'x', window.innerHeight);
    }
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    const now = performance.now();
    const dt = Math.min(0.05, (this.animate._last ? (now - this.animate._last) : 16) / 1000);
    this.animate._last = now;
    
    // 移除了自动旋转相机功能
    
    // 阵风与风向
    const gust = this.noise1D(now * 0.0007);
    const base = this.WIND_BASE + gust * this.WIND_GUST;
    const wd = THREE.MathUtils.degToRad((this.WIND_DIR + 180) % 360);
    this.WIND_VEC.set(Math.sin(wd), 0, Math.cos(wd)).multiplyScalar(base);
    
    // 更新天气效果
    this.updateRain(dt);
    this.updateSnow(dt);
    this.updateSplash(dt);
    this.updateClouds();
    
    // 渲染场景
    if (this.composer) {
      this.composer.render();
    }
  }
  
  // 继承原有的天气数据获取方法
  async getCurrentLocation() {
    this.currentLocation = { 
      lat: 31.2304, 
      lon: 121.4737,
      name: '上海'
    };
    return this.currentLocation;
  }
  
  async loadWeatherData() {
    if (!this.currentLocation) {
      console.error('ERROR: No location available for weather data');
      this.showError('无法获取位置信息');
      return;
    }
    
    try {
      // 首先尝试直接从API获取数据（避免扩展上下文问题）
      await this.fetchWeatherData();
      this.hideLoading();
      
    } catch (directError) {
      console.log('Direct fetch failed, trying background service:', directError.message);
      
      // 如果直接获取失败，尝试从后台获取天气数据
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'weather.getCurrent'
        });
        
        if (response && response.data) {
          this.currentWeather = response.data;
          this.updateUI();
          this.hideLoading();
          return;
        }
      } catch (backgroundError) {
        console.log('Background service unavailable:', backgroundError.message);
        
        // 如果是扩展上下文失效，使用模拟数据
        if (backgroundError.message.includes('Extension context invalidated')) {
          console.log('Extension context invalidated, using mock data');
          this.useMockWeatherData();
          this.hideLoading();
          return;
        }
      }
      
      // 如果所有方法都失败，使用模拟数据
      console.log('All weather data sources failed, using mock data');
      this.useMockWeatherData();
      this.hideLoading();
    }
  }
  
  // 使用模拟天气数据
  useMockWeatherData() {
    console.log('Using mock weather data');
    
    // 计算模拟的太阳位置
    const sunPosition = this.calculateSunPosition(
      this.currentLocation.lat,
      this.currentLocation.lon
    );
    
    this.currentWeather = {
      location: {
        ...this.currentLocation,
        name: '上海',
        timezone: 'Asia/Shanghai'
      },
      sun: {
        altitudeDeg: sunPosition.altitudeDeg,
        azimuthDeg: sunPosition.azimuthDeg
      },
      weather: {
        code: 'clear',
        precipIntensity: 0,
        precipType: 'rain',
        visibilityKm: 10,
        windSpeedMps: 0,
        windDirDeg: 0,
        thunderProb: 0
      },
      env: {
        isNight: !sunPosition.isDay,
        temperature: 25
      },
      timestamp: Date.now()
    };
    
    this.updateUI();
    console.log('Mock weather data applied');
  }
  
  async fetchWeatherData() {
    if (!this.currentLocation || !this.currentLocation.lat || !this.currentLocation.lon) return;
    
    try {
      const params = new URLSearchParams({
        latitude: this.currentLocation.lat.toFixed(4),
        longitude: this.currentLocation.lon.toFixed(4),
        current_weather: 'true',
        hourly: 'temperature_2m,relativehumidity_2m,apparent_temperature,precipitation_probability,precipitation,weathercode,cloudcover,visibility,windspeed,winddirection,uv_index',
        daily: 'sunrise,sunset',
        timezone: 'auto'
      });

      const url = `https://api.open-meteo.com/v1/forecast?${params}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`API Error: ${data.reason || 'Unknown error'}`);
      }

      // 转换数据格式
      const current = data.current_weather;
      const hourly = data.hourly;
      
      // 找到当前时间对应的 hourly 索引（与 hourly.time 最接近）
      const times = hourly.time.map(t => new Date(t).getTime());
      const now = Date.now();
      let idx = 0, best = Infinity;
      for (let i = 0; i < times.length; i++) {
        const d = Math.abs(times[i] - now);
        if (d < best) { best = d; idx = i; }
      }
      
      // 正确取字段
      const windSpeed = (current.windspeed ?? 0);          // m/s
      const windDir   = (current.winddirection ?? 0);      // deg
      const precip    = (hourly.precipitation?.[idx] ?? 0);// mm
      const visKm     = (hourly.visibility?.[idx] ?? 10000) / 1000; // m → km
      
      // 计算太阳位置（简化）
      const sunPosition = this.calculateSunPosition(
        this.currentLocation.lat,
        this.currentLocation.lon
      );
      
      this.currentWeather = {
        location: {
          ...this.currentLocation,
          name: this.currentLocation.name || '当前位置',
          timezone: data.timezone || 'Asia/Shanghai'
        },
        sun: {
          altitudeDeg: sunPosition.altitudeDeg,
          azimuthDeg: sunPosition.azimuthDeg
        },
        weather: {
          code: this.mapWeatherCode(current.weathercode),
          precipIntensity: precip,                     // 直接用 mm/h
          precipType: (current.temperature ?? 20) < 0 ? 'snow' : 'rain',
          visibilityKm: visKm,
          windSpeedMps: windSpeed,                     // 单位保持 m/s
          windDirDeg: windDir,
          thunderProb: current.weathercode >= 95 ? 0.6 : 0
        },
        env: {
          isNight: !sunPosition.isDay,
          temperature: current.temperature || 20
        },
        timestamp: Date.now()
      };
      
      this.updateUI();
      
    } catch (error) {
      console.error('Direct fetch failed:', error);
      this.showError('天气数据获取失败');
    }
  }
  
  calculateSunPosition(lat, lon, date = new Date()) {
    // 简化的太阳位置计算
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    const declination = 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180);
    const hourAngle = 15 * (date.getHours() + date.getMinutes() / 60 - 12);
    
    const altitudeRad = Math.asin(
      Math.sin(declination * Math.PI / 180) * Math.sin(lat * Math.PI / 180) +
      Math.cos(declination * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.cos(hourAngle * Math.PI / 180)
    );
    
    const altitudeDeg = altitudeRad * 180 / Math.PI;
    
    // 计算日出日落
    const sunriseHour = 6 + Math.sin((dayOfYear - 80) * Math.PI / 182) * 2;
    const sunsetHour = 18 + Math.sin((dayOfYear - 80) * Math.PI / 182) * 2;
    const currentHour = date.getHours() + date.getMinutes() / 60;
    
    return {
      altitudeDeg: Math.round(altitudeDeg * 100) / 100,
      azimuthDeg: 0, // 简化计算
      isDay: currentHour >= sunriseHour && currentHour <= sunsetHour
    };
  }
  
  mapWeatherCode(code) {
    const codeMap = {
      0: 'clear', 1: 'clear', 2: 'cloudy', 3: 'cloudy',
      45: 'fog', 48: 'fog',
      51: 'rain', 53: 'rain', 55: 'rain',
      56: 'rain', 57: 'rain',
      61: 'rain', 63: 'rain', 65: 'rain',
      66: 'snow', 67: 'snow',
      71: 'snow', 73: 'snow', 75: 'snow', 77: 'snow',
      80: 'rain', 81: 'rain', 82: 'rain',
      85: 'snow', 86: 'snow',
      95: 'thunderstorm', 96: 'thunderstorm', 99: 'thunderstorm'
    };
    return codeMap[code] || 'clear';
  }
  
  updateUI() {
    if (!this.currentWeather) return;
    
    const temp = Math.round(this.currentWeather.env.temperature);
    const locationName = this.currentWeather.location.name;
    const weatherCode = this.currentWeather.weather.code;
    const isNight = this.currentWeather.env.isNight;
    
    const weatherDescriptions = {
      clear: '晴朗',
      cloudy: '多云',
      rain: '下雨',
      snow: '下雪',
      fog: '有雾',
      thunderstorm: '雷暴'
    };
    
    const locationElement = document.getElementById('weather-location');
    const tempElement = document.getElementById('weather-temperature');
    const locationDetailElement = document.getElementById('weather-location-detail');
    const descriptionElement = document.getElementById('weather-description');
    
    if (locationElement) locationElement.textContent = locationName;
    if (tempElement) tempElement.textContent = `${temp}°`;
    if (locationDetailElement) {
      locationDetailElement.textContent = 
        `${this.currentLocation.lat.toFixed(2)}, ${this.currentLocation.lon.toFixed(2)}`;
    }
    if (descriptionElement) {
      descriptionElement.textContent = weatherDescriptions[weatherCode] || '未知';
    }
    
    // 更新 3D 场景
    this.updateWeatherScene(weatherCode, isNight);
  }
  
  updateWeatherScene(weatherCode, isNight) {
    console.log('Updating weather scene:', weatherCode, 'isNight:', isNight);
    
    // 检查必要对象是否存在
    if (!this.scene || !this.ambientLight || !this.directionalLight) {
      console.log('Scene objects not ready, skipping weather scene update');
      return;
    }
    
    // 设置环境
    if (isNight) {
      this.currentTime = 'night';
      this.applyEnv('night');
    } else {
      this.currentTime = 'day';
      this.applyEnv('day');
    }
    
    // 设置天气效果
    switch (weatherCode) {
      case 'clear':
        this.setupClear();
        break;
      case 'cloudy':
        this.setupCloudy();
        break;
      case 'rain':
        this.setupRain();
        break;
      case 'snow':
        this.setupSnow();
        break;
      case 'thunderstorm':
        this.setupRain();
        // 可以添加雷暴效果
        break;
      default:
        this.setupClear();
    }
  }
  
  setupSnow() {
    if (this.rainMesh) this.scene.remove(this.rainMesh);
    if (this.snowMesh) this.scene.remove(this.snowMesh);
    
    this.isRaining = false;
    this.isSnowing = true;
    
    const g = new THREE.BufferGeometry();
    const count = this.particleCount;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = THREE.MathUtils.randFloatSpread(100);
      pos[i3 + 1] = Math.random() * 50;
      pos[i3 + 2] = THREE.MathUtils.randFloatSpread(100);
      
      vel[i3] = (Math.random() - 0.5) * 0.05 * this.particleSpeed;
      vel[i3 + 1] = -(0.05 + Math.random() * 0.1) * this.particleSpeed;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.05 * this.particleSpeed;
    }
    
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('velocity', new THREE.BufferAttribute(vel, 3));
    
    const m = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.12,
      transparent: true,
      opacity: 0.95
    });
    
    this.snowMesh = new THREE.Points(g, m);
    this.scene.add(this.snowMesh);
    
    // 在纯天空场景中不需要设置地面湿度
  }
  
  updateSnow(dt) {
    if (!this.isSnowing || !this.snowMesh) return;
    
    const p = this.snowMesh.geometry.attributes.position.array;
    const v = this.snowMesh.geometry.attributes.velocity.array;
    
    for (let i = 0; i < p.length; i += 3) {
      p[i] += (v[i] + this.WIND_VEC.x * 0.6) * dt;
      p[i + 1] += v[i + 1] * dt;
      p[i + 2] += (v[i + 2] + this.WIND_VEC.z * 0.6) * dt;
      
      if (p[i + 1] < 0) {
        p[i] = THREE.MathUtils.randFloatSpread(100);
        p[i + 1] = 50;
        p[i + 2] = THREE.MathUtils.randFloatSpread(100);
      }
    }
    
    this.snowMesh.geometry.attributes.position.needsUpdate = true;
  }
  
  setupMessageListener() {
    if (chrome.runtime && chrome.runtime.onMessage) {
      try {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (message.type === 'weather.updated') {
            this.currentWeather = message.data;
            this.updateUI();
          }
        });
        console.log('Message listener setup successfully');
      } catch (error) {
        console.log('Failed to setup message listener:', error.message);
        
        // 如果是扩展上下文失效，忽略这个错误
        if (error.message.includes('Extension context invalidated')) {
          console.log('Extension context invalidated, message listener disabled');
        }
      }
    } else {
      console.log('Chrome runtime not available');
    }
  }
  
  setupDataRefresh() {
    // 每 30 分钟刷新一次数据
    setInterval(() => {
      this.loadWeatherData();
    }, 30 * 60 * 1000);
  }
  
  hideLoading() {
    console.log('=== hideLoading called ===');
    
    const loading = document.getElementById('loading');
    console.log('Loading element found:', !!loading);
    if (loading) {
      loading.style.display = 'none';
      console.log('Loading element hidden');
    }
    
    const weatherInfo = document.getElementById('weather-info');
    console.log('Weather info element found:', !!weatherInfo);
    if (weatherInfo) {
      weatherInfo.style.display = 'block';
      console.log('Weather info element shown');
    }
  }
  
  showError(message) {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.innerHTML = message;
      loading.style.display = 'block';
    }
  }
  
  // 创建控制面板
  createControlPanel() {
    console.log('Creating control panel...');
    
    // 创建控制面板容器
    const controlPanel = document.createElement('div');
    controlPanel.id = 'control-panel';
    controlPanel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      color: #333;
      max-height: 90vh;
      overflow-y: auto;
    `;
    
    // 创建标题
    const title = document.createElement('h3');
    title.textContent = '天空场景控制';
    title.style.cssText = `
      margin: 0 0 15px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      text-align: center;
    `;
    controlPanel.appendChild(title);
    
    // 创建控制组
    const controls = [
      {
        label: '云量透明度',
        type: 'range',
        min: 0,
        max: 1,
        step: 0.01,
        value: this.controlParams.cloudOpacity,
        param: 'cloudOpacity'
      },
      {
        label: '云移动速度',
        type: 'range',
        min: 0,
        max: 3,
        step: 0.1,
        value: this.controlParams.cloudSpeed,
        param: 'cloudSpeed'
      },
      {
        label: '太阳高度角',
        type: 'range',
        min: -90,
        max: 90,
        step: 1,
        value: this.controlParams.sunAltitude,
        param: 'sunAltitude'
      },
      {
        label: '太阳方位角',
        type: 'range',
        min: 0,
        max: 360,
        step: 1,
        value: this.controlParams.sunAzimuth,
        param: 'sunAzimuth'
      },
      {
        label: '雾浓度',
        type: 'range',
        min: 0,
        max: 0.2,
        step: 0.001,
        value: this.controlParams.fogDensity,
        param: 'fogDensity'
      },
      {
        label: '相机视野角',
        type: 'range',
        min: 30,
        max: 120,
        step: 1,
        value: this.controlParams.cameraFov,
        param: 'cameraFov'
      },
      {
        label: '相机距离',
        type: 'range',
        min: -50,
        max: 50,
        step: 1,
        value: this.controlParams.cameraDistance,
        param: 'cameraDistance'
      },
      {
        label: '时间 (小时)',
        type: 'range',
        min: 0,
        max: 24,
        step: 0.5,
        value: this.controlParams.timeOfDayHours,
        param: 'timeOfDayHours'
      }
    ];
    
    // 添加滑块控制
    controls.forEach(control => {
      const group = document.createElement('div');
      group.style.cssText = 'margin-bottom: 15px;';
      
      const label = document.createElement('label');
      label.textContent = control.label;
      label.style.cssText = `
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #374151;
      `;
      group.appendChild(label);
      
      const slider = document.createElement('input');
      slider.type = control.type;
      slider.min = control.min;
      slider.max = control.max;
      slider.step = control.step;
      slider.value = control.value;
      slider.setAttribute('data-param', control.param);
      slider.style.cssText = `
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: #e5e7eb;
        outline: none;
        -webkit-appearance: none;
      `;
      
      const valueDisplay = document.createElement('span');
      valueDisplay.textContent = control.value;
      valueDisplay.style.cssText = `
        display: inline-block;
        margin-left: 10px;
        font-size: 12px;
        color: #6b7280;
        min-width: 40px;
      `;
      
      slider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        this.controlParams[control.param] = value;
        valueDisplay.textContent = value.toFixed(control.step < 0.1 ? 2 : 1);
        
        // 如果是时间滑块，更新时间显示
        if (control.param === 'timeOfDayHours') {
          const timeDisplay = document.getElementById('time-display');
          if (timeDisplay) {
            timeDisplay.textContent = this.formatTime(value);
          }
        }
        
        this.applyControlParams();
      });
      
      const sliderContainer = document.createElement('div');
      sliderContainer.style.cssText = 'display: flex; align-items: center;';
      sliderContainer.appendChild(slider);
      sliderContainer.appendChild(valueDisplay);
      
      group.appendChild(sliderContainer);
      controlPanel.appendChild(group);
    });
    
    // 添加时间显示
    const timeDisplayGroup = document.createElement('div');
    timeDisplayGroup.style.cssText = 'margin-bottom: 15px; text-align: center;';
    
    const timeDisplayLabel = document.createElement('label');
    timeDisplayLabel.textContent = '当前时间';
    timeDisplayLabel.style.cssText = `
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #374151;
      font-size: 12px;
    `;
    timeDisplayGroup.appendChild(timeDisplayLabel);
    
    const timeDisplay = document.createElement('div');
    timeDisplay.id = 'time-display';
    timeDisplay.textContent = this.formatTime(this.controlParams.timeOfDayHours);
    timeDisplay.style.cssText = `
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      padding: 5px 10px;
      background: #f3f4f6;
      border-radius: 4px;
    `;
    timeDisplayGroup.appendChild(timeDisplay);
    
    controlPanel.appendChild(timeDisplayGroup);
    
    // 添加天气类型控制按钮
    const weatherGroup = document.createElement('div');
    weatherGroup.style.cssText = 'margin-bottom: 15px;';
    
    const weatherLabel = document.createElement('label');
    weatherLabel.textContent = '天气类型';
    weatherLabel.style.cssText = `
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #374151;
    `;
    weatherGroup.appendChild(weatherLabel);
    
    const weatherButtons = document.createElement('div');
    weatherButtons.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px;';
    
    ['clear', 'cloudy', 'rain', 'snow'].forEach(weather => {
      const button = document.createElement('button');
      const weatherNames = {
        clear: '晴天',
        cloudy: '多云',
        rain: '雨天',
        snow: '雪天'
      };
      button.textContent = weatherNames[weather];
      button.style.cssText = `
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: ${this.controlParams.weatherType === weather ? '#3b82f6' : '#fff'};
        color: ${this.controlParams.weatherType === weather ? '#fff' : '#374151'};
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      `;
      
      button.addEventListener('click', () => {
        this.controlParams.weatherType = weather;
        this.applyControlParams();
        this.updateWeatherButtons();
      });
      
      weatherButtons.appendChild(button);
    });
    
    weatherGroup.appendChild(weatherButtons);
    controlPanel.appendChild(weatherGroup);
    
    // 移除了相机控制组
    
    // 添加重置按钮
    const resetButton = document.createElement('button');
    resetButton.textContent = '重置为默认值';
    resetButton.style.cssText = `
      width: 100%;
      padding: 10px;
      background: #6b7280;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      margin-top: 10px;
    `;
    
    resetButton.addEventListener('click', () => {
      this.resetControlParams();
    });
    
    controlPanel.appendChild(resetButton);
    
    // 添加到页面
    document.body.appendChild(controlPanel);
    
    // 保存按钮引用
    this.weatherButtons = weatherButtons.querySelectorAll('button');
    
    console.log('Control panel created successfully');
  }
  
  // 应用控制参数
  applyControlParams() {
    console.log('Applying control params:', this.controlParams);
    
    try {
      // 更新云透明度
      if (this.cloud1 && this.cloud2) {
        this.cloud1.material.opacity = this.controlParams.cloudOpacity * 0.6;
        this.cloud2.material.opacity = this.controlParams.cloudOpacity * 0.8;
        this.cloud1.material.needsUpdate = true;
        this.cloud2.material.needsUpdate = true;
        console.log('Updated cloud opacity:', this.controlParams.cloudOpacity);
      }
      
      // 更新太阳位置和光照环境
      this.updateSunPosition();
      
      // 更新天气
      this.updateWeatherType();
      
      // 更新雾浓度
      if (this.scene && this.scene.fog) {
        this.scene.fog.density = this.controlParams.fogDensity;
        console.log('Updated fog density:', this.controlParams.fogDensity);
      }
      
      // 移除了bloomPass强度调整
      
      // 更新基本相机控制
      this.updateBasicCameraControls();
      
      // 强制更新天空材质
      if (this.skySphere && this.skySphere.material) {
        this.skySphere.material.needsUpdate = true;
      }
      
      // 强制重新渲染一帧
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
      
      console.log('Control params applied successfully');
      
    } catch (error) {
      console.error('Error applying control params:', error);
    }
  }
  
  // 从扩展存储中获取位置信息
  async loadLocationFromStorage() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.sync.get(['currentLocation']);
        if (result.currentLocation) {
          this.controlParams.latitude = result.currentLocation.lat;
          this.controlParams.longitude = result.currentLocation.lon;
          console.log('Loaded location from storage:', this.controlParams.latitude, this.controlParams.longitude);
        }
      }
    } catch (error) {
      console.error('Failed to load location from storage:', error);
    }
  }
  
  // 根据时间计算太阳位置
  calculateSunPositionFromTime() {
    const hour = this.controlParams.timeOfDayHours;
    const now = new Date();
    const latitude = this.controlParams.latitude || 31.2304; // 默认上海
    const longitude = this.controlParams.longitude || 121.4737;
    
    // 计算儒略日
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    let a = Math.floor(year / 100);
    let b = 2 - a + Math.floor(a / 4);
    if (month < 3) {
      year--;
      month += 12;
    }
    
    const jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
    
    // 计算自2000年1月1日12:00 UTC以来的儒略世纪数
    const jc = (jd - 2451545) / 36525;
    
    // 计算太阳几何平均黄经（度）
    let sunLongitude = 280.46646 + jc * (36000.76983 + jc * 0.0003032);
    sunLongitude = sunLongitude % 360;
    if (sunLongitude < 0) sunLongitude += 360;
    
    // 计算太阳几何平均近点角（度）
    const sunMeanAnomaly = 357.52911 + jc * (35999.05029 - 0.0001537 * jc);
    
    // 计算地球轨道偏心率
    const eccentricity = 0.016708634 - jc * (0.000042037 + 0.0000001267 * jc);
    
    // 计算太阳中心方程（度）
    const sunEquation = (1.914602 - jc * (0.004817 + 0.000014 * jc)) * Math.sin(sunMeanAnomaly * Math.PI / 180) +
                       (0.019993 - 0.000101 * jc) * Math.sin(2 * sunMeanAnomaly * Math.PI / 180) +
                       0.000289 * Math.sin(3 * sunMeanAnomaly * Math.PI / 180);
    
    // 计算太阳真实黄经（度）
    const sunTrueLongitude = sunLongitude + sunEquation;
    
    // 计算太阳真实近点角（度）
    const sunTrueAnomaly = sunMeanAnomaly + sunEquation;
    
    // 计算太阳地心距离（AU）
    const sunDistance = (1.000001018 * (1 - eccentricity * eccentricity)) / (1 + eccentricity * Math.cos(sunTrueAnomaly * Math.PI / 180));
    
    // 计算太阳黄纬（度）
    const sunApparentLongitude = sunTrueLongitude - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * jc) * Math.PI / 180);
    
    // 计算平均赤道倾角（度）
    const meanObliquity = 23 + (26 + ((21.448 - jc * (46.815 + jc * (0.00059 - jc * 0.001813)))) / 60) / 60;
    
    // 计算修正赤道倾角（度）
    const obliquity = meanObliquity + 0.00256 * Math.cos((125.04 - 1934.136 * jc) * Math.PI / 180);
    
    // 计算太阳赤纬（度）
    const sunDeclination = Math.asin(Math.sin(obliquity * Math.PI / 180) * Math.sin(sunApparentLongitude * Math.PI / 180)) * 180 / Math.PI;
    
    // 计算时角（考虑经度影响）
    const timezone = longitude / 15; // 根据经度估算时区
    const localTime = hour + timezone;
    const hourAngle = (localTime - 12) * 15; // 每小时15度
    
    // 计算太阳高度角（度）
    const altitudeRad = Math.asin(
      Math.sin(sunDeclination * Math.PI / 180) * Math.sin(latitude * Math.PI / 180) +
      Math.cos(sunDeclination * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) * Math.cos(hourAngle * Math.PI / 180)
    );
    let altitude = altitudeRad * 180 / Math.PI;
    
    // 计算太阳方位角（度）
    const azimuthRad = Math.atan2(
      Math.sin(hourAngle * Math.PI / 180),
      Math.cos(hourAngle * Math.PI / 180) * Math.sin(latitude * Math.PI / 180) - Math.tan(sunDeclination * Math.PI / 180) * Math.cos(latitude * Math.PI / 180)
    );
    let azimuth = (azimuthRad * 180 / Math.PI + 180) % 360;
    
    // 修正：确保方位角从正北开始，顺时针方向
    if (azimuth < 0) azimuth += 360;
    
    // 夜晚处理：太阳在地平线下
    if (altitude < 0) {
      altitude = Math.max(altitude, -30); // 夜晚最低-30度
    }
    
    // 更新控制参数
    this.controlParams.sunAltitude = altitude;
    this.controlParams.sunAzimuth = azimuth;
    
    // 更新控制面板中的太阳位置滑块
    const altitudeSlider = document.querySelector('input[data-param="sunAltitude"]');
    const azimuthSlider = document.querySelector('input[data-param="sunAzimuth"]');
    
    if (altitudeSlider) {
      altitudeSlider.value = altitude;
      altitudeSlider.nextElementSibling.textContent = altitude.toFixed(0);
    }
    
    if (azimuthSlider) {
      azimuthSlider.value = azimuth;
      azimuthSlider.nextElementSibling.textContent = azimuth.toFixed(0);
    }
  }
  
  // 基本相机控制函数
  updateBasicCameraControls() {
    if (!this.camera) return;
    
    // 更新相机视野角
    this.camera.fov = this.controlParams.cameraFov;
    this.camera.updateProjectionMatrix();
    
    // 更新相机位置
    this.camera.position.set(0, 0, this.controlParams.cameraDistance);
  }
  
  // 更新太阳位置和光照环境
  updateSunPosition() {
    if (!this.directionalLight || !this.ambientLight) {
      console.log('Lights not available:', {
        directionalLight: !!this.directionalLight,
        ambientLight: !!this.ambientLight
      });
      return;
    }
    
    const altitude = THREE.MathUtils.degToRad(this.controlParams.sunAltitude);
    const azimuth = THREE.MathUtils.degToRad(this.controlParams.sunAzimuth);
    
    // 计算太阳位置
    const x = Math.cos(altitude) * Math.sin(azimuth);
    const y = Math.sin(altitude);
    const z = Math.cos(altitude) * Math.cos(azimuth);
    
    // 更新方向光位置
    const lightDistance = 300;
    this.directionalLight.position.set(x * lightDistance, y * lightDistance, z * lightDistance);
    
    console.log('Sun position updated:', {
      altitude: this.controlParams.sunAltitude,
      azimuth: this.controlParams.sunAzimuth,
      lightPosition: {
        x: this.directionalLight.position.x,
        y: this.directionalLight.position.y,
        z: this.directionalLight.position.z
      }
    });
    
    // 根据太阳高度角计算光照强度 - 使用更平滑的曲线
    const normalizedAltitude = Math.max(0, Math.sin(altitude));
    // 使用平方根函数使光照变化更平缓，避免低角度时光照过弱
    const sunIntensity = Math.max(0.2, Math.sqrt(normalizedAltitude));
    
    // 根据时间判断白天/夜晚
    const hour = this.controlParams.timeOfDayHours;
    const isDayTime = hour >= 6 && hour <= 18;
    
    if (isDayTime && this.controlParams.sunAltitude > 0) {
      // 白天光照 - 使用更合理的光照强度范围
      this.directionalLight.intensity = 0.5 + sunIntensity * 1.5; // 基础强度 + 变化范围
      
      // 根据高度角调整太阳颜色
      const sunColor = new THREE.Color();
      if (this.controlParams.sunAltitude < 10) {
        // 日出日落 - 橙红色
        sunColor.setHex(0xff6b35);
      } else if (this.controlParams.sunAltitude < 30) {
        // 早晨/傍晚 - 淡黄色
        sunColor.setHex(0xffd23f);
      } else {
        // 正午 - 白色
        sunColor.setHex(0xffffff);
      }
      this.directionalLight.color.copy(sunColor);
      
      // 环境光强度
      this.ambientLight.intensity = 0.4 + sunIntensity * 0.6;
      this.ambientLight.color.setHex(0xffffff);
      
      console.log('Day lighting applied:', {
        directionalIntensity: this.directionalLight.intensity,
        ambientIntensity: this.ambientLight.intensity,
        sunColor: '#' + sunColor.getHexString()
      });
      
    } else {
      // 夜晚光照
      this.directionalLight.intensity = 0.05;
      this.directionalLight.color.setHex(0x404080);
      
      // 环境光 - 夜晚更暗更蓝
      this.ambientLight.intensity = 0.05;
      this.ambientLight.color.setHex(0x202060);
      
      console.log('Night lighting applied');
    }
    
    // 强制更新光照
    this.directionalLight.needsUpdate = true;
    this.ambientLight.needsUpdate = true;
    
    // 更新天空球颜色
    this.updateSkyColor();
    
    // 如果有太阳位置指示器，更新其位置
    this.updateSunIndicator(x * 150, y * 150, z * 150);
  }
  
  // 更新天空颜色
  updateSkyColor() {
    if (!this.skySphere) return;
    
    const hour = this.controlParams.timeOfDayHours;
    const altitude = this.controlParams.sunAltitude;
    
    let skyColor, bgColor;
    
    if (hour >= 6 && hour <= 18) {
      // 白天
      if (altitude < 10) {
        // 日出日落
        skyColor = 0xff7f50; // 珊瑚色
        bgColor = 0xffb347; // 浅橙色
      } else if (altitude < 30) {
        // 早晨/傍晚
        skyColor = 0x87ceeb; // 天蓝色
        bgColor = 0x98d8e8; // 浅天蓝色
      } else {
        // 正午
        skyColor = 0x4169e1; // 皇家蓝
        bgColor = 0x87ceeb; // 天蓝色
      }
    } else {
      // 夜晚
      skyColor = 0x191970; // 午夜蓝
      bgColor = 0x000033; // 深蓝色
    }
    
    this.skySphere.material.color.setHex(skyColor);
    this.skySphere.material.opacity = 0.8;
    this.skySphere.material.needsUpdate = true;
    
    // 更新背景渐变
    this.setBG(skyColor, bgColor);
  }
  
  // 更新太阳指示器（可选）
  updateSunIndicator(x, y, z) {
    if (!this.sunIndicator) {
      // 创建太阳指示器
      const geometry = new THREE.SphereGeometry(3, 16, 16);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.8
      });
      this.sunIndicator = new THREE.Mesh(geometry, material);
      this.scene.add(this.sunIndicator);
    }
    
    this.sunIndicator.position.set(x, y, z);
    
    // 根据高度角调整太阳大小和亮度
    const altitude = this.controlParams.sunAltitude;
    if (altitude > 0) {
      this.sunIndicator.visible = true;
      this.sunIndicator.scale.setScalar(0.5 + altitude / 90);
      this.sunIndicator.material.opacity = 0.3 + altitude / 180;
    } else {
      this.sunIndicator.visible = false;
    }
  }
  
  // 格式化时间显示
  formatTime(hour) {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
  }
  
  // 更新天气类型
  updateWeatherType() {
    switch (this.controlParams.weatherType) {
      case 'clear':
        this.setupClear();
        break;
      case 'cloudy':
        this.setupCloudy();
        break;
      case 'rain':
        this.setupRain();
        break;
      case 'snow':
        this.setupSnow();
        break;
    }
  }
  
  // updateTimeButtons 方法已移除，改用时间滑块
  
  // 更新天气按钮状态
  updateWeatherButtons() {
    const weatherTypes = ['clear', 'cloudy', 'rain', 'snow'];
    this.weatherButtons.forEach((button, index) => {
      const weather = weatherTypes[index];
      button.style.background = this.controlParams.weatherType === weather ? '#3b82f6' : '#fff';
      button.style.color = this.controlParams.weatherType === weather ? '#fff' : '#374151';
    });
  }
  
  // 重置控制参数
  resetControlParams() {
    // 保留位置参数，重置其他参数
    const latitude = this.controlParams.latitude;
    const longitude = this.controlParams.longitude;
    
    this.controlParams = {
      cloudOpacity: 0.4,
      cloudSpeed: 1.0,
      sunAltitude: 30,
      sunAzimuth: 180,
      timeOfDay: 'day',
      weatherType: 'clear',
      fogDensity: 0.03,
      timeOfDayHours: 12,
      cameraFov: 75,
      cameraDistance: 0,
      latitude: latitude || 31.2304,
      longitude: longitude || 121.4737
    };
    
    // 更新所有滑块值
    const sliders = document.querySelectorAll('#control-panel input[type="range"]');
    sliders.forEach(slider => {
      const param = slider.getAttribute('data-param');
      if (param && this.controlParams[param] !== undefined) {
        slider.value = this.controlParams[param];
        // 更新显示值
        const valueDisplay = slider.nextElementSibling;
        if (valueDisplay) {
          valueDisplay.textContent = this.controlParams[param].toFixed(
            slider.step < 0.1 ? 2 : 1
          );
        }
      }
    });
    
    // 更新天气按钮状态
    this.updateWeatherButtons();
    
    // 更新时间显示
    const timeDisplay = document.getElementById('time-display');
    if (timeDisplay) {
      timeDisplay.textContent = this.formatTime(this.controlParams.timeOfDayHours);
    }
    
    // 应用参数
    this.applyControlParams();
  }
  
  // setupMouseControls 方法已移除 - 不再使用鼠标控制
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded, starting FullWeatherEngine...');
  try {
    const app = new FullWeatherEngine(document.body);
    console.log('FullWeatherEngine started successfully');
  } catch (error) {
    console.error('Failed to start FullWeatherEngine:', error);
    const loading = document.getElementById('loading');
    if (loading) {
      loading.innerHTML = '应用启动失败，请刷新页面重试';
      loading.style.display = 'block';
    }
  }
});