// 天气引擎主控制器 - 使用高质量渲染器
// 基于 ref 目录中的专业天气渲染器

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
    
    // 高质量渲染器实例
    this.renderer = null;
    
    // 天气状态
    this.isRaining = false;
    this.isSnowing = false;
    this.currentTime = 'day';
    
    // 天气类型到模板的映射
    this.weatherToTemplate = {
      'clear': 'clear-day',
      'cloudy': 'cloudy-day',
      'rain': 'rain',
      'snow': 'snow',
      'storm': 'storm'
    };
    
    // 时间到模板的映射
    this.timeToTemplate = {
      'dawn': 'golden-hour',
      'day': 'clear-day',
      'dusk': 'golden-hour',
      'night': 'night-clear'
    };
    
    // 初始化Promise
    this.initializationPromise = this.init().then(() => {
      // 异步加载位置信息
      return this.loadLocationFromStorage();
    }).then(() => {
      console.log('Location loaded, updating sun position...');
      this.calculateSunPositionFromTime();
      this.applyControlParams();
    }).catch((error) => {
      console.error('Initialization error:', error);
    });
  }
  
  async init() {
    console.log('=== FullWeatherEngine init started ===');
    
    try {
      console.log('Step 1: Setting up advanced renderer...');
      await this.setupRenderer();
      console.log('Step 2: Advanced renderer setup complete');
      
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
      
      console.log('Step 11: Control panel creation will be handled by caller...');
      console.log('Step 12: Init completed, control panel ready');
      
      console.log('=== FullWeatherEngine init completed ===');
      
    } catch (error) {
      console.error('初始化失败:', error);
      this.showError('初始化失败，请刷新页面重试');
      throw error;
    }
  }
  
  async setupRenderer() {
    console.log('Setting up advanced weather renderer...');
    
    // 检查 AdvancedWeatherRenderer 是否可用
    if (typeof AdvancedWeatherRenderer === 'undefined') {
      throw new Error('AdvancedWeatherRenderer not loaded');
    }
    
    // 创建高质量渲染器实例
    this.renderer = new AdvancedWeatherRenderer();
    await this.renderer.init(this.container);
    console.log('Advanced weather renderer initialized successfully');
    
    console.log('Advanced weather renderer setup complete');
  }
  
  // 应用控制参数到高质量渲染器
  applyControlParams() {
    if (!this.renderer) {
      console.warn('Advanced renderer not available');
      return;
    }
    
    console.log('Applying control params to advanced renderer:', this.controlParams);
    
    // 首先根据天气类型选择模板
    const templateKey = this.weatherToTemplate[this.controlParams.weatherType] || 'clear-day';
    this.renderer.applyTemplate(templateKey);
    
    // 然后应用具体的参数调整
    const params = {
      sunAltitude: this.controlParams.sunAltitude,
      sunAzimuth: this.controlParams.sunAzimuth,
      cloudOpacity: this.controlParams.cloudOpacity,
      cloudSpeed: this.controlParams.cloudSpeed,
      fogDensity: this.controlParams.fogDensity,
      cameraFov: this.controlParams.cameraFov,
      cameraDistance: this.controlParams.cameraDistance
    };
    
    // 使用渲染器的参数更新接口
    this.renderer.updateParams(params);
    
    // 根据时间调整光照
    this.updateLightingFromTime();
    
    console.log('Control params applied to advanced renderer');
  }
  
  // 根据时间更新光照
  updateLightingFromTime() {
    const hours = this.controlParams.timeOfDayHours;
    let timeCategory = 'day';
    
    if (hours >= 5 && hours < 7) timeCategory = 'dawn';
    else if (hours >= 7 && hours < 17) timeCategory = 'day';
    else if (hours >= 17 && hours < 19) timeCategory = 'dusk';
    else timeCategory = 'night';
    
    // 如果时间和天气类型变化较大，可以切换模板
    const currentTemplate = this.renderer._currentKey;
    const expectedTemplate = this.weatherToTemplate[this.controlParams.weatherType] || 'clear-day';
    
    if (currentTemplate !== expectedTemplate) {
      this.renderer.applyTemplate(expectedTemplate);
    }
    
    console.log('Lighting updated for time:', hours, 'category:', timeCategory);
  }
  
  // 更新太阳位置
  updateSunPosition() {
    if (!this.renderer) {
      console.warn('Advanced renderer not available');
      return;
    }
    
    console.log('Updating sun position...');
    
    // 高质量渲染器会自动处理太阳位置计算
    // 我们只需要更新参数
    const params = {
      sunAltitude: this.controlParams.sunAltitude,
      sunAzimuth: this.controlParams.sunAzimuth
    };
    
    this.renderer.updateParams(params);
    
    console.log('Sun position updated via advanced renderer');
  }
  
  // 更新天气类型
  updateWeatherType() {
    console.log('Updating weather type:', this.controlParams.weatherType);
    
    if (!this.renderer) {
      console.warn('Advanced renderer not available');
      return;
    }
    
    // 切换到对应的天气模板
    const templateKey = this.weatherToTemplate[this.controlParams.weatherType] || 'clear-day';
    this.renderer.applyTemplate(templateKey);
    
    // 应用当前的控制参数
    this.applyControlParams();
    
    console.log('Weather type updated via template:', templateKey);
  }
  
  // 计算太阳位置从时间
  calculateSunPositionFromTime() {
    console.log('Calculating sun position from time...');
    
    const hours = this.controlParams.timeOfDayHours;
    const latitude = this.controlParams.latitude;
    const longitude = this.controlParams.longitude;
    
    // 简化的太阳位置计算
    const dayOfYear = new Date().getDay();
    const solarDeclination = 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180);
    
    // 计算时角
    const hourAngle = 15 * (hours - 12);
    
    // 计算太阳高度角
    const altitudeRad = Math.asin(
      Math.sin(solarDeclination * Math.PI / 180) * Math.sin(latitude * Math.PI / 180) +
      Math.cos(solarDeclination * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) * Math.cos(hourAngle * Math.PI / 180)
    );
    
    // 计算太阳方位角
    const azimuthRad = Math.atan2(
      Math.sin(hourAngle * Math.PI / 180),
      Math.cos(hourAngle * Math.PI / 180) * Math.sin(latitude * Math.PI / 180) - Math.tan(solarDeclination * Math.PI / 180) * Math.cos(latitude * Math.PI / 180)
    );
    
    // 更新控制参数
    this.controlParams.sunAltitude = altitudeRad * 180 / Math.PI;
    this.controlParams.sunAzimuth = (azimuthRad * 180 / Math.PI + 180) % 360;
    
    console.log('Sun position calculated:', {
      altitude: this.controlParams.sunAltitude,
      azimuth: this.controlParams.sunAzimuth,
      time: hours
    });
  }
  
  // 重置控制参数
  resetControlParams() {
    console.log('Resetting control params...');
    
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
      latitude: 31.2304,
      longitude: 121.4737,
    };
    
    this.applyControlParams();
    console.log('Control params reset');
  }
  
  // 获取当前地理位置
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.currentLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            this.controlParams.latitude = position.coords.latitude;
            this.controlParams.longitude = position.coords.longitude;
            console.log('Location obtained:', this.currentLocation);
            resolve();
          },
          (error) => {
            console.warn('Geolocation failed, using default location:', error.message);
            resolve(); // 使用默认位置
          }
        );
      } else {
        console.warn('Geolocation not supported, using default location');
        resolve();
      }
    });
  }
  
  // 从存储加载位置
  loadLocationFromStorage() {
    return new Promise((resolve) => {
      try {
        const stored = localStorage.getItem('weatherLocation');
        if (stored) {
          const location = JSON.parse(stored);
          this.currentLocation = location;
          this.controlParams.latitude = location.latitude;
          this.controlParams.longitude = location.longitude;
          console.log('Location loaded from storage:', location);
        }
        resolve();
      } catch (error) {
        console.warn('Failed to load location from storage:', error);
        resolve();
      }
    });
  }
  
  // 加载天气数据
  loadWeatherData() {
    return new Promise((resolve) => {
      // 模拟天气数据加载
      setTimeout(() => {
        this.currentWeather = {
          type: 'clear',
          temperature: 25,
          humidity: 60,
          windSpeed: 5
        };
        console.log('Weather data loaded:', this.currentWeather);
        resolve();
      }, 1000);
    });
  }
  
  // 设置消息监听器
  setupMessageListener() {
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'weatherUpdate') {
        console.log('Received weather update:', event.data);
        this.handleWeatherUpdate(event.data);
      }
    });
  }
  
  // 处理天气更新
  handleWeatherUpdate(data) {
    console.log('Handling weather update:', data);
    
    if (data.weatherType) {
      this.controlParams.weatherType = data.weatherType;
      this.updateWeatherType();
    }
    
    if (data.temperature !== undefined) {
      this.currentWeather.temperature = data.temperature;
    }
    
    if (data.humidity !== undefined) {
      this.currentWeather.humidity = data.humidity;
    }
  }
  
  // 设置数据刷新
  setupDataRefresh() {
    // 每5分钟刷新一次天气数据
    setInterval(() => {
      this.loadWeatherData();
    }, 5 * 60 * 1000);
  }
  
  // 显示错误信息
  showError(message) {
    console.error('Error:', message);
    if (this.container) {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 1000;
      `;
      errorDiv.textContent = message;
      this.container.appendChild(errorDiv);
    }
  }
  
  // 获取引擎状态
  getEngineState() {
    return {
      initialized: !!(this.renderer && this.renderer._currentKey),
      controlParams: { ...this.controlParams },
      currentWeather: this.currentWeather,
      currentLocation: this.currentLocation,
      currentTemplate: this.renderer ? this.renderer._currentKey : null,
      renderState: this.renderer ? {
        currentTemplate: this.renderer._currentKey,
        hasPrecipitation: !!(this.renderer.precip),
        lightningEnergy: this.renderer.lightning.energy
      } : null
    };
  }
  
  // 销毁引擎
  destroy() {
    console.log('Destroying weather engine...');
    
    if (this.renderer) {
      this.renderer.destroy();
      this.renderer = null;
    }
    
    console.log('Weather engine destroyed');
  }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FullWeatherEngine;
} else if (typeof window !== 'undefined') {
  window.FullWeatherEngine = FullWeatherEngine;
}