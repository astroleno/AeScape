/**
 * 天景 AeScape - 后台服务
 * 基于OpenWeatherMap One Call API 3.0
 * 简洁高效的天气数据服务
 */

class WeatherBackgroundService {
  constructor() {
    this.apiKey = '';
    this.currentLocation = null;
    this.currentWeather = null;
    this.updateInterval = null;
    
    // Current Weather API (免费版)
    this.WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
    this.GEO_API_URL = 'https://api.openweathermap.org/geo/1.0';
    
    this.init();
  }

  async init() {
    console.log('Weather Background Service initializing...');
    
    try {
      await this.loadStoredData();
      this.setupMessageHandlers();
      
      if (this.apiKey && this.currentLocation) {
        await this.updateWeatherData();
        this.setupPeriodicUpdates();
      }
      
      console.log('Weather Background Service initialized');
    } catch (error) {
      console.error('Background service initialization failed:', error);
      this.setupMessageHandlers();
    }
  }

  async loadStoredData() {
    try {
      const result = await chrome.storage.local.get(['apiKey', 'location', 'weather']);
      
      this.apiKey = result.apiKey || '';
      this.currentLocation = result.location || {
        lat: 31.2304,
        lon: 121.4737,
        name: '上海',
        country: 'CN'
      };
      this.currentWeather = result.weather || null;
      
      console.log('Loaded stored data:', {
        hasApiKey: !!this.apiKey,
        location: this.currentLocation?.name
      });
    } catch (error) {
      console.error('Failed to load stored data:', error);
      // 设置默认位置
      this.currentLocation = {
        lat: 31.2304,
        lon: 121.4737,
        name: '上海',
        country: 'CN'
      };
    }
  }

