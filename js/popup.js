/**
 * 天景 AeScape - 弹窗脚本
 * 简洁的扩展弹窗控制
 */

class AeScapePopup {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadWeatherData();
    this.setupEventListeners();
  }

  async loadWeatherData() {
    try {
      // 获取天气数据
      const weatherResponse = await chrome.runtime.sendMessage({
        type: 'weather.getCurrent'
      });

      if (weatherResponse?.success && weatherResponse?.data) {
        this.updateWeatherDisplay(weatherResponse.data);
      }

      // 获取位置数据
      const locationResponse = await chrome.runtime.sendMessage({
        type: 'location.getCurrent'
      });

      if (locationResponse?.success && locationResponse?.data) {
        this.updateLocationDisplay(locationResponse.data);
      }

    } catch (error) {
      console.error('Failed to load data:', error);
      this.showError();
    }
  }

  updateWeatherDisplay(weather) {
    // 使用 SVG 图标

    const weatherDescriptions = {
      clear: weather.env?.isNight ? '夜晚晴朗' : '晴朗',
      cloudy: '多云',
      rain: '下雨',
      snow: '下雪',
      fog: '有雾',
      thunderstorm: '雷暴'
    };

    // 更新背景主题
    this.updateBackgroundTheme(weather.weather?.code, weather.env?.isNight);

    const elements = {
      icon: document.getElementById('weather-icon'),
      temp: document.getElementById('temperature'),
      desc: document.getElementById('weather-description'),
      feelsLike: document.getElementById('feels-like'),
      humidity: document.getElementById('humidity'),
      windSpeed: document.getElementById('wind-speed'),
      visibility: document.getElementById('visibility')
    };

    // SVG 图标已经在 HTML 中定义，无需更新
    
    if (elements.temp) {
      elements.temp.textContent = `${weather.env?.temperature || '--'}°`;
    }
    
    if (elements.desc) {
      elements.desc.textContent = weatherDescriptions[weather.weather?.code] || 
        weather.weather?.description || '未知';
    }
    
    if (elements.feelsLike) {
      elements.feelsLike.textContent = `${weather.env?.feelsLike || '--'}°`;
    }
    
    if (elements.humidity) {
      elements.humidity.textContent = `${weather.weather?.humidity || '--'}%`;
    }
    
    if (elements.windSpeed) {
      const windKmh = Math.round((weather.weather?.windSpeedMps || 0) * 3.6);
      elements.windSpeed.textContent = `${windKmh} km/h`;
    }
    
    if (elements.visibility) {
      elements.visibility.textContent = `${weather.weather?.visibilityKm || '--'} km`;
    }
  }

  updateLocationDisplay(location) {
    const locationElement = document.getElementById('location-text');
    if (locationElement) {
      locationElement.textContent = location.name || '未知位置';
    }
  }

  showError() {
    const elements = {
      temp: document.getElementById('temperature'),
      desc: document.getElementById('weather-description'),
      location: document.getElementById('location-text')
    };

    if (elements.temp) elements.temp.textContent = '--°';
    if (elements.desc) elements.desc.textContent = '数据获取失败';
    if (elements.location) elements.location.textContent = '位置获取失败';
  }

  setupEventListeners() {
    // 刷新按钮
    const refreshBtn = document.getElementById('refresh-btn');
    refreshBtn?.addEventListener('click', () => this.refreshWeather());

    // 打开设置
    const openSettingsBtn = document.getElementById('open-settings');
    openSettingsBtn?.addEventListener('click', () => {
      chrome.tabs.create({ url: 'chrome://newtab/' });
      window.close();
    });

    // 悬浮球开关
    const floatingBallToggle = document.getElementById('floating-ball-toggle');
    floatingBallToggle?.addEventListener('change', (e) => this.toggleFloatingBall(e.target.checked));
    
    // 初始化悬浮球状态
    this.initFloatingBallState();
  }

  async initFloatingBallState() {
    try {
      const result = await chrome.storage.local.get(['floatingBallEnabled']);
      const toggle = document.getElementById('floating-ball-toggle');
      if (toggle) {
        toggle.checked = result.floatingBallEnabled !== false; // 默认开启
      }
    } catch (error) {
      console.error('Failed to load floating ball state:', error);
    }
  }

  async toggleFloatingBall(enabled) {
    try {
      await chrome.storage.local.set({ floatingBallEnabled: enabled });
      
      // 通知所有标签页更新悬浮球状态
      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'floatingBall.toggle',
          enabled: enabled
        }).catch(() => {
          // 忽略无法发送消息的标签页
        });
      });
    } catch (error) {
      console.error('Failed to toggle floating ball:', error);
    }
  }

  updateBackgroundTheme(weatherCode, isNight) {
    const body = document.body;
    
    // 移除所有天气主题类
    body.classList.remove('weather-clear', 'weather-cloudy', 'weather-rain', 
                         'weather-snow', 'weather-night');
    
    // 根据天气和时间应用主题
    if (isNight) {
      body.classList.add('weather-night');
    } else {
      switch (weatherCode) {
        case 'rain':
        case 'thunderstorm':
          body.classList.add('weather-rain');
          break;
        case 'snow':
          body.classList.add('weather-snow');
          break;
        case 'cloudy':
          body.classList.add('weather-cloudy');
          break;
        default:
          body.classList.add('weather-clear');
      }
    }
  }

  async refreshWeather() {
    const btn = document.getElementById('refresh-btn');
    const originalText = btn?.textContent;
    
    if (btn) {
      btn.textContent = '刷新中...';
      btn.classList.add('loading');
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'weather.forceUpdate'
      });

      if (response?.success && response?.data) {
        this.updateWeatherDisplay(response.data);
      } else {
        this.showError();
      }
    } catch (error) {
      console.error('Failed to refresh weather:', error);
      this.showError();
    } finally {
      if (btn) {
        btn.textContent = originalText;
        btn.classList.remove('loading');
      }
    }
  }
}

// 初始化弹窗
document.addEventListener('DOMContentLoaded', () => {
  new AeScapePopup();
});
