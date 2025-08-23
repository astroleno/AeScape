// 简化版 Popup Script for 天景 AeScape
class Popup {
  constructor() {
    this.init();
  }
  
  async init() {
    this.setupEventListeners();
    await this.loadStatus();
  }
  
  setupEventListeners() {
    const refreshBtn = document.getElementById('refresh-btn');
    const setLocationBtn = document.getElementById('set-location-btn');
    const locationInput = document.getElementById('location-input');
    
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refreshWeather();
      });
    }
    
    if (setLocationBtn) {
      setLocationBtn.addEventListener('click', () => {
        this.setLocation();
      });
    }
    
    if (locationInput) {
      locationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.setLocation();
        }
      });
    }
  }
  
  async loadStatus() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'weather.getCurrent'
      });
      
      if (response.success && response.data) {
        const weather = response.data;
        this.updateWeatherDisplay(weather);
      }
      
      const locationResponse = await chrome.runtime.sendMessage({
        type: 'location.getCurrent'
      });
      
      if (locationResponse.success && locationResponse.data) {
        const location = locationResponse.data;
        const locationText = document.getElementById('location-text');
        const locationInput = document.getElementById('location-input');
        
        if (locationText) {
          locationText.textContent = location.name || '未知';
        }
        if (locationInput) {
          locationInput.value = location.name || '北京';
        }
      }
    } catch (error) {
      console.error('加载状态失败:', error);
      this.showError('无法连接到扩展服务');
    }
  }
  
  updateWeatherDisplay(weather) {
    if (!weather) return;
    
    const temp = Math.round(weather.env.temperature);
    const weatherCode = weather.weather.code;
    
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
    
    const statusText = document.getElementById('status-text');
    const weatherText = document.getElementById('weather-text');
    const tempText = document.getElementById('temp-text');
    const updateText = document.getElementById('update-text');
    
    if (statusText) statusText.textContent = '正常';
    if (weatherText) {
      weatherText.textContent = 
        `${weatherIcons[weatherCode] || '🌤️'} ${weatherDescriptions[weatherCode] || '未知'}`;
    }
    if (tempText) tempText.textContent = `${temp}°`;
    
    if (updateText && weather.timestamp) {
      const updateTime = new Date(weather.timestamp);
      updateText.textContent = 
        updateTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
  }
  
  async refreshWeather() {
    const btn = document.getElementById('refresh-btn');
    if (!btn) return;
    
    const originalText = btn.textContent;
    
    btn.textContent = '刷新中...';
    btn.classList.add('loading');
    
    try {
      await chrome.runtime.sendMessage({
        type: 'weather.forceUpdate'
      });
      
      setTimeout(() => {
        this.loadStatus();
        btn.textContent = originalText;
        btn.classList.remove('loading');
      }, 1000);
    } catch (error) {
      console.error('刷新失败:', error);
      btn.textContent = '失败';
      btn.classList.remove('loading');
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    }
  }
  
  async setLocation() {
    const input = document.getElementById('location-input');
    const messageDiv = document.getElementById('location-message');
    
    if (!input || !messageDiv) return;
    
    const locationName = input.value.trim();
    
    if (!locationName) {
      this.showLocationError('请输入城市名称');
      return;
    }
    
    const btn = document.getElementById('set-location-btn');
    if (!btn) return;
    
    const originalText = btn.textContent;
    
    btn.textContent = '设置中...';
    btn.classList.add('loading');
    messageDiv.innerHTML = '';
    
    try {
      // 先尝试地理编码
      const geocodeResult = await this.geocodeLocation(locationName);
      
      if (geocodeResult.length > 0) {
        const location = {
          lat: geocodeResult[0].latitude,
          lon: geocodeResult[0].longitude,
          name: geocodeResult[0].name
        };
        
        await chrome.runtime.sendMessage({
          type: 'location.set',
          location
        });
        
        this.showLocationSuccess(`位置已设置为: ${location.name}`);
        
        const locationText = document.getElementById('location-text');
        if (locationText) {
          locationText.textContent = location.name;
        }
        
        // 重新加载天气数据
        setTimeout(() => {
          this.loadStatus();
        }, 1000);
      } else {
        this.showLocationError('未找到该城市，请检查输入');
      }
    } catch (error) {
      console.error('设置位置失败:', error);
      this.showLocationError('设置位置失败，请重试');
    }
    
    btn.textContent = originalText;
    btn.classList.remove('loading');
  }
  
  async geocodeLocation(name) {
    try {
      // 注意：这里需要用户提供自己的 OpenWeatherMap API Key
      const apiKey = 'YOUR_API_KEY_HERE'; // 用户需要替换为实际的API Key
      
      const params = new URLSearchParams({
        q: name,
        appid: apiKey,
        limit: '1'
      });

      const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?${params}`);
      const data = await response.json();
      
      if (!response.ok || !Array.isArray(data)) {
        return [];
      }

      return data.map(result => ({
        name: result.name,
        lat: result.lat,
        lon: result.lon,
        country: result.country,
        state: result.state
      }));
    } catch (error) {
      console.error('Geocoding Error:', error);
      return [];
    }
  }
  
    
  showLocationError(message) {
    const messageDiv = document.getElementById('location-message');
    if (messageDiv) {
      messageDiv.innerHTML = `<div class="error">${message}</div>`;
      
      setTimeout(() => {
        messageDiv.innerHTML = '';
      }, 3000);
    }
  }
  
  showLocationSuccess(message) {
    const messageDiv = document.getElementById('location-message');
    if (messageDiv) {
      messageDiv.innerHTML = `<div class="success">${message}</div>`;
      
      setTimeout(() => {
        messageDiv.innerHTML = '';
      }, 3000);
    }
  }
  
  showError(message) {
    const messageDiv = document.getElementById('location-message');
    if (messageDiv) {
      messageDiv.innerHTML = `<div class="error">${message}</div>`;
    }
  }
}

// 初始化弹窗
document.addEventListener('DOMContentLoaded', () => {
  new Popup();
});