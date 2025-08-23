// New Tab Page Script for 天景 AeScape
// 简化的天气引擎类 + Three.js 3D 渲染
class SimpleWeatherEngine {
  constructor(container) {
    this.container = container;
    this.currentWeather = null;
    this.currentLocation = null;
    
    // Three.js 相关属性
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.ambientLight = null;
    this.directionalLight = null;
    this.ground = null;
    this.clouds = null;
    
    this.init();
  }
  
  async init() {
    console.log('=== SimpleWeatherEngine init started ===');
    
    try {
      console.log('Step 1: Setting up Three.js...');
      this.setupThreeJS();
      console.log('Step 2: Three.js setup complete');
      
      console.log('Step 3: Getting location...');
      await this.getCurrentLocation();
      console.log('Step 4: Location obtained');
      
      console.log('Step 5: Loading weather data...');
      await this.loadWeatherData();
      console.log('Step 6: Weather data loaded');
      
      console.log('Step 7: Setting up message listener...');
      this.setupMessageListener();
      console.log('Step 8: Message listener setup');
      
      console.log('Step 9: Setting up data refresh...');
      this.setupDataRefresh();
      console.log('Step 10: Data refresh setup');
      
      console.log('=== SimpleWeatherEngine init completed ===');
      
    } catch (error) {
      console.error('初始化失败:', error);
      this.showError('初始化失败，请刷新页面重试');
    }
  }
  
    
  async getCurrentLocation() {
    console.log('getCurrentLocation called');
    
    // 直接使用默认位置（上海）避免权限问题
    this.currentLocation = { 
      lat: 31.2304, 
      lon: 121.4737,
      name: '上海'
    };
    
    console.log('Using default location:', this.currentLocation);
    return this.currentLocation;
    
    /* 注释掉地理位置获取，避免权限问题
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.currentLocation = {
              lat: position.coords.latitude,
              lon: position.coords.longitude
            };
            resolve(this.currentLocation);
          },
          (error) => {
            console.error('位置获取失败:', error);
            // 使用默认位置（上海）
            this.currentLocation = { lat: 31.2304, lon: 121.4737 };
            resolve(this.currentLocation);
          }
        );
      } else {
        // 使用默认位置
        this.currentLocation = { lat: 31.2304, lon: 121.4737 };
        resolve(this.currentLocation);
      }
    });
    */
  }
  
  async loadWeatherData() {
    console.log('=== loadWeatherData called ===');
    console.log('Location:', JSON.stringify(this.currentLocation, null, 2));
    
    if (!this.currentLocation) {
      console.error('ERROR: No location available for weather data');
      this.showError('无法获取位置信息');
      return;
    }
    
    try {
      // 尝试从后台获取天气数据
      console.log('Step 1: Trying to get weather data from background...');
      
      try {
        console.log('Step 2: Sending message to background...');
        const response = await chrome.runtime.sendMessage({
          type: 'weather.getCurrent'
        });
        
        console.log('Step 3: Background response received:', JSON.stringify(response, null, 2));
        
        if (response && response.data) {
          console.log('Step 4: Using background weather data');
          this.currentWeather = response.data;
          this.updateUI();
          this.hideLoading();
          console.log('Step 5: Background data processing completed');
          return; // 成功获取数据，直接返回
        } else {
          console.log('Step 4: Background returned no data, fetching directly');
        }
      } catch (backgroundError) {
        console.log('Step 3: Background service unavailable:', backgroundError);
      }
      
      // 如果后台没有数据或不可用，直接获取
      console.log('Step 6: Fetching weather data directly...');
      await this.fetchWeatherData();
      console.log('Step 7: Direct weather data fetch completed');
      this.hideLoading();
      
    } catch (error) {
      console.error('Step 8: Weather data loading failed:', error);
      this.showError('天气数据加载失败');
    }
  }
  
  async fetchWeatherData() {
    if (!this.currentLocation || !this.currentLocation.lat || !this.currentLocation.lon) return;
    
    try {
      const params = new URLSearchParams({
        latitude: this.currentLocation.lat.toFixed(4),
        longitude: this.currentLocation.lon.toFixed(4),
        current_weather: 'true',
        hourly: 'temperature_2m,relativehumidity_2m,apparent_temperature,precipitation_probability,precipitation,weathercode,cloudcover,visibility,windspeed_10m,winddirection_10m,uv_index',
        daily: 'sunrise,sunset',
        timezone: 'auto'
      });

      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`API Error: ${data.reason || 'Unknown error'}`);
      }

      // 转换数据格式
      const current = data.current_weather;
      const hourly = data.hourly;
      const currentHour = new Date().getHours();
      
      // 计算太阳位置（简化）
      const sunPosition = this.calculateSunPosition(
        this.currentLocation.lat,
        this.currentLocation.lon
      );
      
      this.currentWeather = {
        location: {
          ...this.currentLocation,
          name: '当前位置',
          timezone: data.timezone || 'Asia/Shanghai'
        },
        sun: {
          altitudeDeg: sunPosition.altitudeDeg,
          azimuthDeg: sunPosition.azimuthDeg
        },
        weather: {
          code: this.mapWeatherCode(current.weathercode),
          precipIntensity: (hourly.precipitation[currentHour] || 0) / 10,
          precipType: (current.temperature || 20) < 0 ? 'snow' : 'rain',
          visibilityKm: hourly.visibility[currentHour] || 10,
          windSpeedMps: current.windspeed_10m || 0,
          windDirDeg: current.winddirection_10m || 0,
          thunderProb: current.weathercode >= 95 ? 0.6 : 0
        },
        env: {
          isNight: !sunPosition.isDay,
          temperature: current.temperature || 20
        },
        timestamp: Date.now()
      };
      
