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
        <div class="weather-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        </div>
        <div class="temperature">--°</div>
      </div>
      <div class="ball-tooltip">点击查看详细天气</div>
    `;

    // 基础样式
    Object.assign(this.ball.style, {
      position: 'fixed',
      bottom: '80px',
      right: '20px',
      width: '60px',
      height: '60px',
      background: 'rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '50%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      zIndex: '10000',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      userSelect: 'none',
      color: 'white',
      fontSize: '12px',
      fontWeight: '600'
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

    const icon = this.ball.querySelector('.weather-icon');
    Object.assign(icon.style, {
      fontSize: '18px',
      lineHeight: '1',
      marginBottom: '2px'
    });

    const temp = this.ball.querySelector('.temperature');
    Object.assign(temp.style, {
      fontSize: '10px',
      fontWeight: '600',
      lineHeight: '1'
    });

    const locationName = this.ball.querySelector('.location-name');
    Object.assign(locationName.style, {
      fontSize: '8px',
      opacity: '0.8',
      marginTop: '1px',
      maxWidth: '50px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    });

    const tooltip = this.ball.querySelector('.ball-tooltip');
    Object.assign(tooltip.style, {
      position: 'absolute',
      bottom: '70px',
      right: '0',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '6px 10px',
      borderRadius: '6px',
      fontSize: '11px',
      whiteSpace: 'nowrap',
      opacity: '0',
      visibility: 'hidden',
      transition: 'all 0.2s ease',
      pointerEvents: 'none',
      zIndex: '10001'
    });

    // 悬停效果
    this.ball.addEventListener('mouseenter', () => {
      this.ball.style.transform = 'scale(1.1)';
      this.ball.style.background = 'rgba(255, 255, 255, 0.25)';
      
      // 显示工具提示
      const tooltip = this.ball.querySelector('.ball-tooltip');
      if (tooltip) {
        tooltip.style.opacity = '1';
        tooltip.style.visibility = 'visible';
      }
    });

    this.ball.addEventListener('mouseleave', () => {
      this.ball.style.transform = 'scale(1)';
      this.ball.style.background = 'rgba(255, 255, 255, 0.15)';
      
      // 隐藏工具提示
      const tooltip = this.ball.querySelector('.ball-tooltip');
      if (tooltip) {
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
      }
    });

    // 点击事件
    this.ball.addEventListener('click', () => {
      this.showDetailPanel();
    });

    document.body.appendChild(this.ball);
    this.isVisible = true;

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
      if (saved) {
        const position = JSON.parse(saved);
        if (position.left !== undefined && position.top !== undefined) {
          this.ball.style.left = position.left + 'px';
          this.ball.style.top = position.top + 'px';
          this.ball.style.right = 'auto';
          this.ball.style.bottom = 'auto';
        }
      }
    } catch (error) {
      console.log('Failed to load saved position:', error);
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
      }
    } catch (error) {
      console.error('Failed to load weather data:', error);
      // 不显示错误状态，静默处理
      if (this.ball) {
        this.ball.style.display = 'none';
      }
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

  updateBallTheme(weatherCode, isNight) {
    if (!this.ball) return;

    let backgroundColor, borderColor;

    if (isNight) {
      backgroundColor = 'rgba(25, 25, 35, 0.8)';
      borderColor = 'rgba(100, 100, 120, 0.3)';
    } else {
      switch (weatherCode) {
        case 'clear':
          backgroundColor = 'rgba(255, 193, 7, 0.2)';
          borderColor = 'rgba(255, 193, 7, 0.4)';
          break;
        case 'rain':
          backgroundColor = 'rgba(54, 162, 235, 0.2)';
          borderColor = 'rgba(54, 162, 235, 0.4)';
          break;
        case 'snow':
          backgroundColor = 'rgba(255, 255, 255, 0.3)';
          borderColor = 'rgba(255, 255, 255, 0.5)';
          break;
        default:
          backgroundColor = 'rgba(255, 255, 255, 0.15)';
          borderColor = 'rgba(255, 255, 255, 0.2)';
      }
    }

    this.ball.style.background = backgroundColor;
    this.ball.style.borderColor = borderColor;
  }

  getWeatherSVG(code, isNight) {
    const svgs = {
      clear: isNight ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>` : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
      cloudy: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
      </svg>`,
      rain: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="16" y1="13" x2="16" y2="21"></line>
        <line x1="8" y1="13" x2="8" y2="21"></line>
        <line x1="12" y1="15" x2="12" y2="23"></line>
        <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>
      </svg>`,
      snow: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="2" y1="17" x2="22" y2="17"></line>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <line x1="2" y1="7" x2="22" y2="7"></line>
        <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>
      </svg>`,
      fog: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 15h18M3 9h18M3 21h18"></path>
      </svg>`,
      thunderstorm: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

    if (iconElement) iconElement.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>`;
    if (tempElement) tempElement.textContent = '--°';
  }

  showDetailPanel() {
    if (!this.weatherData) {
      this.loadWeatherData();
      return;
    }

    // 移除现有面板
    const existingPanel = document.getElementById('aescape-detail-panel');
    if (existingPanel) {
      existingPanel.remove();
    }

    const panel = document.createElement('div');
    panel.id = 'aescape-detail-panel';
    panel.innerHTML = this.generateDetailHTML(this.weatherData);

    Object.assign(panel.style, {
      position: 'fixed',
      bottom: '150px',
      right: '20px',
      width: '280px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '16px',
      padding: '20px',
      zIndex: '10001',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      transform: 'translateY(20px)',
      opacity: '0',
      transition: 'all 0.3s ease',
      color: '#333'
    });

    // 关闭按钮
    const closeBtn = document.createElement('div');
    closeBtn.innerHTML = '×';
    Object.assign(closeBtn.style, {
      position: 'absolute',
      top: '10px',
      right: '15px',
      fontSize: '20px',
      cursor: 'pointer',
      color: '#666',
      transition: 'color 0.2s ease'
    });
    
    closeBtn.addEventListener('click', () => panel.remove());
    panel.appendChild(closeBtn);

    document.body.appendChild(panel);

    // 显示动画
    requestAnimationFrame(() => {
      panel.style.opacity = '1';
      panel.style.transform = 'translateY(0)';
    });

    // 添加点击外部关闭功能
    this.setupPanelCloseHandler(panel);
  }

  setupPanelCloseHandler(panel) {
    const closePanel = () => {
      panel.style.opacity = '0';
      panel.style.transform = 'translateY(20px)';
      setTimeout(() => {
        if (panel.parentNode) {
          panel.parentNode.removeChild(panel);
        }
      }, 300);
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleEscKey);
    };

    const handleOutsideClick = (event) => {
      if (!panel.contains(event.target) && !this.ball.contains(event.target)) {
        closePanel();
      }
    };

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        closePanel();
      }
    };

    // 延迟添加事件监听器，避免立即触发
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
      document.addEventListener('keydown', handleEscKey);
    }, 100);
  }
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

    return `
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="font-size: 24px; margin-bottom: 4px;">${this.getWeatherIconLarge(weather.weather?.code, weather.env?.isNight)}</div>
        <div style="font-size: 18px; font-weight: 600; margin-bottom: 2px;">${Math.round(weather.env?.temperature || 0)}°C</div>
        <div style="font-size: 14px; color: #666;">${weatherDescriptions[weather.weather?.code] || '未知天气'}</div>
        <div style="font-size: 12px; color: #999; margin-top: 4px;">${weather.location?.name || '未知位置'}</div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #666;">体感温度</span>
          <span style="font-weight: 500;">${Math.round(weather.env?.feelsLike || weather.env?.temperature || 0)}°C</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #666;">湿度</span>
          <span style="font-weight: 500;">${weather.weather?.humidity || '--'}%</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #666;">风速</span>
          <span style="font-weight: 500;">${Math.round((weather.weather?.windSpeedMps || 0) * 3.6)} km/h</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #666;">风向</span>
          <span style="font-weight: 500;">${windDirection}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #666;">能见度</span>
          <span style="font-weight: 500;">${weather.weather?.visibilityKm || '--'} km</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #666;">气压</span>
          <span style="font-weight: 500;">${weather.weather?.pressure || '--'} hPa</span>
        </div>
      </div>
      
      <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.1); text-align: center;">
        <div style="font-size: 11px; color: #999;">
          更新时间：${weather.timestamp ? new Date(weather.timestamp).toLocaleTimeString('zh-CN') : '--'}
        </div>
      </div>
    `;
  }

  getWeatherIconLarge(code, isNight) {
    return this.getWeatherSVG(code, isNight).replace('width="18" height="18"', 'width="32" height="32"');
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

    // 检查悬浮球是否启用
    try {
      const result = await chrome.storage.local.get(['floatingBallEnabled']);
      if (result.floatingBallEnabled === false) {
        return; // 如果禁用则不创建悬浮球
      }
    } catch (error) {
      console.log('Failed to check floating ball state:', error);
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

// 初始化
if (!window.aeScapeFloatingBall) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.aeScapeFloatingBall = new AeScapeFloatingBall();
    });
  } else {
    window.aeScapeFloatingBall = new AeScapeFloatingBall();
  }
}
