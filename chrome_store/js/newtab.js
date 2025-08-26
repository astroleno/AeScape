/**
 * 天景 AeScape - 新标签页主脚本
 * 专业简洁的天气应用
 */

class AeScapeNewTab {
  constructor() {
    this.weatherData = null;
    this.currentLocation = null;
    this.isApiConfigured = false;
    this.refreshInterval = null;
    
    this.init();
  }

  async init() {
    console.log('AeScape NewTab initializing...');
    
    try {
      this.initializeTime();
      this.setupEventListeners();
      this.setupQuickLinks();
      
      await this.checkApiStatus();
      await this.loadWeatherData();
      
      this.startTimers();
      
      console.log('AeScape NewTab initialized successfully');
    } catch (error) {
      console.error('Initialization failed:', error);
      this.showNotification('error', '初始化失败，请检查扩展设置');
    }
  }

  // 使用统一图标库
  getSVGIcon(weatherCode, isNight = false) {
    if (window.AeScapeIcons) {
      return window.AeScapeIcons.getWeatherIcon(weatherCode, isNight, 64);
    }
    // 备用方案：使用默认太阳图标
    return `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>`;
  }

  // 时间管理
  initializeTime() {
    this.updateTime();
    setInterval(() => this.updateTime(), 1000);
  }

  updateTime() {
    const now = new Date();
    const timeElement = document.getElementById('current-time');
    const dateElement = document.getElementById('current-date');
    
    if (timeElement) {
      timeElement.textContent = now.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    
    if (dateElement) {
      dateElement.textContent = now.toLocaleDateString('zh-CN', { 
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    }
  }

  // 事件监听器设置
  setupEventListeners() {
    // 搜索功能
    const searchInput = document.getElementById('search-input');
    searchInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSearch(searchInput.value.trim());
      }
    });

    // 按钮事件 - 使用箭头函数确保this绑定
    document.getElementById('settings-btn')?.addEventListener('click', () => this.toggleSettings());
    document.getElementById('refresh-btn')?.addEventListener('click', () => this.refreshWeather());
    document.getElementById('location-btn')?.addEventListener('click', () => this.toggleLocationModal());
    
    // 设置面板
    document.getElementById('close-settings')?.addEventListener('click', () => this.toggleSettings());
    document.getElementById('save-api-key')?.addEventListener('click', () => this.saveApiKey());
    document.getElementById('test-api-key')?.addEventListener('click', () => this.testApiKey());
    document.getElementById('set-location')?.addEventListener('click', () => this.setLocationByCity());
    document.getElementById('auto-location')?.addEventListener('click', () => this.getAutoLocation());
    
    // 位置弹窗
    document.getElementById('close-location')?.addEventListener('click', () => this.toggleLocationModal());
    document.getElementById('use-current-location')?.addEventListener('click', () => this.useCurrentLocation());
    
    // 输入框
    document.getElementById('api-key-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.saveApiKey();
    });
    
