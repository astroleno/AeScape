/**
 * 天景 AeScape - 弹窗脚本
 * 简洁的扩展弹窗控制
 */

class AeScapePopup {
  constructor() {
    this.init();
  }

  async init() {
    // 首先尝试从background获取当前主题，确保popup立即有正确的外观
    await this.initializeTheme();
    await this.loadWeatherData();
    this.setupEventListeners();
  }

  // 初始化主题 - 确保popup立即显示正确颜色
  async initializeTheme() {
    try {
      const themeResponse = await chrome.runtime.sendMessage({
        type: 'theme.getCurrent'
      });
      
      if (themeResponse?.success && themeResponse?.data) {
        this.applyThemeData(themeResponse.data);
      }
    } catch (error) {
      console.warn('Failed to initialize theme:', error);
      // 设置默认主题变量，避免白色背景
      const root = document.documentElement;
      const hour = new Date().getHours();
      const isNight = hour < 6 || hour > 19;
      root.style.setProperty('--theme-gradient', isNight ? 
        'linear-gradient(135deg, rgb(31, 40, 91) 0%, rgb(46, 54, 96) 100%)' :
        'linear-gradient(135deg, rgba(66, 165, 245, 0.2) 0%, rgba(102, 187, 106, 0.05) 100%)');
      root.style.setProperty('--theme-text', isNight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(33, 33, 33, 0.9)');
    }
  }

  async loadWeatherData() {
    try {
      // 获取天气数据
      const weatherResponse = await chrome.runtime.sendMessage({
        type: 'weather.getCurrent'
      });

      if (weatherResponse?.success && weatherResponse?.data) {
        this.updateWeatherDisplay(weatherResponse.data);
      } else {
        // 如果没有天气数据，尝试强制更新
        console.log('[AeScape] No weather data, forcing update...');
        const forceUpdateResponse = await chrome.runtime.sendMessage({
          type: 'weather.forceUpdate'
        });
        
        if (forceUpdateResponse?.success && forceUpdateResponse?.data) {
          this.updateWeatherDisplay(forceUpdateResponse.data);
          weatherResponse.data = forceUpdateResponse.data; // 更新引用
        }
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

    // 主题更新由统一的updateTheme处理

    const elements = {
      icon: document.getElementById('weather-icon'),
      temp: document.getElementById('temperature'),
      desc: document.getElementById('weather-description'),
      feelsLike: document.getElementById('feels-like'),
      humidity: document.getElementById('humidity'),
      windSpeed: document.getElementById('wind-speed'),
      visibility: document.getElementById('visibility')
    };

    // 更新天气图标
    if (elements.icon && window.AeScapeIcons) {
      const weatherCode = weather.weather?.code || 'clear';
      const isNight = weather.env?.isNight || false;
      elements.icon.innerHTML = window.AeScapeIcons.getWeatherIcon(weatherCode, isNight, 32);
    }
    
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
    // 设置统一图标
    this.setupIcons();
    
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

  setupIcons() {
    // 使用统一图标库设置图标
    if (window.AeScapeIcons) {
      const refreshBtn = document.getElementById('refresh-btn');
      const settingsBtn = document.getElementById('open-settings');
      
      if (refreshBtn) {
        refreshBtn.innerHTML = window.AeScapeIcons.getUIIcon('refresh', 16);
      }
      
      if (settingsBtn) {
        settingsBtn.innerHTML = window.AeScapeIcons.getUIIcon('settings', 16);
      }
    }
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
      try {
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
          try {
            chrome.tabs.sendMessage(tab.id, {
              type: 'floatingBall.toggle',
              enabled: enabled
            }).catch(() => {});
          } catch (_) {}
        });
      } catch (tabsErr) {
        console.warn('[AeScape] 无法查询tabs，依赖storage.onChanged兜底:', tabsErr);
      }
    } catch (error) {
      console.error('Failed to toggle floating ball:', error);
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

  // 更新主题 - 统一从背景服务获取主题数据
  async updateTheme(weather, location = null) {
    try {
      const themeResponse = await chrome.runtime.sendMessage({
        type: 'theme.getCurrent'
      });
      
      if (themeResponse?.success && themeResponse?.data) {
        this.applyThemeData(themeResponse.data);
      }
    } catch (error) {
      console.warn('Failed to get theme from background:', error);
    }
  }

  // 应用从背景服务获取的主题数据
  applyThemeData(themeData) {
    if (!themeData?.popup) return;
    
    this.applyThemeStyles(themeData.popup);
  }

  // 应用主题样式到popup
  applyThemeStyles(theme) {
    const root = document.documentElement;
    
    // 简化处理，直接使用原始渐变，不进行字符串处理
    const gradient = theme.gradient || theme.primary;
    
    if (gradient) {
      root.style.setProperty('--theme-gradient', gradient);
      console.log('Applied theme gradient:', gradient);
    }
    
    if (theme.text) {
      root.style.setProperty('--theme-text', theme.text);
    }
    
    // 设置其他主题变量
    if (theme.primary) root.style.setProperty('--theme-primary', theme.primary);
    if (theme.secondary) root.style.setProperty('--theme-secondary', theme.secondary);
    if (theme.accent) root.style.setProperty('--theme-accent', theme.accent);
  }

}

// 初始化弹窗
document.addEventListener('DOMContentLoaded', () => {
  new AeScapePopup();
});
