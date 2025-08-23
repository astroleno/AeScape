// Settings Page Script for 天景 AeScape
class SettingsPage {
  constructor() {
    this.init();
  }
  
  async init() {
    this.setupEventListeners();
    await this.loadSettings();
    await this.loadCurrentLocation();
  }
  
  setupEventListeners() {
    // 位置设置
    const setLocationBtn = document.getElementById('set-location-btn');
    const locationInput = document.getElementById('location-input');
    
    if (setLocationBtn) {
      setLocationBtn.addEventListener('click', () => {
        this.setLocation();
      });
    }
    
    if (locationInput) {
      locationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.setLocation();
        }
      });
    }
    
    // 功能开关
    const floatingBallToggle = document.getElementById('floating-ball-toggle');
    const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
    const detailedWeatherToggle = document.getElementById('detailed-weather-toggle');
    const weatherEngineToggle = document.getElementById('weather-engine-toggle');
    
    if (floatingBallToggle) {
      floatingBallToggle.addEventListener('change', (e) => {
        this.saveSetting('floatingBallEnabled', e.target.checked);
        this.toggleFloatingBall(e.target.checked);
      });
    }
    
    if (autoRefreshToggle) {
      autoRefreshToggle.addEventListener('change', (e) => {
        this.saveSetting('autoRefreshEnabled', e.target.checked);
      });
    }
    
    if (detailedWeatherToggle) {
      detailedWeatherToggle.addEventListener('change', (e) => {
        this.saveSetting('detailedWeatherEnabled', e.target.checked);
      });
    }
    
    if (weatherEngineToggle) {
      weatherEngineToggle.addEventListener('change', (e) => {
        this.saveSetting('weatherEngineEnabled', e.target.checked);
        this.toggleWeatherEngineLink(e.target.checked);
      });
    }
    
    // 数据管理
    const refreshWeatherBtn = document.getElementById('refresh-weather-btn');
    const clearCacheBtn = document.getElementById('clear-cache-btn');
    
    if (refreshWeatherBtn) {
      refreshWeatherBtn.addEventListener('click', () => {
        this.refreshWeather();
      });
    }
    
    if (clearCacheBtn) {
      clearCacheBtn.addEventListener('click', () => {
        this.clearCache();
      });
    }
    
    // API 配置
    const openWeatherApiKeyInput = document.getElementById('openweather-apikey');
    const saveApiKeyBtn = document.getElementById('save-apikey-btn');
    
    // 天气引擎功能
    const weatherEngineBtn = document.getElementById('weather-engine-btn');
    
    if (weatherEngineBtn) {
      weatherEngineBtn.addEventListener('click', () => {
        this.openWeatherEngine();
      });
    }

    // API 测试
    const testWeatherApiBtn = document.getElementById('test-weather-api-btn');
    const testGeocodingApiBtn = document.getElementById('test-geocoding-api-btn');
    const testOpenWeatherApiBtn = document.getElementById('test-openweather-api-btn');
    const testCustomApiBtn = document.getElementById('test-custom-api-btn');
    const customApiUrl = document.getElementById('custom-api-url');
    
    if (testWeatherApiBtn) {
      testWeatherApiBtn.addEventListener('click', () => {
        this.testWeatherAPI();
      });
    }
    
    if (testGeocodingApiBtn) {
      testGeocodingApiBtn.addEventListener('click', () => {
        this.testGeocodingAPI();
      });
    }
    
    if (testOpenWeatherApiBtn) {
      testOpenWeatherApiBtn.addEventListener('click', () => {
        this.testOpenWeatherMapAPI();
      });
    }
    
    if (testCustomApiBtn) {
      testCustomApiBtn.addEventListener('click', () => {
        this.testCustomAPI();
      });
    }
    
    if (customApiUrl) {
      customApiUrl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.testCustomAPI();
        }
      });
    }
    
    if (saveApiKeyBtn) {
      saveApiKeyBtn.addEventListener('click', () => {
        this.saveApiKey();
      });
    }
    
    if (openWeatherApiKeyInput) {
      openWeatherApiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.saveApiKey();
        }
      });
    }
  }
  
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'floatingBallEnabled',
        'autoRefreshEnabled',
        'detailedWeatherEnabled',
        'weatherEngineEnabled',
        'openWeatherApiKey'
      ]);
      
      console.log('Loaded settings:', result);
      
      const floatingBallToggle = document.getElementById('floating-ball-toggle');
      const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
      const detailedWeatherToggle = document.getElementById('detailed-weather-toggle');
      
      if (floatingBallToggle) {
        floatingBallToggle.checked = result.floatingBallEnabled !== false; // 默认开启
        console.log('Floating ball toggle set to:', floatingBallToggle.checked);
      }
      
      if (autoRefreshToggle) {
        autoRefreshToggle.checked = result.autoRefreshEnabled !== false;
      }
      
      if (detailedWeatherToggle) {
        detailedWeatherToggle.checked = result.detailedWeatherEnabled !== false;
      }
      
      // 加载天气引擎设置
      const weatherEngineToggle = document.getElementById('weather-engine-toggle');
      if (weatherEngineToggle) {
        weatherEngineToggle.checked = result.weatherEngineEnabled || false;
        this.toggleWeatherEngineLink(weatherEngineToggle.checked);
      }
      
      // 加载 OpenWeatherMap API Key
      const openWeatherApiKeyInput = document.getElementById('openweather-apikey');
      if (openWeatherApiKeyInput) {
        openWeatherApiKeyInput.value = result.openWeatherApiKey || '';
      }
      
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  }
  
  async loadCurrentLocation() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'location.getCurrent'
      });
      
      if (response.success && response.data) {
        const location = response.data;
        const currentLocationElement = document.getElementById('current-location');
        const locationInput = document.getElementById('location-input');
        
        if (currentLocationElement) {
          currentLocationElement.textContent = `${location.name} (${location.lat.toFixed(2)}, ${location.lon.toFixed(2)})`;
        }
        
        if (locationInput) {
          locationInput.value = location.name || '';
        }
      }
    } catch (error) {
      console.error('加载位置失败:', error);
    }
  }
  
  async saveSetting(key, value) {
    try {
      await chrome.storage.sync.set({ [key]: value });
      console.log(`设置已保存: ${key} = ${value}`);
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  }
  
  async saveApiKey() {
    const input = document.getElementById('openweather-apikey');
    const statusDiv = document.getElementById('apikey-status');
    
    if (!input || !statusDiv) return;
    
    const apiKey = input.value.trim();
    
    if (!apiKey) {
      this.showApiKeyStatus('请输入 API Key', 'error');
      return;
    }
    
    // 简单的 API Key 格式验证
    if (apiKey.length < 16) {
      this.showApiKeyStatus('API Key 格式不正确', 'error');
      return;
    }
    
    try {
      await this.saveSetting('openWeatherApiKey', apiKey);
      this.showApiKeyStatus('API Key 已保存', 'success');
      
      // 测试 API Key 是否有效
      setTimeout(() => {
        this.testApiKey(apiKey);
      }, 1000);
      
    } catch (error) {
      console.error('保存 API Key 失败:', error);
      this.showApiKeyStatus('保存失败，请重试', 'error');
    }
  }
  
  async testApiKey(apiKey) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=Shanghai&appid=${apiKey}&units=metric`;
      const response = await fetch(url);
      
      if (response.ok) {
        this.showApiKeyStatus('✅ API Key 验证成功', 'success');
      } else {
        const data = await response.json();
        this.showApiKeyStatus(`❌ API Key 无效: ${data.message}`, 'error');
      }
    } catch (error) {
      this.showApiKeyStatus('❌ API Key 测试失败', 'error');
    }
  }
  
  showApiKeyStatus(message, type) {
    const statusDiv = document.getElementById('apikey-status');
    if (!statusDiv) return;
    
    statusDiv.className = `status ${type}`;
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
  
  async setLocation() {
    const input = document.getElementById('location-input');
    const statusDiv = document.getElementById('location-status');
    
    if (!input || !statusDiv) return;
    
    const locationName = input.value.trim();
    
    if (!locationName) {
      this.showStatus('请输入城市名称', 'error');
      return;
    }
    
    try {
      // 先尝试地理编码
      const geocodeResult = await this.geocodeLocation(locationName);
      
      if (geocodeResult.length > 0) {
        const location = {
          lat: geocodeResult[0].latitude,
          lon: geocodeResult[0].longitude,
          name: geocodeResult[0].name
        };
        
        await chrome.runtime.sendMessage({
          type: 'location.set',
          location
        });
        
        this.showStatus(`位置已设置为: ${location.name}`, 'success');
        
        // 更新当前位置显示
        setTimeout(() => {
          this.loadCurrentLocation();
        }, 1000);
        
      } else {
        this.showStatus('未找到该城市，请检查输入', 'error');
      }
    } catch (error) {
      console.error('设置位置失败:', error);
      this.showStatus('设置位置失败，请重试', 'error');
    }
  }
  
  async geocodeLocation(name) {
    try {
      const params = new URLSearchParams({
        name: name,
        count: '1',
        language: 'zh',
        format: 'json'
      });

      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
      const data = await response.json();
      
      if (!response.ok || !data.results) {
        return [];
      }

      return data.results.map(result => ({
        name: result.name,
        lat: result.latitude,
        lon: result.longitude,
        country: result.country,
        admin1: result.admin1
      }));
    } catch (error) {
      console.error('Geocoding Error:', error);
      return [];
    }
  }
  
  toggleWeatherEngineLink(enabled) {
    const weatherEngineLink = document.getElementById('weather-engine-link');
    if (weatherEngineLink) {
      weatherEngineLink.style.display = enabled ? 'flex' : 'none';
    }
  }
  
  async toggleFloatingBall(enabled) {
    try {
      // 向所有标签页发送消息
      const tabs = await chrome.tabs.query({});
      
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'floatingBall.toggle',
            enabled: enabled
          });
        } catch (error) {
          // 忽略无法发送消息的标签页
        }
      }
    } catch (error) {
      console.error('切换悬浮球失败:', error);
    }
  }
  
  async refreshWeather() {
    const btn = document.getElementById('refresh-weather-btn');
    if (!btn) return;
    
    const originalText = btn.textContent;
    btn.textContent = '刷新中...';
    btn.disabled = true;
    
    try {
      await chrome.runtime.sendMessage({
        type: 'weather.forceUpdate'
      });
      
      this.showStatus('天气数据已更新', 'success');
    } catch (error) {
      console.error('刷新天气失败:', error);
      this.showStatus('刷新失败，请重试', 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }
  
  async clearCache() {
    try {
      // 清除所有存储数据
      await chrome.storage.local.clear();
      await chrome.storage.sync.clear();
      
      // 重新初始化默认设置
      await chrome.storage.sync.set({
        floatingBallEnabled: false,
        autoRefreshEnabled: true,
        detailedWeatherEnabled: true
      });
      
      this.showStatus('缓存已清除', 'success');
      
      // 重新加载数据
      setTimeout(() => {
        this.loadSettings();
        this.loadCurrentLocation();
      }, 1000);
      
    } catch (error) {
      console.error('清除缓存失败:', error);
      this.showStatus('清除缓存失败，请重试', 'error');
    }
  }
  
  showStatus(message, type) {
    const statusDiv = document.getElementById('location-status');
    if (!statusDiv) return;
    
    statusDiv.className = `status ${type}`;
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
  
  async testWeatherAPI() {
    const resultsDiv = document.getElementById('api-test-results');
    const btn = document.getElementById('test-weather-api-btn');
    
    if (!resultsDiv || !btn) return;
    
    const originalText = btn.textContent;
    btn.textContent = '测试中...';
    btn.disabled = true;
    
    try {
      // 创建测试结果显示
      const resultDiv = document.createElement('div');
      resultDiv.className = 'status loading';
      resultDiv.innerHTML = '正在测试 Open-Meteo 天气 API...';
      resultsDiv.appendChild(resultDiv);
      
      const params = new URLSearchParams({
        latitude: '31.2304',
        longitude: '121.4737',
        current_weather: 'true',
        hourly: 'temperature_2m,relativehumidity_2m,apparent_temperature,precipitation_probability,precipitation,weathercode,cloudcover,visibility,windspeed_10m,winddirection_10m,uv_index',
        daily: 'sunrise,sunset',
        timezone: 'auto'
      });
      
      const url = `https://api.open-meteo.com/v1/forecast?${params}`;
      console.log('Testing weather API:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        resultDiv.className = 'status success';
        resultDiv.innerHTML = `
          <strong>✅ 天气 API 测试成功</strong><br>
          状态码: ${response.status}<br>
          当前温度: ${data.current_weather.temperature}°C<br>
          天气代码: ${data.current_weather.weathercode}<br>
          响应时间: ${new Date().toLocaleTimeString()}
        `;
        console.log('Weather API Response:', data);
      } else {
        throw new Error(`HTTP ${response.status}: ${data.reason || 'Unknown error'}`);
      }
      
    } catch (error) {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'status error';
      resultDiv.innerHTML = `<strong>❌ 天气 API 测试失败</strong><br>错误: ${error.message}`;
      resultsDiv.appendChild(resultDiv);
      console.error('Weather API Error:', error);
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
      
      // 5秒后清除测试结果
      setTimeout(() => {
        if (resultsDiv.contains(resultDiv)) {
          resultsDiv.removeChild(resultDiv);
        }
      }, 5000);
    }
  }
  
  async testGeocodingAPI() {
    const resultsDiv = document.getElementById('api-test-results');
    const btn = document.getElementById('test-geocoding-api-btn');
    
    if (!resultsDiv || !btn) return;
    
    const originalText = btn.textContent;
    btn.textContent = '测试中...';
    btn.disabled = true;
    
    try {
      // 创建测试结果显示
      const resultDiv = document.createElement('div');
      resultDiv.className = 'status loading';
      resultDiv.innerHTML = '正在测试地理编码 API...';
      resultsDiv.appendChild(resultDiv);
      
      const params = new URLSearchParams({
        name: '上海',
        count: '1',
        language: 'zh'
      });
      
      const url = `https://geocoding-api.open-meteo.com/v1/search?${params}`;
      console.log('Testing geocoding API:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok && data.results && data.results.length > 0) {
        const location = data.results[0];
        resultDiv.className = 'status success';
        resultDiv.innerHTML = `
          <strong>✅ 地理编码 API 测试成功</strong><br>
          状态码: ${response.status}<br>
          找到位置: ${location.name}, ${location.country}<br>
          坐标: ${location.latitude}, ${location.longitude}<br>
          响应时间: ${new Date().toLocaleTimeString()}
        `;
        console.log('Geocoding API Response:', data);
      } else {
        throw new Error('未找到位置数据');
      }
      
    } catch (error) {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'status error';
      resultDiv.innerHTML = `<strong>❌ 地理编码 API 测试失败</strong><br>错误: ${error.message}`;
      resultsDiv.appendChild(resultDiv);
      console.error('Geocoding API Error:', error);
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
      
      // 5秒后清除测试结果
      setTimeout(() => {
        const loadingResults = resultsDiv.querySelectorAll('.status.loading');
        loadingResults.forEach(result => {
          if (resultsDiv.contains(result)) {
            resultsDiv.removeChild(result);
          }
        });
      }, 5000);
    }
  }
  
  async testOpenWeatherMapAPI() {
    const resultsDiv = document.getElementById('api-test-results');
    const btn = document.getElementById('test-openweather-api-btn');
    
    if (!resultsDiv || !btn) return;
    
    // 获取存储的 API Key
    const result = await chrome.storage.sync.get(['openWeatherApiKey']);
    const apiKey = result.openWeatherApiKey;
    
    if (!apiKey) {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'status error';
      resultDiv.innerHTML = '<strong>❌ 请先设置 OpenWeatherMap API Key</strong>';
      resultsDiv.appendChild(resultDiv);
      
      setTimeout(() => {
        if (resultsDiv.contains(resultDiv)) {
          resultsDiv.removeChild(resultDiv);
        }
      }, 3000);
      return;
    }
    
    const originalText = btn.textContent;
    btn.textContent = '测试中...';
    btn.disabled = true;
    
    try {
      // 创建测试结果显示
      const resultDiv = document.createElement('div');
      resultDiv.className = 'status loading';
      resultDiv.innerHTML = '正在测试 OpenWeatherMap API...';
      resultsDiv.appendChild(resultDiv);
      
      const city = 'Shanghai';
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
      
      console.log('Testing OpenWeatherMap API:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        resultDiv.className = 'status success';
        resultDiv.innerHTML = `
          <strong>✅ OpenWeatherMap API 测试成功</strong><br>
          状态码: ${response.status}<br>
          城市: ${data.name}, ${data.sys.country}<br>
          温度: ${data.main.temp}°C<br>
          天气: ${data.weather[0].description}<br>
          湿度: ${data.main.humidity}%<br>
          风速: ${data.wind.speed} m/s<br>
          响应时间: ${new Date().toLocaleTimeString()}
        `;
        console.log('OpenWeatherMap API Response:', data);
      } else {
        throw new Error(`HTTP ${response.status}: ${data.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'status error';
      resultDiv.innerHTML = `<strong>❌ OpenWeatherMap API 测试失败</strong><br>错误: ${error.message}`;
      resultsDiv.appendChild(resultDiv);
      console.error('OpenWeatherMap API Error:', error);
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
      
      // 5秒后清除测试结果
      setTimeout(() => {
        if (resultsDiv.contains(resultDiv)) {
          resultsDiv.removeChild(resultDiv);
        }
      }, 5000);
    }
  }
  
  async testCustomAPI() {
    const resultsDiv = document.getElementById('api-test-results');
    const btn = document.getElementById('test-custom-api-btn');
    const urlInput = document.getElementById('custom-api-url');
    
    if (!resultsDiv || !btn || !urlInput) return;
    
    const url = urlInput.value.trim();
    
    if (!url) {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'status error';
      resultDiv.innerHTML = '<strong>❌ 请输入 API URL</strong>';
      resultsDiv.appendChild(resultDiv);
      
      setTimeout(() => {
        if (resultsDiv.contains(resultDiv)) {
          resultsDiv.removeChild(resultDiv);
        }
      }, 3000);
      return;
    }
    
    // 验证 URL 格式
    try {
      new URL(url);
    } catch (error) {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'status error';
      resultDiv.innerHTML = '<strong>❌ 无效的 URL 格式</strong>';
      resultsDiv.appendChild(resultDiv);
      
      setTimeout(() => {
        if (resultsDiv.contains(resultDiv)) {
          resultsDiv.removeChild(resultDiv);
        }
      }, 3000);
      return;
    }
    
    const originalText = btn.textContent;
    btn.textContent = '测试中...';
    btn.disabled = true;
    
    try {
      // 创建测试结果显示
      const resultDiv = document.createElement('div');
      resultDiv.className = 'status loading';
      resultDiv.innerHTML = `正在测试: ${url}`;
      resultsDiv.appendChild(resultDiv);
      
      console.log('Testing custom API:', url);
      
      // 测试 API 连通性
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'AeScape/1.0.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
        // 如果文本太长，截断显示
        if (responseData.length > 200) {
          responseData = responseData.substring(0, 200) + '...';
        }
      }
      
      if (response.ok) {
        resultDiv.className = 'status success';
        resultDiv.innerHTML = `
          <strong>✅ 自定义 API 测试成功</strong><br>
          URL: ${url}<br>
          状态码: ${response.status}<br>
          响应类型: ${contentType || 'unknown'}<br>
          响应时间: ${new Date().toLocaleTimeString()}<br>
          <small>响应数据: ${typeof responseData === 'object' ? JSON.stringify(responseData).substring(0, 100) + '...' : responseData}</small>
        `;
        console.log('Custom API Response:', responseData);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'status error';
      
      let errorMessage = error.message;
      if (error.name === 'AbortError') {
        errorMessage = '请求超时 (10秒)';
      } else if (error.name === 'TypeError') {
        errorMessage = '网络错误或 CORS 限制';
      }
      
      resultDiv.innerHTML = `<strong>❌ 自定义 API 测试失败</strong><br>URL: ${url}<br>错误: ${errorMessage}`;
      resultsDiv.appendChild(resultDiv);
      console.error('Custom API Error:', error);
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
      
      // 10秒后清除测试结果
      setTimeout(() => {
        if (resultsDiv.contains(resultDiv)) {
          resultsDiv.removeChild(resultDiv);
        }
      }, 10000);
    }
  }
  
  // 天气引擎功能方法
  openWeatherEngine() {
    window.open('src/weather-engine-control.html', '_blank');
  }
}

// 初始化设置页面
document.addEventListener('DOMContentLoaded', () => {
  new SettingsPage();
});