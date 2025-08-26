/**
 * 天景 AeScape - 内容脚本
 * 在网页中注入优雅的天气悬浮球
 */

class AeScapeFloatingBall {
  constructor() {
    this.ball = null;
    this.isVisible = false;
    this.weatherData = null;
    this.updateInterval = null;
    this.detailPanel = null;
    this.panelVisible = false;
    
    this.init();
  }

  init() {
    if (!this.shouldShow()) {
      return;
    }

    this.createFloatingBall();
    this.loadWeatherData();
    this.setupUpdateInterval();
    this.setupMessageListener();
  }

  shouldShow() {
    const url = window.location.href;
    const excludePatterns = [
      'chrome://', 'chrome-extension://', 'file://',
      'moz-extension://', 'about:', 'edge://'
    ];

    return !excludePatterns.some(pattern => url.startsWith(pattern));
  }

  createFloatingBall() {
    if (this.ball) {
      this.ball.remove();
    }

    this.ball = document.createElement('div');
    this.ball.id = 'aescape-floating-ball';
    this.ball.innerHTML = `
      <div class="ball-content">
        <div class="weather-icon"></div>
        <div class="temperature">--°</div>
      </div>
      <div class="ball-tooltip">点击查看详细天气</div>
    `;

    // 基础样式 - 使用默认主题
    const initialGradient = 'linear-gradient(135deg, rgb(255, 167, 38) 0%, rgb(255, 138, 101) 100%)';
    const initialTextColor = 'rgba(33, 33, 33, 0.9)';
    
    Object.assign(this.ball.style, {
      position: 'fixed',
      bottom: '80px',
      right: '20px',
      width: '64px',
      height: '64px',
      background: initialGradient,
      backdropFilter: 'blur(20px)',
      border: 'none',
      borderRadius: '50%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      zIndex: '10000',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
      boxShadow: '0 6px 24px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)',
      userSelect: 'none',
      color: initialTextColor
    });

    // 内容样式
    const content = this.ball.querySelector('.ball-content');
    Object.assign(content.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
    });


    // 天气图标样式
    const weatherIcon = this.ball.querySelector('.weather-icon');
    Object.assign(weatherIcon.style, {
      width: '18px',
      height: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '2px',
      opacity: '0.9',
      color: 'inherit'
    });

    const temp = this.ball.querySelector('.temperature');
    Object.assign(temp.style, {
      fontSize: '14px',
      fontWeight: '600',
      lineHeight: '1',
      textAlign: 'center',
      marginTop: '0px',
      color: 'inherit'
    });


    const tooltip = this.ball.querySelector('.ball-tooltip');
    Object.assign(tooltip.style, {
      position: 'absolute',
      bottom: '75px',
      right: '0',
      background: 'rgba(0, 0, 0, 0.85)',
      color: 'rgba(255, 255, 255, 0.95)',
      padding: '8px 12px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      opacity: '0',
      visibility: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
      pointerEvents: 'none',
      zIndex: '10001',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
    });

    // 悬停效果
    this.ball.addEventListener('mouseenter', () => {
      this.ball.style.transform = 'scale(1.1)';
      this.ball.style.filter = 'brightness(1.1) saturate(1.1)';
      
      // 显示工具提示
      const tooltip = this.ball.querySelector('.ball-tooltip');
      if (tooltip) {
        tooltip.style.opacity = '1';
        tooltip.style.visibility = 'visible';
      }
    });

    this.ball.addEventListener('mouseleave', () => {
      this.ball.style.transform = 'scale(1)';
      this.ball.style.filter = 'none';
      
      // 隐藏工具提示
      const tooltip = this.ball.querySelector('.ball-tooltip');
      if (tooltip) {
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
      }
    });

