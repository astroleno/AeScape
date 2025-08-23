/**
 * Chrome 扩展 Service Worker
 * 负责后台数据获取、缓存管理和消息推送
 */
import { weatherService } from './data/weather.js'
import { sunCalculator } from './data/sun.js'

class WeatherServiceWorker {
  constructor() {
    this.currentLocation = null
    this.currentWeather = null
    this.currentAirQuality = null
    this.updateInterval = null
    this.isInitialized = false
    
    this.init()
  }

  async init() {
    try {
      // 设置默认位置
      await this.setDefaultLocation()
      
      // 初始化数据
      await this.loadInitialData()
      
      // 设置定时更新
      this.setupScheduledUpdates()
      
      // 监听消息
      this.setupMessageListener()
      
      // 监听扩展安装/更新
      this.setupInstallListener()
      
      this.isInitialized = true
      console.log('Weather Service Worker initialized successfully')
      
    } catch (error) {
      console.error('Service Worker initialization failed:', error)
    }
  }

  async setDefaultLocation() {
    try {
      // 尝试从存储中获取位置
      const result = await chrome.storage.local.get(['location'])
      if (result.location) {
        this.currentLocation = result.location
        return
      }
      
      // 使用默认位置（北京）
      this.currentLocation = {
        lat: 39.9042,
        lon: 116.4074,
        name: '北京'
      }
      
      // 保存到存储
      await chrome.storage.local.set({ location: this.currentLocation })
      
    } catch (error) {
      console.error('设置默认位置失败:', error)
      this.currentLocation = { lat: 39.9042, lon: 116.4074, name: '北京' }
    }
  }

  async loadInitialData() {
    try {
      // 获取天气数据
      await this.updateWeatherData()
      
      // 获取空气质量数据
      await this.updateAirQualityData()
      
    } catch (error) {
      console.error('加载初始数据失败:', error)
    }
  }

  async updateWeatherData() {
    if (!this.currentLocation) return
    
    try {
      const weatherData = await weatherService.getCurrentWeather(
        this.currentLocation.lat,
        this.currentLocation.lon
      )
      
      // 获取太阳位置
      const sunPosition = sunCalculator.getSunPosition(
        this.currentLocation.lat,
        this.currentLocation.lon
      )
      
      // 构建天气状态
      this.currentWeather = {
        location: {
          ...this.currentLocation,
          timezone: weatherData.location.timezone
        },
        sun: {
          altitudeDeg: sunPosition.altitudeDeg,
          azimuthDeg: sunPosition.azimuthDeg
        },
        weather: {
          code: weatherService.mapWeatherCode(weatherData.current.weatherCode),
          precipIntensity: weatherData.hourly.precipitation / 10,
          precipType: weatherData.current.temperature < 0 ? 'snow' : 'rain',
          visibilityKm: weatherData.hourly.visibility,
          windSpeedMps: weatherData.current.windSpeed,
          windDirDeg: weatherData.current.windDirection,
          thunderProb: weatherData.current.weatherCode >= 95 ? 0.6 : 0
        },
        env: {
          isNight: !sunPosition.isDay,
          temperature: weatherData.current.temperature
        },
        timestamp: Date.now()
      }
      
      // 保存到存储
      await chrome.storage.local.set({ weather: this.currentWeather })
      
      // 通知所有页面
      this.broadcastWeatherUpdate()
      
    } catch (error) {
      console.error('更新天气数据失败:', error)
    }
  }

  async updateAirQualityData() {
    if (!this.currentLocation) return
    
    try {
      const airQualityData = await weatherService.getAirQuality(
        this.currentLocation.lat,
        this.currentLocation.lon
      )
      
      this.currentAirQuality = {
        ...airQualityData,
        location: this.currentLocation,
        timestamp: Date.now()
      }
      
      // 保存到存储
      await chrome.storage.local.set({ airQuality: this.currentAirQuality })
      
      // 通知所有页面
      this.broadcastAirQualityUpdate()
      
    } catch (error) {
      console.error('更新空气质量数据失败:', error)
    }
  }

  setupScheduledUpdates() {
    // 清除现有定时器
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }
    
    // 天气数据每 30 分钟更新一次
    this.updateInterval = setInterval(async () => {
      await this.updateWeatherData()
    }, 30 * 60 * 1000)
    
