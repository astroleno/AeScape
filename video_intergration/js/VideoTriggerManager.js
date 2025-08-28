/**
 * 天景 AeScape - 视频触发管理器
 * 管理各种视频播放触发条件：首次安装、设置完成、浏览器重启等
 */

class VideoTriggerManager {
  constructor(options = {}) {
    this.config = {
      // 触发条件开关
      enableWelcomeVideo: options.enableWelcomeVideo !== false,      // 首次安装欢迎视频
      enableSettingsVideo: options.enableSettingsVideo !== false,   // 设置完成后视频
      enableRestartVideo: options.enableRestartVideo !== false,     // 浏览器重启后视频
      enableUpdateVideo: options.enableUpdateVideo !== false,       // 扩展更新后视频
      enableFirstLoadCarousel: options.enableFirstLoadCarousel !== false, // 首次载入轮播
      
      // 触发间隔控制
      minTriggerInterval: options.minTriggerInterval || 30 * 60 * 1000, // 30分钟最小间隔
      sessionTimeout: options.sessionTimeout || 60 * 60 * 1000,         // 1小时会话超时
      
      // 调试选项
      debug: options.debug || false
    };
    
    this.state = {
      lastTriggerTime: 0,
      sessionStartTime: Date.now(),
      isFirstTabThisSession: true,
      hasTriggeredThisSession: false,
      hasFirstLoadCarousel: false,  // 是否已执行首次载入轮播
      lastTabOpenTime: 0            // 上次标签页打开时间
    };
    
    console.log('VideoTriggerManager: 初始化完成', this.config);
  }

  /**
   * 初始化触发管理器
   */
  async init() {
    try {
      // 加载状态
      await this.loadState();
      
      // 检测会话重启
      await this.checkSessionRestart();
      
      // 监听存储变化
      this.setupStorageListener();
      
      console.log('VideoTriggerManager: 初始化状态', this.state);
    } catch (error) {
      console.error('VideoTriggerManager: 初始化失败', error);
    }
  }

  /**
   * 加载状态数据
   */
  async loadState() {
    try {
      const result = await chrome.storage.local.get([
        'videoTriggerState',
        'lastSessionEnd',
        'lastTriggerTime',
        'extensionStartCount',
        'lastStartTime',
        'lastTabOpenTime'
      ]);
      
      if (result.videoTriggerState) {
        this.state = { ...this.state, ...result.videoTriggerState };
      }
      
      if (result.lastTriggerTime) {
        this.state.lastTriggerTime = result.lastTriggerTime;
      }
      
      if (result.extensionStartCount !== undefined) {
        this.state.extensionStartCount = result.extensionStartCount;
      }
      
      if (result.lastStartTime) {
        this.state.lastStartTime = result.lastStartTime;
      }
      
      if (result.lastTabOpenTime) {
        this.state.lastTabOpenTime = result.lastTabOpenTime;
      }
      
    } catch (error) {
      console.error('VideoTriggerManager: 加载状态失败', error);
    }
  }

  /**
   * 保存状态数据
   */
  async saveState() {
    try {
      await chrome.storage.local.set({
        videoTriggerState: this.state,
        lastTriggerTime: this.state.lastTriggerTime,
        extensionStartCount: this.state.extensionStartCount,
        lastStartTime: this.state.lastStartTime,
        lastTabOpenTime: this.state.lastTabOpenTime
      });
    } catch (error) {
      console.error('VideoTriggerManager: 保存状态失败', error);
    }
  }

  /**
   * 检测会话重启
   */
  async checkSessionRestart() {
    try {
      const result = await chrome.storage.local.get(['lastSessionEnd']);
      const lastSessionEnd = result.lastSessionEnd || 0;
      const now = Date.now();
      
      // 如果距离上次会话结束超过指定时间，认为是新会话
      const isNewSession = now - lastSessionEnd > this.config.sessionTimeout;
      
      if (isNewSession && lastSessionEnd > 0) {
        console.log('VideoTriggerManager: 检测到会话重启');
        this.state.isFirstTabThisSession = true;
        this.state.hasTriggeredThisSession = false;
        this.state.sessionStartTime = now;
      }
      
      // 更新当前会话开始时间
      await chrome.storage.local.set({ currentSessionStart: now });
      
    } catch (error) {
      console.error('VideoTriggerManager: 检测会话重启失败', error);
    }
  }

  /**
   * 设置存储监听器（监听设置变化）
   */
  setupStorageListener() {
    try {
      if (chrome?.storage?.onChanged) {
        chrome.storage.onChanged.addListener((changes, area) => {
          if (area === 'local') {
            this.handleStorageChange(changes);
          }
        });
      }
    } catch (error) {
      console.error('VideoTriggerManager: 设置存储监听器失败', error);
    }
  }

