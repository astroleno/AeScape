// 简化的天气测试脚本
class WeatherTest {
  constructor() {
    this.currentLocation = { lat: 31.2304, lon: 121.4737, name: '上海' };
    this.currentWeather = null;
    this.init();
  }
  
  async init() {
    console.log('WeatherTest init starting...');
    try {
      await this.loadWeatherData();
    } catch (error) {
      console.error('WeatherTest init failed:', error);
      this.showError('初始化失败: ' + error.message);
    }
  }
  
  async loadWeatherData() {
    console.log('Loading weather data...');
    
    try {
      // 尝试从后台获取天气数据
      let useBackground = true;
      
      try {
        console.log('Trying to get weather from background...');
        const response = await chrome.runtime.sendMessage({
          type: 'weather.getCurrent'
        });
        
        console.log('Background response:', response);
        
        if (response && response.success && response.data) {
          this.currentWeather = response.data;
          console.log('Using background weather data');
          this.updateUI();
          useBackground = false;
        } else {
          console.log('Background returned no data, fetching directly');
          useBackground = true;
        }
      } catch (backgroundError) {
        console.log('Background service unavailable:', backgroundError);
        useBackground = false;
      }
      
      // 如果后台没有数据或不可用，直接获取
      if (!useBackground) {
        console.log('Fetching weather data directly...');
        await this.fetchWeatherData();
      }
      
    } catch (error) {
      console.error('Weather data loading failed:', error);
      this.showError('天气数据加载失败: ' + error.message);
    }
  }
  
  async fetchWeatherData() {
    console.log('Direct weather fetch...');
    
    try {
      const params = new URLSearchParams({
        latitude: this.currentLocation.lat.toFixed(4),
        longitude: this.currentLocation.lon.toFixed(4),
        current_weather: 'true',
        hourly: 'temperature_2m,relativehumidity_2m,apparent_temperature,precipitation_probability,precipitation,weathercode,cloudcover,visibility,windspeed_10m,winddirection_10m,uv_index',
        daily: 'sunrise,sunset',
        timezone: 'auto'
      });

      console.log('Fetching from:', `https://api.open-meteo.com/v1/forecast?${params}`);
      
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      const data = await response.json();
      
      console.log('API response:', data);
      
      if (!response.ok) {
        throw new Error(`API Error: ${data.reason || 'Unknown error'}`);
      }

      // 转换数据格式
      const current = data.current_weather;
      const hourly = data.hourly;
      const currentHour = new Date().getHours();
      
      this.currentWeather = {
        location: {
          ...this.currentLocation,
          timezone: data.timezone || 'Asia/Shanghai'
        },
        weather: {
          code: this.mapWeatherCode(current.weathercode),
          temperature: current.temperature || 20
        },
        timestamp: Date.now()
      };
      
      console.log('Processed weather data:', this.currentWeather);
      this.updateUI();
      
    } catch (error) {
      console.error('Direct weather fetch failed:', error);
      this.showError('直接获取天气数据失败: ' + error.message);
    }
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
    console.log('Updating UI with weather:', this.currentWeather);
    
    if (!this.currentWeather) return;
    
    const temp = Math.round(this.currentWeather.weather.temperature);
    const locationName = this.currentWeather.location.name;
    const weatherCode = this.currentWeather.weather.code;
    
    const weatherDescriptions = {
      clear: '晴朗',
      cloudy: '多云',
      rain: '下雨',
      snow: '下雪',
      fog: '有雾',
      thunderstorm: '雷暴'
    };
    
    const weatherIcons = {
      clear: '☀️',
      cloudy: '☁️',
      rain: '🌧️',
      snow: '❄️',
      fog: '🌫️',
      thunderstorm: '⛈️'
    };
    
    const container = document.getElementById('weather-container');
    container.innerHTML = `
      <div class="weather-display">
        <h2>${weatherIcons[weatherCode] || '🌤️'} ${locationName}</h2>
        <div style="font-size: 48px; font-weight: bold; margin: 20px 0;">${temp}°</div>
        <div style="font-size: 18px; color: #666;">${weatherDescriptions[weatherCode] || '未知'}</div>
        <div style="margin-top: 20px; font-size: 14px; color: #999;">
          数据更新时间: ${new Date(this.currentWeather.timestamp).toLocaleString('zh-CN')}
        </div>
      </div>
    `;
  }
  
  showError(message) {
    const container = document.getElementById('weather-container');
    container.innerHTML = `<div class="error">${message}</div>`;
  }
}

// 启动测试
document.addEventListener('DOMContentLoaded', () => {
  console.log('Test page loaded, starting weather test...');
  new WeatherTest();
});