    // 空气质量数据每小时更新一次
    setInterval(async () => {
      await this.updateAirQualityData()
    }, 60 * 60 * 1000)
    
    // 太阳位置每分钟更新一次
    setInterval(async () => {
      await this.updateSunPosition()
    }, 60 * 1000)
  }

  async updateSunPosition() {
    if (!this.currentLocation || !this.currentWeather) return
    
    try {
      const sunPosition = sunCalculator.getSunPosition(
        this.currentLocation.lat,
        this.currentLocation.lon
      )
      
      this.currentWeather.sun = {
        altitudeDeg: sunPosition.altitudeDeg,
        azimuthDeg: sunPosition.azimuthDeg
      }
      
      this.currentWeather.env.isNight = !sunPosition.isDay
      
      // 保存到存储
      await chrome.storage.local.set({ weather: this.currentWeather })
      
      // 通知所有页面
      this.broadcastWeatherUpdate()
      
    } catch (error) {
      console.error('更新太阳位置失败:', error)
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse)
      return true // 保持消息通道开放
    })
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'weather.getCurrent':
          sendResponse({ success: true, data: this.currentWeather })
          break
          
        case 'airQuality.getCurrent':
          sendResponse({ success: true, data: this.currentAirQuality })
          break
          
        case 'location.getCurrent':
          sendResponse({ success: true, data: this.currentLocation })
          break
          
        case 'location.set':
          await this.setLocation(message.location)
          sendResponse({ success: true })
          break
          
        case 'weather.forceUpdate':
          await this.updateWeatherData()
          sendResponse({ success: true })
          break
          
        case 'airQuality.forceUpdate':
          await this.updateAirQualityData()
          sendResponse({ success: true })
          break
          
        default:
          sendResponse({ success: false, error: 'Unknown message type' })
      }
    } catch (error) {
      console.error('Message handling error:', error)
      sendResponse({ success: false, error: error.message })
    }
  }

  async setLocation(location) {
    this.currentLocation = location
    
    // 保存到存储
    await chrome.storage.local.set({ location: this.currentLocation })
    
    // 立即更新数据
    await this.updateWeatherData()
    await this.updateAirQualityData()
    
    // 清除缓存
    weatherService.clearCache()
    sunCalculator.clearCache()
  }

  setupInstallListener() {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        // 首次安装
        this.handleFirstInstall()
      } else if (details.reason === 'update') {
        // 扩展更新
        this.handleUpdate()
      }
    })
  }

  async handleFirstInstall() {
    try {
      // 设置默认位置
      await this.setDefaultLocation()
      
      // 获取初始数据
      await this.loadInitialData()
      
      // 打开欢迎页面
      chrome.tabs.create({
        url: chrome.runtime.getURL('src/welcome.html')
      })
      
    } catch (error) {
      console.error('首次安装处理失败:', error)
    }
  }

  async handleUpdate() {
    try {
      // 重新加载数据
      await this.loadInitialData()
      
      // 通知用户更新
      this.broadcastUpdateNotification()
      
    } catch (error) {
      console.error('更新处理失败:', error)
    }
  }

  broadcastWeatherUpdate() {
    chrome.runtime.sendMessage({
      type: 'weather.updated',
      data: this.currentWeather
    }).catch(() => {
      // 忽略错误（可能没有监听器）
    })
  }

  broadcastAirQualityUpdate() {
    chrome.runtime.sendMessage({
      type: 'airQuality.updated',
      data: this.currentAirQuality
    }).catch(() => {
      // 忽略错误（可能没有监听器）
    })
  }

  broadcastUpdateNotification() {
    chrome.runtime.sendMessage({
      type: 'extension.updated',
      data: { version: chrome.runtime.getManifest().version }
    }).catch(() => {
      // 忽略错误（可能没有监听器）
    })
  }

  // 获取当前状态（用于调试）
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasLocation: !!this.currentLocation,
      hasWeather: !!this.currentWeather,
      hasAirQuality: !!this.currentAirQuality,
      location: this.currentLocation,
      lastWeatherUpdate: this.currentWeather?.timestamp,
      lastAirQualityUpdate: this.currentAirQuality?.timestamp
    }
  }
}

// 创建 Service Worker 实例
const weatherWorker = new WeatherServiceWorker()

// 导出用于调试
self.weatherWorker = weatherWorker