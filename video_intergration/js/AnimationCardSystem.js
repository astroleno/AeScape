/**
 * 动画抽卡系统
 * 实现智能抽卡算法，避免连续重复
 */
class AnimationCardSystem {
  constructor() {
    this.lastPlayedVideo = null;
    this.consecutivePlays = {};
    this.animationPools = this.loadAnimationPools();
    
    console.log('AnimationCardSystem: 初始化完成');
  }

  /**
   * 加载动画池配置 - 基于更新后的视频文件夹结构
   * @returns {object} 动画池配置
   */
  loadAnimationPools() {
    // 使用 WeatherVideoMapper 获取实际的视频文件映射
    if (typeof WeatherVideoMapper !== 'undefined') {
      try {
        const mapper = new WeatherVideoMapper();
        
        // 检查mapper是否正确初始化
        if (!mapper.videoMap || typeof mapper.videoMap !== 'object') {
          throw new Error('WeatherVideoMapper映射数据无效');
        }
        
        const pools = {};
        const supportedTypes = ['clear', 'cloudy', 'rain', 'snow', 'fog', 'thunderstorm'];
        
        supportedTypes.forEach(weatherType => {
          try {
            const videos = this.createVideoPoolFromMapper(weatherType, mapper);
            if (videos && videos.length > 0) {
              pools[weatherType] = {
                name: `${this.getWeatherDisplayName(weatherType)}动画池`,
                videos: videos
              };
            }
          } catch (poolError) {
            // 为单个天气类型创建失败时，不抛出错误，继续处理其他类型
            console.warn(`创建${weatherType}动画池失败，跳过:`, poolError);
          }
        });
        
        // 检查是否成功创建了任何池
        if (Object.keys(pools).length > 0) {
          console.log('AnimationCardSystem: 成功从映射器加载动画池');
          return pools;
        } else {
          throw new Error('未能从映射器创建任何有效的动画池');
        }
        
      } catch (error) {
        console.warn('Failed to load from WeatherVideoMapper, using fallback:', error);
      }
    }
    
    // 备用的硬编码映射（基于新的文件夹结构）
    return {
      clear: {
        name: "晴天动画池",
        videos: this.generateVideoList("c", [
          "Windy_1.webm", "cloudy_1.webm", "cloudy_2.webm", "cloudy_3.webm", "cloudy_4.webm", 
          "cloudy_5.webm", "cloudy_6.webm", "cloudy_7.webm", "cloudy_8.webm", "cloudy_9.webm",
          "cloudy_10.webm", "cloudy_11.webm", "cloudy_12.webm", "cloudy_13.webm", "cloudy_14.webm",
          "cloudy_15.webm", "cloudy_16.webm", "cloudy_17.webm", "cloudy_18.webm", "cloudy_19.webm",
          "cloudy_20.webm", "cloudy_21.webm", "cloudy_22.webm", "cloudy_23.webm"
        ])
      },
      cloudy: {
        name: "多云动画池", 
        videos: this.generateVideoList("c", [
          "Windy_1.webm", "cloudy_1.webm", "cloudy_2.webm", "cloudy_3.webm", "cloudy_4.webm", 
          "cloudy_5.webm", "cloudy_6.webm", "cloudy_7.webm", "cloudy_8.webm", "cloudy_9.webm",
          "cloudy_10.webm", "cloudy_11.webm", "cloudy_12.webm", "cloudy_13.webm", "cloudy_14.webm",
          "cloudy_15.webm", "cloudy_16.webm", "cloudy_17.webm", "cloudy_18.webm", "cloudy_19.webm",
          "cloudy_20.webm", "cloudy_21.webm", "cloudy_22.webm", "cloudy_23.webm"
        ])
      },
      rain: {
        name: "雨天动画池",
        videos: [
          ...this.generateVideoList("r", ["rain_1.webm", "rain_2.webm", "rain_3.webm", "rain_4.webm", "rain_6.webm", "rain_7.webm", "rain_8.webm", "rain_9.webm", "rain_10.webm", "rain_12.webm"]),
          ...this.generateVideoList("bv", ["bottomview_1.webm", "bottomview_2.webm", "bottomview_4.webm"], "special"),
          ...this.generateVideoList("g", ["glass_1.webm", "glass_2.webm", "glass_3.webm", "glass_4.webm"], "rare")
        ]
      },
      snow: {
        name: "雪天动画池",
        videos: this.generateVideoList("s", [
          "snow_1.webm", "snow_2.webm", "snow_3.webm", "snow_4.webm", "snow_5.webm",
          "snow_6.webm", "snow_7.webm", "snow_8.webm", "snow_9.webm"
        ])
      },
      fog: {
        name: "雾天动画池",
        videos: this.generateVideoList("f", ["foggy_1.webm", "foggy_2.webm", "foggy_3.webm"])
      },
      thunderstorm: {
        name: "雷暴动画池",
        videos: this.generateVideoList("t", ["thunder_1.webm", "thunder_2.webm", "thunder_3.webm", "thunder_4.webm"], "rare")
      }
    };
  }

