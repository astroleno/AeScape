/**
 * 天景 AeScape - 弹窗脚本
 * 简洁的扩展弹窗控制
 */

class AeScapePopup {
  constructor() {
    this.init();
  }

  async init() {
    // 首先应用默认主题
    this.applyDefaultTheme();
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
      
      // 更新主题（需要天气和位置数据）
      if (weatherResponse?.success && weatherResponse?.data) {
        const location = locationResponse?.success ? locationResponse.data : null;
        await this.updateTheme(weatherResponse.data, location);
      }

    } catch (error) {
      console.error('Failed to load data:', error);
      this.showError();
      // 即使加载失败也应用默认主题
      this.applyDefaultTheme();
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
    const originalHTML = btn?.innerHTML;
    
    if (btn) {
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
          <polyline points="23 4,23 10,17 10"></polyline>
          <polyline points="1 20,1 14,7 14"></polyline>
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10"></path>
          <path d="M3.51 15A9 9 0 0 0 18.36 18.36L23 14"></path>
        </svg>
      `;
      btn.classList.add('loading');
      btn.title = '刷新中...';
      
      // 添加旋转动画
      if (!document.querySelector('style[data-spinner]')) {
        const style = document.createElement('style');
        style.setAttribute('data-spinner', 'true');
        style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
      }
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
        btn.innerHTML = originalHTML;
        btn.classList.remove('loading');
        btn.title = '刷新天气';
      }
    }
  }

  // 更新主题
  async updateTheme(weather, location = null) {
    if (window.unifiedTheme) {
      const weatherCode = weather.weather?.code || 'clear';
      const hour = new Date().getHours();
      let isNight = weather.env?.isNight || false;
      
      // 获取日出日落时间
      let sunTimes = null;
      if (location?.lat && location?.lng) {
        sunTimes = await window.unifiedTheme.getSunTimes(location.lat, location.lng);
        
        // 使用智能判断
        if (sunTimes) {
          isNight = window.unifiedTheme.isNightTime(hour, sunTimes);
        }
      }
      
      window.unifiedTheme.applyToPopup(weatherCode, hour, isNight, sunTimes);
    }
  }

  applyDefaultTheme() {
    if (window.unifiedTheme) {
      const hour = new Date().getHours();
      const isNight = hour < 6 || hour > 19;
      // 使用晴天主题作为默认
      window.unifiedTheme.applyToPopup('clear', hour, isNight);
    }
  }
}

// 初始化弹窗
document.addEventListener('DOMContentLoaded', () => {
  new AeScapePopup();
});
