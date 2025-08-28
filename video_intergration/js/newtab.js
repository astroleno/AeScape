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
    
    // 视频模块相关
    this.videoManager = null;
    this.cardSystem = null;
    this.triggerManager = null;
    this.videoTriggerManager = null; // 新增：视频触发管理器
    this.lastWeatherType = null;
    this.videoSettings = {
      enabled: true,
      weatherChangeTrigger: true,
      intervalMinutes: 'off'
    };
    
    // 优化模块
    this.errorHandler = null;
    this.performanceMonitor = null;
    this.configManager = null;
    this.videoResourceManager = null;
    this.smartThemeAdapter = null;
    
    this.init();
  }

  async init() {
    console.log('AeScape NewTab initializing...');
    
    try {
      // 初始化优化模块
      await this.initOptimizationModules();
      
      // 简化启动 - 直接初始化，让CSS动画自然触发
      await this.continueInit();
      
      console.log('AeScape NewTab initialized successfully');
    } catch (error) {
      console.error('AeScape初始化失败:', error);
      // 即使失败也继续基本初始化
      try {
        await this.continueInit();
      } catch (_) {}
    }
  }

  // 继续初始化流程
  async continueInit() {
    try {
      this.initializeTime();
      this.setupEventListeners();
      this.setupQuickLinks();
      
      // 初始化视频模块
      await this.initializeVideoModule();
      
      await this.checkApiStatus();
      
      // 异步加载天气数据，不阻塞初始化流程
      this.loadWeatherData().catch(err => console.warn('Weather data loading failed:', err));
      
      // 检查特殊触发条件（确保所有系统初始化完成后执行）
      setTimeout(() => this.checkSpecialTriggers(), 600);
      
      this.startTimers();
      
      console.log('AeScape NewTab initialized successfully');
    } catch (error) {
      console.error('Initialization failed:', error);
      this.showNotification('error', '初始化失败，请检查扩展设置');
    }
  }

  /**
   * 初始化优化模块
   */
  async initOptimizationModules() {
    try {
      console.log('[AeScape] 初始化优化模块...');
      
      // 初始化错误处理器
      if (typeof AeScapeErrorHandler !== 'undefined') {
        this.errorHandler = new AeScapeErrorHandler();
        console.log('[AeScape] 错误处理器已初始化');
      }
      
      // 初始化性能监控器
      if (typeof AeScapePerformanceMonitor !== 'undefined') {
        this.performanceMonitor = new AeScapePerformanceMonitor();
        console.log('[AeScape] 性能监控器已初始化');
      }
      
      // 初始化配置管理器
      if (typeof AeScapeConfigManager !== 'undefined') {
        this.configManager = new AeScapeConfigManager();
        await this.configManager.init();
        console.log('[AeScape] 配置管理器已初始化');
      }
      
      // 初始化视频资源管理器
      if (typeof VideoResourceManager !== 'undefined') {
        this.videoResourceManager = new VideoResourceManager({
          maxCacheSize: 3,
          enableIntelligentPreload: true
        });
        console.log('[AeScape] 视频资源管理器已初始化');
      }
      
      // 初始化智能主题适配器
      if (typeof SmartThemeAdapter !== 'undefined') {
        this.smartThemeAdapter = new SmartThemeAdapter({
          enableCaching: true,
          enableBatching: true,
          enableTransitions: true
        });
        console.log('[AeScape] 智能主题适配器已初始化');
      }
      
      console.log('[AeScape] 所有优化模块初始化完成');
      
    } catch (error) {
      console.error('[AeScape] 优化模块初始化失败:', error);
      // 不抛出错误，允许基础功能继续工作
    }
  }

  /**
   * 在 MV3 下，background service worker 可能尚未唤醒或刚重启，
   * 这里增加一个带退避的安全消息发送封装，提升稳定性。
   */
  async sendMessageWithRetry(message, maxAttempts = 3, baseDelayMs = 150) {
    // 扩展上下文不可用（例如直接用 file:// 打开页面或扩展被重载）
    if (!this.hasExtensionContext()) {
      throw new Error('Extension context not available');
    }

    let lastError = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // 使用 Promise 包装 sendMessage
        const response = await new Promise((resolve, reject) => {
          try {
            // 二次守护：在真正调用前再次检测
            if (!this.hasExtensionContext()) {
              reject(new Error('Extension context not available'));
              return;
            }
            chrome.runtime.sendMessage(message, (res) => {
              const err = chrome.runtime.lastError;
              if (err) {
                reject(new Error(err.message || 'chrome.runtime.lastError'));
              } else {
                resolve(res);
              }
            });
          } catch (e) {
            reject(e);
          }
        });
        return response;
      } catch (err) {
        lastError = err;
        // 消息发送失败（静默重试）
        
        // 如果扩展上下文失效，立即停止重试
        if (err.message.includes('Extension context invalidated') || 
            err.message.includes('receiving end does not exist')) {
          // 扩展上下文失效，停止消息重试（静默）
          break;
        }
        
        // 其他错误：退避等待后重试
        const delay = baseDelayMs * attempt;
        await new Promise(r => setTimeout(r, delay));
      }
    }
    throw lastError || new Error('sendMessageWithRetry failed');
  }

  // 判断是否处于扩展上下文（兼容 chrome 未定义的场景）
  hasExtensionContext() {
    try {
      return typeof chrome !== 'undefined' && 
             chrome.runtime && 
             chrome.runtime.id && 
             !chrome.runtime.lastError;
    } catch (error) {
      console.warn('[AeScape] 扩展上下文检测失败:', error.message);
      return false;
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
    document.getElementById('refresh-weather-btn')?.addEventListener('click', () => this.refreshWeather());
    
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

    // 视频设置事件监听器
    document.getElementById('video-animations')?.addEventListener('change', (e) => {
      this.videoSettings.enabled = e.target.checked;
      this.saveVideoSettings();
    });

    // 自动触发开关已移除

    document.getElementById('animation-frequency')?.addEventListener('input', (e) => {
      this.videoSettings.frequency = parseInt(e.target.value);
      document.getElementById('frequency-value').textContent = e.target.value;
      this.saveVideoSettings();
    });

    document.getElementById('weather-change-trigger')?.addEventListener('change', (e) => {
      this.videoSettings.weatherChangeTrigger = e.target.checked;
      this.saveVideoSettings();
    });

    document.getElementById('interval-trigger')?.addEventListener('change', (e) => {
      this.videoSettings.intervalMinutes = e.target.value; // 'off' | '15' | '30' ...
      this.saveVideoSettings();
      this.setupIntervalTrigger();
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
      if (!this.hasExtensionContext()) {
        this.isApiConfigured = false;
        return;
      }
      const response = await this.sendMessageWithRetry({ type: 'api.checkStatus' }, 4, 200);
      this.isApiConfigured = response?.success && response?.hasApiKey;
      
      if (!this.isApiConfigured) {
        this.showNotification('warning', '请在设置中配置API Key以获取天气数据');
      }
    } catch (error) {
      console.error('Failed to check API status:', error);
      this.isApiConfigured = false;
    }
  }

  // 天气数据加载 - 支持默认晴天天气
  async loadWeatherData() {
    try {
      let weatherDataLoaded = false;
      let locationDataLoaded = false;

      // 检查扩展是否可用
      if (!this.hasExtensionContext()) {
        console.log('[AeScape] 扩展上下文不可用，使用默认晴天天气');
        this.setDefaultWeatherData();
        this.setDefaultLocationData();
        return;
      }

      try {
        // 先 ping 一次，确保 SW 已唤醒
        try { await this.sendMessageWithRetry({ type: 'ping' }, 1, 0); } catch (_) {}

        // 设置加载超时 - 3秒内必须完成
        const weatherTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Weather data timeout')), 3000)
        );

        // 尝试加载天气数据
        const weatherPromise = this.sendMessageWithRetry({ type: 'weather.getCurrent' }, 2, 150);
        const response = await Promise.race([weatherPromise, weatherTimeout]);
        
        if (response?.success && response?.data) {
          this.weatherData = response.data;
          this.currentLocation = response.data.location;
          this.updateWeatherUI(response.data);
          await this.updateWeatherTheme(response.data);
          weatherDataLoaded = true;
          console.log('[AeScape] 天气数据加载成功');
        } else {
          // 天气数据响应无效，将使用默认数据（不显示错误）
        }
      } catch (weatherError) {
        // 天气数据加载失败，将使用默认数据（不显示错误）
      }

      try {
        // 尝试加载位置数据
        const locationTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Location data timeout')), 2000)
        );
        
        const locationPromise = this.sendMessageWithRetry({ type: 'location.getCurrent' }, 2, 100);
        const locationResponse = await Promise.race([locationPromise, locationTimeout]);
        
        if (locationResponse?.success && locationResponse?.data) {
          this.currentLocation = locationResponse.data;
          this.updateLocationDisplay(locationResponse.data);
          locationDataLoaded = true;
          console.log('[AeScape] 位置数据加载成功');
        } else {
          // 位置数据响应无效，将使用默认位置（不显示错误）
        }
      } catch (locationError) {
        // 位置数据加载失败，将使用默认位置（不显示错误）
      }

      // 如果数据加载失败，使用默认数据
      if (!weatherDataLoaded) {
        // 天气数据响应无效，使用默认晴天数据（静默）
        this.setDefaultWeatherData();
        weatherDataLoaded = true; // 标记已处理
      }

      if (!locationDataLoaded && !this.currentLocation) {
        // 位置数据无效，使用默认位置（静默）
        this.setDefaultLocationData();
        locationDataLoaded = true; // 标记已处理
      }

      // 确保有数据后再更新主题
      if (weatherDataLoaded && this.weatherData) {
        await this.updateWeatherTheme(this.weatherData);
      }

    } catch (error) {
      console.error('[AeScape] 加载天气数据时发生错误:', error);
      this.setDefaultWeatherData();
    }
  }

  // 设置默认晴天天气数据
  setDefaultWeatherData() {
    const now = new Date();
    const hour = now.getHours();
    const isNight = hour < 6 || hour > 19;
    
    // 根据时间设置不同的温度
    let temperature = 22; // 默认22度
    if (hour >= 6 && hour < 12) {
      temperature = 18 + Math.floor(Math.random() * 8); // 18-25度
    } else if (hour >= 12 && hour < 18) {
      temperature = 22 + Math.floor(Math.random() * 8); // 22-29度
    } else {
      temperature = 15 + Math.floor(Math.random() * 10); // 15-24度
    }

    this.weatherData = {
      weather: {
        code: 'clear',
        description: isNight ? '夜晚晴朗' : '晴朗',
        id: 800,
        main: 'Clear',
        humidity: 45 + Math.floor(Math.random() * 25), // 45-70%
        windSpeedMps: 0.5 + Math.random() * 2.5, // 0.5-3.0 m/s
        visibilityKm: 8 + Math.floor(Math.random() * 7), // 8-15 km
        pressure: 1010 + Math.floor(Math.random() * 20), // 1010-1030 hPa
        uvIndex: isNight ? 0 : Math.min(10, Math.max(1, Math.floor((hour - 6) / 1.2))) // UV指数基于时间
      },
      env: {
        temperature: temperature,
        feelsLike: temperature + (-2 + Math.random() * 4), // 体感温度±2度
        isNight: isNight
      }
    };

    this.updateWeatherUI(this.weatherData);
    // 异步更新主题，避免阻塞
    this.updateWeatherTheme(this.weatherData).catch(err => 
      console.warn('[AeScape] 更新默认天气主题失败:', err)
    );
    console.log('[AeScape] 默认晴天天气数据已设置:', this.weatherData);
  }

  // 设置默认位置数据
  setDefaultLocationData() {
    this.currentLocation = {
      name: '当前位置',
      country: 'CN',
      lat: 39.9042,
      lon: 116.4074
    };
    this.updateLocationDisplay(this.currentLocation);
    console.log('[AeScape] 默认位置数据已设置');
  }

  updateWeatherUI(weather) {
    // 检查视频动画
    this.checkVideoAnimation(weather);
    
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
    const cardLocationElement = document.getElementById('card-location-name');
    if (locationElement) {
      locationElement.textContent = location.name || '未知位置';
    }
    if (cardLocationElement) {
      cardLocationElement.textContent = location.name || '未知位置';
    }
  }

  async updateWeatherTheme(weather) {
    try {
      // 优先直接从 storage 读取统一主题快照（由背景集中写入）
      if (chrome?.storage?.local?.get) {
        const stored = await chrome.storage.local.get(['currentThemeData']);
        if (stored?.currentThemeData) {
          this.applyThemeData(stored.currentThemeData);
          return;
        }
      }
      // 兜底：向背景请求一次
      const themeResponse = await this.sendMessageWithRetry({ type: 'theme.getCurrent' }, 3, 150);
      if (themeResponse?.success && themeResponse?.data) {
        this.applyThemeData(themeResponse.data);
      }
    } catch (error) {
      console.warn('Failed to apply theme:', error);
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

    // 主题已就绪，开启过渡，避免首次加载闪烁
    document.body.classList.add('theme-ready');
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

      const response = await this.sendMessageWithRetry({ type: 'weather.forceUpdate' }, 4, 200);

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
      const response = await this.sendMessageWithRetry({
        type: 'api.setKey',
        apiKey: apiKey
      }, 3, 200);

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
      const response = await this.sendMessageWithRetry({
        type: 'api.testKey',
        apiKey: apiKey
      }, 3, 200);

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
      const response = await this.sendMessageWithRetry({
        type: 'location.setByName',
        cityName: cityName
      }, 3, 200);

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

      const response = await this.sendMessageWithRetry({
        type: 'location.setCoordinates',
        lat: position.coords.latitude,
        lon: position.coords.longitude
      }, 3, 200);

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
      const response = await this.sendMessageWithRetry({
        type: 'location.searchCities',
        query: query
      }, 3, 200);

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
      const response = await this.sendMessageWithRetry({
        type: 'location.setCoordinates',
        lat: city.lat,
        lon: city.lon,
        name: city.name
      }, 3, 200);

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
    this.setupIntervalTrigger();
  }

  // 按设置的间隔触发视频
  setupIntervalTrigger() {
    try {
      if (this._intervalTriggerTimer) {
        clearInterval(this._intervalTriggerTimer);
        this._intervalTriggerTimer = null;
      }
      const m = this.videoSettings?.intervalMinutes;
      if (!m || m === 'off') return;
      const minutes = parseInt(m, 10);
      const ms = Math.max(1, minutes) * 60 * 1000;
      this._intervalTriggerTimer = setInterval(() => {
        try {
          if (!this.videoSettings.enabled) return;
          // 使用当前天气类型
          const wt = this.getWeatherType(this.weatherData);
          this.playVideoAnimation(wt);
        } catch (e) { console.warn('interval trigger error', e); }
      }, ms);
    } catch (e) { console.warn('setupIntervalTrigger error', e); }
  }

  // 视频模块初始化
  async initializeVideoModule() {
    try {
      console.log('Initializing video module...');
      
      // 初始化视频管理器（先创建实例，再显式初始化容器与视频ID）
      this.videoManager = new VideoWeatherManager({
        debug: true,
        onStart: () => {
          console.log('Video animation started');
        },
        onEnd: () => {
          console.log('Video animation ended');
        }
      });
      // 重要：需要显式调用 init，并传入容器ID与视频ID（不含#）
      this.videoManager.init('video-container', 'intro-video');

      // 初始化抽卡系统
      this.cardSystem = new AnimationCardSystem();

      // 初始化天气触发管理器
      this.triggerManager = new WeatherTriggerManager();

      // 初始化视频触发管理器（用于特殊场景触发）
      if (typeof VideoTriggerManager !== 'undefined') {
        this.videoTriggerManager = new VideoTriggerManager({
          enableWelcomeVideo: true,
          enableSettingsVideo: true,
          enableRestartVideo: true,
          enableUpdateVideo: true,
          enableFirstLoadCarousel: true, // 启用首次载入轮播
          minTriggerInterval: 10 * 1000, // 减少最小间隔到10秒用于测试
          debug: true
        });
        await this.videoTriggerManager.init();
        console.log('Video trigger manager initialized successfully');
      }

      // 加载视频设置
      await this.loadVideoSettings();

      console.log('Video module initialized successfully');
    } catch (error) {
      console.error('Failed to initialize video module:', error);
    }
  }

  // 加载视频设置
  async loadVideoSettings() {
    try {
      const result = await chrome.storage.local.get(['videoSettings', 'aescape_config']);
      
      // 优先从统一配置中读取
      if (result.aescape_config?.video) {
        this.videoSettings = { ...this.videoSettings, ...result.aescape_config.video };
      }
      // 备选从旧设置中读取
      else if (result.videoSettings) {
        this.videoSettings = { ...this.videoSettings, ...result.videoSettings };
      }
      
      this.updateVideoSettingsUI();
      console.log('Video settings loaded:', this.videoSettings);
    } catch (error) {
      console.error('Failed to load video settings:', error);
    }
  }

  // 保存视频设置
  async saveVideoSettings() {
    try {
      await chrome.storage.local.set({ videoSettings: this.videoSettings });
      console.log('Video settings saved');
    } catch (error) {
      console.error('Failed to save video settings:', error);
    }
  }

  // 更新视频设置UI
  updateVideoSettingsUI() {
    const videoAnimations = document.getElementById('video-animations');
    const autoTrigger = document.getElementById('auto-trigger');
    const weatherChange = document.getElementById('weather-change-trigger');
    const frequency = null;
    const frequencyValue = null;
    const intervalSel = document.getElementById('interval-trigger');

    if (videoAnimations) videoAnimations.checked = this.videoSettings.enabled;
    if (autoTrigger) autoTrigger.checked = this.videoSettings.autoTrigger;
    if (weatherChange) weatherChange.checked = this.videoSettings.weatherChangeTrigger;
    // 频率控制已移除
    if (intervalSel) intervalSel.value = String(this.videoSettings.intervalMinutes);
  }

  // 检查是否应该播放视频动画
  checkVideoAnimation(weatherData) {
    if (!this.videoSettings.enabled || !this.videoManager || !this.cardSystem || !this.triggerManager) {
      return;
    }

    try {
      const weatherType = this.getWeatherType(weatherData);
      
      // 检查天气变化触发
      const shouldTrigger = this.triggerManager.checkWeatherChange(weatherType, this.lastWeatherType);
      
      if (this.videoSettings.weatherChangeTrigger && shouldTrigger.shouldTrigger && this.videoSettings.autoTrigger) {
        console.log('Weather change detected, triggering video animation');
        this.playVideoAnimation(weatherType);
      }

      // 更新上次天气类型
      this.lastWeatherType = weatherType;
    } catch (error) {
      console.error('Error checking video animation:', error);
    }
  }

  // 获取天气类型 - 使用智能映射器
  getWeatherType(weatherData) {
    if (!weatherData || !weatherData.weather || !weatherData.weather[0]) {
      return 'clear';
    }

    // 使用智能天气API映射器
    if (typeof WeatherAPIMapper !== 'undefined') {
      try {
        const mapper = new WeatherAPIMapper();
        return mapper.mapWeatherData(weatherData, 'openweather');
      } catch (error) {
        console.warn('Weather API mapper failed, using fallback:', error);
      }
    }

    // 备用映射逻辑
    const weatherCode = weatherData.weather[0].id;
    const weatherMain = weatherData.weather[0].main.toLowerCase();

    // 根据天气代码映射到视频类型
    if (weatherCode >= 200 && weatherCode < 300) return 'thunderstorm';
    if (weatherCode >= 300 && weatherCode < 400) return 'rain';
    if (weatherCode >= 500 && weatherCode < 600) return 'rain';
    if (weatherCode >= 600 && weatherCode < 700) return 'snow';
    if (weatherCode >= 700 && weatherCode < 800) return 'fog';
    if (weatherCode === 800) return 'clear';
    if (weatherCode >= 801 && weatherCode <= 804) return 'cloudy';

    return weatherMain || 'clear';
  }

  // 检查特殊触发条件（首次安装、设置完成等）
  async checkSpecialTriggers() {
    console.log('🔍 checkSpecialTriggers: 开始检查特殊触发条件...');
    
    if (!this.videoTriggerManager) {
      console.warn('❌ videoTriggerManager未初始化');
      return;
    }
    
    if (!this.videoSettings.enabled) {
      console.log('ℹ️ 视频设置已禁用，跳过触发检查');
      return;
    }

    if (!this.videoManager || !this.cardSystem) {
      console.warn('❌ 视频系统未完全初始化，等待1秒后重试...');
      setTimeout(() => this.checkSpecialTriggers(), 1000);
      return;
    }

    try {
      console.log('🎬 开始检查特殊视频触发条件...');
      
      const triggerResult = await this.videoTriggerManager.checkShouldTriggerVideo();
      
      console.log('🎯 触发检查结果:', triggerResult);
      
      if (triggerResult.shouldTrigger) {
        console.log(`Special trigger detected: ${triggerResult.reason} (${triggerResult.triggerType})`);
        
        // 记录触发事件
        await this.videoTriggerManager.recordTrigger(triggerResult.triggerType, triggerResult.reason);
        
        // 检查是否需要轮播
        if (triggerResult.needsCarousel) {
          console.log('开始首次载入轮播：雨雪云闪电雾各一个');
          setTimeout(() => this.startFirstLoadCarousel(), 1000);
        } else {
          // 根据触发类型选择合适的天气效果
          let weatherType = triggerResult.weatherType || 'clear';
          
          // 特殊触发使用更华丽的效果
          switch (triggerResult.triggerType) {
            case 'welcome':
              weatherType = 'clear'; // 欢迎视频使用晴天效果
              break;
            case 'settings':
              weatherType = this.lastWeatherType || 'clear'; // 使用当前天气
              break;
            case 'restart':
              weatherType = 'cloudy'; // 重启使用多云效果
              break;
            case 'update':
              weatherType = 'clear'; // 更新使用晴天效果
              break;
          }
          
          // 延迟播放，确保页面完全加载
          setTimeout(async () => {
            await this.playVideoAnimation(weatherType, {
              reason: triggerResult.reason,
              triggerType: triggerResult.triggerType
            });
          }, 1000);
        }
      } else {
        console.log(`No special trigger: ${triggerResult.reason || 'unknown'}`);
      }
    } catch (error) {
      console.error('Error checking special triggers:', error);
    }
  }

  /**
   * 首次载入轮播：雨雪云闪电雾各一个（0.3s重叠无间隙）
   */
  async startFirstLoadCarousel() {
    const weatherTypes = ['rain', 'snow', 'cloudy', 'thunderstorm', 'fog'];
    
    console.log('🎠 开始首次载入轮播（无间隙重叠）:', weatherTypes.join(' ⟶ '));
    
    for (let i = 0; i < weatherTypes.length; i++) {
      const weatherType = weatherTypes[i];
      // 视频播放时长1.5s，重叠0.3s，所以间隔1.2s
      const delay = i * 1200; 
      
      setTimeout(async () => {
        console.log(`🎬 轮播第${i + 1}/${weatherTypes.length}: ${weatherType}`);
        await this.playVideoAnimation(weatherType, {
          reason: 'first_load_carousel',
          triggerType: 'carousel',
          carouselIndex: i + 1,
          carouselTotal: weatherTypes.length
        });
      }, delay);
    }
    
    // 总时长 = (数量-1) * 间隔 + 最后一个视频时长
    const totalDuration = (weatherTypes.length - 1) * 1.2 + 1.5;
    console.log(`⏰ 轮播将在${totalDuration}秒内完成（重叠播放）`);
  }

  // 播放视频动画
  async playVideoAnimation(weatherType, options = {}) {
    try {
      console.log(`Playing video animation for weather type: ${weatherType}`, options);
      
      // 抽卡选择视频
      const selectedVideo = this.cardSystem.drawCard(weatherType);
      
      if (selectedVideo && selectedVideo.path) {
        // 播放视频
        await this.videoManager.playWeatherVideo(weatherType, {
          videoPath: selectedVideo.path,
          blendMode: selectedVideo.blendMode || 'lighten',
          ...options
        });
      }
    } catch (error) {
      console.error('Error playing video animation:', error);
    }
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  window.aeScape = new AeScapeNewTab();

  // 监听 storage 变更，主题变化时即时更新
  try {
    if (chrome?.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
          // 主题变化时更新
          if (changes.currentThemeData?.newValue) {
            try {
              window.aeScape.applyThemeData(changes.currentThemeData.newValue);
            } catch (_) {}
          }
          
          // 视频设置变化时重新加载
          if (changes.videoSettings?.newValue || changes.aescape_config?.newValue) {
            try {
              window.aeScape.loadVideoSettings();
            } catch (_) {}
          }
        }
      });
    }
  } catch (_) {}

  // 监听页面卸载，标记会话结束
  window.addEventListener('beforeunload', () => {
    try {
      if (window.aeScape?.videoTriggerManager) {
        window.aeScape.videoTriggerManager.markSessionEnd();
      }
    } catch (error) {
      console.warn('Failed to mark session end:', error);
    }
  });
});