  /**
   * 生成视频列表
   * @param {string} folder - 文件夹名称
   * @param {Array} files - 文件名数组
   * @param {string} type - 类型 (normal/special/rare)
   * @returns {Array} 视频配置数组
   */
  generateVideoList(folder, files, type = "normal") {
    const weights = { normal: 80, special: 15, rare: 5 };
    return files.map((file, index) => ({
      id: `${folder}_${String(index + 1).padStart(3, '0')}`,
      path: `video/tab/${folder}/${file}`,
      weight: weights[type],
      type: type,
      description: `${folder}文件夹 - ${file}`
    }));
  }

  /**
   * 从映射器创建视频池
   * @param {string} weatherType - 天气类型
   * @param {WeatherVideoMapper} mapper - 视频映射器
   * @returns {Array} 视频配置数组
   */
  createVideoPoolFromMapper(weatherType, mapper) {
    try {
      // 直接从WeatherVideoMapper获取完整的视频列表
      const weatherConfig = mapper.videoMap ? mapper.videoMap[weatherType] : null;
      if (!weatherConfig || !weatherConfig.videos || weatherConfig.videos.length === 0) {
        if (this.config?.debug) {
          console.warn(`WeatherVideoMapper没有${weatherType}的视频配置，使用默认配置`);
        }
        return this.generateDefaultVideos(weatherType);
      }
      
      // 转换为抽卡系统格式
      const videos = weatherConfig.videos.map((videoPath, index) => ({
        id: `${weatherType}_${String(index + 1).padStart(3, '0')}`,
        path: videoPath,
        weight: this.getVideoWeight(videoPath),
        type: this.getVideoType(videoPath),
        description: weatherConfig.description || `${weatherType} 视频`,
        blendMode: weatherConfig.blendMode || 'lighten'
      }));
      
      console.log(`AnimationCardSystem: 从映射器创建${weatherType}池，共${videos.length}个视频`);
      return videos;
      
    } catch (error) {
      // 静默处理错误，返回默认配置
      if (this.config?.debug) {
        console.warn('Error creating video pool from mapper:', error);
      }
      return this.generateDefaultVideos(weatherType);
    }
  }

  /**
   * 获取视频权重
   * @param {string} videoPath - 视频路径
   * @returns {number} 权重值
   */
  getVideoWeight(videoPath) {
    if (videoPath.includes('/bv/') || videoPath.includes('/g/')) return 5;  // special/rare
    if (videoPath.includes('/t/')) return 10; // thunderstorm - rare but higher chance
    return 80; // normal
  }

  /**
   * 获取视频类型
   * @param {string} videoPath - 视频路径
   * @returns {string} 类型
   */
  getVideoType(videoPath) {
    if (videoPath.includes('/g/')) return 'rare';     // glass effects
    if (videoPath.includes('/bv/')) return 'special'; // bottom view
    if (videoPath.includes('/t/')) return 'rare';     // thunderstorm
    return 'normal';
  }

  /**
   * 生成默认视频
   * @param {string} weatherType - 天气类型
   * @returns {Array} 默认视频配置
   */
  generateDefaultVideos(weatherType) {
    return [{
      id: `${weatherType}_001`,
      path: `video/tab/c/cloudy_1.webm`, // 默认回退视频
      weight: 100,
      type: "normal",
      description: `${weatherType} 默认视频`
    }];
  }

