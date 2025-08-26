/**
 * 天景 AeScape - 内容脚本 (完全重构版)
 * 
 * ⚠️ 全局规范：禁止使用任何emoji表情符号
 * 使用文字描述或SVG图标替代所有emoji
 */

class AeScapeFloatingBall {
  constructor() {
    // 核心状态
    this.ball = null;
    this.panel = null;
    this.isVisible = false;
    this.isPanelVisible = false;
    
    // 数据状态
    this.weatherData = null;
    this.currentLocation = null;
    
    // 计时器
    this.updateTimer = null;
    this.retryTimer = null;
    
    // 配置
    this.config = {
      ballSize: 64,
      updateInterval: 5 * 60 * 1000, // 5分钟
      retryInterval: 30 * 1000, // 30秒
      position: { bottom: '80px', right: '20px' }
    };
    
    console.log('[AeScape] 悬浮球系统初始化开始');
    this.init();
  }

  async init() {
    try {
      // 检查是否应该显示悬浮球
      if (!this.shouldShow()) {
        console.log('[AeScape] 当前页面不显示悬浮球');
        return;
      }

      // 检查用户设置
      const enabled = await this.checkUserSettings();
      if (!enabled) {
        console.log('[AeScape] 用户已禁用悬浮球');
        return;
      }

      // 等待主题系统加载
      await this.waitForThemeSystem();
      
      // 创建悬浮球
      this.createFloatingBall();
      
      // 加载天气数据
      await this.loadWeatherData();
      
      // 设置定时器
      this.setupTimers();
      
      // 设置消息监听
      this.setupMessageListener();
      
      console.log('[AeScape] 悬浮球系统初始化完成');
      
    } catch (error) {
      console.error('[AeScape] 悬浮球初始化失败:', error);
      this.scheduleRetry();
    }
  }

  shouldShow() {
    const url = window.location.href;
    const excludePatterns = [
      'chrome://', 'chrome-extension://', 'file://',
      'moz-extension://', 'about:', 'edge://',
      'extension://', 'chrome-search:'
    ];
    
    const shouldExclude = excludePatterns.some(pattern => url.startsWith(pattern));
    console.log(`[AeScape] URL检查: ${url}, 应排除: ${shouldExclude}`);
    return !shouldExclude;
  }

  async checkUserSettings() {
    try {
      const result = await chrome.storage.local.get(['floatingBallEnabled']);
      const enabled = result.floatingBallEnabled !== false; // 默认启用
      console.log('[AeScape] 用户设置检查:', enabled);
      return enabled;
    } catch (error) {
      console.log('[AeScape] 无法检查用户设置，默认启用:', error);
      return true;
    }
  }

