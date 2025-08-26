/**
 * 天景 AeScape - 视频开幕动画模块
 * 独立的视频播放和过渡效果管理
 * 
 * 功能特性：
 * - 精确的基于视频时长的过渡控制
 * - 支持Alpha通道视频的平滑过渡
 * - 模块化设计，易于集成
 * - 完整的错误处理和状态管理
 */

class VideoIntroAnimation {
  constructor(options = {}) {
    this.videoContainer = null;
    this.video = null;
    this.isInitialized = false;
    this.isPlaying = false;
    
    // 配置选项
    this.config = {
      containerId: options.containerId || 'intro-video-container',
      videoId: options.videoId || 'intro-video',
      autoPlay: options.autoPlay !== false, // 默认自动播放
      onStart: options.onStart || null,
      onEnd: options.onEnd || null,
      onError: options.onError || null,
      onProgress: options.onProgress || null
    };
    
    this.init();
  }

  init() {
    this.videoContainer = document.getElementById(this.config.containerId);
    this.video = document.getElementById(this.config.videoId);
    
    if (!this.videoContainer || !this.video) {
      console.warn('VideoIntroAnimation: Video elements not found');
      return;
    }

    this.setupEventListeners();
    this.isInitialized = true;
    console.log('VideoIntroAnimation: 初始化完成');
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
  }

  updateOpacity() {
    if (!this.video || !this.isPlaying) return;
    
    const currentTime = this.video.currentTime;
    const duration = this.video.duration;
    
    if (duration > 0) {
      const progress = currentTime / duration;
      
      // 前1/2时间：背景保持纯黑，不透明度100%
      if (progress < 0.5) {
        this.videoContainer.style.opacity = 1;
        this.videoContainer.classList.remove('video-ready');
      }
      // 1/2到2/3时间：tab逐渐出现（背景从黑变透明），不透明度100%
      else if (progress >= 0.5 && progress < 2/3) {
        this.videoContainer.style.opacity = 1;
        this.videoContainer.classList.add('video-ready');
      }
      // 最后1/3时间：从100%不透明度变到0
      else if (progress >= 2/3) {
        const fadeProgress = (progress - 2/3) / (1/3); // 0到1的进度
        const opacity = 1 - fadeProgress;
        this.videoContainer.style.opacity = opacity;
      }
    }
  }

  hideVideo() {
    // 不隐藏容器，而是设置为透明，这样背景界面可以显示
    this.videoContainer.style.opacity = 0;
    this.videoContainer.style.pointerEvents = 'none';
    this.isPlaying = false;
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
    
    // 重置视频到开始位置
    this.video.currentTime = 0;

    // 确保视频自动播放
    this.video.play().catch(error => {
      console.warn('VideoIntroAnimation: 视频自动播放失败', error);
      this.hideVideo();
    });
    
    console.log('VideoIntroAnimation: 开始播放视频');
  }

  stop() {
    if (this.video) {
      this.video.pause();
      this.video.currentTime = 0;
    }
    this.hideVideo();
  }

  pause() {
    if (this.video) {
      this.video.pause();
    }
    this.isPlaying = false;
  }

  resume() {
    if (this.video) {
      this.video.play();
      this.isPlaying = true;
    }
  }

  // 获取当前状态
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isPlaying: this.isPlaying,
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