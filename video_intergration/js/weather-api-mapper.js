/**
 * 天景 AeScape - 天气API映射器
 * 将不同天气API返回的天气代码统一映射为内部天气类型
 * 支持OpenWeatherMap、AccuWeather等主流API
 */

class WeatherAPIMapper {
  constructor() {
    // 内部标准天气类型
    this.INTERNAL_WEATHER_TYPES = {
      CLEAR: 'clear',           // 晴天
      CLOUDY: 'cloudy',         // 多云
      RAIN: 'rain',             // 雨天
      SNOW: 'snow',             // 雪天
      THUNDERSTORM: 'thunderstorm', // 雷暴
      FOG: 'fog'                // 雾天
    };

    // OpenWeatherMap API天气代码映射
    this.OPENWEATHER_CODE_MAP = {
      // 雷暴系列 (2xx)
      200: 'thunderstorm', // thunderstorm with light rain
      201: 'thunderstorm', // thunderstorm with rain
      202: 'thunderstorm', // thunderstorm with heavy rain
      210: 'thunderstorm', // light thunderstorm
      211: 'thunderstorm', // thunderstorm
      212: 'thunderstorm', // heavy thunderstorm
      221: 'thunderstorm', // ragged thunderstorm
      230: 'thunderstorm', // thunderstorm with light drizzle
      231: 'thunderstorm', // thunderstorm with drizzle
      232: 'thunderstorm', // thunderstorm with heavy drizzle

      // 毛毛雨系列 (3xx) - 映射为雨天
      300: 'rain', // light intensity drizzle
      301: 'rain', // drizzle
      302: 'rain', // heavy intensity drizzle
      310: 'rain', // light intensity drizzle rain
      311: 'rain', // drizzle rain
      312: 'rain', // heavy intensity drizzle rain
      313: 'rain', // shower rain and drizzle
      314: 'rain', // heavy shower rain and drizzle
      321: 'rain', // shower drizzle

      // 雨天系列 (5xx)
      500: 'rain', // light rain
      501: 'rain', // moderate rain
      502: 'rain', // heavy intensity rain
      503: 'rain', // very heavy rain
      504: 'rain', // extreme rain
      511: 'rain', // freezing rain
      520: 'rain', // light intensity shower rain
      521: 'rain', // shower rain
      522: 'rain', // heavy intensity shower rain
      531: 'rain', // ragged shower rain

      // 雪天系列 (6xx)
      600: 'snow', // light snow
      601: 'snow', // snow
      602: 'snow', // heavy snow
      611: 'snow', // sleet
      612: 'snow', // light shower sleet
      613: 'snow', // shower sleet
      615: 'snow', // light rain and snow
      616: 'snow', // rain and snow
      620: 'snow', // light shower snow
      621: 'snow', // shower snow
      622: 'snow', // heavy shower snow

      // 大气现象系列 (7xx) - 大多映射为雾天
      701: 'fog',   // mist
      711: 'fog',   // smoke
      721: 'fog',   // haze
      731: 'cloudy', // sand/dust whirls
      741: 'fog',   // fog
      751: 'cloudy', // sand
      761: 'cloudy', // dust
      762: 'fog',   // volcanic ash
      771: 'cloudy', // squalls
      781: 'thunderstorm', // tornado

      // 晴天/多云系列 (800-804)
      800: 'clear',  // clear sky
      801: 'cloudy', // few clouds: 11-25%
      802: 'cloudy', // scattered clouds: 25-50%
      803: 'cloudy', // broken clouds: 51-84%
      804: 'cloudy'  // overcast clouds: 85-100%
    };

    // AccuWeather天气图标代码映射
    this.ACCUWEATHER_ICON_MAP = {
      1: 'clear',    // Sunny
      2: 'clear',    // Mostly Sunny
      3: 'cloudy',   // Partly Sunny
      4: 'cloudy',   // Intermittent Clouds
      5: 'cloudy',   // Hazy Sunshine
      6: 'cloudy',   // Mostly Cloudy
      7: 'cloudy',   // Cloudy
      8: 'cloudy',   // Dreary (Overcast)
      11: 'fog',     // Fog
      12: 'rain',    // Showers
      13: 'rain',    // Mostly Cloudy w/ Showers
      14: 'rain',    // Partly Sunny w/ Showers
      15: 'thunderstorm', // T-Storms
      16: 'thunderstorm', // Mostly Cloudy w/ T-Storms
      17: 'thunderstorm', // Partly Sunny w/ T-Storms
      18: 'rain',    // Rain
      19: 'snow',    // Flurries
      20: 'snow',    // Mostly Cloudy w/ Flurries
      21: 'snow',    // Partly Sunny w/ Flurries
      22: 'snow',    // Snow
      23: 'snow',    // Mostly Cloudy w/ Snow
      24: 'snow',    // Ice
      25: 'rain',    // Sleet
      26: 'rain',    // Freezing Rain
      29: 'rain',    // Rain and Snow
      30: 'clear',   // Hot
      31: 'clear',   // Cold
      32: 'clear',   // Windy
      33: 'clear',   // Clear (Night)
      34: 'clear',   // Mostly Clear (Night)
      35: 'cloudy',  // Partly Cloudy (Night)
      36: 'cloudy',  // Intermittent Clouds (Night)
      37: 'cloudy',  // Hazy Moonlight (Night)
      38: 'cloudy',  // Mostly Cloudy (Night)
      39: 'rain',    // Partly Cloudy w/ Showers (Night)
      40: 'rain',    // Mostly Cloudy w/ Showers (Night)
      41: 'thunderstorm', // Partly Cloudy w/ T-Storms (Night)
      42: 'thunderstorm', // Mostly Cloudy w/ T-Storms (Night)
      43: 'snow',    // Mostly Cloudy w/ Flurries (Night)
      44: 'snow'     // Mostly Cloudy w/ Snow (Night)
    };

    // 天气描述关键词映射（用于处理文字描述）
    this.DESCRIPTION_KEYWORDS = {
      thunderstorm: ['thunder', 'storm', 'lightning', '雷', '暴雨', '雷暴', '雷雨'],
      rain: ['rain', 'shower', 'drizzle', '雨', '阵雨', '毛毛雨', '小雨', '中雨', '大雨', '暴雨'],
      snow: ['snow', 'sleet', 'blizzard', '雪', '雨夹雪', '暴雪', '小雪', '中雪', '大雪'],
      fog: ['fog', 'mist', 'haze', 'smoke', '雾', '薄雾', '霾', '烟雾'],
      cloudy: ['cloud', 'overcast', '云', '多云', '阴', '阴天'],
      clear: ['clear', 'sunny', 'fair', '晴', '晴朗', '晴天', '艳阳']
    };

    console.log('WeatherAPIMapper: 初始化完成');
  }

