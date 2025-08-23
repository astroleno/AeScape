// Weather Ball Script for 天景 AeScape
class WeatherBall {
  constructor() {
    this.isExpanded = false;
    this.currentWeather = null;
    this.currentLocation = null;
    
    this.init();
  }
  
  async init() {
    this.setupEventListeners();
    await this.loadWeatherData();
    this.setupAutoUpdate();
  }
  
  setupEventListeners() {
    const ball = document.getElementById('weatherBall');
    
    if (ball) {
      ball.addEventListener('click', () => {
        this.toggleExpand();
      });
    }
    
    // 点击外部收起
    document.addEventListener('click', (e) => {
      if (ball && !ball.contains(e.target) && this.isExpanded) {
        this.collapse();
      }
    });
    
    // 监听来自后台的消息
    if (chrome.runtime) {
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'weather.updated') {
          this.updateWeatherDisplay(message.data);
        }
      });
    }
    
    // 监听来自父窗口的消息
    window.addEventListener('message', (event) => {
      if (event.data.type === 'weatherBall.data') {
        console.log('WeatherBall: Received data from parent', event.data);
        this.currentWeather = event.data.weather;
        this.currentLocation = event.data.location;
        this.updateWeatherDisplay(event.data.weather);
      } else if (event.data.type === 'floatingBall.toggle') {
        if (event.data.enabled) {
          this.show();
        } else {
          this.hide();
        }
      }
    });
  }
  
  async loadWeatherData() {
    try {
      console.log('WeatherBall: Loading weather data...');
      
      // 通过父窗口请求数据
      if (window.parent && window.parent !== window) {
        console.log('WeatherBall: Requesting data from parent...');
        window.parent.postMessage({
          type: 'weatherBall.requestData'
        }, '*');
        
        // 设置超时，如果父窗口没有响应，显示错误
        setTimeout(() => {
          if (!this.currentWeather) {
            console.log('WeatherBall: No response from parent, showing error');
            this.showError();
          }
        }, 3000);
      } else {
        console.log('WeatherBall: No parent window, showing error');
        this.showError();
      }
      
    } catch (error) {
      console.error('加载天气数据失败:', error);
      this.showError();
    }
  }
  
  updateWeatherDisplay(weather) {
    if (!weather) return;
    
    const temp = Math.round(weather.env.temperature);
    const locationName = weather.location.name || '当前位置';
    const weatherCode = weather.weather.code;
    
    // 更新图标
    const iconMap = {
      clear: '☀️',
      cloudy: '☁️',
      rain: '🌧️',
      snow: '❄️',
      fog: '🌫️',
      thunderstorm: '⛈️'
    };
    
    const descriptionMap = {
      clear: '晴朗',
      cloudy: '多云',
      rain: '下雨',
      snow: '下雪',
      fog: '有雾',
      thunderstorm: '雷暴'
    };
    
    const weatherIcon = document.getElementById('weatherIcon');
    const weatherTemp = document.getElementById('weatherTemp');
    const weatherLocation = document.getElementById('weatherLocation');
    const weatherDescription = document.getElementById('weatherDescription');
    const weatherWind = document.getElementById('weatherWind');
    
    if (weatherIcon) weatherIcon.textContent = iconMap[weatherCode] || '🌤️';
    if (weatherTemp) weatherTemp.textContent = `${temp}°`;
    if (weatherLocation) weatherLocation.textContent = locationName;
    if (weatherDescription) weatherDescription.textContent = descriptionMap[weatherCode] || '未知';
    
    // 风力信息
    const windSpeed = weather.weather.windSpeedMps || 0;
    const windDir = weather.weather.windDirDeg || 0;
    if (weatherWind) {
      weatherWind.textContent = windSpeed > 0 ? `${windSpeed.toFixed(1)} m/s` : '无风';
    }
  }
  
  toggleExpand() {
    const ball = document.getElementById('weatherBall');
    if (!ball) return;
    
    this.isExpanded = !this.isExpanded;
    
    if (this.isExpanded) {
      ball.classList.add('expanded');
    } else {
      ball.classList.remove('expanded');
    }
  }
  
  collapse() {
    const ball = document.getElementById('weatherBall');
    if (!ball) return;
    
    ball.classList.remove('expanded');
    this.isExpanded = false;
  }
  
  setupAutoUpdate() {
    // 每 5 分钟更新一次
    setInterval(() => {
      this.loadWeatherData();
    }, 5 * 60 * 1000);
  }
  
  showError() {
    const weatherIcon = document.getElementById('weatherIcon');
    const weatherTemp = document.getElementById('weatherTemp');
    const weatherLocation = document.getElementById('weatherLocation');
    const weatherDescription = document.getElementById('weatherDescription');
    const weatherWind = document.getElementById('weatherWind');
    
    if (weatherIcon) weatherIcon.textContent = '❌';
    if (weatherTemp) weatherTemp.textContent = '--°';
    if (weatherLocation) weatherLocation.textContent = '加载失败';
    if (weatherDescription) weatherDescription.textContent = '无法获取天气数据';
    if (weatherWind) weatherWind.textContent = '--';
  }
  
  show() {
    const ball = document.getElementById('weatherBall');
    if (ball) {
      ball.style.display = 'flex';
    }
  }
  
  hide() {
    const ball = document.getElementById('weatherBall');
    if (ball) {
      ball.style.display = 'none';
    }
  }
}

// 启动悬浮球
document.addEventListener('DOMContentLoaded', () => {
  new WeatherBall();
});