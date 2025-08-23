/**
 * Open-Meteo 天气数据获取模块
 * 免费无需 API Key，支持全球天气数据
 */
export class WeatherService {
  constructor() {
    this.cache = new Map()
    this.lastUpdate = 0
    this.cacheTimeout = 30 * 60 * 1000 // 30分钟缓存
    this.baseUrl = 'https://api.open-meteo.com/v1'
  }

  /**
   * 获取当前天气数据
   * @param {number} lat 纬度
   * @param {number} lon 经度
   * @returns {Promise<Object>} 天气数据
   */
  async getCurrentWeather(lat, lon) {
    const cacheKey = `weather_${lat.toFixed(4)}_${lon.toFixed(4)}`
    const now = Date.now()
    
    // 检查缓存
    if (this.cache.has(cacheKey) && (now - this.lastUpdate) < this.cacheTimeout) {
      return this.cache.get(cacheKey)
    }

    try {
      const params = new URLSearchParams({
        latitude: lat.toFixed(4),
        longitude: lon.toFixed(4),
        current_weather: 'true',
        hourly: 'temperature_2m,relativehumidity_2m,apparent_temperature,precipitation_probability,precipitation,weathercode,cloudcover,visibility,windspeed_10m,winddirection_10m,uv_index',
        daily: 'sunrise,sunset',
        timezone: 'auto'
      })

      const response = await fetch(`${this.baseUrl}/forecast?${params}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(`API Error: ${data.reason || 'Unknown error'}`)
      }

      const weatherData = this.transformWeatherData(data)
      
      // 缓存结果
      this.cache.set(cacheKey, weatherData)
      this.lastUpdate = now
      
      return weatherData
    } catch (error) {
      console.error('Weather API Error:', error)
      // 返回缓存数据或默认值
      return this.cache.get(cacheKey) || this.getDefaultWeather()
    }
  }

  /**
   * 获取空气质量数据
   * @param {number} lat 纬度
   * @param {number} lon 经度
   * @returns {Promise<Object>} 空气质量数据
   */
  async getAirQuality(lat, lon) {
    const cacheKey = `air_${lat.toFixed(4)}_${lon.toFixed(4)}`
    const now = Date.now()
    
    // 空气质量数据缓存时间更长 (1小时)
    const airCacheTimeout = 60 * 60 * 1000
    
    if (this.cache.has(cacheKey) && (now - this.lastUpdate) < airCacheTimeout) {
      return this.cache.get(cacheKey)
    }

    try {
      const params = new URLSearchParams({
        latitude: lat.toFixed(4),
        longitude: lon.toFixed(4),
        hourly: 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,aqi',
        timezone: 'auto'
      })

      const response = await fetch(`${this.baseUrl}/air-quality?${params}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(`Air Quality API Error: ${data.reason || 'Unknown error'}`)
      }

      const airData = this.transformAirQualityData(data)
      
      // 缓存结果
      this.cache.set(cacheKey, airData)
      
      return airData
    } catch (error) {
      console.error('Air Quality API Error:', error)
      return this.cache.get(cacheKey) || this.getDefaultAirQuality()
    }
  }