  async waitForThemeSystem() {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 20; // 2秒
      
      const checkTheme = () => {
        attempts++;
        console.log(`[AeScape] 等待主题系统... 第${attempts}次尝试`);
        
        if (window.unifiedTheme) {
          console.log('[AeScape] 主题系统已加载');
          resolve();
        } else if (attempts >= maxAttempts) {
          console.warn('[AeScape] 主题系统加载超时，使用默认主题');
          resolve();
        } else {
          setTimeout(checkTheme, 100);
        }
      };
      
      checkTheme();
    });
  }

  createFloatingBall() {
    // 移除现有悬浮球
    if (this.ball) {
      this.ball.remove();
    }

    console.log('[AeScape] 创建悬浮球DOM');
    
    // 创建悬浮球容器
    this.ball = document.createElement('div');
    this.ball.id = 'aescape-floating-ball';
    
    // 设置基础样式
    this.ball.style.cssText = `
      position: fixed;
      bottom: ${this.config.position.bottom};
      right: ${this.config.position.right};
      width: ${this.config.ballSize}px;
      height: ${this.config.ballSize}px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10000;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1);
      user-select: none;
      opacity: 0;
      transform: scale(0.8);
    `;

    // 创建内容结构
    this.ball.innerHTML = `
      <div class="weather-icon" style="
        width: 18px;
        height: 18px;
        margin-bottom: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
      "></div>
      <div class="temperature" style="
        font-size: 14px;
        font-weight: 600;
        line-height: 1;
      ">--</div>
    `;

    // 设置事件监听
    this.setupBallEvents();
    
    // 应用默认主题
    this.applyDefaultTheme();
    
    // 添加到页面
    document.body.appendChild(this.ball);
    console.log('[AeScape] 悬浮球DOM已添加到页面');
    
    // 显示动画
    requestAnimationFrame(() => {
      this.ball.style.opacity = '1';
      this.ball.style.transform = 'scale(1)';
    });
    
    this.isVisible = true;
  }

  setupBallEvents() {
    if (!this.ball) return;

    // 点击事件
    this.ball.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('[AeScape] 悬浮球被点击');
      this.togglePanel();
    });

    // 悬停效果
    this.ball.addEventListener('mouseenter', () => {
      this.ball.style.transform = 'scale(1.1)';
      this.ball.style.filter = 'brightness(1.1)';
    });

    this.ball.addEventListener('mouseleave', () => {
      this.ball.style.transform = 'scale(1)';
      this.ball.style.filter = 'none';
    });

    // 拖拽功能
    this.setupDragFunctionality();
  }

  setupDragFunctionality() {
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    this.ball.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = this.ball.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      
      this.ball.style.cursor = 'grabbing';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newLeft = Math.max(0, Math.min(window.innerWidth - this.config.ballSize, startLeft + deltaX));
      const newTop = Math.max(0, Math.min(window.innerHeight - this.config.ballSize, startTop + deltaY));
      
      this.ball.style.left = newLeft + 'px';
      this.ball.style.top = newTop + 'px';
      this.ball.style.right = 'auto';
      this.ball.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        this.ball.style.cursor = 'pointer';
        this.savePosition();
      }
    });
  }

  savePosition() {
    try {
      const rect = this.ball.getBoundingClientRect();
      const position = {
        left: rect.left,
        top: rect.top
      };
      localStorage.setItem('aescape-ball-position', JSON.stringify(position));
      console.log('[AeScape] 位置已保存:', position);
    } catch (error) {
      console.warn('[AeScape] 保存位置失败:', error);
    }
  }

  applyDefaultTheme() {
    if (!this.ball) return;

    console.log('[AeScape] 应用默认主题');
    
    const hour = new Date().getHours();
    let theme;
    
    if (window.unifiedTheme) {
      const isNight = hour < 6 || hour > 19;
      theme = window.unifiedTheme.getTheme('clear', hour, isNight);
      console.log('[AeScape] 使用统一主题系统:', theme);
    } else {
      // 备用主题
      const isNight = hour < 6 || hour > 19;
      theme = {
        gradient: isNight 
          ? 'linear-gradient(135deg, rgb(31, 40, 91) 0%, rgb(46, 54, 96) 100%)'
          : 'linear-gradient(135deg, rgb(255, 167, 38) 0%, rgb(255, 138, 101) 100%)',
        text: isNight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(33, 33, 33, 0.9)'
      };
      console.log('[AeScape] 使用备用主题:', theme);
    }
    
    this.ball.style.background = theme.gradient;
    this.ball.style.color = theme.text;
    
    // 设置默认天气图标
    this.setDefaultIcon();
  }

  setDefaultIcon() {
    const iconElement = this.ball.querySelector('.weather-icon');
    if (iconElement) {
      const hour = new Date().getHours();
      const isNight = hour < 6 || hour > 19;
      const iconSvg = isNight
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
      
      iconElement.innerHTML = iconSvg;
      console.log('[AeScape] 已设置默认天气图标');
    }
  }

  async loadWeatherData() {
    console.log('[AeScape] 开始加载天气数据');
    
    try {
      // 检查扩展是否可用
      if (!chrome.runtime?.id) {
        throw new Error('扩展上下文不可用');
      }

      // 获取天气数据
      const weatherResponse = await Promise.race([
        chrome.runtime.sendMessage({ type: 'weather.getCurrent' }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('天气数据获取超时')), 5000)
        )
      ]);

      if (weatherResponse?.success && weatherResponse?.data) {
        this.weatherData = weatherResponse.data;
        this.updateBallDisplay(weatherResponse.data);
        console.log('[AeScape] 天气数据加载成功:', weatherResponse.data);
      } else {
        throw new Error('天气数据响应无效');
      }

      // 获取位置数据
      const locationResponse = await chrome.runtime.sendMessage({ type: 'location.getCurrent' });
      if (locationResponse?.success && locationResponse?.data) {
        this.currentLocation = locationResponse.data;
        console.log('[AeScape] 位置数据加载成功:', locationResponse.data);
      }

    } catch (error) {
      console.warn('[AeScape] 天气数据加载失败:', error);
      this.showErrorState();
    }
  }

  updateBallDisplay(weatherData) {
    if (!this.ball || !weatherData) {
      console.warn('[AeScape] 更新显示失败：悬浮球或天气数据为空');
      return;
    }

    console.log('[AeScape] 更新悬浮球显示:', weatherData);

    // 更新温度
    const tempElement = this.ball.querySelector('.temperature');
    if (tempElement && weatherData.env?.temperature !== undefined) {
      tempElement.textContent = `${Math.round(weatherData.env.temperature)}°`;
    }

    // 更新天气图标
    const iconElement = this.ball.querySelector('.weather-icon');
    if (iconElement && weatherData.weather?.code) {
      const iconSvg = this.getWeatherSVG(weatherData.weather.code, weatherData.env?.isNight);
      iconElement.innerHTML = iconSvg;
    }

    // 更新主题
    this.updateTheme(weatherData);
  }

  updateTheme(weatherData) {
    if (!this.ball || !weatherData) return;

    console.log('[AeScape] 更新主题');
    
    const hour = new Date().getHours();
    const weatherCode = weatherData.weather?.code || 'clear';
    const isNight = weatherData.env?.isNight || (hour < 6 || hour > 19);

    let theme;
    if (window.unifiedTheme) {
      theme = window.unifiedTheme.getTheme(weatherCode, hour, isNight);
    } else {
      theme = this.getFallbackTheme(weatherCode, isNight);
    }

    this.ball.style.background = theme.gradient;
    this.ball.style.color = theme.text;
    
    console.log('[AeScape] 主题已更新:', theme);
  }

  getFallbackTheme(weatherCode, isNight) {
    const themes = {
      clear: isNight 
        ? { gradient: 'linear-gradient(135deg, rgb(31, 40, 91) 0%, rgb(46, 54, 96) 100%)', text: 'rgba(255, 255, 255, 0.95)' }
        : { gradient: 'linear-gradient(135deg, rgb(255, 167, 38) 0%, rgb(255, 138, 101) 100%)', text: 'rgba(33, 33, 33, 0.9)' },
      cloudy: isNight
        ? { gradient: 'linear-gradient(135deg, rgb(19, 25, 28) 0%, rgb(28, 36, 40) 100%)', text: 'rgba(255, 255, 255, 0.95)' }
        : { gradient: 'linear-gradient(135deg, rgb(96, 125, 139) 0%, rgb(120, 144, 156) 100%)', text: 'rgba(33, 33, 33, 0.9)' },
      rain: isNight
        ? { gradient: 'linear-gradient(135deg, rgb(7, 10, 17) 0%, rgb(13, 18, 63) 100%)', text: 'rgba(255, 255, 255, 0.95)' }
        : { gradient: 'linear-gradient(135deg, rgb(63, 81, 181) 0%, rgb(92, 107, 192) 100%)', text: 'rgba(255, 255, 255, 0.95)' }
    };
    
    return themes[weatherCode] || themes.clear;
  }

  getWeatherSVG(code, isNight, size = 16) {
    // 使用统一图标库
    if (window.AeScapeIcons) {
      return window.AeScapeIcons.getWeatherIcon(code, isNight, size);
    }
    
    // 备用方案
    const fallbackIcon = isNight 
      ? `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
      : `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    return fallbackIcon;
  }

  showErrorState() {
    if (!this.ball) return;
    
    console.log('[AeScape] 显示错误状态');
    
    const tempElement = this.ball.querySelector('.temperature');
    const iconElement = this.ball.querySelector('.weather-icon');
    
    if (tempElement) tempElement.textContent = '--';
    if (iconElement) {
      iconElement.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    }
  }

  togglePanel() {
    console.log('[AeScape] 切换面板显示状态');
    
    if (this.isPanelVisible) {
      this.hidePanel();
    } else {
      this.showPanel();
    }
  }

  showPanel() {
    console.log('[AeScape] 显示详情面板');
    
    // 移除现有面板
    if (this.panel) {
      this.panel.remove();
    }

    // 创建面板
    this.panel = document.createElement('div');
    this.panel.id = 'aescape-detail-panel';
    
    // 设置面板样式
    this.panel.style.cssText = `
      position: fixed;
      bottom: 160px;
      right: 20px;
      width: 300px;
      min-height: 200px;
      background: ${this.getCurrentThemeGradient()};
      backdrop-filter: blur(20px);
      border: none;
      border-radius: 16px;
      padding: 20px;
      z-index: 10001;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15);
      color: ${this.getCurrentThemeTextColor()};
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
    `;

    // 设置面板内容
    this.panel.innerHTML = this.generatePanelContent();
    
    // 添加关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = window.AeScapeIcons ? window.AeScapeIcons.getUIIcon('close', 16) : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    closeBtn.style.cssText = `
      position: absolute;
      top: 12px;
      right: 12px;
      background: none;
      border: none;
      color: inherit;
      font-size: 18px;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s ease;
      padding: 4px;
      border-radius: 4px;
    `;
    
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hidePanel();
    });
    
    this.panel.appendChild(closeBtn);
    
    // 添加到页面
    document.body.appendChild(this.panel);
    this.isPanelVisible = true;
    
    // 显示动画
    requestAnimationFrame(() => {
      this.panel.style.opacity = '1';
      this.panel.style.transform = 'translateY(0)';
    });
    
    // 设置点击外部关闭
    this.setupPanelOutsideClick();
  }

  hidePanel() {
    if (!this.panel || !this.isPanelVisible) return;
    
    console.log('[AeScape] 隐藏详情面板');
    
    this.panel.style.opacity = '0';
    this.panel.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      if (this.panel && this.panel.parentNode) {
        this.panel.parentNode.removeChild(this.panel);
        this.panel = null;
        this.isPanelVisible = false;
      }
    }, 300);
  }

  setupPanelOutsideClick() {
    const handleOutsideClick = (e) => {
      if (this.panel && !this.panel.contains(e.target) && 
          this.ball && !this.ball.contains(e.target)) {
        this.hidePanel();
        document.removeEventListener('click', handleOutsideClick);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 100);
  }

  generatePanelContent() {
    if (!this.weatherData) {
      return `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 18px; margin-bottom: 10px;">天气数据加载中</div>
          <div style="font-size: 14px; opacity: 0.7;">请稍候...</div>
        </div>
      `;
    }

    const weather = this.weatherData;
    const location = this.currentLocation?.name || '未知位置';
    const temperature = Math.round(weather.env?.temperature || 0);
    const feelsLike = Math.round(weather.env?.feelsLike || weather.env?.temperature || 0);
    const humidity = weather.weather?.humidity || '--';
    const windSpeed = Math.round((weather.weather?.windSpeedMps || 0) * 3.6);
    
    const weatherNames = {
      clear: weather.env?.isNight ? '夜晚晴朗' : '晴朗',
      cloudy: '多云',
      rain: '下雨',
      snow: '下雪',
      fog: '有雾',
      thunderstorm: '雷暴'
    };
    
    const weatherDesc = weatherNames[weather.weather?.code] || '未知天气';

    return `
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="font-size: 24px; margin-bottom: 4px;">${this.getWeatherSVG(weather.weather?.code, weather.env?.isNight, 32)}</div>
        <div style="font-size: 18px; font-weight: 600; margin-bottom: 2px;">${temperature}°C</div>
        <div style="font-size: 14px; opacity: 0.8;">${weatherDesc}</div>
        <div style="font-size: 12px; opacity: 0.7; margin-top: 4px;">${location}</div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
        <div style="display: flex; justify-content: space-between;">
          <span style="opacity: 0.8;">体感温度</span>
          <span style="font-weight: 500;">${feelsLike}°C</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="opacity: 0.8;">湿度</span>
          <span style="font-weight: 500;">${humidity}%</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="opacity: 0.8;">风速</span>
          <span style="font-weight: 500;">${windSpeed} km/h</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="opacity: 0.8;">能见度</span>
          <span style="font-weight: 500;">${weather.weather?.visibilityKm || '--'} km</span>
        </div>
      </div>
      
      <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.2); text-align: center;">
        <div style="font-size: 11px; opacity: 0.7;">
          更新时间：${weather.timestamp ? new Date(weather.timestamp).toLocaleTimeString('zh-CN') : '--'}
        </div>
      </div>
    `;
  }

  getCurrentThemeGradient() {
    if (window.unifiedTheme && this.weatherData) {
      const hour = new Date().getHours();
      const weatherCode = this.weatherData.weather?.code || 'clear';
      const isNight = this.weatherData.env?.isNight || (hour < 6 || hour > 19);
      const theme = window.unifiedTheme.getTheme(weatherCode, hour, isNight);
      return theme.gradient;
    }
    
    // 备用方案
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 19;
    return isNight 
      ? 'linear-gradient(135deg, rgb(31, 40, 91) 0%, rgb(46, 54, 96) 100%)'
      : 'linear-gradient(135deg, rgb(255, 167, 38) 0%, rgb(255, 138, 101) 100%)';
  }

  getCurrentThemeTextColor() {
    if (window.unifiedTheme && this.weatherData) {
      const hour = new Date().getHours();
      const weatherCode = this.weatherData.weather?.code || 'clear';
      const isNight = this.weatherData.env?.isNight || (hour < 6 || hour > 19);
      const theme = window.unifiedTheme.getTheme(weatherCode, hour, isNight);
      return theme.text;
    }
    
    // 备用方案
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 19;
    return isNight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(33, 33, 33, 0.9)';
  }

  setupTimers() {
    // 定期更新天气数据
    this.updateTimer = setInterval(() => {
      console.log('[AeScape] 定时更新天气数据');
      this.loadWeatherData();
    }, this.config.updateInterval);
  }

  scheduleRetry() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    
    console.log('[AeScape] 计划重试初始化');
    this.retryTimer = setTimeout(() => {
      this.init();
    }, this.config.retryInterval);
  }

  setupMessageListener() {
    if (chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('[AeScape] 收到消息:', message);
        
        switch (message.type) {
          case 'weather.updated':
            if (message.data) {
              this.weatherData = message.data;
              this.updateBallDisplay(message.data);
            }
            break;
            
          case 'floatingBall.toggle':
            if (message.enabled) {
              if (!this.isVisible) {
                this.init();
              }
            } else {
              this.destroy();
            }
            break;
        }
      });
    }
  }

  destroy() {
    console.log('[AeScape] 销毁悬浮球');
    
    // 清理定时器
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    
    // 移除面板
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
      this.isPanelVisible = false;
    }
    
    // 移除悬浮球
    if (this.ball) {
      this.ball.remove();
      this.ball = null;
      this.isVisible = false;
    }
  }
}

// 初始化函数
function initFloatingBall() {
  console.log('[AeScape] 准备初始化悬浮球');
  
  // 销毁现有实例
  if (window.aeScapeFloatingBall) {
    window.aeScapeFloatingBall.destroy();
  }
  
  // 创建新实例
  window.aeScapeFloatingBall = new AeScapeFloatingBall();
}

// 页面加载时初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFloatingBall);
} else {
  initFloatingBall();
}

// 监听页面变化（用于SPA应用）
let currentUrl = location.href;
const urlObserver = new MutationObserver(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    console.log('[AeScape] 页面URL变化，重新初始化');
    setTimeout(initFloatingBall, 1000);
  }
});

urlObserver.observe(document, { subtree: true, childList: true });

console.log('[AeScape] 内容脚本已加载');