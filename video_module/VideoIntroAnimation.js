/**
 * 天景 AeScape - 视频开幕动画模块
 * 独立的视频播放和过渡效果管理
 * 集成双层视频播放和增强效果
 * 
 * 功能特性：
 * - 精确的基于视频时长的过渡控制
 * - 支持Alpha通道视频的平滑过渡
 * - 双层视频播放（清晰层+光晕层）
 * - 视频增强效果（基于 advice.md）
 * - 模块化设计，易于集成
 * - 完整的错误处理和状态管理
 */

class VideoIntroAnimation {
  constructor(options = {}) {
    this.videoContainer = null;
    this.video = null;
    this.videoCore = null;
    this.videoGlow = null;
    this.vignette = null;
    this.isInitialized = false;
    this.isPlaying = false;
    this.useDoubleLayer = options.useDoubleLayer !== false; // 默认使用双层
    
    // 配置选项
    this.config = {
      containerId: options.containerId || 'intro-video-container',
      videoId: options.videoId || 'intro-video',
      autoPlay: options.autoPlay !== false, // 默认自动播放
      duration: options.duration || 1500, // 播放时长（毫秒）
      enhanceEffects: options.enhanceEffects !== false, // 默认启用增强效果
      onStart: options.onStart || null,
      onEnd: options.onEnd || null,
      onError: options.onError || null,
      onProgress: options.onProgress || null
    };
    
    this.init();
  }

  init() {
    this.videoContainer = document.getElementById(this.config.containerId);
    
    if (!this.videoContainer) {
      console.warn('VideoIntroAnimation: Video container not found');
      return;
    }

    // 创建双层视频结构
    this.createDoubleLayerStructure();
    
    this.setupEventListeners();
    this.isInitialized = true;
    console.log('VideoIntroAnimation: 初始化完成');
  }

  /**
   * 创建双层视频播放结构
   */
  createDoubleLayerStructure() {
    try {
      // 清空容器
      this.videoContainer.innerHTML = '';
      
      // 创建视频舞台
      const videoStage = document.createElement('div');
      videoStage.className = 'video-stage';
      
      if (this.useDoubleLayer) {
        // 创建清晰层视频
        this.videoCore = document.createElement('video');
        this.videoCore.className = 'intro-video fx-core';
        this.videoCore.muted = true;
        this.videoCore.playsInline = true;
        this.videoCore.loop = false; // 禁用循环播放
        
        // 创建光晕层视频
        this.videoGlow = document.createElement('video');
        this.videoGlow.className = 'intro-video fx-glow';
        this.videoGlow.muted = true;
        this.videoGlow.playsInline = true;
        this.videoGlow.loop = false; // 禁用循环播放
        
        // 添加到舞台
        videoStage.appendChild(this.videoCore);
        videoStage.appendChild(this.videoGlow);
        
        // 设置主视频引用
        this.video = this.videoCore;
        
      } else {
        // 单层视频模式
        this.video = document.createElement('video');
        this.video.className = 'intro-video';
        this.video.muted = true;
        this.video.playsInline = true;
        this.video.loop = false; // 禁用循环播放
        
        videoStage.appendChild(this.video);
      }
      
      // 创建径向渐晕效果
      if (this.config.enhanceEffects) {
        this.vignette = document.createElement('div');
        this.vignette.className = 'vignette';
        videoStage.appendChild(this.vignette);
      }
      
      // 添加到容器
      this.videoContainer.appendChild(videoStage);
      
      console.log('VideoIntroAnimation: 双层视频结构创建完成');
      
    } catch (error) {
      console.error('VideoIntroAnimation: 创建双层视频结构失败', error);
      // 回退到单层模式
      this.useDoubleLayer = false;
      this.createSingleLayerStructure();
    }
  }

  /**
   * 创建单层视频结构（回退模式）
   */
  createSingleLayerStructure() {
    try {
      this.videoContainer.innerHTML = '';
      
      this.video = document.createElement('video');
      this.video.className = 'intro-video';
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.loop = false; // 禁用循环播放
      
      this.videoContainer.appendChild(this.video);
      
      console.log('VideoIntroAnimation: 单层视频结构创建完成');
      
    } catch (error) {
      console.error('VideoIntroAnimation: 创建单层视频结构失败', error);
    }
  }