  /**
   * 处理存储变化
   */
  async handleStorageChange(changes) {
    try {
      // 检测API设置变化
      if (changes.apiKey && changes.apiKey.newValue && changes.apiKey.newValue !== changes.apiKey.oldValue) {
        console.log('VideoTriggerManager: 检测到API密钥设置');
        await chrome.storage.local.set({ 
          settingsChanged: true,
          settingsChangeTime: Date.now(),
          settingsChangeType: 'api_configured'
        });
      }
      
      // 检测位置设置变化
      if (changes.location && changes.location.newValue) {
        const oldLoc = changes.location.oldValue;
        const newLoc = changes.location.newValue;
        if (!oldLoc || oldLoc.name !== newLoc.name) {
          console.log('VideoTriggerManager: 检测到位置设置变化');
          await chrome.storage.local.set({ 
            settingsChanged: true,
            settingsChangeTime: Date.now(),
            settingsChangeType: 'location_changed'
          });
        }
      }
      
      // 检测视频设置变化
      if (changes.videoSettings && changes.videoSettings.newValue) {
        console.log('VideoTriggerManager: 检测到视频设置变化');
        await chrome.storage.local.set({ 
          settingsChanged: true,
          settingsChangeTime: Date.now(),
          settingsChangeType: 'video_settings'
        });
      }
      
    } catch (error) {
      console.error('VideoTriggerManager: 处理存储变化失败', error);
    }
  }

  /**
   * 检查是否为首次载入
   */
  async checkFirstLoad() {
    try {
      console.log('VideoTriggerManager: 开始检查首次载入状态...');
      
      const result = await chrome.storage.local.get(['hasFirstLoadCarousel']);
      const hasCarousel = result.hasFirstLoadCarousel || false;
      
      console.log('VideoTriggerManager: 首次载入检查结果:', {
        hasFirstLoadCarousel: hasCarousel,
        storageResult: result
      });
      
      if (!hasCarousel) {
        console.log('🎠 VideoTriggerManager: 检测到首次载入，准备触发轮播！');
        return true;
      } else {
        console.log('VideoTriggerManager: 首次载入轮播已完成，跳过');
        return false;
      }
      
    } catch (error) {
      console.error('VideoTriggerManager: 检查首次载入失败', error);
      // 如果检查失败，默认认为是首次载入
      return true;
    }
  }

  /**
   * 记录标签页打开事件
   */
  async recordTabOpen() {
    const now = Date.now();
    this.state.lastTabOpenTime = now;
    await this.saveState();
    
    console.log(`VideoTriggerManager: 记录标签页打开`);
  }

  /**
   * 检查是否应该触发视频
   * @returns {object} 触发结果
   */
  async checkShouldTriggerVideo() {
    try {
      const now = Date.now();
      const result = {
        shouldTrigger: false,
        reason: null,
        triggerType: null,
        weatherType: 'clear' // 默认天气类型
      };
      
      // 记录标签页打开
      await this.recordTabOpen();
      
      // 检查首次载入轮播触发
      if (this.config.enableFirstLoadCarousel) {
        const isFirstLoad = await this.checkFirstLoad();
        if (isFirstLoad) {
          result.shouldTrigger = true;
          result.reason = 'first_load_carousel';
          result.triggerType = 'first_load_carousel';
          result.needsCarousel = true; // 特殊标记，表示需要轮播
          console.log('VideoTriggerManager: 首次载入轮播触发');
          return result;
        }
      }
      
      // 检查最小间隔（仅对其他触发类型生效）
      if (now - this.state.lastTriggerTime < this.config.minTriggerInterval) {
        result.reason = 'too_soon';
        return result;
      }
      
      // 获取存储状态
      const storageData = await chrome.storage.local.get([
        'firstInstall',
        'shouldShowWelcomeVideo',
        'settingsChanged',
        'settingsChangeTime',
        'recentUpdate',
        'weather'
      ]);
      
      // 1. 首次安装触发
      if (this.config.enableWelcomeVideo && storageData.shouldShowWelcomeVideo) {
        result.shouldTrigger = true;
        result.reason = 'first_install';
        result.triggerType = 'welcome';
        
        // 清除首次安装标记
        await chrome.storage.local.set({ 
          shouldShowWelcomeVideo: false,
          firstInstall: false
        });
        return result;
      }
      
      // 2. 扩展更新触发
      if (this.config.enableUpdateVideo && storageData.recentUpdate && 
          now - (storageData.updateTime || 0) < 24 * 60 * 60 * 1000) { // 24小时内
        result.shouldTrigger = true;
        result.reason = 'extension_update';
        result.triggerType = 'update';
        
        // 清除更新标记
        await chrome.storage.local.set({ recentUpdate: false });
        return result;
      }
      
      // 3. 设置完成后触发
      if (this.config.enableSettingsVideo && storageData.settingsChanged) {
        const timeSinceChange = now - (storageData.settingsChangeTime || 0);
        // 设置变化后5分钟内有效
        if (timeSinceChange < 5 * 60 * 1000) {
          result.shouldTrigger = true;
          result.reason = 'settings_completed';
          result.triggerType = 'settings';
          
          // 清除设置变化标记
          await chrome.storage.local.set({ 
            settingsChanged: false 
          });
          return result;
        }
      }
      
      // 4. 会话重启触发（首次打开标签页）
      if (this.config.enableRestartVideo && this.state.isFirstTabThisSession && 
          !this.state.hasTriggeredThisSession) {
        const sessionAge = now - this.state.sessionStartTime;
        // 会话开始后30秒内触发
        if (sessionAge < 30 * 1000) {
          result.shouldTrigger = true;
          result.reason = 'session_restart';
          result.triggerType = 'restart';
          
          this.state.isFirstTabThisSession = false;
          this.state.hasTriggeredThisSession = true;
          await this.saveState();
          return result;
        }
      }
      
      // 根据当前天气设置默认天气类型
      if (storageData.weather?.weather?.code) {
        result.weatherType = storageData.weather.weather.code;
      }
      
      return result;
      
    } catch (error) {
      console.error('VideoTriggerManager: 检查触发条件失败', error);
      return { shouldTrigger: false, reason: 'error' };
    }
  }

