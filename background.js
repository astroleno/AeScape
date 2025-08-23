// Chrome 扩展 Service Worker
// 不使用 ES6 模块，避免兼容性问题

// 天气服务类
class WeatherServiceWorker {
  constructor() {
    this.currentLocation = null;
    this.currentWeather = null;
    this.currentAirQuality = null;
    this.updateInterval = null;
    this.isInitialized = false;
    
    console.log('WeatherServiceWorker constructor called');
    this.init();
  }

  async init() {
    console.log('Service Worker init starting...');
    try {
      // 设置默认位置
      console.log('Setting default location...');
      await this.setDefaultLocation();
      
      // 验证位置数据
      if (!this.currentLocation || !this.currentLocation.lat || !this.currentLocation.lon) {
        throw new Error('Failed to set valid location');
      }
      
      // 初始化数据
      console.log('Loading initial data...');
      await this.loadInitialData();
      
      // 设置定时更新
      console.log('Setting up scheduled updates...');
      this.setupScheduledUpdates();
      
      // 监听消息
      console.log('Setting up message listener...');
      this.setupMessageListener();
      
      // 监听扩展安装/更新
      console.log('Setting up install listener...');
      this.setupInstallListener();
      
      this.isInitialized = true;
      console.log('Weather Service Worker initialized successfully');
      
      // 测试消息处理
      console.log('Service Worker is ready to handle messages');
      
    } catch (error) {
      console.error('Service Worker initialization failed:', error);
      // 确保基本功能可用
      this.currentLocation = { lat: 31.2304, lon: 121.4737, name: '上海' };
      this.setupMessageListener();
      this.setupInstallListener();
      console.log('Service Worker initialized with fallback settings');
    }
  }

  async setDefaultLocation() {
    try {
      console.log('Setting default location...');
      
      // 暂时跳过存储读取，直接使用硬编码的上海位置
      this.currentLocation = {
        lat: 31.2304,
        lon: 121.4737,
        name: '上海'
      };
      console.log('Using hardcoded Shanghai location:', JSON.stringify(this.currentLocation, null, 2));
      
      // 尝试保存到存储，但不影响初始化
      try {
        await chrome.storage.local.set({ location: this.currentLocation });
        console.log('Location saved to storage');
      } catch (storageError) {
        console.log('Storage save failed, but continuing with hardcoded location');
      }
      
    } catch (error) {
      console.error('设置默认位置失败:', error);
      // 确保无论如何都有位置
      this.currentLocation = { 
        lat: 31.2304, 
        lon: 121.4737, 
        name: '上海' 
      };
      console.log('Emergency fallback to hardcoded location:', JSON.stringify(this.currentLocation, null, 2));
    }
  }

  async loadInitialData() {
    try {
      console.log('Loading initial data...');
      
      // 确保位置有效
      if (!this.currentLocation || !this.currentLocation.lat || !this.currentLocation.lon) {
        console.log('Invalid location, setting default...');
        this.currentLocation = { lat: 31.2304, lon: 121.4737, name: '上海' };
      }
      
      // 获取天气数据
      console.log('Updating weather data...');
      try {
        await this.updateWeatherData();
      } catch (weatherError) {
        console.error('Weather data update failed:', weatherError);
      }
      
      // 获取空气质量数据
      console.log('Updating air quality data...');
      try {
        await this.updateAirQualityData();
      } catch (airQualityError) {
        console.error('Air quality data update failed:', airQualityError);
      }
      
      console.log('Initial data loading completed');
      
    } catch (error) {
      console.error('加载初始数据失败:', error);
    }
  }