      this.updateUI();
      this.hideLoading();
      
    } catch (error) {
      console.error('获取天气数据失败:', error);
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
    this.update3DScene(weatherCode, isNight);
  }
  
  update3DScene(weatherCode, isNight) {
    if (!this.scene || !this.camera || !this.renderer) return;
    
    console.log('Updating 3D scene for weather:', weatherCode, 'isNight:', isNight);
    
    // 更新场景环境
    this.updateSceneEnvironment(weatherCode, isNight);
    
    // 更新天气效果
    this.updateWeatherEffects(weatherCode);
  }
  
  updateSceneEnvironment(weatherCode, isNight) {
    // 更新雾效
    if (this.scene.fog) {
      if (isNight) {
        this.scene.fog.color.setHex(0x0b1a2e);
        this.scene.fog.density = 0.055;
      } else {
        this.scene.fog.color.setHex(0x8ec5df);
        this.scene.fog.density = 0.03;
      }
    }
    
    // 更新光照
    if (this.ambientLight && this.directionalLight) {
      if (isNight) {
        this.ambientLight.intensity = 0.22;
        this.directionalLight.intensity = 0.55;
        this.directionalLight.color.setHex(0x8080ff);
      } else {
        this.ambientLight.intensity = 0.6;
        this.directionalLight.intensity = 1.0;
        this.directionalLight.color.setHex(0xffffff);
      }
    }
    
    // 更新云朵可见性
    if (this.clouds) {
      this.clouds.visible = (weatherCode === 'cloudy');
    }
  }
  
  updateWeatherEffects(weatherCode) {
    // 这里可以添加更多天气效果
    // 例如：雨、雪、雷暴等
    
    console.log('Weather effects updated for:', weatherCode);
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
      } catch (error) {
        console.log('无法设置消息监听器:', error);
      }
    }
  }
  
  setupDataRefresh() {
    // 每 30 分钟刷新一次数据
    setInterval(() => {
      this.loadWeatherData();
    }, 30 * 60 * 1000);
  }
  
  setupThreeJS() {
    console.log('Setting up Three.js scene...');
    
    // 检查 Three.js 是否可用
    if (typeof THREE === 'undefined') {
      console.error('Three.js not loaded');
      return;
    }
    
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x8ec5df, 0.03);
    
    // 创建相机
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 220);
    this.camera.position.set(0, 1.7, 7);
    this.camera.lookAt(0, 1.4, 0);
    
    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    // 将渲染器添加到容器
    const container = document.getElementById('weather-container');
    if (container) {
      container.appendChild(this.renderer.domElement);
      console.log('Three.js renderer added to container');
    } else {
      console.error('Weather container not found');
    }
    
    // 创建光源
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);
    
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.directionalLight.position.set(3, 5, 2);
    this.scene.add(this.directionalLight);
    
    // 创建地面
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x9aa0a6,
      roughness: 0.95,
      metalness: 0.0
    });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
    
    // 创建简单的云朵
    this.createClouds();
    
    // 设置窗口大小调整监听
    window.addEventListener('resize', () => this.onWindowResize());
    
    // 开始渲染循环
    this.animate();
    
    console.log('Three.js setup complete');
  }
  
  createClouds() {
    // 创建简单的云朵组
    this.clouds = new THREE.Group();
    
    // 创建云朵几何体
    const cloudGeometry = new THREE.SphereGeometry(1, 8, 6);
    const cloudMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    
    // 创建多个云朵
    for (let i = 0; i < 5; i++) {
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloud.position.set(
        (Math.random() - 0.5) * 50,
        10 + Math.random() * 5,
        (Math.random() - 0.5) * 50
      );
      cloud.scale.set(
        2 + Math.random() * 3,
        1 + Math.random() * 2,
        2 + Math.random() * 3
      );
      this.clouds.add(cloud);
    }
    
    this.scene.add(this.clouds);
  }
  
  onWindowResize() {
    if (this.camera && this.renderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    // 旋转云朵
    if (this.clouds) {
      this.clouds.rotation.y += 0.001;
    }
    
    // 渲染场景
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
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
}

class WeatherApp {
  constructor() {
    this.engine = null;
    this.init();
  }
  
  async init() {
    try {
      // 初始化简化的天气引擎
      this.engine = new SimpleWeatherEngine(document.body);
      
    } catch (error) {
      console.error('初始化失败:', error);
      this.showError('初始化失败，请刷新页面重试');
    }
  }
  
  showError(message) {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.innerHTML = message;
      loading.style.display = 'block';
    }
  }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded, starting WeatherApp...');
  try {
    const app = new WeatherApp();
    console.log('WeatherApp started successfully');
  } catch (error) {
    console.error('Failed to start WeatherApp:', error);
    // 显示错误信息
    const loading = document.getElementById('loading');
    if (loading) {
      loading.innerHTML = '应用启动失败，请刷新页面重试';
      loading.style.display = 'block';
    }
  }
});