  /**
   * 获取天气显示名称
   * @param {string} weatherType - 天气类型
   * @returns {string} 显示名称
   */
  getWeatherDisplayName(weatherType) {
    const displayNames = {
      clear: "晴天",
      cloudy: "多云",
      rain: "雨天",
      snow: "雪天",
      fog: "雾天",
      thunderstorm: "雷暴"
    };
    return displayNames[weatherType] || weatherType;
  }

  /**
   * 获取动画池
   * @param {string} weatherType - 天气类型
   * @returns {object} 动画池
   */
  getAnimationPool(weatherType) {
    const pool = this.animationPools[weatherType];
    if (!pool) {
      console.warn(`AnimationCardSystem: 未找到天气类型 ${weatherType} 的动画池，使用默认池`);
      return this.animationPools.clear || this.animationPools.cloudy;
    }
    return pool;
  }

  /**
   * 过滤可用视频（避免连续重复）
   * @param {object} pool - 动画池
   * @param {string} weatherType - 天气类型
   * @returns {array} 可用视频列表
   */
  filterAvailableVideos(pool, weatherType) {
    const lastVideo = this.lastPlayedVideo;
    const consecutiveCount = this.consecutivePlays[weatherType] || 0;
    
    console.log(`AnimationCardSystem: 过滤视频`, {
      weatherType,
      lastVideoId: lastVideo?.id,
      consecutiveCount,
      totalVideos: pool.videos.length
    });
    
    return pool.videos.filter(video => {
      // 如果连续播放3次相同视频，强制换一个
      if (video.id === lastVideo?.id && consecutiveCount >= 3) {
        console.log(`AnimationCardSystem: 跳过重复视频 ${video.id}`);
        return false;
      }
      return true;
    });
  }

  /**
   * 智能抽卡算法
   * @param {string} weatherType - 天气类型
   * @returns {object} 选中的视频
   */
  drawCard(weatherType) {
    const pool = this.getAnimationPool(weatherType);
    const availableVideos = this.filterAvailableVideos(pool, weatherType);
    
    if (availableVideos.length === 0) {
      console.warn(`AnimationCardSystem: 没有可用视频，使用池中第一个视频`);
      return pool.videos[0];
    }
    
    // 权重计算
    const totalWeight = availableVideos.reduce((sum, video) => sum + video.weight, 0);
    let random = Math.random() * totalWeight;
    
    console.log(`AnimationCardSystem: 开始抽卡`, {
      weatherType,
      availableVideos: availableVideos.length,
      totalWeight
    });
    
    for (const video of availableVideos) {
      random -= video.weight;
      if (random <= 0) {
        // 更新播放历史
        this.updatePlayHistory(weatherType, video);
        
        console.log(`AnimationCardSystem: 抽中视频`, {
          id: video.id,
          type: video.type,
          description: video.description
        });
        
        return video;
      }
    }
    
    // 兜底：返回第一个可用视频
    const fallbackVideo = availableVideos[0];
    this.updatePlayHistory(weatherType, fallbackVideo);
    
    console.log(`AnimationCardSystem: 使用兜底视频`, {
      id: fallbackVideo.id,
      type: fallbackVideo.type
    });
    
    return fallbackVideo;
  }

  /**
   * 更新播放历史
   * @param {string} weatherType - 天气类型
   * @param {object} video - 视频信息
   */
  updatePlayHistory(weatherType, video) {
    if (this.lastPlayedVideo && this.lastPlayedVideo.id === video.id) {
      this.consecutivePlays[weatherType] = (this.consecutivePlays[weatherType] || 0) + 1;
    } else {
      this.consecutivePlays[weatherType] = 1;
    }
    
    this.lastPlayedVideo = video;
    
    console.log(`AnimationCardSystem: 更新播放历史`, {
      weatherType,
      videoId: video.id,
      consecutiveCount: this.consecutivePlays[weatherType]
    });
  }

  /**
   * 重置播放历史
   */
  reset() {
    this.lastPlayedVideo = null;
    this.consecutivePlays = {};
    console.log('AnimationCardSystem: 播放历史已重置');
  }

  /**
   * 获取播放统计
   * @returns {object} 播放统计信息
   */
  getStats() {
    return {
      lastPlayedVideo: this.lastPlayedVideo,
      consecutivePlays: this.consecutivePlays,
      availablePools: Object.keys(this.animationPools)
    };
  }
}
