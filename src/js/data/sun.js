import { getTimes, getPosition } from 'suncalc'

/**
 * 太阳位置计算模块
 * 基于 suncalc 库计算真实的太阳高度角和方位角
 */
export class SunCalculator {
  constructor() {
    this.cache = new Map()
    this.lastUpdate = 0
    this.cacheTimeout = 60000 // 1分钟缓存
  }

  /**
   * 获取太阳位置
   * @param {number} lat 纬度
   * @param {number} lon 经度
   * @param {Date} date 日期时间
   * @returns {Object} { altitudeDeg, azimuthDeg, isDay }
   */
  getSunPosition(lat, lon, date = new Date()) {
    const now = Date.now()
    const cacheKey = `${lat.toFixed(4)}_${lon.toFixed(4)}_${Math.floor(date.getTime() / 60000)}`
    
    // 检查缓存
    if (this.cache.has(cacheKey) && (now - this.lastUpdate) < this.cacheTimeout) {
      return this.cache.get(cacheKey)
    }

    // 计算太阳位置
    const position = getPosition(date, lat, lon)
    
    // 转换为度数
    const altitudeDeg = position.altitude * 180 / Math.PI
    const azimuthDeg = position.azimuth * 180 / Math.PI
    
    // 计算日出日落时间
    const times = getTimes(date, lat, lon)
    const sunrise = times.sunrise.getTime()
    const sunset = times.sunset.getTime()
    const currentTime = date.getTime()
    
    // 判断是否为白天
    const isDay = currentTime >= sunrise && currentTime <= sunset
    
    const result = {
      altitudeDeg: Math.round(altitudeDeg * 100) / 100,
      azimuthDeg: Math.round(azimuthDeg * 100) / 100,
      isDay,
      sunrise,
      sunset
    }
    
    // 缓存结果
    this.cache.set(cacheKey, result)
    this.lastUpdate = now
    
    return result
  }

  /**
   * 获取太阳详细信息
   * @param {number} lat 纬度
   * @param {number} lon 经度
   * @param {Date} date 日期时间
   * @returns {Object} 完整的太阳信息
   */
  getSunInfo(lat, lon, date = new Date()) {
    const times = getTimes(date, lat, lon)
    const position = this.getSunPosition(lat, lon, date)
    
    return {
      ...position,
      times: {
        sunrise: times.sunrise,
        sunset: times.sunset,
        solarNoon: times.solarNoon,
        dawn: times.dawn,
        dusk: times.dusk
      }
    }
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear()
    this.lastUpdate = 0
  }
}

// 导出单例实例
export const sunCalculator = new SunCalculator()