  async updateWeatherData() {
    console.log('updateWeatherData called with location:', JSON.stringify(this.currentLocation, null, 2));
    
    if (!this.currentLocation) {
      console.error('No current location available');
      return;
    }
    
    if (typeof this.currentLocation.lat === 'undefined' || typeof this.currentLocation.lon === 'undefined') {
      console.error('Invalid location coordinates:', this.currentLocation);
      return;
    }
    
    if (isNaN(this.currentLocation.lat) || isNaN(this.currentLocation.lon)) {
      console.error('Invalid coordinate values:', this.currentLocation);
      return;
    }
    
    try {
      const weatherData = await this.fetchWeatherData(
        this.currentLocation.lat,
        this.currentLocation.lon
      );
      
      // 获取太阳位置
      const sunPosition = this.calculateSunPosition(
        this.currentLocation.lat,
        this.currentLocation.lon
      );
      
      // 构建天气状态
      this.currentWeather = {
        location: {
          ...this.currentLocation,
          timezone: weatherData.timezone || 'Asia/Shanghai'
        },
        sun: {
          altitudeDeg: sunPosition.altitudeDeg,
          azimuthDeg: sunPosition.azimuthDeg
        },
        weather: {
          code: this.mapWeatherCode(weatherData.weatherCode),
          precipIntensity: (weatherData.precipitation || 0) / 10,
          precipType: (weatherData.temperature || 20) < 0 ? 'snow' : 'rain',
          visibilityKm: weatherData.visibility || 10,
          windSpeedMps: weatherData.windSpeed || 0,
          windDirDeg: weatherData.windDirection || 0,
          thunderProb: weatherData.weatherCode >= 95 ? 0.6 : 0
        },
        env: {
          isNight: !sunPosition.isDay,
          temperature: weatherData.temperature || 20
        },
        timestamp: Date.now()
      };
      
      // 保存到存储
      await chrome.storage.local.set({ weather: this.currentWeather });
      
      // 通知所有页面
      this.broadcastWeatherUpdate();
      
    } catch (error) {
      console.error('更新天气数据失败:', error);
    }
  }

  async updateAirQualityData() {
    // 暂时禁用空气质量数据获取，因为 API 不可用
    console.log('空气质量数据获取暂时禁用');
    return;
    
    if (!this.currentLocation || !this.currentLocation.lat || !this.currentLocation.lon) {
      console.error('Invalid location data for air quality:', this.currentLocation);
      return;
    }
    
    try {
      const airQualityData = await this.fetchAirQualityData(
        this.currentLocation.lat,
        this.currentLocation.lon
      );
      
      this.currentAirQuality = {
        ...airQualityData,
        location: this.currentLocation,
        timestamp: Date.now()
      };
      
      // 保存到存储
      await chrome.storage.local.set({ airQuality: this.currentAirQuality });
      
      // 通知所有页面
      this.broadcastAirQualityUpdate();
      
    } catch (error) {
      console.error('更新空气质量数据失败:', error);
    }
  }