  /**
   * 映射OpenWeatherMap天气代码
   * @param {number} code - OpenWeatherMap天气代码
   * @returns {string} 内部天气类型
   */
  mapOpenWeatherCode(code) {
    const weatherType = this.OPENWEATHER_CODE_MAP[code];
    if (weatherType) {
      console.log(`WeatherAPIMapper: OpenWeather代码 ${code} 映射为 ${weatherType}`);
      return weatherType;
    }

    // 回退逻辑
    if (code >= 200 && code < 300) return this.INTERNAL_WEATHER_TYPES.THUNDERSTORM;
    if (code >= 300 && code < 600) return this.INTERNAL_WEATHER_TYPES.RAIN;
    if (code >= 600 && code < 700) return this.INTERNAL_WEATHER_TYPES.SNOW;
    if (code >= 700 && code < 800) return this.INTERNAL_WEATHER_TYPES.FOG;
    if (code === 800) return this.INTERNAL_WEATHER_TYPES.CLEAR;
    if (code > 800) return this.INTERNAL_WEATHER_TYPES.CLOUDY;

    console.warn(`WeatherAPIMapper: 未知的OpenWeather代码 ${code}, 默认为晴天`);
    return this.INTERNAL_WEATHER_TYPES.CLEAR;
  }

  /**
   * 映射AccuWeather图标代码
   * @param {number} iconCode - AccuWeather图标代码
   * @returns {string} 内部天气类型
   */
  mapAccuWeatherIcon(iconCode) {
    const weatherType = this.ACCUWEATHER_ICON_MAP[iconCode];
    if (weatherType) {
      console.log(`WeatherAPIMapper: AccuWeather图标 ${iconCode} 映射为 ${weatherType}`);
      return weatherType;
    }

    console.warn(`WeatherAPIMapper: 未知的AccuWeather图标 ${iconCode}, 默认为晴天`);
    return this.INTERNAL_WEATHER_TYPES.CLEAR;
  }