    document.getElementById('city-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.setLocationByCity();
    });
    
    document.getElementById('city-search')?.addEventListener('input', (e) => {
      this.searchCities(e.target.value);
    });

    // 点击外部关闭弹窗
    document.addEventListener('click', (e) => {
      const settingsPanel = document.getElementById('settings-panel');
      const locationModal = document.getElementById('location-modal');
      
      if (settingsPanel?.classList.contains('active')) {
        if (!settingsPanel.querySelector('.settings-content').contains(e.target) &&
            !document.getElementById('settings-btn').contains(e.target)) {
          this.toggleSettings();
        }
      }
      
      if (locationModal?.classList.contains('active')) {
        if (!locationModal.querySelector('.modal-content').contains(e.target) &&
            !document.getElementById('location-btn').contains(e.target)) {
          this.toggleLocationModal();
        }
      }
    });
  }

  // 快捷链接
  setupQuickLinks() {
    const quickLinks = document.getElementById('quick-links');
    const defaultLinks = [
      { name: 'GitHub', url: 'https://github.com' },
      { name: 'Google', url: 'https://google.com' },
      { name: '微博', url: 'https://weibo.com' },
      { name: '知乎', url: 'https://zhihu.com' },
      { name: 'Bilibili', url: 'https://bilibili.com' }
    ];

    quickLinks.innerHTML = defaultLinks.map(link => 
      `<a href="${link.url}" class="quick-link" target="_blank">${link.name}</a>`
    ).join('');
  }

  // 搜索功能
  handleSearch(query) {
    if (!query) return;

    if (this.isValidUrl(query)) {
      window.location.href = query.startsWith('http') ? query : `https://${query}`;
    } else {
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
  }

  isValidUrl(string) {
    try {
      new URL(string.startsWith('http') ? string : `https://${string}`);
      return string.includes('.');
    } catch (_) {
      return false;
    }
  }

  // API状态检查
  async checkApiStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'api.checkStatus' });
      this.isApiConfigured = response?.success && response?.hasApiKey;
      
      if (!this.isApiConfigured) {
        this.showNotification('warning', '请在设置中配置API Key以获取天气数据');
      }
    } catch (error) {
      console.error('Failed to check API status:', error);
      this.isApiConfigured = false;
    }
  }

  // 天气数据加载
  async loadWeatherData() {
    try {
      // 检查扩展是否可用
      if (!chrome.runtime?.id) {
        console.log('Extension context not available, skipping weather load');
        return;
      }

      // 添加超时处理，避免Extension context invalidated错误
      const response = await Promise.race([
        chrome.runtime.sendMessage({ type: 'weather.getCurrent' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Weather data timeout')), 3000))
      ]);
      
      if (response?.success && response?.data) {
        this.weatherData = response.data;
        this.currentLocation = response.data.location;
        this.updateWeatherUI(response.data);
        await this.updateWeatherTheme(response.data);
      }

      const locationResponse = await Promise.race([
        chrome.runtime.sendMessage({ type: 'location.getCurrent' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Location data timeout')), 3000))
      ]);
      
      if (locationResponse?.success && locationResponse?.data) {
        this.currentLocation = locationResponse.data;
        this.updateLocationDisplay(locationResponse.data);
      }
    } catch (error) {
      console.error('Failed to load weather data:', error);
      // 静默处理错误，不显示错误状态
    }
  }

  updateWeatherUI(weather) {
    const elements = {
      location: document.getElementById('location-name'),
      temperature: document.getElementById('current-temp'),
      description: document.getElementById('weather-desc'),
      icon: document.getElementById('weather-icon'),
      feelsLike: document.getElementById('feels-like'),
      humidity: document.getElementById('humidity'),
      windSpeed: document.getElementById('wind-speed'),
      visibility: document.getElementById('visibility'),
      pressure: document.getElementById('pressure'),
      uvIndex: document.getElementById('uv-index')
    };

    const weatherDescriptions = {
      clear: weather.env?.isNight ? '夜晚晴朗' : '晴朗',
      cloudy: '多云',
      rain: '下雨',
      snow: '下雪',
      fog: '有雾',
      thunderstorm: '雷暴'
    };

    // 更新UI元素
    if (elements.location) {
      elements.location.textContent = this.currentLocation?.name || '未知位置';
    }

    if (elements.temperature) {
      elements.temperature.textContent = `${Math.round(weather.env?.temperature || 0)}°`;
    }

    if (elements.description) {
      elements.description.textContent = weatherDescriptions[weather.weather?.code] || 
        weather.weather?.description || '未知天气';
    }

    if (elements.icon) {
      const weatherCode = weather.weather?.code || 'clear';
      const isNight = weather.env?.isNight || false;
      elements.icon.innerHTML = this.getSVGIcon(weatherCode, isNight);
    }

    if (elements.feelsLike) {
      elements.feelsLike.textContent = `${Math.round(weather.env?.feelsLike || weather.env?.temperature || 0)}°`;
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

    if (elements.pressure) {
      elements.pressure.textContent = `${weather.weather?.pressure || '--'} hPa`;
    }

    if (elements.uvIndex) {
      elements.uvIndex.textContent = weather.weather?.uvIndex || '--';
    }
  }

  updateLocationDisplay(location) {
    const locationElement = document.getElementById('location-name');
    if (locationElement) {
      locationElement.textContent = location.name || '未知位置';
    }
  }

  async updateWeatherTheme(weather) {
    // 统一从背景服务获取主题数据
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
    if (!themeData?.newtab) return;
    
    const theme = themeData.newtab;
    const root = document.documentElement;
    
    // 应用CSS自定义属性
    root.style.setProperty('--theme-primary', theme.primary || theme.gradient);
    root.style.setProperty('--theme-secondary', theme.secondary || theme.gradient);
    root.style.setProperty('--theme-accent', theme.accent || theme.gradient);
    root.style.setProperty('--theme-gradient', theme.gradient);
    root.style.setProperty('--theme-text', theme.text);
  }

  showErrorState() {
    const elements = {
      location: document.getElementById('location-name'),
      temperature: document.getElementById('current-temp'),
      description: document.getElementById('weather-desc'),
      icon: document.getElementById('weather-icon')
    };

    if (elements.location) elements.location.textContent = '位置获取失败';
    if (elements.temperature) elements.temperature.textContent = '--°';
    if (elements.description) elements.description.textContent = '天气数据获取失败';
    if (elements.icon) elements.icon.innerHTML = this.getSVGIcon('cloudy', false);
  }

  // 使用统一图标库 - 通知系统
  getNotificationSVG(type) {
    if (window.AeScapeIcons) {
      return window.AeScapeIcons.getNotificationIcon(type, 16);
    }
    // 备用方案
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>`;
  }

  // 通知系统
  showNotification(type, message) {
    const notification = document.getElementById('notification');
    const icon = notification?.querySelector('.notification-icon');
    const text = notification?.querySelector('.notification-text');

    if (!notification || !icon || !text) return;
    
    icon.innerHTML = this.getNotificationSVG(type);
    text.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => notification.classList.remove('show'), 3000);
  }

  // 设置面板
  toggleSettings() {
    document.getElementById('settings-panel')?.classList.toggle('active');
  }

  toggleLocationModal() {
    document.getElementById('location-modal')?.classList.toggle('active');
  }

  // 刷新天气
  async refreshWeather() {
    const refreshBtn = document.getElementById('refresh-btn');
    
    if (refreshBtn) {
      refreshBtn.style.opacity = '0.6';
      refreshBtn.style.pointerEvents = 'none';
    }

    try {
      if (!this.isApiConfigured) {
        this.showNotification('warning', '请先配置API Key');
        return;
      }

      const response = await chrome.runtime.sendMessage({ type: 'weather.forceUpdate' });

      if (response?.success && response?.data) {
        this.weatherData = response.data;
        this.updateWeatherUI(response.data);
        await this.updateWeatherTheme(response.data);
        this.showNotification('success', '天气数据已更新');
      } else {
        this.showNotification('error', '刷新失败，请重试');
      }
    } catch (error) {
      console.error('Failed to refresh weather:', error);
      this.showNotification('error', '刷新失败，请检查网络连接');
    } finally {
      if (refreshBtn) {
        refreshBtn.style.opacity = '1';
        refreshBtn.style.pointerEvents = 'auto';
      }
    }
  }

  // API Key 管理
  async saveApiKey() {
    const input = document.getElementById('api-key-input');
    const apiKey = input?.value.trim();

    if (!apiKey) {
      this.showNotification('error', '请输入有效的API Key');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'api.setKey',
        apiKey: apiKey
      });

      if (response?.success) {
        this.isApiConfigured = true;
        input.value = '';
        this.showNotification('success', 'API Key保存成功');
        
        setTimeout(() => {
          this.loadWeatherData();
        }, 1000);
      } else {
        this.showNotification('error', response?.error || 'API Key验证失败');
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
      this.showNotification('error', '保存失败，请重试');
    }
  }

  async testApiKey() {
    const input = document.getElementById('api-key-input');
    const apiKey = input?.value.trim();

    if (!apiKey) {
      this.showNotification('error', '请先输入API Key');
      return;
    }

    const testBtn = document.getElementById('test-api-key');
    if (testBtn) {
      testBtn.textContent = '测试中...';
      testBtn.disabled = true;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'api.testKey',
        apiKey: apiKey
      });

      if (response?.success) {
        this.showNotification('success', `${response.message} 测试位置：${response.testData.location}，温度：${response.testData.temperature}°C`);
      } else {
        this.showNotification('error', response?.error || 'API Key测试失败');
      }
    } catch (error) {
      console.error('Failed to test API key:', error);
      this.showNotification('error', '测试失败，请检查网络连接');
    } finally {
      if (testBtn) {
        testBtn.textContent = '测试API Key';
        testBtn.disabled = false;
      }
    }
  }

  // 位置管理相关方法（简化版）
  async setLocationByCity() {
    const input = document.getElementById('city-input');
    const cityName = input?.value.trim();

    if (!cityName) {
      this.showNotification('error', '请输入城市名称');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'location.setByName',
        cityName: cityName
      });

      if (response?.success) {
        this.currentLocation = response.location;
        input.value = '';
        this.showNotification('success', `位置已设置为 ${cityName}`);
        this.toggleSettings();
        
        setTimeout(() => {
          this.loadWeatherData();
        }, 1000);
      } else {
        this.showNotification('error', response?.error || '找不到该城市');
      }
    } catch (error) {
      console.error('Failed to set location:', error);
      this.showNotification('error', '设置位置失败');
    }
  }

  async getAutoLocation() {
    try {
      this.showNotification('info', '正在获取位置...');
      
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }
        
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, // 降低精度要求
          timeout: 15000, // 增加超时时间
          maximumAge: 600000 // 10分钟缓存
        });
      });

      const response = await chrome.runtime.sendMessage({
        type: 'location.setCoordinates',
        lat: position.coords.latitude,
        lon: position.coords.longitude
      });

      if (response?.success) {
        this.currentLocation = response.location;
        this.showNotification('success', '位置已自动获取');
        this.toggleSettings();
        
        setTimeout(() => {
          this.loadWeatherData();
        }, 1000);
      } else {
        this.showNotification('error', '位置设置失败');
      }
    } catch (error) {
      console.error('Failed to get auto location:', error);
      
      let errorMessage = '自动获取位置失败';
      if (error.code === 1) {
        errorMessage = '位置权限被拒绝，请在浏览器设置中允许位置访问';
      } else if (error.code === 2) {
        errorMessage = '无法获取位置信息，请检查网络连接';
      } else if (error.code === 3) {
        errorMessage = '获取位置超时，请重试';
      } else if (error.message === 'Geolocation not supported') {
        errorMessage = '浏览器不支持地理位置功能';
      }
      
      this.showNotification('error', errorMessage);
    }
  }

  async useCurrentLocation() {
    this.toggleLocationModal();
    await this.getAutoLocation();
  }

  // 城市搜索相关方法（简化版）
  async searchCities(query) {
    if (!query || query.length < 2) {
      this.clearCityResults();
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'location.searchCities',
        query: query
      });

      if (response?.success && response?.cities) {
        this.displayCityResults(response.cities);
      } else {
        this.clearCityResults();
      }
    } catch (error) {
      console.error('Failed to search cities:', error);
      this.clearCityResults();
    }
  }

  displayCityResults(cities) {
    const resultsContainer = document.getElementById('city-results');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = cities.map(city => `
      <div class="city-result-item" data-lat="${city.lat}" data-lon="${city.lon}" data-name="${city.name}">
        <div class="city-name">${city.name}</div>
        <div class="city-country">${city.country} ${city.state || ''}</div>
      </div>
    `).join('');

    resultsContainer.querySelectorAll('.city-result-item').forEach(item => {
      item.addEventListener('click', () => {
        this.selectCity({
          name: item.dataset.name,
          lat: parseFloat(item.dataset.lat),
          lon: parseFloat(item.dataset.lon)
        });
      });
    });
  }

  clearCityResults() {
    const resultsContainer = document.getElementById('city-results');
    if (resultsContainer) {
      resultsContainer.innerHTML = '';
    }
  }

  async selectCity(city) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'location.setCoordinates',
        lat: city.lat,
        lon: city.lon,
        name: city.name
      });

      if (response?.success) {
        this.currentLocation = city;
        this.showNotification('success', `位置已设置为 ${city.name}`);
        this.toggleLocationModal();
        
        const citySearch = document.getElementById('city-search');
        if (citySearch) citySearch.value = '';
        this.clearCityResults();
        
        setTimeout(() => {
          this.loadWeatherData();
        }, 1000);
      } else {
        this.showNotification('error', '设置位置失败');
      }
    } catch (error) {
      console.error('Failed to select city:', error);
      this.showNotification('error', '设置位置失败');
    }
  }

  // 定时器
  startTimers() {
    this.refreshInterval = setInterval(() => {
      if (this.isApiConfigured) {
        this.loadWeatherData();
      }
    }, 30 * 60 * 1000);
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  window.aeScape = new AeScapeNewTab();
});