  /**
   * 获取地理编码 (城市名称)
   * @param {string} name 城市名称
   * @returns {Promise<Array>} 地理编码结果
   */
  async geocode(name) {
    try {
      const params = new URLSearchParams({
        name: name,
        count: '1',
        language: 'zh',
        format: 'json'
      })

      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`)
      const data = await response.json()
      
      if (!response.ok || !data.results) {
        return []
      }

      return data.results.map(result => ({
        name: result.name,
        lat: result.latitude,
        lon: result.longitude,
        country: result.country,
        admin1: result.admin1
      }))
    } catch (error) {
      console.error('Geocoding Error:', error)
      return []
    }
  }

  /**
   * 转换天气数据格式
   * @param {Object} data API 原始数据
   * @returns {Object} 标准化天气数据
   */
  transformWeatherData(data) {
    const current = data.current_weather
    const hourly = data.hourly
    const daily = data.daily
    
    // 获取当前时间对应的小时数据
    const currentHour = new Date().getHours()
    const currentHourly = {
      temperature: hourly.temperature_2m[currentHour],
      humidity: hourly.relativehumidity_2m[currentHour],
      apparentTemp: hourly.apparent_temperature[currentHour],
      precipitationProb: hourly.precipitation_probability[currentHour],
      precipitation: hourly.precipitation[currentHour],
      cloudcover: hourly.cloudcover[currentHour],
      visibility: hourly.visibility[currentHour],
      windSpeed: hourly.windspeed_10m[currentHour],
      windDirection: hourly.winddirection_10m[currentHour],
      uvIndex: hourly.uv_index[currentHour]
    }

    return {
      location: {
        lat: data.latitude,
        lon: data.longitude,
        timezone: data.timezone
      },
      current: {
        temperature: current.temperature,
        weatherCode: current.weathercode,
        windSpeed: current.windspeed_10m,
        windDirection: current.winddirection_10m,
        isDay: current.is_day === 1
      },
      hourly: currentHourly,
      daily: {
        sunrise: daily.sunrise[0],
        sunset: daily.sunset[0]
      },
      timestamp: Date.now()
    }
  }

  /**
   * 转换空气质量数据格式
   * @param {Object} data API 原始数据
   * @returns {Object} 标准化空气质量数据
   */
  transformAirQualityData(data) {
    const hourly = data.hourly
    const currentHour = new Date().getHours()
    
    return {
      pm10: hourly.pm10[currentHour],
      pm2_5: hourly.pm2_5[currentHour],
      carbon_monoxide: hourly.carbon_monoxide[currentHour],
      nitrogen_dioxide: hourly.nitrogen_dioxide[currentHour],
      sulphur_dioxide: hourly.sulphur_dioxide[currentHour],
      ozone: hourly.ozone[currentHour],
      aqi: hourly.aqi[currentHour],
      timestamp: Date.now()
    }
  }

  /**
   * 天气代码映射
   * @param {number} code Open-Meteo 天气代码
   * @returns {string} 标准化天气代码
   */
  mapWeatherCode(code) {
    const codeMap = {
      0: 'clear',           // 晴
      1: 'clear',           // 主要晴朗
      2: 'cloudy',          // 部分多云
      3: 'cloudy',          // 阴天
      45: 'fog',            // 雾
      48: 'fog',            // 冻雾
      51: 'rain',           // 毛毛雨
      53: 'rain',           // 毛毛雨
      55: 'rain',           // 密集毛毛雨
      56: 'rain',           // 冻毛毛雨
      57: 'rain',           // 密集冻毛毛雨
      61: 'rain',           // 小雨
      63: 'rain',           // 中雨
      65: 'rain',           // 大雨
      66: 'snow',           // 冻雨
      67: 'snow',           // 冻雨
      71: 'snow',           // 小雪
      73: 'snow',           // 中雪
      75: 'snow',           // 大雪
      77: 'snow',           // 雪粒
      80: 'rain',           // 阵雨
      81: 'rain',           // 强阵雨
      82: 'rain',           // 强阵雨
      85: 'snow',           // 阵雪
      86: 'snow',           // 阵雪
      95: 'thunderstorm',   // 雷暴
      96: 'thunderstorm',   // 雷暴伴小冰雹
      99: 'thunderstorm'    // 雷暴伴大冰雹
    }
    
    return codeMap[code] || 'clear'
  }

  /**
   * 获取默认天气数据
   * @returns {Object} 默认天气数据
   */
  getDefaultWeather() {
    return {
      location: { lat: 39.9042, lon: 116.4074, timezone: 'Asia/Shanghai' },
      current: {
        temperature: 20,
        weatherCode: 0,
        windSpeed: 5,
        windDirection: 180,
        isDay: true
      },
      hourly: {
        temperature: 20,
        humidity: 60,
        apparentTemp: 20,
        precipitationProb: 0,
        precipitation: 0,
        cloudcover: 20,
        visibility: 10,
        windSpeed: 5,
        windDirection: 180,
        uvIndex: 5
      },
      daily: {
        sunrise: new Date().setHours(6, 0, 0, 0),
        sunset: new Date().setHours(18, 0, 0, 0)
      },
      timestamp: Date.now()
    }
  }

  /**
   * 获取默认空气质量数据
   * @returns {Object} 默认空气质量数据
   */
  getDefaultAirQuality() {
    return {
      pm10: 50,
      pm2_5: 25,
      carbon_monoxide: 500,
      nitrogen_dioxide: 40,
      sulphur_dioxide: 20,
      ozone: 100,
      aqi: 50,
      timestamp: Date.now()
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
export const weatherService = new WeatherService()