  /**
   * 根据天气描述文字映射天气类型
   * @param {string} description - 天气描述
   * @param {string} language - 语言 ('en', 'zh', 'auto')
   * @returns {string} 内部天气类型
   */
  mapWeatherDescription(description, language = 'auto') {
    if (!description || typeof description !== 'string') {
      return this.INTERNAL_WEATHER_TYPES.CLEAR;
    }

    const desc = description.toLowerCase();
    
    // 按优先级检查关键词
    const weatherTypes = ['thunderstorm', 'snow', 'rain', 'fog', 'cloudy', 'clear'];
    
    for (const weatherType of weatherTypes) {
      const keywords = this.DESCRIPTION_KEYWORDS[weatherType];
      for (const keyword of keywords) {
        if (desc.includes(keyword.toLowerCase())) {
          console.log(`WeatherAPIMapper: 描述 "${description}" 通过关键词 "${keyword}" 映射为 ${weatherType}`);
          return this.INTERNAL_WEATHER_TYPES[weatherType.toUpperCase()];
        }
      }
    }

    console.warn(`WeatherAPIMapper: 无法识别天气描述 "${description}", 默认为晴天`);
    return this.INTERNAL_WEATHER_TYPES.CLEAR;
  }

  /**
   * 通用天气数据映射方法
   * @param {object} weatherData - 原始天气数据
   * @param {string} apiType - API类型 ('openweather', 'accuweather', 'auto')
   * @returns {string} 内部天气类型
   */
  mapWeatherData(weatherData, apiType = 'auto') {
    if (!weatherData || typeof weatherData !== 'object') {
      console.warn('WeatherAPIMapper: 无效的天气数据');
      return this.INTERNAL_WEATHER_TYPES.CLEAR;
    }

    try {
      // 自动检测API类型
      if (apiType === 'auto') {
        if (weatherData.weather && Array.isArray(weatherData.weather) && weatherData.weather[0]?.id) {
          apiType = 'openweather';
        } else if (weatherData.WeatherIcon !== undefined) {
          apiType = 'accuweather';
        } else if (weatherData.description) {
          apiType = 'description';
        }
      }

      switch (apiType) {
        case 'openweather':
          if (weatherData.weather && weatherData.weather[0]) {
            return this.mapOpenWeatherCode(weatherData.weather[0].id);
          }
          break;

        case 'accuweather':
          if (weatherData.WeatherIcon !== undefined) {
            return this.mapAccuWeatherIcon(weatherData.WeatherIcon);
          }
          break;

        case 'description':
          if (weatherData.description) {
            return this.mapWeatherDescription(weatherData.description);
          }
          break;
      }

      // 通用回退逻辑
      if (weatherData.description) {
        return this.mapWeatherDescription(weatherData.description);
      }

      if (weatherData.weather && weatherData.weather[0]?.main) {
        return this.mapWeatherDescription(weatherData.weather[0].main);
      }

    } catch (error) {
      console.error('WeatherAPIMapper: 映射过程出错', error);
    }

    // WeatherAPIMapper: 无法映射天气数据，使用默认值（静默处理）
    return this.INTERNAL_WEATHER_TYPES.CLEAR;
  }

