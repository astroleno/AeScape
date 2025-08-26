/**
 * 天景 AeScape - 视频开幕动画模块
 * 独立的视频播放和过渡效果管理
 */

class VideoIntroAnimation {
  constructor() {
    this.videoContainer = null;
    this.video = null;
    this.isInitialized = false;
    this.isPlaying = false;
    
    this.init();
  }

  init() {
    this.videoContainer = document.getElementById('intro-video-container');
    this.video = document.getElementById('intro-video');
    
    if (!this.videoContainer || !this.video) {
      console.warn('Video elements not found');
      return;
    }

    this.setupEventListeners();
    this.isInitialized = true;
    console.log('VideoIntroAnimation initialized');
  }

  setupEventListeners() {
    // 视频可以播放时的处理
    this.video.addEventListener('canplay', () => {
      console.log('Video ready to play');
    });

    // 视频播放结束后的处理
    this.video.addEventListener('ended', () => {
      console.log('Intro video ended');
      this.hideVideo();
    });

    // 视频加载错误处理
    this.video.addEventListener('error', (e) => {
      console.error('Video loading error:', e);
      this.hideVideo();
    });

    // 视频播放进度监听，实现精确的过渡控制
    this.video.addEventListener('timeupdate', () => {
      this.updateOpacity();
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
    console.log('Intro video hidden, background interface visible');
  }

  play() {
    if (!this.isInitialized) {
      console.warn('VideoIntroAnimation not initialized');
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
      console.warn('Video autoplay failed:', error);
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

  // 获取当前状态
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isPlaying: this.isPlaying,
      currentTime: this.video ? this.video.currentTime : 0,
      duration: this.video ? this.video.duration : 0
    };
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VideoIntroAnimation;
}