  setupMessageHandlers() {
    // 移除之前的监听器以避免重复
    if (chrome.runtime.onMessage.hasListeners()) {
      chrome.runtime.onMessage.removeListener(this.handleMessage);
    }
    
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // 使用箭头函数确保正确的this绑定
      this.handleMessageAsync(message, sender, sendResponse);
      return true; // 保持消息通道开放，支持异步响应
    });
  }

  async handleMessageAsync(message, sender, sendResponse) {
    try {
      const result = await this.handleMessage(message, sender);
      sendResponse(result);
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    }
  }

  async handleMessage(message, sender) {
    switch (message.type) {
      case 'api.checkStatus':
        return { 
          success: true, 
          hasApiKey: !!this.apiKey 
        };

      case 'api.setKey':
        await this.setApiKey(message.apiKey);
        return { success: true, message: 'API Key保存成功' };

      case 'api.testKey':
        return await this.testApiKey(message.apiKey || this.apiKey);

      case 'weather.getCurrent':
        return { 
          success: true, 
          data: this.currentWeather 
        };

      case 'weather.forceUpdate':
        const weather = await this.updateWeatherData();
        return { 
          success: true, 
          data: weather 
        };

      case 'location.getCurrent':
        return { 
          success: true, 
          data: this.currentLocation 
        };

      case 'location.setByName':
        const locationByName = await this.setLocationByName(message.cityName);
        return { 
          success: true, 
          location: locationByName 
        };

      case 'location.setCoordinates':
        const locationByCoords = await this.setLocationByCoordinates(
          message.lat, 
          message.lon, 
          message.name
        );
        return { 
          success: true, 
          location: locationByCoords 
        };

      case 'location.searchCities':
        const cities = await this.searchCities(message.query);
        return { 
          success: true, 
          cities: cities 
        };

      default:
        return { 
          success: false, 
          error: 'Unknown message type' 
        };
    }
  }

  async testApiKey(apiKey) {
    if (!apiKey) {
      return { success: false, error: 'API Key未提供' };
    }

    try {
      console.log('Testing API Key using Current Weather API...');
      
      // 使用北京的坐标测试免费版API
      const testLat = 39.9042;
      const testLon = 116.4074;
      
      const url = `${this.WEATHER_API_URL}?lat=${testLat}&lon=${testLon}&appid=${apiKey}&units=metric&lang=zh_cn`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        
        if (response.status === 401) {
          return { success: false, error: 'API Key无效或未授权' };
        } else if (response.status === 429) {
          return { success: false, error: 'API调用次数超限，请稍后重试' };
        } else {
          return { success: false, error: `API测试失败: ${errorData.message}` };
        }
      }

      const data = await response.json();
      
      return { 
        success: true, 
        message: 'API Key验证成功！',
        testData: {
          location: data.name || '北京',
          temperature: Math.round(data.main.temp),
          description: data.weather[0].description
        }
      };

    } catch (error) {
      console.error('Failed to test API key:', error);
      return { success: false, error: '网络连接失败，请检查网络后重试' };
    }
  }

  async setApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Invalid API key');
    }

    this.apiKey = apiKey.trim();
    await chrome.storage.local.set({ apiKey: this.apiKey });
    
    // 验证API Key并获取天气数据
    if (this.currentLocation) {
      await this.updateWeatherData();
      this.setupPeriodicUpdates();
    }
    
    console.log('API key updated and validated');
  }

  async updateWeatherData() {
    if (!this.apiKey || !this.currentLocation) {
      console.log('Missing API key or location');
      return null;
    }

    try {
      console.log('Updating weather data using Current Weather API for:', this.currentLocation.name);
      
      const weatherData = await this.fetchCurrentWeatherData(
        this.currentLocation.lat,
        this.currentLocation.lon
      );
      
      this.currentWeather = {
        location: this.currentLocation,
        weather: {
          code: this.mapWeatherCode(weatherData.weather[0].id),
          description: weatherData.weather[0].description,
          humidity: weatherData.main.humidity,
          windSpeedMps: weatherData.wind?.speed || 0,
          windDirection: weatherData.wind?.deg || 0,
          visibilityKm: (weatherData.visibility || 10000) / 1000,
          pressure: weatherData.main.pressure,
          uvIndex: 0 // Current Weather API 不提供UV指数
        },
        env: {
          temperature: Math.round(weatherData.main.temp),
          feelsLike: Math.round(weatherData.main.feels_like),
          isNight: this.isNightTime(weatherData.dt, weatherData.sys.sunrise, weatherData.sys.sunset)
        },
        timestamp: Date.now()
      };

      await chrome.storage.local.set({ 
        weather: this.currentWeather,
        lastUpdate: this.currentWeather.timestamp
      });

      console.log('Weather data updated successfully using Current Weather API');
      return this.currentWeather;
      
    } catch (error) {
      console.error('Failed to update weather data:', error);
      throw error;
    }
  }

  async fetchCurrentWeatherData(lat, lon) {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const url = new URL(this.WEATHER_API_URL);
    url.searchParams.set('lat', lat.toFixed(4));
    url.searchParams.set('lon', lon.toFixed(4));
    url.searchParams.set('appid', this.apiKey);
    url.searchParams.set('units', 'metric');
    url.searchParams.set('lang', 'zh_cn');

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Current Weather API error: ${error.message || 'Unknown error'}`);
    }

    return await response.json();
  }

  mapWeatherCode(openWeatherCode) {
    if (openWeatherCode >= 200 && openWeatherCode < 300) return 'thunderstorm';
    if (openWeatherCode >= 300 && openWeatherCode < 600) return 'rain';
    if (openWeatherCode >= 600 && openWeatherCode < 700) return 'snow';
    if (openWeatherCode >= 700 && openWeatherCode < 800) return 'fog';
    if (openWeatherCode === 800) return 'clear';
    if (openWeatherCode > 800) return 'cloudy';
    return 'clear';
  }

  isNightTime(currentTime, sunrise, sunset) {
    // currentTime, sunrise, sunset 都是UNIX时间戳
    return currentTime < sunrise || currentTime > sunset;
  }

  async setLocationByName(cityName) {
    if (!cityName) {
      throw new Error('City name is required');
    }

    const cities = await this.geocodeLocation(cityName);
    if (cities.length === 0) {
      throw new Error('City not found');
    }

    const city = cities[0];
    return await this.setLocationByCoordinates(city.lat, city.lon, city.name);
  }

  async setLocationByCoordinates(lat, lon, name) {
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      throw new Error('Invalid coordinates');
    }

    this.currentLocation = {
      lat: lat,
      lon: lon,
      name: name || '未知位置',
      country: ''
    };

    await chrome.storage.local.set({ location: this.currentLocation });
    
    if (this.apiKey) {
      await this.updateWeatherData();
    }

    console.log('Location updated:', this.currentLocation);
    return this.currentLocation;
  }

  async geocodeLocation(cityName) {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const url = new URL(`${this.GEO_API_URL}/direct`);
    url.searchParams.set('q', cityName);
    url.searchParams.set('limit', '5');
    url.searchParams.set('appid', this.apiKey);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const results = await response.json();
    
    return results.map(result => ({
      name: result.name,
      lat: result.lat,
      lon: result.lon,
      country: result.country,
      state: result.state || ''
    }));
  }

  async searchCities(query) {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      return await this.geocodeLocation(query);
    } catch (error) {
      console.error('Failed to search cities:', error);
      return [];
    }
  }

  setupPeriodicUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      if (this.apiKey && this.currentLocation) {
        try {
          await this.updateWeatherData();
        } catch (error) {
          console.error('Periodic update failed:', error);
        }
      }
    }, 30 * 60 * 1000); // 30分钟

    console.log('Periodic weather updates enabled (30 minutes interval)');
  }
}

// 创建服务实例
const weatherService = new WeatherBackgroundService();

// 扩展安装处理
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('AeScape extension installed');
  } else if (details.reason === 'update') {
    console.log('AeScape extension updated');
  }
});

// 导出用于调试
self.weatherService = weatherService;