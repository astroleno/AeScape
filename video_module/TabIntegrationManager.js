/**
 * Tab集成管理器
 * 主要入口类，集成所有组件，实现与插件的API接口
 */
class TabIntegrationManager {
  constructor(containerSelector = '#video-container', options = {}) {
    this.containerSelector = containerSelector;
    this.options = {
      duration: 1500, // 默认1.5秒
      enhanceEffects: true,
      autoPlay: true,
      ...options
    };
    
    // 初始化组件
    this.videoManager = new VideoWeatherManager(containerSelector, this.options);
    this.triggerManager = new WeatherTriggerManager();
    this.cardSystem = new AnimationCardSystem();
    
    // 回调函数
    this.callbacks = {
      onVideoStart: () => {},
      onVideoEnd: () => {},
      onAnimationComplete: () => {},
      onError: () => {}
    };
    
    // 状态管理
    this.isInitialized = false;
    this.isPlaying = false;
    
    console.log('TabIntegrationManager: 初始化完成');
  }

  /**
   * 主要入口方法 - 插件调用此方法
   * @param {object} data - 插件提供的数据
   * @param {object} data.weather - 天气数据
   * @param {object} data.theme - 主题数据
   * @param {object} data.settings - 设置数据
   * @param {object} callbacks - 回调函数
   * @returns {Promise} 播放结果
   */
  async initializeTab(data, callbacks = {}) {
    try {
      console.log('TabIntegrationManager: 开始初始化Tab', data);
      
      // 更新回调函数
      this.updateCallbacks(callbacks);
      
      // 解析数据
      const { weather, theme, settings } = data;
      
      if (!weather || !weather.type) {
        throw new Error('缺少天气数据');
      }
      
      // 检查是否应该播放动画
      const shouldPlay = this.shouldPlayAnimation(weather, settings);
      
      if (shouldPlay) {
        console.log('TabIntegrationManager: 开始播放动画');
        
        // 抽卡选择视频
        const selectedVideo = this.cardSystem.drawCard(weather.type);
        
        // 播放动画
        await this.playAnimation(selectedVideo, weather, theme);
        
        // 通知插件动画完成
        this.callbacks.onAnimationComplete();
        
        return { success: true, played: true, video: selectedVideo };
      } else {
        console.log('TabIntegrationManager: 跳过动画播放');
        
        // 通知插件可以直接显示tab内容
        this.callbacks.onAnimationComplete();
        
        return { success: true, played: false };
      }
      
    } catch (error) {
      console.error('TabIntegrationManager: 初始化失败', error);
      this.callbacks.onError(error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 检查是否应该播放动画
   * @param {object} weather - 天气数据
   * @param {object} settings - 设置数据
   * @returns {boolean} 是否应该播放
   */
  shouldPlayAnimation(weather, settings) {
    // 检查用户设置
    if (settings && settings.animationEnabled === false) {
      console.log('TabIntegrationManager: 用户禁用了动画');
      return false;
    }
    
    // 检查触发条件
    const triggerResult = this.triggerManager.shouldTriggerAnimation(weather.type);
    
    console.log('TabIntegrationManager: 触发检查结果', triggerResult);
    
    return triggerResult.shouldTrigger;
  }

  /**
   * 播放动画
   * @param {object} video - 视频信息
   * @param {object} weather - 天气数据
   * @param {object} theme - 主题数据
   * @returns {Promise} 播放结果
   */
  async playAnimation(video, weather, theme) {
    return new Promise((resolve, reject) => {
      try {
        console.log('TabIntegrationManager: 开始播放视频', {
          videoId: video.id,
          weatherType: weather.type,
          theme: theme
        });
        
        // 通知插件视频开始
        this.callbacks.onVideoStart(weather.type, video);
        
        // 播放视频
        this.videoManager.playWeatherVideo(weather.type, {
          duration: this.options.duration,
          enhanceEffects: this.options.enhanceEffects,
          onStart: () => {
            this.isPlaying = true;
            console.log('TabIntegrationManager: 视频开始播放');
          },
          onEnd: () => {
            this.isPlaying = false;
            console.log('TabIntegrationManager: 视频播放结束');
            
            // 通知插件视频结束
            this.callbacks.onVideoEnd(weather.type, video);
            
            resolve({ success: true });
          },
          onError: (error) => {
            this.isPlaying = false;
            console.error('TabIntegrationManager: 视频播放错误', error);
            
            this.callbacks.onError(error);
            reject(error);
          }
        });
        
      } catch (error) {
        console.error('TabIntegrationManager: 播放动画失败', error);
        reject(error);
      }
    });
  }

  /**
   * 更新回调函数
   * @param {object} callbacks - 回调函数对象
   */
  updateCallbacks(callbacks) {
    this.callbacks = {
      ...this.callbacks,
      ...callbacks
    };
  }

  /**
   * 停止当前播放
   */
  stop() {
    if (this.isPlaying) {
      this.videoManager.stopVideo();
      this.isPlaying = false;
      console.log('TabIntegrationManager: 停止播放');
    }
  }

  /**
   * 重置所有状态
   */
  reset() {
    this.stop();
    this.triggerManager.reset();
    this.cardSystem.reset();
    console.log('TabIntegrationManager: 状态已重置');
  }

  /**
   * 获取当前状态
   * @returns {object} 状态信息
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isPlaying: this.isPlaying,
      triggerStatus: this.triggerManager.getStatus(),
      cardStats: this.cardSystem.getStats(),
      options: this.options
    };
  }

  /**
   * 手动触发动画（用于测试）
   * @param {string} weatherType - 天气类型
   * @param {object} theme - 主题数据
   * @returns {Promise} 播放结果
   */
  async manualTrigger(weatherType, theme = {}) {
    console.log('TabIntegrationManager: 手动触发动画', weatherType);
    
    const weather = { type: weatherType };
    const settings = { animationEnabled: true };
    
    return this.initializeTab({ weather, theme, settings });
  }

  /**
   * 销毁实例
   */
  destroy() {
    this.stop();
    this.videoManager = null;
    this.triggerManager = null;
    this.cardSystem = null;
    this.callbacks = {};
    console.log('TabIntegrationManager: 实例已销毁');
  }
}