  /**
   * 获取天气强度级别
   * @param {object} weatherData - 原始天气数据
   * @param {string} weatherType - 内部天气类型
   * @returns {string} 强度级别 ('light', 'medium', 'heavy')
   */
  getWeatherIntensity(weatherData, weatherType) {
    if (!weatherData || !weatherType) {
      return 'medium';
    }

    try {
      // 根据不同天气类型和数据判断强度
      switch (weatherType) {
        case 'rain':
          if (weatherData.rain?.['1h'] !== undefined) {
            const rainVolume = weatherData.rain['1h'];
            if (rainVolume < 2.5) return 'light';
            if (rainVolume > 10) return 'heavy';
            return 'medium';
          }
          
          if (weatherData.weather && weatherData.weather[0]) {
            const code = weatherData.weather[0].id;
            if (code >= 300 && code < 310) return 'light'; // 毛毛雨
            if (code >= 502 && code <= 504) return 'heavy'; // 重雨
          }
          break;

        case 'snow':
          if (weatherData.snow?.['1h'] !== undefined) {
            const snowVolume = weatherData.snow['1h'];
            if (snowVolume < 1) return 'light';
            if (snowVolume > 5) return 'heavy';
            return 'medium';
          }
          break;

        case 'thunderstorm':
          return 'heavy'; // 雷暴默认为重强度
          
        case 'cloudy':
          if (weatherData.clouds?.all !== undefined) {
            const cloudiness = weatherData.clouds.all;
            if (cloudiness < 25) return 'light';
            if (cloudiness > 75) return 'heavy';
            return 'medium';
          }
          break;
      }

      // 根据风速判断
      if (weatherData.wind?.speed !== undefined) {
        const windSpeed = weatherData.wind.speed;
        if (windSpeed > 10) return 'heavy';
        if (windSpeed < 3) return 'light';
      }

    } catch (error) {
      console.error('WeatherAPIMapper: 获取天气强度时出错', error);
    }

    return 'medium';
  }

  /**
   * 获取所有支持的天气类型
   * @returns {Array<string>} 支持的天气类型列表
   */
  getSupportedWeatherTypes() {
    return Object.values(this.INTERNAL_WEATHER_TYPES);
  }

  /**
   * 验证天气类型是否有效
   * @param {string} weatherType - 天气类型
   * @returns {boolean} 是否有效
   */
  isValidWeatherType(weatherType) {
    return Object.values(this.INTERNAL_WEATHER_TYPES).includes(weatherType);
  }

  /**
   * 获取映射统计信息
   * @returns {object} 统计信息
   */
  getMappingStats() {
    return {
      supportedWeatherTypes: this.getSupportedWeatherTypes().length,
      openWeatherCodes: Object.keys(this.OPENWEATHER_CODE_MAP).length,
      accuWeatherIcons: Object.keys(this.ACCUWEATHER_ICON_MAP).length,
      descriptionKeywords: Object.keys(this.DESCRIPTION_KEYWORDS).reduce((sum, key) => 
        sum + this.DESCRIPTION_KEYWORDS[key].length, 0)
    };
  }

  /**
   * 测试映射功能
   * @param {object} testData - 测试数据
   * @returns {object} 测试结果
   */
  testMapping(testData) {
    const results = {};
    
    try {
      // 测试OpenWeather映射
      if (testData.openWeatherCode) {
        results.openWeather = this.mapOpenWeatherCode(testData.openWeatherCode);
      }

      // 测试AccuWeather映射
      if (testData.accuWeatherIcon) {
        results.accuWeather = this.mapAccuWeatherIcon(testData.accuWeatherIcon);
      }

      // 测试描述映射
      if (testData.description) {
        results.description = this.mapWeatherDescription(testData.description);
      }

      // 测试通用映射
      if (testData.weatherData) {
        results.generic = this.mapWeatherData(testData.weatherData);
      }

    } catch (error) {
      results.error = error.message;
    }

    return results;
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WeatherAPIMapper;
}

// 创建全局实例
if (typeof window !== 'undefined') {
  window.WeatherAPIMapper = WeatherAPIMapper;
}