    // 点击事件
    this.ball.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDetailPanel();
    });

    document.body.appendChild(this.ball);
    this.isVisible = true;

    // 等待theme-system.js加载并应用主题
    this.waitForThemeSystemAndApply();

    // 入场动画
    requestAnimationFrame(() => {
      this.ball.style.opacity = '0';
      this.ball.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        this.ball.style.opacity = '1';
        this.ball.style.transform = 'translateY(0)';
      }, 100);
    });

    // 添加拖拽功能
    this.setupDragging();
  }

  waitForThemeSystemAndApply() {
    const maxRetries = 10;
    let retries = 0;

    const checkAndApply = () => {
      console.log(`[AeScape] Checking theme system... attempt ${retries + 1}/${maxRetries}`);
      console.log('window.unifiedTheme exists:', !!window.unifiedTheme);
      
      if (window.unifiedTheme) {
        console.log('[AeScape] Theme system loaded successfully!');
        console.log('Theme system methods:', Object.getOwnPropertyNames(window.unifiedTheme));
        
        // 应用主题
        const currentGradient = this.getCurrentThemeGradient();
        console.log('[AeScape] Applied gradient:', currentGradient);
        this.ball.style.background = currentGradient;
        
        // 设置默认天气图标和颜色
        this.setDefaultWeatherIcon();
        this.updateThemeColors();
        
        return; // 成功，退出
      }
      
      retries++;
      if (retries < maxRetries) {
        // 每100ms重试一次
        setTimeout(checkAndApply, 100);
      } else {
        console.warn('[AeScape] Theme system failed to load after multiple attempts, using fallback');
        // 使用备用方案
        this.applyFallbackTheme();
        this.setDefaultWeatherIcon();
      }
    };

    checkAndApply();
  }

  applyFallbackTheme() {
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 19;
    
    // 备用渐变
    const fallbackGradient = isNight 
      ? 'linear-gradient(135deg, rgb(31, 40, 91) 0%, rgb(46, 54, 96) 100%)'
      : 'linear-gradient(135deg, rgb(255, 167, 38) 0%, rgb(255, 138, 101) 100%)';
    
    const fallbackTextColor = isNight 
      ? 'rgba(255, 255, 255, 0.95)' 
      : 'rgba(33, 33, 33, 0.9)';
    
    console.log('[AeScape] Applied fallback theme:', {gradient: fallbackGradient, text: fallbackTextColor});
    
    this.ball.style.background = fallbackGradient;
    this.ball.style.color = fallbackTextColor;
  }

  setupDragging() {
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    this.ball.addEventListener('mousedown', (e) => {
      if (e.target.closest('.ball-tooltip')) return; // 不拖拽工具提示
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseInt(this.ball.style.left) || 0;
      startTop = parseInt(this.ball.style.top) || 0;
      
      this.ball.style.cursor = 'grabbing';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newLeft = Math.max(0, Math.min(window.innerWidth - 60, startLeft + deltaX));
      const newTop = Math.max(0, Math.min(window.innerHeight - 60, startTop + deltaY));
      
      this.ball.style.left = newLeft + 'px';
      this.ball.style.top = newTop + 'px';
      this.ball.style.right = 'auto';
      this.ball.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        this.ball.style.cursor = 'pointer';
        
        // 保存位置到localStorage
        const left = parseInt(this.ball.style.left) || 0;
        const top = parseInt(this.ball.style.top) || 0;
        localStorage.setItem('aescape-ball-position', JSON.stringify({ left, top }));
      }
    });

    // 加载保存的位置
    this.loadSavedPosition();
  }

  loadSavedPosition() {
    try {
      const saved = localStorage.getItem('aescape-ball-position');
      
      // 临时强制清除保存的位置，调试位置问题
      if (saved) {
        console.log('Found saved position:', saved);
        localStorage.removeItem('aescape-ball-position');
        console.log('Cleared saved position for debugging');
        return; // 使用默认位置
      }
      
      if (saved) {
        const position = JSON.parse(saved);
        if (position.left !== undefined && position.top !== undefined) {
          // 验证位置是否在合理范围内
          const maxLeft = window.innerWidth - 60;
          const maxTop = window.innerHeight - 60;
          
          if (position.left >= 0 && position.left <= maxLeft && 
              position.top >= 0 && position.top <= maxTop) {
            this.ball.style.left = position.left + 'px';
            this.ball.style.top = position.top + 'px';
            this.ball.style.right = 'auto';
            this.ball.style.bottom = 'auto';
            console.log('Applied saved position:', position);
          } else {
            // 位置无效，清除保存的位置，使用默认位置
            console.log('Saved position is invalid, using default position');
            localStorage.removeItem('aescape-ball-position');
          }
        }
      }
    } catch (error) {
      console.log('Failed to load saved position:', error);
      localStorage.removeItem('aescape-ball-position');
    }
  }

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
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
      ]);

      if (response?.success && response?.data) {
        this.weatherData = response.data;
        this.updateBallDisplay(response.data);
      } else {
        // 如果没有数据，显示默认状态
        this.showDefaultState();
      }
    } catch (error) {
      console.error('Failed to load weather data:', error);
      // 显示默认状态而不是隐藏
      this.showDefaultState();
    }
  }

  showDefaultState() {
    if (!this.ball) return;
    
    // 确保悬浮球可见
    this.ball.style.display = 'flex';
    
    // 设置默认天气图标和温度
    const iconElement = this.ball.querySelector('.weather-icon');
    const tempElement = this.ball.querySelector('.temperature');
    
    if (iconElement) {
      const hour = new Date().getHours();
      const isNight = hour < 6 || hour > 19;
      iconElement.innerHTML = this.getWeatherSVG('clear', isNight);
    }
    
    if (tempElement) {
      tempElement.textContent = '--°';
    }
    
    // 应用主题色
    this.updateThemeColors();
    
    // 应用主题背景
    const currentGradient = this.getCurrentThemeGradient();
    this.ball.style.background = currentGradient;
    
    console.log('Applied default state with gradient:', currentGradient);
  }

  setDefaultWeatherIcon() {
    if (!this.ball) return;
    
    const iconElement = this.ball.querySelector('.weather-icon');
    if (iconElement) {
      const hour = new Date().getHours();
      const isNight = hour < 6 || hour > 19;
      iconElement.innerHTML = this.getWeatherSVG('clear', isNight);
    }
  }

  updateThemeColors() {
    if (!this.ball) return;
    
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 19;
    const weatherCode = this.weatherData?.weather?.code || 'clear';
    
    let textColor = null;
    
    if (window.unifiedTheme) {
      const theme = window.unifiedTheme.getTheme(weatherCode, hour, isNight);
      if (theme && theme.text) {
        textColor = theme.text;
      }
    }
    
    // 备用方案
    if (!textColor) {
      textColor = isNight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(33, 33, 33, 0.9)';
    }
    
    console.log('[AeScape] Applied text color:', textColor);
    this.ball.style.color = textColor;
    
    // 更新工具提示颜色
    const tooltip = this.ball.querySelector('.ball-tooltip');
    if (tooltip) {
      tooltip.style.color = textColor;
      const isDarkText = textColor.includes('33, 33, 33') || textColor.includes('rgb(33');
      tooltip.style.background = isDarkText 
        ? 'rgba(255, 255, 255, 0.9)' 
        : 'rgba(0, 0, 0, 0.85)';
    }
  }

  updateBallDisplay(weather) {
    if (!this.ball || !weather) return;

    const iconElement = this.ball.querySelector('.weather-icon');
    const tempElement = this.ball.querySelector('.temperature');

    if (iconElement) {
      iconElement.innerHTML = this.getWeatherSVG(weather.weather?.code, weather.env?.isNight);
    }

    if (tempElement) {
      tempElement.textContent = `${Math.round(weather.env?.temperature || 0)}°`;
    }

    this.updateBallTheme(weather.weather?.code, weather.env?.isNight);
  }

  getCurrentThemeGradient() {
    if (!this.weatherData) {
      // 默认使用当前时间的晴天主题
      const hour = new Date().getHours();
      const isNight = hour < 6 || hour > 19;
      if (window.unifiedTheme) {
        const theme = window.unifiedTheme.getTheme('clear', hour, isNight);
        if (theme && theme.gradient) {
          return theme.gradient;
        }
      }
      // 最终备用
      return isNight ? 
        'linear-gradient(135deg, rgb(31, 40, 91) 0%, rgb(46, 54, 96) 100%)' :
        'linear-gradient(135deg, rgb(255, 167, 38) 0%, rgb(255, 138, 101) 100%)';
    }
    
    // 使用统一的主题系统
    if (window.unifiedTheme) {
      const weatherCode = this.weatherData.weather?.code || 'clear';
      const hour = new Date().getHours();
      const isNight = this.weatherData.env?.isNight || false;
      
      const theme = window.unifiedTheme.getTheme(weatherCode, hour, isNight);
      if (theme && theme.gradient) {
        return theme.gradient;
      }
    }
    
    // 备用方案
    const weatherCode = this.weatherData.weather?.code || 'clear';
    const isNight = this.weatherData.env?.isNight || false;
    
    return this.getThemeGradient(weatherCode, isNight);
  }

  getThemeGradient(weatherCode, isNight) {
    if (isNight) {
      switch (weatherCode) {
        case 'clear':
          return 'linear-gradient(135deg, rgb(31, 40, 91) 0%, rgb(46, 54, 96) 100%)';
        case 'cloudy':
          return 'linear-gradient(135deg, rgb(19, 25, 28) 0%, rgb(28, 36, 40) 100%)';
        case 'rain':
        case 'thunderstorm':
          return 'linear-gradient(135deg, rgb(7, 10, 17) 0%, rgb(13, 18, 63) 100%)';
        case 'snow':
          return 'linear-gradient(135deg, rgb(1, 60, 95) 0%, rgb(1, 68, 105) 100%)';
        case 'fog':
          return 'linear-gradient(135deg, rgb(33, 33, 33) 0%, rgb(49, 49, 49) 100%)';
        default:
          return 'linear-gradient(135deg, rgb(31, 40, 91) 0%, rgb(46, 54, 96) 100%)';
      }
    } else {
      switch (weatherCode) {
        case 'clear':
          return 'linear-gradient(135deg, rgb(255, 167, 38) 0%, rgb(255, 138, 101) 100%)';
        case 'cloudy':
          return 'linear-gradient(135deg, rgb(96, 125, 139) 0%, rgb(120, 144, 156) 100%)';
        case 'rain':
        case 'thunderstorm':
          return 'linear-gradient(135deg, rgb(63, 81, 181) 0%, rgb(92, 107, 192) 100%)';
        case 'snow':
          return 'linear-gradient(135deg, rgb(129, 212, 250) 0%, rgb(79, 195, 247) 100%)';
        case 'fog':
          return 'linear-gradient(135deg, rgb(189, 189, 189) 0%, rgb(158, 158, 158) 100%)';
        default:
          return 'linear-gradient(135deg, rgb(255, 167, 38) 0%, rgb(255, 138, 101) 100%)';
      }
    }
  }

  updateBallTheme(weatherCode, isNight) {
    if (!this.ball) return;

    const gradient = this.getCurrentThemeGradient();
    this.ball.style.background = gradient;
    this.ball.style.border = 'none';
    
    // 更新文字颜色
    if (window.unifiedTheme) {
      const hour = new Date().getHours();
      const theme = window.unifiedTheme.getTheme(weatherCode, hour, isNight);
      if (theme && theme.text) {
        this.ball.style.color = theme.text;
        // 更新面板文字颜色
        if (this.detailPanel) {
          this.detailPanel.style.color = theme.text;
        }
      }
    }
  }

  getWeatherSVG(code, isNight) {
    const svgs = {
      clear: isNight ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>` : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>`,
      cloudy: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
      </svg>`,
      rain: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="16" y1="13" x2="16" y2="21"></line>
        <line x1="8" y1="13" x2="8" y2="21"></line>
        <line x1="12" y1="15" x2="12" y2="23"></line>
        <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>
      </svg>`,
      snow: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="2" y1="17" x2="22" y2="17"></line>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <line x1="2" y1="7" x2="22" y2="7"></line>
        <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>
      </svg>`,
      fog: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 15h18M3 9h18M3 21h18"></path>
      </svg>`,
      thunderstorm: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"></path>
        <polyline points="13 11,9 17,15 17,11 23"></polyline>
      </svg>`
    };
    
    return svgs[code] || svgs.clear;
  }

  showErrorState() {
    if (!this.ball) return;

    const iconElement = this.ball.querySelector('.weather-icon');
    const tempElement = this.ball.querySelector('.temperature');

    if (iconElement) iconElement.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>`;
    if (tempElement) tempElement.textContent = '--°';
  }

  toggleDetailPanel() {
    if (this.panelVisible && this.detailPanel) {
      this.hideDetailPanel();
    } else {
      this.showDetailPanel();
    }
  }

  showDetailPanel() {
    if (!this.weatherData) {
      // 如果没有天气数据，先尝试加载
      this.loadWeatherData();
      // 但仍然显示一个默认面板
      this.createDefaultDetailPanel();
      return;
    }

    if (this.panelVisible && this.detailPanel) {
      return; // 面板已经显示
    }

    // 移除现有面板
    if (this.detailPanel) {
      this.detailPanel.remove();
    }

    this.detailPanel = document.createElement('div');
    this.detailPanel.id = 'aescape-detail-panel';
    this.detailPanel.innerHTML = this.generateDetailHTML(this.weatherData);

    // 获取当前的主题背景和文字颜色
    const currentGradient = this.getCurrentThemeGradient();
    let textColor = 'rgba(255, 255, 255, 0.95)';
    
    if (window.unifiedTheme && this.weatherData) {
      const weatherCode = this.weatherData.weather?.code || 'clear';
      const hour = new Date().getHours();
      const isNight = this.weatherData.env?.isNight || false;
      const theme = window.unifiedTheme.getTheme(weatherCode, hour, isNight);
      if (theme && theme.text) {
        textColor = theme.text;
      }
    }
    
    Object.assign(this.detailPanel.style, {
      position: 'fixed',
      bottom: '150px',
      right: '20px',
      width: '300px',
      background: currentGradient,
      backdropFilter: 'blur(20px)',
      border: 'none',
      borderRadius: '16px',
      padding: '24px',
      zIndex: '10001',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15)',
      transform: 'translateY(20px)',
      opacity: '0',
      transition: 'all 0.3s ease',
      color: textColor
    });

    // 关闭按钮
    const closeBtn = document.createElement('div');
    closeBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    Object.assign(closeBtn.style, {
      position: 'absolute',
      top: '10px',
      right: '15px',
      fontSize: '20px',
      cursor: 'pointer',
      color: textColor.replace('0.95)', '0.7)').replace('0.85)', '0.6)').replace('0.8)', '0.5)').replace('0.9)', '0.7)'),
      transition: 'color 0.2s ease'
    });
    
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideDetailPanel();
    });
    this.detailPanel.appendChild(closeBtn);

    document.body.appendChild(this.detailPanel);
    this.panelVisible = true;

    // 显示动画
    requestAnimationFrame(() => {
      this.detailPanel.style.opacity = '1';
      this.detailPanel.style.transform = 'translateY(0)';
    });

    // 添加点击外部关闭功能
    this.setupPanelCloseHandler();
  }

  hideDetailPanel() {
    if (!this.detailPanel || !this.panelVisible) return;

    this.detailPanel.style.opacity = '0';
    this.detailPanel.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      if (this.detailPanel && this.detailPanel.parentNode) {
        this.detailPanel.parentNode.removeChild(this.detailPanel);
        this.detailPanel = null;
        this.panelVisible = false;
      }
    }, 300);
  }

  setupPanelCloseHandler() {
    const handleOutsideClick = (event) => {
      if (this.detailPanel && this.panelVisible && 
          !this.detailPanel.contains(event.target) && 
          !this.ball.contains(event.target)) {
        this.hideDetailPanel();
        document.removeEventListener('click', handleOutsideClick);
        document.removeEventListener('keydown', handleEscKey);
      }
    };

    const handleEscKey = (event) => {
      if (event.key === 'Escape' && this.panelVisible) {
        this.hideDetailPanel();
        document.removeEventListener('click', handleOutsideClick);
        document.removeEventListener('keydown', handleEscKey);
      }
    };

    // 延迟添加事件监听器，避免立即触发
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
      document.addEventListener('keydown', handleEscKey);
    }, 100);
  }

  createDefaultDetailPanel() {
    // 移除现有面板
    if (this.detailPanel) {
      this.detailPanel.remove();
    }

    this.detailPanel = document.createElement('div');
    this.detailPanel.id = 'aescape-detail-panel';
    
    // 获取主题背景和文字颜色
    const currentGradient = this.getCurrentThemeGradient();
    let textColor = 'rgba(255, 255, 255, 0.95)';
    let labelTextColor = 'rgba(255, 255, 255, 0.7)';
    
    if (window.unifiedTheme) {
      const hour = new Date().getHours();
      const isNight = hour < 6 || hour > 19;
      const theme = window.unifiedTheme.getTheme('clear', hour, isNight);
      if (theme && theme.text) {
        textColor = theme.text;
        const isDark = theme.text.includes('33, 33, 33') || theme.text.includes('rgb(33');
        labelTextColor = isDark ? 'rgba(33, 33, 33, 0.7)' : 'rgba(255, 255, 255, 0.7)';
      }
    }
    
    this.detailPanel.innerHTML = `
      <div style="text-align: center; margin-bottom: 16px; color: ${textColor};">
        <div style="font-size: 24px; margin-bottom: 4px;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
        </svg></div>
        <div style="font-size: 18px; font-weight: 600; margin-bottom: 2px;">获取中...</div>
        <div style="font-size: 14px; color: ${labelTextColor};">正在加载天气数据</div>
      </div>
    `;
    
    // 设置面板样式
    Object.assign(this.detailPanel.style, {
      position: 'fixed',
      bottom: '150px',
      right: '20px',
      width: '280px',
      background: currentGradient,
      backdropFilter: 'blur(20px)',
      border: 'none',
      borderRadius: '16px',
      padding: '24px',
      zIndex: '10001',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15)',
      transform: 'translateY(20px)',
      opacity: '0',
      transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
      userSelect: 'none',
      color: textColor
    });

    // 添加关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    Object.assign(closeBtn.style, {
      position: 'absolute',
      top: '12px',
      right: '12px',
      background: 'none',
      border: 'none',
      color: textColor,
      fontSize: '16px',
      cursor: 'pointer',
      padding: '4px',
      borderRadius: '4px',
      transition: 'opacity 0.2s ease'
    });
    
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideDetailPanel();
    });
    this.detailPanel.appendChild(closeBtn);

    document.body.appendChild(this.detailPanel);
    this.panelVisible = true;

    // 显示动画
    requestAnimationFrame(() => {
      this.detailPanel.style.opacity = '1';
      this.detailPanel.style.transform = 'translateY(0)';
    });

    // 添加点击外部关闭功能
    const handleOutsideClick = (e) => {
      if (!this.detailPanel.contains(e.target) && !this.ball.contains(e.target)) {
        this.hideDetailPanel();
        document.removeEventListener('click', handleOutsideClick);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 100);
  }

  generateDetailHTML(weather) {
    const weatherDescriptions = {
      clear: weather.env?.isNight ? '夜晚晴朗' : '晴朗',
      cloudy: '多云',
      rain: '下雨',
      snow: '下雪',
      fog: '有雾',
      thunderstorm: '雷暴'
    };

    const windDirection = this.getWindDirection(weather.weather?.windDirection || 0);
    
    // 获取主题文字颜色
    let mainTextColor = 'rgba(255, 255, 255, 0.95)';
    let labelTextColor = 'rgba(255, 255, 255, 0.7)';
    let subtitleTextColor = 'rgba(255, 255, 255, 0.6)';
    
    if (window.unifiedTheme) {
      const weatherCode = weather.weather?.code || 'clear';
      const hour = new Date().getHours();
      const isNight = weather.env?.isNight || false;
      const theme = window.unifiedTheme.getTheme(weatherCode, hour, isNight);
      if (theme && theme.text) {
        mainTextColor = theme.text;
        // 根据主文字颜色调整透明度
        const isDark = theme.text.includes('33, 33, 33') || theme.text.includes('rgb(33');
        labelTextColor = isDark ? 'rgba(33, 33, 33, 0.7)' : 'rgba(255, 255, 255, 0.7)';
        subtitleTextColor = isDark ? 'rgba(33, 33, 33, 0.6)' : 'rgba(255, 255, 255, 0.6)';
      }
    }

    return `
      <div style="text-align: center; margin-bottom: 16px; color: ${mainTextColor};">
        <div style="font-size: 24px; margin-bottom: 4px;">${this.getWeatherIconLarge(weather.weather?.code, weather.env?.isNight)}</div>
        <div style="font-size: 18px; font-weight: 600; margin-bottom: 2px;">${Math.round(weather.env?.temperature || 0)}°C</div>
        <div style="font-size: 14px; color: ${labelTextColor};">${weatherDescriptions[weather.weather?.code] || '未知天气'}</div>
        <div style="font-size: 12px; color: ${subtitleTextColor}; margin-top: 4px;">${weather.location?.name || '未知位置'}</div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; color: ${mainTextColor};">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: ${labelTextColor};">体感温度</span>
          <span style="font-weight: 500;">${Math.round(weather.env?.feelsLike || weather.env?.temperature || 0)}°C</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: ${labelTextColor};">湿度</span>
          <span style="font-weight: 500;">${weather.weather?.humidity || '--'}%</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: ${labelTextColor};">风速</span>
          <span style="font-weight: 500;">${Math.round((weather.weather?.windSpeedMps || 0) * 3.6)} km/h</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: ${labelTextColor};">风向</span>
          <span style="font-weight: 500;">${windDirection}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: ${labelTextColor};">能见度</span>
          <span style="font-weight: 500;">${weather.weather?.visibilityKm || '--'} km</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: ${labelTextColor};">气压</span>
          <span style="font-weight: 500;">${weather.weather?.pressure || '--'} hPa</span>
        </div>
      </div>
      
      <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid ${labelTextColor.replace('0.7)', '0.2)')}; text-align: center;">
        <div style="font-size: 11px; color: ${subtitleTextColor};">
          更新时间：${weather.timestamp ? new Date(weather.timestamp).toLocaleTimeString('zh-CN') : '--'}
        </div>
      </div>
    `;
  }

  getWeatherIconLarge(code, isNight) {
    return this.getWeatherSVG(code, isNight).replace('width="16" height="16"', 'width="32" height="32"');
  }

  getWindDirection(degrees) {
    const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }

  setupUpdateInterval() {
    this.updateInterval = setInterval(() => {
      this.loadWeatherData();
    }, 5 * 60 * 1000); // 5分钟
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'weather.updated' && message.data) {
        this.weatherData = message.data;
        this.updateBallDisplay(message.data);
      } else if (message.type === 'floatingBall.toggle') {
        this.toggleBallVisibility(message.enabled);
      }
    });
  }

  async toggleBallVisibility(enabled) {
    if (enabled) {
      if (!this.ball) {
        this.createFloatingBall();
        this.loadWeatherData();
      } else {
        this.ball.style.display = 'flex';
      }
    } else {
      if (this.ball) {
        this.ball.style.display = 'none';
      }
    }
  }

  async init() {
    if (!this.shouldShow()) {
      return;
    }

    // 检查悬浮球是否启用（默认启用）
    try {
      const result = await chrome.storage.local.get(['floatingBallEnabled']);
      // 只有明确设置为false时才禁用，否则默认启用
      if (result.floatingBallEnabled === false) {
        console.log('Floating ball disabled by user setting');
        return;
      }
    } catch (error) {
      console.log('Failed to check floating ball state, defaulting to enabled:', error);
    }

    this.createFloatingBall();
    this.loadWeatherData();
    this.setupUpdateInterval();
    this.setupMessageListener();
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    if (this.ball && this.ball.parentNode) {
      this.ball.remove();
    }
    
    this.isVisible = false;
  }
}

// 初始化 - 确保在页面刷新后重新创建
function initFloatingBall() {
  if (window.aeScapeFloatingBall) {
    window.aeScapeFloatingBall.destroy();
  }
  window.aeScapeFloatingBall = new AeScapeFloatingBall();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFloatingBall);
} else {
  initFloatingBall();
}

// 监听页面变化，在SPA应用中重新初始化
let currentUrl = location.href;
new MutationObserver(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    setTimeout(() => {
      if (window.aeScapeFloatingBall && window.aeScapeFloatingBall.shouldShow()) {
        if (!document.getElementById('aescape-floating-ball')) {
          initFloatingBall();
        }
      }
    }, 1000);
  }
}).observe(document, { subtree: true, childList: true });
