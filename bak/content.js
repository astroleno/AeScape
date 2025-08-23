/**
 * Content Script - 悬浮球注入
 * 在所有页面注入天气悬浮球
 */
class WeatherBallInjector {
  constructor() {
    this.isInjected = false;
    this.iframe = null;
    this.isEnabled = false;
    this.init();
  }

  async init() {
    try {
      console.log('WeatherBallInjector init starting...');
      
      // 检查设置
      console.log('Checking settings...');
      await this.checkSettings();
      
      // 检查是否应该注入
      const shouldInject = this.shouldInject();
      console.log('Should inject:', shouldInject);
      console.log('Is enabled:', this.isEnabled);
      
      if (shouldInject && this.isEnabled) {
        console.log('Injecting floating ball...');
        await this.injectFloatingBall();
      } else {
        console.log('Floating ball not injected - shouldInject:', shouldInject, 'enabled:', this.isEnabled);
      }
    } catch (error) {
      console.error('悬浮球注入失败:', error);
    }
  }

  async checkSettings() {
    try {
      const result = await chrome.storage.sync.get(['floatingBallEnabled']);
      this.isEnabled = result.floatingBallEnabled !== false; // 默认开启
      console.log('Floating ball enabled:', this.isEnabled);
    } catch (error) {
      console.error('获取设置失败:', error);
      this.isEnabled = true; // 默认开启
    }
  }

  shouldInject() {
    // 不在以下页面注入：
    // - Chrome 扩展页面
    // - 文件页面
    const url = window.location.href;
    
    const shouldInject = !url.startsWith('chrome://') &&
           !url.startsWith('chrome-extension://') &&
           !url.startsWith('file://');
    
    console.log('shouldInject check:', { url, shouldInject });
    
    return shouldInject;
  }

  async injectFloatingBall() {
    if (this.isInjected) {
      console.log('Floating ball already injected');
      return;
    }
    
    try {
      console.log('Creating floating ball iframe...');
      
      // 创建 iframe
      this.iframe = document.createElement('iframe');
      const iframeUrl = chrome.runtime.getURL('src/floating-ball.html');
      console.log('Floating ball URL:', iframeUrl);
      
      this.iframe.src = iframeUrl;
      this.iframe.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border: none;
        border-radius: 50%;
        z-index: 9999;
        background: transparent;
        box-shadow: none;
        transition: all 0.3s ease;
      `;
      
      // 设置 iframe 属性
      this.iframe.frameBorder = '0';
      this.iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      this.iframe.sandbox = 'allow-scripts allow-same-origin';
      
      // 监听 iframe 加载完成
      this.iframe.onload = () => {
        this.isInjected = true;
        console.log('天气悬浮球注入成功');
      };
      
      // 监听 iframe 错误
      this.iframe.onerror = (error) => {
        console.error('Floating ball iframe error:', error);
      };
      
      // 注入到页面
      console.log('Appending iframe to document body...');
      document.body.appendChild(this.iframe);
      
      // 监听来自 iframe 的消息
      window.addEventListener('message', this.handleMessage.bind(this));
      
      // 监听页面变化
      this.observePageChanges();
      
      console.log('Floating ball injection process completed');
      
    } catch (error) {
      console.error('注入悬浮球失败:', error);
    }
  }

  handleMessage(event) {
    // 处理来自 iframe 的消息
    if (event.source === this.iframe.contentWindow) {
      switch (event.data.type) {
        case 'weatherBall.expand':
          this.handleExpand();
          break;
        case 'weatherBall.collapse':
          this.handleCollapse();
          break;
        case 'weatherBall.click':
          this.handleClick();
          break;
        case 'weatherBall.requestData':
          this.handleDataRequest();
          break;
      }
    }
  }

  handleExpand() {
    if (this.iframe) {
      this.iframe.style.width = '200px';
      this.iframe.style.height = '120px';
      this.iframe.style.borderRadius = '16px';
    }
  }

  handleCollapse() {
    if (this.iframe) {
      this.iframe.style.width = '60px';
      this.iframe.style.height = '60px';
      this.iframe.style.borderRadius = '50%';
    }
  }

  handleClick() {
    // 处理点击事件
    console.log('天气悬浮球被点击');
  }

  async handleDataRequest() {
    try {
      console.log('Handling data request from floating ball...');
      
      // 获取天气数据
      const weatherResponse = await chrome.runtime.sendMessage({
        type: 'weather.getCurrent'
      });
      
      // 获取位置数据
      const locationResponse = await chrome.runtime.sendMessage({
        type: 'location.getCurrent'
      });
      
      console.log('Weather response:', weatherResponse);
      console.log('Location response:', locationResponse);
      
      // 发送数据给 iframe
      if (this.iframe && this.iframe.contentWindow) {
        this.iframe.contentWindow.postMessage({
          type: 'weatherBall.data',
          weather: weatherResponse?.data || null,
          location: locationResponse?.data || null
        }, '*');
        
        console.log('Data sent to floating ball');
      }
      
    } catch (error) {
      console.error('Failed to handle data request:', error);
      
      // 发送错误信息
      if (this.iframe && this.iframe.contentWindow) {
        this.iframe.contentWindow.postMessage({
          type: 'weatherBall.data',
          weather: null,
          location: null
        }, '*');
      }
    }
  }

  observePageChanges() {
    // 监听页面变化，确保悬浮球始终存在
    const observer = new MutationObserver((mutations) => {
      if (this.iframe && !document.body.contains(this.iframe)) {
        // 如果 iframe 被移除，重新注入
        document.body.appendChild(this.iframe);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: false
    });
  }

  remove() {
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
      this.iframe = null;
      this.isInjected = false;
    }
  }

  notifyToggleState(enabled) {
    if (this.iframe && this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage({
        type: 'floatingBall.toggle',
        enabled: enabled
      }, '*');
    }
  }

  async toggle() {
    await this.checkSettings();
    
    if (this.isEnabled && !this.isInjected && this.shouldInject()) {
      await this.injectFloatingBall();
    } else if (!this.isEnabled && this.isInjected) {
      this.remove();
    } else if (this.isEnabled && this.isInjected) {
      // 如果已经注入且启用，通知 iframe 显示状态
      this.notifyToggleState(true);
    }
  }
}

// 自动注入
const weatherBallInjector = new WeatherBallInjector();

// 监听来自扩展的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'floatingBall.toggle':
      weatherBallInjector.toggle();
      break;
    case 'weatherBall.show':
      weatherBallInjector.injectFloatingBall();
      break;
    case 'weatherBall.hide':
      weatherBallInjector.remove();
      break;
  }
});

// 监听设置变化
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.floatingBallEnabled) {
    weatherBallInjector.toggle();
  }
});

// 导出用于调试
window.weatherBallInjector = weatherBallInjector;