  setupEventListeners() {
    // 视频可以播放时的处理
    this.video.addEventListener('canplay', () => {
      console.log('VideoIntroAnimation: 视频可以播放');
      if (this.config.onStart) this.config.onStart();
    });

    // 视频播放结束后的处理
    this.video.addEventListener('ended', () => {
      console.log('VideoIntroAnimation: 视频播放结束');
      this.hideVideo();
      if (this.config.onEnd) this.config.onEnd();
    });

    // 视频加载错误处理
    this.video.addEventListener('error', (e) => {
      console.error('VideoIntroAnimation: 视频加载错误', e);
      this.hideVideo();
      if (this.config.onError) this.config.onError(e);
    });

    // 视频播放进度监听，实现精确的过渡控制
    this.video.addEventListener('timeupdate', () => {
      this.updateOpacity();
      if (this.config.onProgress) {
        this.config.onProgress(this.video.currentTime, this.video.duration);
      }
    });

    // 双层视频同步
    if (this.useDoubleLayer && this.videoGlow) {
      this.video.addEventListener('play', () => {
        this.videoGlow.play().catch(e => console.warn('VideoIntroAnimation: 光晕层播放失败', e));
      });
      
      this.video.addEventListener('pause', () => {
        this.videoGlow.pause();
      });
      
      this.video.addEventListener('seeked', () => {
        this.videoGlow.currentTime = this.video.currentTime;
      });
    }
  }

  updateOpacity() {
    if (!this.video || !this.isPlaying) return;
    
    const currentTime = this.video.currentTime;
    const duration = this.video.duration;
    
    if (duration > 0) {
      const progress = currentTime / duration;
      
      console.log(`VideoIntroAnimation: 播放进度 ${(progress * 100).toFixed(1)}%`);
      
      // 前1/2时间：背景保持纯黑，不透明度100%
      if (progress < 0.5) {
        this.videoContainer.style.opacity = 1;
        this.videoContainer.classList.remove('video-ready');
        console.log('VideoIntroAnimation: 阶段1 - 黑色背景');
      }
      // 1/2到2/3时间：tab逐渐出现（背景从黑变透明），不透明度100%
      else if (progress >= 0.5 && progress < 2/3) {
        this.videoContainer.style.opacity = 1;
        this.videoContainer.classList.add('video-ready');
        console.log('VideoIntroAnimation: 阶段2 - 背景变透明');
      }
      // 最后1/3时间：从100%不透明度变到0
      else if (progress >= 2/3) {
        const fadeProgress = (progress - 2/3) / (1/3); // 0到1的进度
        const opacity = 1 - fadeProgress;
        this.videoContainer.style.opacity = opacity;
        console.log(`VideoIntroAnimation: 阶段3 - 淡出 ${(opacity * 100).toFixed(1)}%`);
      }
    }
  }

  /**
   * 设置视频源
   * @param {string} src - 视频源路径
   */
  setVideoSource(src) {
    try {
      if (!src) {
        console.warn('VideoIntroAnimation: 视频源为空');
        return false;
      }
      
      console.log('VideoIntroAnimation: 设置视频源', src);
      
      // 停止当前播放的视频
      if (this.video) {
        this.video.pause();
        this.video.currentTime = 0;
      }
      if (this.videoGlow) {
        this.videoGlow.pause();
        this.videoGlow.currentTime = 0;
      }
      
      // 设置主视频源
      this.video.src = src;
      
      // 设置光晕层视频源
      if (this.useDoubleLayer && this.videoGlow) {
        this.videoGlow.src = src;
        
        // 设置光晕层播放速率和偏移
        this.videoGlow.playbackRate = 0.85;
        this.videoGlow.currentTime = 0.03; // 约一帧偏移，制造微残影
      }
      
      console.log('VideoIntroAnimation: 视频源设置完成', src);
      return true;
      
    } catch (error) {
      console.error('VideoIntroAnimation: 设置视频源失败', error);
      return false;
    }
  }