  /**
   * 标记首次载入轮播已完成
   */
  async markFirstLoadCarouselCompleted() {
    try {
      await chrome.storage.local.set({ hasFirstLoadCarousel: true });
      this.state.hasFirstLoadCarousel = true;
      console.log('VideoTriggerManager: 已标记首次载入轮播完成');
    } catch (error) {
      console.error('VideoTriggerManager: 标记首次载入完成失败', error);
    }
  }

  /**
   * 记录触发事件
   * @param {string} triggerType - 触发类型
   * @param {string} reason - 触发原因
   */
  async recordTrigger(triggerType, reason) {
    try {
      this.state.lastTriggerTime = Date.now();
      this.state.hasTriggeredThisSession = true;
      
      // 如果是首次载入轮播，标记完成
      if (triggerType === 'first_load_carousel') {
        await this.markFirstLoadCarouselCompleted();
      }
      
      await this.saveState();
      
      // 记录触发历史
      const history = {
        timestamp: Date.now(),
        triggerType,
        reason,
        sessionId: this.state.sessionStartTime
      };
      
      const result = await chrome.storage.local.get(['videoTriggerHistory']);
      const triggerHistory = result.videoTriggerHistory || [];
      triggerHistory.push(history);
      
      // 只保留最近50条记录
      if (triggerHistory.length > 50) {
        triggerHistory.splice(0, triggerHistory.length - 50);
      }
      
      await chrome.storage.local.set({ videoTriggerHistory: triggerHistory });
      
      if (this.config.debug) {
        console.log('VideoTriggerManager: 记录触发', history);
      }
      
    } catch (error) {
      console.error('VideoTriggerManager: 记录触发失败', error);
    }
  }

  /**
   * 标记会话结束
   */
  async markSessionEnd() {
    try {
      await chrome.storage.local.set({ 
        lastSessionEnd: Date.now() 
      });
    } catch (error) {
      console.error('VideoTriggerManager: 标记会话结束失败', error);
    }
  }

  /**
   * 获取触发历史
   * @param {number} limit - 限制数量
   * @returns {Array} 触发历史
   */
  async getTriggerHistory(limit = 10) {
    try {
      const result = await chrome.storage.local.get(['videoTriggerHistory']);
      const history = result.videoTriggerHistory || [];
      return history.slice(-limit).reverse();
    } catch (error) {
      console.error('VideoTriggerManager: 获取触发历史失败', error);
      return [];
    }
  }

  /**
   * 重置标签页打开计数
   */
  async resetTabOpenCount() {
    try {
      this.state.tabOpenCount = 0;
      this.state.lastTabOpenTime = 0;
      await this.saveState();
      console.log('VideoTriggerManager: 标签页打开计数已重置');
    } catch (error) {
      console.error('VideoTriggerManager: 重置标签页计数失败', error);
    }
  }

  /**
   * 重置触发状态
   */
  async resetTriggerState() {
    try {
      this.state = {
        lastTriggerTime: 0,
        sessionStartTime: Date.now(),
        isFirstTabThisSession: true,
        hasTriggeredThisSession: false,
        tabOpenCount: 0,
        lastTabOpenTime: 0
      };
      
      await chrome.storage.local.remove([
        'videoTriggerState',
        'shouldShowWelcomeVideo',
        'settingsChanged',
        'recentUpdate',
        'videoTriggerHistory',
        'tabOpenCount',
        'lastTabOpenTime'
      ]);
      
      console.log('VideoTriggerManager: 触发状态已重置');
    } catch (error) {
      console.error('VideoTriggerManager: 重置触发状态失败', error);
    }
  }

  /**
   * 获取当前状态
   * @returns {object} 当前状态
   */
  getStatus() {
    return {
      config: this.config,
      state: this.state,
      currentTime: Date.now()
    };
  }

  /**
   * 更新配置
   * @param {object} newConfig - 新配置
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('VideoTriggerManager: 配置已更新', this.config);
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VideoTriggerManager;
}

// 创建全局实例
if (typeof window !== 'undefined') {
  window.VideoTriggerManager = VideoTriggerManager;
}