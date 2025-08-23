/**
 * Content Script - 悬浮球注入
 * 在所有页面注入天气悬浮球
 */
class WeatherBallInjector {
  constructor() {
    this.isInjected = false
    this.iframe = null
    this.init()
  }

  async init() {
    try {
      // 检查是否应该注入
      if (this.shouldInject()) {
        await this.injectFloatingBall()
      }
    } catch (error) {
      console.error('悬浮球注入失败:', error)
    }
  }

  shouldInject() {
    // 不在以下页面注入：
    // - Chrome 扩展页面
    // - 文件页面
    // - 新标签页（已经有自己的天气界面）
    const url = window.location.href
    
    return !url.startsWith('chrome://') &&
           !url.startsWith('chrome-extension://') &&
           !url.startsWith('file://') &&
           !url.includes('chrome://newtab') &&
           !url.includes('newtab')
  }

  async injectFloatingBall() {
    if (this.isInjected) return
    
    try {
      // 创建 iframe
      this.iframe = document.createElement('iframe')
      this.iframe.src = chrome.runtime.getURL('src/floating-ball.html')
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
      `
      
      // 设置 iframe 属性
      this.iframe.frameBorder = '0'
      this.iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
      this.iframe.sandbox = 'allow-scripts allow-same-origin'
      
      // 监听 iframe 加载完成
      this.iframe.onload = () => {
        this.isInjected = true
        console.log('天气悬浮球注入成功')
      }
      
      // 注入到页面
      document.body.appendChild(this.iframe)
      
      // 监听来自 iframe 的消息
      window.addEventListener('message', this.handleMessage.bind(this))
      
      // 监听页面变化
      this.observePageChanges()
      
    } catch (error) {
      console.error('注入悬浮球失败:', error)
    }
  }

  handleMessage(event) {
    // 处理来自 iframe 的消息
    if (event.source === this.iframe.contentWindow) {
      switch (event.data.type) {
        case 'weatherBall.expand':
          this.handleExpand()
          break
        case 'weatherBall.collapse':
          this.handleCollapse()
          break
        case 'weatherBall.click':
          this.handleClick()
          break
      }
    }
  }

  handleExpand() {
    if (this.iframe) {
      this.iframe.style.width = '200px'
      this.iframe.style.height = '120px'
      this.iframe.style.borderRadius = '16px'
    }
  }

  handleCollapse() {
    if (this.iframe) {
      this.iframe.style.width = '60px'
      this.iframe.style.height = '60px'
      this.iframe.style.borderRadius = '50%'
    }
  }

  handleClick() {
    // 处理点击事件
    console.log('天气悬浮球被点击')
  }

  observePageChanges() {
    // 监听页面变化，确保悬浮球始终存在
    const observer = new MutationObserver((mutations) => {
      if (this.iframe && !document.body.contains(this.iframe)) {
        // 如果 iframe 被移除，重新注入
        document.body.appendChild(this.iframe)
      }
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: false
    })
  }

  remove() {
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe)
      this.iframe = null
      this.isInjected = false
    }
  }
}

// 自动注入
const weatherBallInjector = new WeatherBallInjector()

// 监听来自扩展的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'weatherBall.show':
      weatherBallInjector.injectFloatingBall()
      break
    case 'weatherBall.hide':
      weatherBallInjector.remove()
      break
    case 'weatherBall.toggle':
      if (weatherBallInjector.isInjected) {
        weatherBallInjector.remove()
      } else {
        weatherBallInjector.injectFloatingBall()
      }
      break
  }
})

// 导出用于调试
window.weatherBallInjector = weatherBallInjector