  hideVideo() {
    // 不隐藏容器，而是设置为透明，这样背景界面可以显示
    this.videoContainer.style.opacity = 0;
    this.videoContainer.style.pointerEvents = 'none';
    this.isPlaying = false;
    
    // 停止视频播放
    if (this.video) {
      this.video.pause();
      this.video.currentTime = 0;
    }
    if (this.videoGlow) {
      this.videoGlow.pause();
      this.videoGlow.currentTime = 0;
    }
    
    console.log('VideoIntroAnimation: 视频隐藏，背景界面可见');
  }

  play() {
    if (!this.isInitialized) {
      console.warn('VideoIntroAnimation: 模块未初始化');
      return;
    }

    this.isPlaying = true;
    this.videoContainer.style.display = 'flex';
    this.videoContainer.style.opacity = 1;
    this.videoContainer.style.pointerEvents = 'auto';
    this.videoContainer.classList.remove('video-ready', 'fade-out');
    
    // 确保开始时是黑色背景
    this.videoContainer.style.background = '#000';
    
    // 重置视频到开始位置
    this.video.currentTime = 0;
    if (this.videoGlow) {
      this.videoGlow.currentTime = 0;
    }

    // 确保视频自动播放，但不循环
    this.video.loop = false; // 禁用循环播放
    if (this.videoGlow) {
      this.videoGlow.loop = false; // 禁用循环播放
    }

    this.video.play().catch(error => {
      console.warn('VideoIntroAnimation: 视频自动播放失败', error);
      this.hideVideo();
    });
    
    console.log('VideoIntroAnimation: 开始播放视频，初始黑色背景');
  }

  stop() {
    if (this.video) {
      this.video.pause();
      this.video.currentTime = 0;
    }
    if (this.videoGlow) {
      this.videoGlow.pause();
      this.videoGlow.currentTime = 0;
    }
    this.hideVideo();
  }

  pause() {
    if (this.video) {
      this.video.pause();
    }
    if (this.videoGlow) {
      this.videoGlow.pause();
    }
    this.isPlaying = false;
  }

  resume() {
    if (this.video) {
      this.video.play();
      this.isPlaying = true;
    }
  }

  /**
   * 切换双层/单层模式
   * @param {boolean} useDouble - 是否使用双层
   */
  toggleDoubleLayer(useDouble) {
    if (this.useDoubleLayer !== useDouble) {
      this.useDoubleLayer = useDouble;
      this.createDoubleLayerStructure();
      this.setupEventListeners();
      console.log('VideoIntroAnimation: 切换视频层模式', useDouble ? '双层' : '单层');
    }
  }

  /**
   * 切换增强效果
   * @param {boolean} enable - 是否启用增强效果
   */
  toggleEnhanceEffects(enable) {
    this.config.enhanceEffects = enable;
    
    if (enable && !this.vignette) {
      // 添加渐晕效果
      const videoStage = this.videoContainer.querySelector('.video-stage');
      if (videoStage) {
        this.vignette = document.createElement('div');
        this.vignette.className = 'vignette';
        videoStage.appendChild(this.vignette);
      }
    } else if (!enable && this.vignette) {
      // 移除渐晕效果
      this.vignette.remove();
      this.vignette = null;
    }
    
    console.log('VideoIntroAnimation: 增强效果', enable ? '启用' : '禁用');
  }

  // 获取当前状态
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isPlaying: this.isPlaying,
      useDoubleLayer: this.useDoubleLayer,
      enhanceEffects: this.config.enhanceEffects,
      currentTime: this.video ? this.video.currentTime : 0,
      duration: this.video ? this.video.duration : 0,
      progress: this.video && this.video.duration > 0 ? 
        (this.video.currentTime / this.video.duration) * 100 : 0
    };
  }

  // 设置配置选项
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  // 销毁模块
  destroy() {
    if (this.video) {
      this.video.pause();
      this.video.removeEventListener('canplay', null);
      this.video.removeEventListener('ended', null);
      this.video.removeEventListener('error', null);
      this.video.removeEventListener('timeupdate', null);
    }
    
    if (this.videoGlow) {
      this.videoGlow.pause();
    }
    
    this.hideVideo();
    this.isInitialized = false;
    this.isPlaying = false;
    console.log('VideoIntroAnimation: 模块已销毁');
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VideoIntroAnimation;
}