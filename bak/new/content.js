/**
 * 简化版 Content Script - 天气信息显示
 * 在页面注入简洁的天气信息
 */
class WeatherInjector {
  constructor() {
    this.weatherElement = null;
    this.isEnabled = true;
    this.init();
  }

  async init() {
    try {
      console.log('WeatherInjector init starting...');
      
      // 检查是否应该注入
      if (this.shouldInject()) {
        console.log('Injecting weather info...');
        await this.injectWeatherInfo();
      }
    } catch (error) {
      console.error('天气信息注入失败:', error);
    }
  }

  shouldInject() {
    // 不在扩展页面和文件页面注入
    const url = window.location.href;
    return !url.startsWith('chrome://') &&
           !url.startsWith('chrome-extension://') &&
           !url.startsWith('file://');
  }

  async injectWeatherInfo() {
    if (this.weatherElement) {
      console.log('Weather info already injected');
      return;
    }
    
    try {
      // 创建天气信息元素
      this.weatherElement = document.createElement('div');
      this.weatherElement.id = 'weather-info-widget';
      this.weatherElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.95);
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        color: #333;
        z-index: 9999;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        transition: all 0.3s ease;
      `;
      
      // 设置初始内容
      this.weatherElement.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span id="weather-icon">🌤️</span>
          <span id="weather-text">加载中...</span>
          <span id="weather-temp">--°</span>
        </div>
      `;
      
      // 添加到页面
      document.body.appendChild(this.weatherElement);
      
      // 加载天气数据
      await this.loadWeatherData();
      
      // 设置定时更新
      setInterval(() => this.loadWeatherData(), 5 * 60 * 1000); // 5分钟更新一次
      
      console.log('Weather info injected successfully');
      
    } catch (error) {
      console.error('注入天气信息失败:', error);
    }
  }

  async loadWeatherData() {
    try {
      // 获取天气数据
      const weatherResponse = await chrome.runtime.sendMessage({
        type: 'weather.getCurrent'
      });
      
      if (weatherResponse && weatherResponse.data) {
        const weather = weatherResponse.data;
        this.updateWeatherDisplay(weather);
      }
    } catch (error) {
      console.error('加载天气数据失败:', error);
      this.showError();
    }
  }

  updateWeatherDisplay(weather) {
    if (!weather || !this.weatherElement) return;
    
    const temp = Math.round(weather.env.temperature);
    const weatherCode = weather.weather.code;
    
    const weatherIcons = {
      clear: '☀️',
      cloudy: '☁️',
      rain: '🌧️',
      snow: '❄️',
      fog: '🌫️',
      thunderstorm: '⛈️'
    };
    
    const weatherText = {
      clear: '晴朗',
      cloudy: '多云',
      rain: '下雨',
      snow: '下雪',
      fog: '有雾',
      thunderstorm: '雷暴'
    };
    
    const iconElement = this.weatherElement.querySelector('#weather-icon');
    const textElement = this.weatherElement.querySelector('#weather-text');
    const tempElement = this.weatherElement.querySelector('#weather-temp');
    
    if (iconElement) iconElement.textContent = weatherIcons[weatherCode] || '🌤️';
    if (textElement) textElement.textContent = weatherText[weatherCode] || '未知';
    if (tempElement) tempElement.textContent = `${temp}°`;
  }

  showError() {
    if (!this.weatherElement) return;
    
    const iconElement = this.weatherElement.querySelector('#weather-icon');
    const textElement = this.weatherElement.querySelector('#weather-text');
    const tempElement = this.weatherElement.querySelector('#weather-temp');
    
    if (iconElement) iconElement.textContent = '❌';
    if (textElement) textElement.textContent = '加载失败';
    if (tempElement) tempElement.textContent = '--°';
  }

  remove() {
    if (this.weatherElement && this.weatherElement.parentNode) {
      this.weatherElement.parentNode.removeChild(this.weatherElement);
      this.weatherElement = null;
    }
  }
}

// 自动注入
const weatherInjector = new WeatherInjector();

// 导出用于调试
window.weatherInjector = weatherInjector;