/**
 * AeScape 视频流优化器
 * 专门优化webm文件的加载和播放流畅性
 */

class VideoStreamOptimizer {
  constructor(options = {}) {
    this.config = {
      // 缓冲区设置
      bufferAhead: options.bufferAhead || 3.0,          // 预缓冲秒数
      bufferBehind: options.bufferBehind || 1.0,        // 后缓冲秒数
      
      // 网络优化
      maxBandwidth: options.maxBandwidth || 5000000,    // 最大带宽 5MB/s
      adaptiveBitrate: options.adaptiveBitrate !== false,
      
      // 预加载策略
      preloadStrategy: options.preloadStrategy || 'metadata', // none/metadata/auto
      priorityPreload: options.priorityPreload !== false,
      
      // 内存管理
      memoryThreshold: options.memoryThreshold || 100, // MB
      autoGC: options.autoGC !== false,
      
      // 性能监控
      enablePerfMonitor: options.enablePerfMonitor !== false,
      debug: options.debug || false
    };
    
    this.stats = {
      videosOptimized: 0,
      bytesLoaded: 0,
      loadTimes: [],
      bufferEvents: 0,
      gcEvents: 0
    };
    
    this.activeVideos = new Map();
    this.loadQueue = [];
    this.isProcessingQueue = false;
    
    console.log('[VideoStreamOptimizer] 视频流优化器初始化', this.config);
  }

  /**
   * 优化视频元素
   * @param {HTMLVideoElement} video - 视频元素
   * @param {object} options - 优化选项
   * @returns {Promise<HTMLVideoElement>} 优化后的视频元素
   */
  async optimizeVideo(video, options = {}) {
    const startTime = Date.now();
    const videoId = this.generateVideoId(video);
    
    try {
      // 基础优化设置
      this.applyBasicOptimizations(video);
      
      // 缓冲区优化
      await this.setupBuffering(video);
      
      // 预加载优化
      this.setupPreloading(video, options);
      
      // 网络优化
      this.setupNetworkOptimization(video);
      
      // 内存监控
      this.setupMemoryMonitoring(video, videoId);
      
      // 记录优化统计
      this.recordOptimization(videoId, Date.now() - startTime);
      
      this.activeVideos.set(videoId, {
        video,
        optimizedAt: Date.now(),
        options
      });
      
      if (this.config.debug) {
        console.log(`[VideoStreamOptimizer] 视频优化完成: ${videoId}, 耗时: ${Date.now() - startTime}ms`);
      }
      
      return video;
      
    } catch (error) {
      console.error('[VideoStreamOptimizer] 视频优化失败:', error);
      throw error;
    }
  }

  /**
   * 应用基础优化设置
   */
  applyBasicOptimizations(video) {
    // 基础属性设置
    video.playsInline = true;
    video.muted = true;
    video.preload = this.config.preloadStrategy;
    
    // 禁用右键菜单
    video.disablePictureInPicture = true;
    video.controlsList = 'nodownload noremoteplayback';
    
    // 设置自动播放策略
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    
    // 优化渲染
    video.style.willChange = 'transform, opacity';
    video.style.backfaceVisibility = 'hidden';
    video.style.transform = 'translateZ(0)'; // 启用硬件加速
  }

  /**
   * 设置缓冲区优化
   */
  async setupBuffering(video) {
    try {
      // 监听缓冲事件
      video.addEventListener('waiting', () => {
        this.stats.bufferEvents++;
        if (this.config.debug) {
          console.log('[VideoStreamOptimizer] 缓冲中...');
        }
      });
      
      video.addEventListener('canplaythrough', () => {
        if (this.config.debug) {
          console.log('[VideoStreamOptimizer] 缓冲完成');
        }
      });
      
      // 设置缓冲区大小（如果支持）
      if (video.buffered && 'setTargetBufferSize' in video) {
        video.setTargetBufferSize(this.config.bufferAhead);
      }
      
    } catch (error) {
      console.warn('[VideoStreamOptimizer] 缓冲设置失败:', error);
    }
  }

  /**
   * 设置预加载优化
   */
  setupPreloading(video, options) {
    if (!this.config.priorityPreload) return;
    
    // 根据优先级设置预加载
    const priority = options.priority || 'normal';
    
    switch (priority) {
      case 'high':
        video.preload = 'auto';
        break;
      case 'low': 
        video.preload = 'none';
        break;
      default:
        video.preload = 'metadata';
    }
    
    // 预加载提示
    if ('loading' in video) {
      video.loading = priority === 'high' ? 'eager' : 'lazy';
    }
  }

  /**
   * 设置网络优化
   */
  setupNetworkOptimization(video) {
    try {
      // 连接优化提示 - 只有当src有效时才预加载
      if (video && video.src && video.src.trim()) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = video.src;
        link.as = 'video';
        link.type = 'video/webm';
        document.head.appendChild(link);
      }
    } catch (error) {
      // 静默处理预加载错误
      if (this.config.debug) {
        console.warn('[VideoStreamOptimizer] 预加载链接创建失败:', error);
      }
    }
    