  async fetchWeatherData(lat, lon) {
    if (!lat || !lon) {
      throw new Error('Invalid coordinates');
    }
    
    const params = new URLSearchParams({
      latitude: lat.toFixed(4),
      longitude: lon.toFixed(4),
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
    
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      temperature: current.temperature,
      weatherCode: current.weathercode,
      windSpeed: current.windspeed_10m,
      windDirection: current.winddirection_10m,
      precipitation: hourly.precipitation[currentHour],
      visibility: hourly.visibility[currentHour],
      humidity: hourly.relativehumidity_2m[currentHour],
      cloudCover: hourly.cloudcover[currentHour],
      uvIndex: hourly.uv_index[currentHour]
    };
  }

  async fetchAirQualityData(lat, lon) {
    if (!lat || !lon) {
      throw new Error('Invalid coordinates');
    }
    
    const params = new URLSearchParams({
      latitude: lat.toFixed(4),
      longitude: lon.toFixed(4),
      hourly: 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,aqi',
      timezone: 'auto'
    });

    const response = await fetch(`https://api.open-meteo.com/v1/air-quality?${params}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Air Quality API Error: ${data.reason || 'Unknown error'}`);
    }

    const hourly = data.hourly;
    const currentHour = new Date().getHours();
    
    return {
      pm10: hourly.pm10[currentHour],
      pm2_5: hourly.pm2_5[currentHour],
      carbon_monoxide: hourly.carbon_monoxide[currentHour],
      nitrogen_dioxide: hourly.nitrogen_dioxide[currentHour],
      sulphur_dioxide: hourly.sulphur_dioxide[currentHour],
      ozone: hourly.ozone[currentHour],
      aqi: hourly.aqi[currentHour]
    };
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
    
    const azimuthRad = Math.atan2(
      Math.sin(hourAngle * Math.PI / 180),
      Math.cos(hourAngle * Math.PI / 180) * Math.tan(lat * Math.PI / 180) -
      Math.tan(declination * Math.PI / 180)
    );
    
    const altitudeDeg = altitudeRad * 180 / Math.PI;
    const azimuthDeg = (azimuthRad * 180 / Math.PI + 180) % 360;
    
    // 计算日出日落
    const sunriseHour = 6 + Math.sin((dayOfYear - 80) * Math.PI / 182) * 2;
    const sunsetHour = 18 + Math.sin((dayOfYear - 80) * Math.PI / 182) * 2;
    const currentHour = date.getHours() + date.getMinutes() / 60;
    
    return {
      altitudeDeg: Math.round(altitudeDeg * 100) / 100,
      azimuthDeg: Math.round(azimuthDeg * 100) / 100,
      isDay: currentHour >= sunriseHour && currentHour <= sunsetHour
    };
  }

  mapWeatherCode(code) {
    const codeMap = {
      0: 'clear',
      1: 'clear',
      2: 'cloudy',
      3: 'cloudy',
      45: 'fog',
      48: 'fog',
      51: 'rain',
      53: 'rain',
      55: 'rain',
      56: 'rain',
      57: 'rain',
      61: 'rain',
      63: 'rain',
      65: 'rain',
      66: 'snow',
      67: 'snow',
      71: 'snow',
      73: 'snow',
      75: 'snow',
      77: 'snow',
      80: 'rain',
      81: 'rain',
      82: 'rain',
      85: 'snow',
      86: 'snow',
      95: 'thunderstorm',
      96: 'thunderstorm',
      99: 'thunderstorm'
    };
    
    return codeMap[code] || 'clear';
  }

  setupScheduledUpdates() {
    // 清除现有定时器
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    // 天气数据每 30 分钟更新一次
    this.updateInterval = setInterval(async () => {
      await this.updateWeatherData();
    }, 30 * 60 * 1000);
    
    // 空气质量数据每小时更新一次
    setInterval(async () => {
      await this.updateAirQualityData();
    }, 60 * 60 * 1000);
    
    // 太阳位置每分钟更新一次
    setInterval(async () => {
      await this.updateSunPosition();
    }, 60 * 1000);
  }