    // 监听网络状态
    if ('connection' in navigator) {
      const connection = navigator.connection;
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        video.preload = 'none'; // 慢网络下禁用预加载
      }
    }
  }

  /**
   * 设置内存监控
   */
  setupMemoryMonitoring(video, videoId) {
    if (!this.config.autoGC) return;
    
    const checkMemory = () => {
      if (performance.memory) {
        const memoryMB = performance.memory.usedJSHeapSize / 1024 / 1024;
        
        if (memoryMB > this.config.memoryThreshold) {
          this.triggerGarbageCollection(videoId);
        }
      }
    };
    
    // 定期检查内存
    video._memoryCheckInterval = setInterval(checkMemory, 5000);
  }

  /**
   * 触发垃圾回收
   */
  triggerGarbageCollection(excludeVideoId) {
    try {
      let cleaned = 0;
      
      // 清理不活跃的视频
      for (const [videoId, videoData] of this.activeVideos.entries()) {
        if (videoId === excludeVideoId) continue;
        
        const video = videoData.video;
        const age = Date.now() - videoData.optimizedAt;
        
        // 清理超过5分钟未使用的视频
        if (age > 5 * 60 * 1000 && video.paused) {
          this.cleanupVideo(videoId, video);
          cleaned++;
        }
      }
      
      this.stats.gcEvents++;
      
      if (this.config.debug) {
        console.log(`[VideoStreamOptimizer] GC清理完成，清理${cleaned}个视频`);
      }
      
    } catch (error) {
      console.error('[VideoStreamOptimizer] GC失败:', error);
    }
  }

  /**
   * 清理视频资源
   */
  cleanupVideo(videoId, video) {
    try {
      // 停止播放
      if (!video.paused) {
        video.pause();
      }
      
      // 清除源
      video.removeAttribute('src');
      video.load();
      
      // 清除事件监听器
      if (video._memoryCheckInterval) {
        clearInterval(video._memoryCheckInterval);
        delete video._memoryCheckInterval;
      }
      
      // 从活跃列表中移除
      this.activeVideos.delete(videoId);
      
    } catch (error) {
      console.warn('[VideoStreamOptimizer] 清理视频失败:', error);
    }
  }

  /**
   * 批量优化视频队列
   */
  async processVideoQueue() {
    if (this.isProcessingQueue || this.loadQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    try {
      while (this.loadQueue.length > 0) {
        const { video, options, resolve, reject } = this.loadQueue.shift();
        
        try {
          const optimizedVideo = await this.optimizeVideo(video, options);
          resolve(optimizedVideo);
        } catch (error) {
          reject(error);
        }
        
        // 避免阻塞UI
        await this.sleep(10);
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * 添加视频到优化队列
   */
  queueVideoForOptimization(video, options = {}) {
    return new Promise((resolve, reject) => {
      this.loadQueue.push({ video, options, resolve, reject });
      this.processVideoQueue();
    });
  }

  /**
   * 智能预加载相关视频
   */
  async preloadRelatedVideos(weatherType, currentVideo) {
    if (!this.config.priorityPreload) return;
    
    try {
      // 使用WeatherVideoMapper获取相关视频
      if (typeof WeatherVideoMapper !== 'undefined') {
        const mapper = new WeatherVideoMapper();
        
        // 预加载下一个可能的视频
        for (let i = 0; i < 2; i++) {
          const nextVideo = mapper.getVideoForWeather(weatherType);
          if (nextVideo && nextVideo.videoPath !== currentVideo.src) {
            const preloadVideo = document.createElement('video');
            preloadVideo.src = nextVideo.videoPath;
            preloadVideo.preload = 'metadata';
            preloadVideo.muted = true;
            
            // 添加到优化队列
            this.queueVideoForOptimization(preloadVideo, { priority: 'low' });
          }
        }
      }
    } catch (error) {
      console.warn('[VideoStreamOptimizer] 预加载相关视频失败:', error);
    }
  }

  /**
   * 生成视频ID
   */
  generateVideoId(video) {
    return video.src ? btoa(video.src).substring(0, 8) : 'video_' + Date.now();
  }

  /**
   * 记录优化统计
   */
  recordOptimization(videoId, loadTime) {
    this.stats.videosOptimized++;
    this.stats.loadTimes.push(loadTime);
    
    // 只保留最近100次的加载时间
    if (this.stats.loadTimes.length > 100) {
      this.stats.loadTimes.shift();
    }
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    const avgLoadTime = this.stats.loadTimes.length > 0 
      ? this.stats.loadTimes.reduce((a, b) => a + b, 0) / this.stats.loadTimes.length 
      : 0;
    
    return {
      ...this.stats,
      averageLoadTime: Math.round(avgLoadTime),
      activeVideos: this.activeVideos.size,
      queueSize: this.loadQueue.length,
      memoryUsage: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 'N/A'
    };
  }

  /**
   * 重置统计
   */
  resetStats() {
    this.stats = {
      videosOptimized: 0,
      bytesLoaded: 0,
      loadTimes: [],
      bufferEvents: 0,
      gcEvents: 0
    };
  }

  /**
   * 辅助函数：延迟
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 销毁优化器
   */
  destroy() {
    try {
      // 清理所有活跃视频
      for (const [videoId, videoData] of this.activeVideos.entries()) {
        this.cleanupVideo(videoId, videoData.video);
      }
      
      // 清空队列
      this.loadQueue.length = 0;
      
      console.log('[VideoStreamOptimizer] 优化器已销毁');
    } catch (error) {
      console.error('[VideoStreamOptimizer] 销毁失败:', error);
    }
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VideoStreamOptimizer;
}

// 创建全局实例
if (typeof window !== 'undefined') {
  window.VideoStreamOptimizer = VideoStreamOptimizer;
}