  async updateSunPosition() {
    if (!this.currentLocation || !this.currentLocation.lat || !this.currentLocation.lon || !this.currentWeather) {
      console.error('Invalid data for sun position update');
      return;
    }
    
    try {
      const sunPosition = this.calculateSunPosition(
        this.currentLocation.lat,
        this.currentLocation.lon
      );
      
      this.currentWeather.sun = {
        altitudeDeg: sunPosition.altitudeDeg,
        azimuthDeg: sunPosition.azimuthDeg
      };
      
      this.currentWeather.env.isNight = !sunPosition.isDay;
      
      // 保存到存储
      await chrome.storage.local.set({ weather: this.currentWeather });
      
      // 通知所有页面
      this.broadcastWeatherUpdate();
      
    } catch (error) {
      console.error('更新太阳位置失败:', error);
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // 保持消息通道开放
    });
  }

  async handleMessage(message, sender, sendResponse) {
    console.log(' handleMessage called with:', JSON.stringify(message, null, 2));
    
    try {
      switch (message.type) {
        case 'weather.getCurrent':
          console.log('Returning current weather:', JSON.stringify(this.currentWeather, null, 2));
          sendResponse({ success: true, data: this.currentWeather });
          break;
          
        case 'airQuality.getCurrent':
          console.log('Returning current air quality:', JSON.stringify(this.currentAirQuality, null, 2));
          sendResponse({ success: true, data: this.currentAirQuality });
          break;
          
        case 'location.getCurrent':
          console.log('Returning current location:', JSON.stringify(this.currentLocation, null, 2));
          sendResponse({ success: true, data: this.currentLocation });
          break;
          
        case 'location.set':
          console.log('Setting new location from message');
          await this.setLocation(message.location);
          sendResponse({ success: true });
          break;
          
        case 'weather.forceUpdate':
          console.log('Forcing weather update');
          await this.updateWeatherData();
          sendResponse({ success: true });
          break;
          
        case 'airQuality.forceUpdate':
          console.log('Forcing air quality update');
          await this.updateAirQualityData();
          sendResponse({ success: true });
          break;
          
        default:
          console.log('Unknown message type:', message.type);
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async setLocation(location) {
    console.log('setLocation called with:', JSON.stringify(location, null, 2));
    
    if (!location || typeof location.lat === 'undefined' || typeof location.lon === 'undefined') {
      console.error('Invalid location provided:', location);
      return;
    }
    
    // 确保坐标是数字
    const lat = parseFloat(location.lat);
    const lon = parseFloat(location.lon);
    
    if (isNaN(lat) || isNaN(lon)) {
      console.error('Invalid coordinate values:', location);
      return;
    }
    
    this.currentLocation = {
      lat: lat,
      lon: lon,
      name: location.name || '未知位置'
    };
    console.log('Location set to:', JSON.stringify(this.currentLocation, null, 2));
    
    // 保存到存储
    try {
      await chrome.storage.local.set({ location: this.currentLocation });
      console.log('Location saved to storage');
    } catch (storageError) {
      console.log('Storage save failed, but continuing with new location');
    }
    
    // 立即更新数据
    try {
      await this.updateWeatherData();
    } catch (weatherError) {
      console.error('Weather update failed after location change:', weatherError);
    }
    
    try {
      await this.updateAirQualityData();
    } catch (airQualityError) {
      console.log('Air quality update failed (expected):', airQualityError);
    }
  }

  setupInstallListener() {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        // 首次安装
        this.handleFirstInstall();
      } else if (details.reason === 'update') {
        // 扩展更新
        this.handleUpdate();
      }
    });
  }

  async handleFirstInstall() {
    try {
      // 设置默认位置
      await this.setDefaultLocation();
      
      // 获取初始数据
      await this.loadInitialData();
      
      console.log('Extension installed successfully');
      
    } catch (error) {
      console.error('首次安装处理失败:', error);
    }
  }

  async handleUpdate() {
    try {
      // 重新加载数据
      await this.loadInitialData();
      
      console.log('Extension updated successfully');
      
    } catch (error) {
      console.error('更新处理失败:', error);
    }
  }

  broadcastWeatherUpdate() {
    chrome.runtime.sendMessage({
      type: 'weather.updated',
      data: this.currentWeather
    }).catch(() => {
      // 忽略错误（可能没有监听器）
    });
  }

  broadcastAirQualityUpdate() {
    chrome.runtime.sendMessage({
      type: 'airQuality.updated',
      data: this.currentAirQuality
    }).catch(() => {
      // 忽略错误（可能没有监听器）
    });
  }
}

// 创建 Service Worker 实例
console.log('Creating WeatherServiceWorker instance...');
const weatherWorker = new WeatherServiceWorker();

// 导出用于调试
self.weatherWorker = weatherWorker;

// Service Worker 激活事件
self.addEventListener('activate', event => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

// Service Worker 安装事件
self.addEventListener('install', event => {
  console.log('Service Worker installed');
  self.skipWaiting();
});