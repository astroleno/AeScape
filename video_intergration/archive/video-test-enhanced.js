/**
 * 增强型视频测试控制台脚本
 * 用于测试视频播放、轮播和触发机制
 */

// 全局测试对象
window.VideoTestSuite = {
  isRunning: false,
  currentTest: null,
  carouselTimer: null,
  currentVideoIndex: 0,
  allVideos: [],
  stats: {
    videosPlayed: 0,
    errors: 0,
    startTime: null
  },

  /**
   * 初始化测试套件
   */
  init() {
    console.log('🎬 增强型视频测试套件已加载');
    console.log('📋 可用命令：');
    console.log('  • VideoTestSuite.checkVideoSystem() - 检查视频系统状态');
    console.log('  • VideoTestSuite.forcePlayVideo(weatherType) - 强制播放指定天气视频');
    console.log('  • VideoTestSuite.startCarousel(interval) - 开始轮播所有视频');
    console.log('  • VideoTestSuite.stopCarousel() - 停止轮播');
    console.log('  • VideoTestSuite.testTabOpenTrigger() - 测试标签页打开触发');
    console.log('  • VideoTestSuite.resetTriggerSystem() - 重置触发系统');
    console.log('  • VideoTestSuite.fixAnimationPools() - 修复动画池问题');
    console.log('  • VideoTestSuite.showVideoStats() - 显示视频统计');
    
    this.checkVideoSystem();
  },

  /**
   * 检查视频系统状态
   */
  checkVideoSystem() {
    console.log('🔍 检查视频系统状态...');
    
    const systems = {
      'window.aeScape': window.aeScape,
      'VideoManager': window.aeScape?.videoManager,
      'AnimationCardSystem': window.aeScape?.cardSystem,
      'VideoTriggerManager': window.aeScape?.videoTriggerManager,
      'WeatherTriggerManager': window.aeScape?.triggerManager
    };

    let allOk = true;
    for (const [name, system] of Object.entries(systems)) {
      const status = system ? '✅' : '❌';
      console.log(`${status} ${name}: ${system ? '已加载' : '未找到'}`);
      if (!system) allOk = false;
    }

    if (window.aeScape?.cardSystem) {
      const stats = window.aeScape.cardSystem.getStats();
      console.log('📊 动画池统计:', stats);
      
      // 统计各天气类型的视频数量
      const pools = window.aeScape.cardSystem.animationPools;
      let totalVideos = 0;
      console.log('🎭 各天气类型视频数量:');
      for (const [weatherType, pool] of Object.entries(pools)) {
        const count = pool.videos ? pool.videos.length : 0;
        totalVideos += count;
        console.log(`  • ${weatherType}: ${count} 个视频`);
      }
      console.log(`📈 总计: ${totalVideos} 个视频`);
      
      // 检查是否存在问题
      if (totalVideos < 50) {
        console.warn('⚠️  警告: 视频数量异常，建议运行 VideoTestSuite.fixAnimationPools()');
      }
    }

    console.log(allOk ? '✅ 视频系统状态正常' : '❌ 视频系统存在问题');
    return allOk;
  },

  /**
   * 强制播放视频
   */
  async forcePlayVideo(weatherType = 'clear') {
    console.log(`🎬 强制播放 ${weatherType} 天气视频...`);
    
    if (!window.aeScape?.videoManager) {
      console.error('❌ 视频管理器未找到');
      return false;
    }

    try {
      await window.aeScape.playVideoAnimation(weatherType, {
        reason: 'manual_test',
        triggerType: 'console_test'
      });
      
      this.stats.videosPlayed++;
      console.log(`✅ 视频播放成功 (${weatherType})`);
      return true;
    } catch (error) {
      console.error('❌ 视频播放失败:', error);
      this.stats.errors++;
      return false;
    }
  },

  /**
   * 开始视频轮播
   */
  async startCarousel(intervalSeconds = 5) {
    if (this.carouselTimer) {
      console.log('⏹️ 停止当前轮播...');
      clearInterval(this.carouselTimer);
    }

    console.log(`🎠 开始视频轮播 (${intervalSeconds}秒间隔)...`);
    
    // 获取所有天气类型
    const weatherTypes = ['clear', 'cloudy', 'rain', 'snow', 'fog', 'thunderstorm'];
    
    // 收集所有视频
    this.allVideos = [];
    if (window.aeScape?.cardSystem) {
      const pools = window.aeScape.cardSystem.animationPools;
      for (const weatherType of weatherTypes) {
        if (pools[weatherType] && pools[weatherType].videos) {
          pools[weatherType].videos.forEach(video => {
            this.allVideos.push({
              weatherType,
              video,
              id: video.id,
              path: video.path
            });
          });
        }
      }
    }

    console.log(`📊 找到 ${this.allVideos.length} 个视频用于轮播`);
    
    if (this.allVideos.length === 0) {
      console.error('❌ 没有找到可轮播的视频');
      return;
    }

    this.isRunning = true;
    this.currentVideoIndex = 0;
    this.stats.startTime = Date.now();

    // 立即播放第一个视频
    await this.playCurrentVideo();

    // 设置定时器
    this.carouselTimer = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(this.carouselTimer);
        return;
      }
      
      this.currentVideoIndex = (this.currentVideoIndex + 1) % this.allVideos.length;
      await this.playCurrentVideo();
    }, intervalSeconds * 1000);

    console.log('✅ 轮播已开始，使用 VideoTestSuite.stopCarousel() 停止');
  },

  /**
   * 播放当前视频
   */
  async playCurrentVideo() {
    if (!this.allVideos[this.currentVideoIndex]) return;
    
    const { weatherType, video } = this.allVideos[this.currentVideoIndex];
    
    console.log(`🎬 轮播 [${this.currentVideoIndex + 1}/${this.allVideos.length}]: ${weatherType} - ${video.id}`);
    
    try {
      if (window.aeScape?.videoManager) {
        await window.aeScape.videoManager.playWeatherVideo(weatherType, {
          videoPath: video.path,
          blendMode: video.blendMode || 'lighten',
          reason: 'carousel_test'
        });
        this.stats.videosPlayed++;
      }
    } catch (error) {
      console.error(`❌ 播放失败: ${video.id}`, error);
      this.stats.errors++;
    }
  },

  /**
   * 停止轮播
   */
  stopCarousel() {
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
      this.carouselTimer = null;
    }
    
    this.isRunning = false;
    console.log('⏹️ 视频轮播已停止');
    this.showVideoStats();
  },

  /**
   * 测试标签页打开触发
   */
  async testTabOpenTrigger() {
    console.log('🔄 测试标签页打开触发机制...');
    
    if (!window.aeScape?.videoTriggerManager) {
      console.error('❌ 视频触发管理器未找到');
      return;
    }

    try {
      // 重置计数器进行测试
      await window.aeScape.videoTriggerManager.resetTabOpenCount();
      console.log('🔄 已重置标签页计数器');
      
      // 模拟检查触发条件
      const result = await window.aeScape.videoTriggerManager.checkShouldTriggerVideo();
      console.log('📊 触发检查结果:', result);
      
      if (result.shouldTrigger) {
        console.log(`✅ 触发成功: ${result.reason} (${result.triggerType})`);
        
        // 播放视频
        await this.forcePlayVideo(result.weatherType);
      } else {
        console.log(`ℹ️ 未触发: ${result.reason}`);
      }
      
      // 显示当前状态
      const status = window.aeScape.videoTriggerManager.getStatus();
      console.log('📈 触发器状态:', status);
      
    } catch (error) {
      console.error('❌ 测试失败:', error);
    }
  },

  /**
   * 重置触发系统
   */
  async resetTriggerSystem() {
    console.log('🔄 重置触发系统...');
    
    if (window.aeScape?.videoTriggerManager) {
      try {
        await window.aeScape.videoTriggerManager.resetTriggerState();
        console.log('✅ 视频触发系统已重置');
      } catch (error) {
        console.error('❌ 重置视频触发系统失败:', error);
      }
    }

    if (window.aeScape?.cardSystem) {
      try {
        window.aeScape.cardSystem.reset();
        console.log('✅ 动画卡系统已重置');
      } catch (error) {
        console.error('❌ 重置动画卡系统失败:', error);
      }
    }

    console.log('✅ 触发系统重置完成');
  },

  /**
   * 修复动画池问题（使用硬编码视频列表）
   */
  fixAnimationPools() {
    console.log('🔧 修复动画池问题...');
    
    if (!window.aeScape?.cardSystem) {
      console.error('❌ 动画卡系统未找到');
      return;
    }

    // 使用硬编码的完整视频池
    const fixedPools = {
      clear: {
        name: "晴天动画池",
        videos: [
          "Windy_1.webm", "cloudy_1.webm", "cloudy_2.webm", "cloudy_3.webm", "cloudy_4.webm",
          "cloudy_5.webm", "cloudy_6.webm", "cloudy_7.webm", "cloudy_8.webm", "cloudy_9.webm",
          "cloudy_10.webm", "cloudy_11.webm", "cloudy_12.webm", "cloudy_13.webm", "cloudy_14.webm",
          "cloudy_15.webm", "cloudy_16.webm", "cloudy_17.webm", "cloudy_18.webm", "cloudy_19.webm",
          "cloudy_20.webm", "cloudy_21.webm", "cloudy_22.webm", "cloudy_23.webm"
        ].map((file, index) => ({
          id: `c_${String(index + 1).padStart(3, '0')}`,
          path: `video/tab/c/${file}`,
          weight: 80,
          type: "normal",
          description: `晴天视频 - ${file}`
        }))
      },
      cloudy: {
        name: "多云动画池",
        videos: [
          "Windy_1.webm", "cloudy_1.webm", "cloudy_2.webm", "cloudy_3.webm", "cloudy_4.webm",
          "cloudy_5.webm", "cloudy_6.webm", "cloudy_7.webm", "cloudy_8.webm", "cloudy_9.webm",
          "cloudy_10.webm", "cloudy_11.webm", "cloudy_12.webm", "cloudy_13.webm", "cloudy_14.webm",
          "cloudy_15.webm", "cloudy_16.webm", "cloudy_17.webm", "cloudy_18.webm", "cloudy_19.webm",
          "cloudy_20.webm", "cloudy_21.webm", "cloudy_22.webm", "cloudy_23.webm"
        ].map((file, index) => ({
          id: `c_${String(index + 1).padStart(3, '0')}`,
          path: `video/tab/c/${file}`,
          weight: 80,
          type: "normal",
          description: `多云视频 - ${file}`
        }))
      },
      rain: {
        name: "雨天动画池",
        videos: [
          // rain 文件夹视频
          ...["rain_1.webm", "rain_2.webm", "rain_3.webm", "rain_6.webm", "rain_7.webm", "rain_8.webm", "rain_9.webm", "rain_10.webm", "rain_12.webm"].map((file, index) => ({
            id: `r_${String(index + 1).padStart(3, '0')}`,
            path: `video/tab/r/${file}`,
            weight: 80,
            type: "normal",
            description: `雨天视频 - ${file}`
          })),
          // bottomview 特殊视频
          ...["bottomview_1.webm", "bottomview_2.webm", "bottomview_4.webm"].map((file, index) => ({
            id: `bv_${String(index + 1).padStart(3, '0')}`,
            path: `video/tab/bv/${file}`,
            weight: 15,
            type: "special",
            description: `底部视角 - ${file}`
          })),
          // glass 稀有视频
          ...["glass_1.webm", "glass_2.webm", "glass_3.webm", "glass_4.webm"].map((file, index) => ({
            id: `g_${String(index + 1).padStart(3, '0')}`,
            path: `video/tab/g/${file}`,
            weight: 5,
            type: "rare",
            description: `玻璃效果 - ${file}`
          }))
        ]
      },
      snow: {
        name: "雪天动画池",
        videos: [
          "snow_1.webm", "snow_2.webm", "snow_3.webm", "snow_4.webm", "snow_5.webm",
          "snow_6.webm", "snow_7.webm", "snow_8.webm", "snow_9.webm"
        ].map((file, index) => ({
          id: `s_${String(index + 1).padStart(3, '0')}`,
          path: `video/tab/s/${file}`,
          weight: 80,
          type: "normal",
          description: `雪天视频 - ${file}`
        }))
      },
      fog: {
        name: "雾天动画池",
        videos: [
          "foggy_1.webm", "foggy_2.webm", "foggy_3.webm"
        ].map((file, index) => ({
          id: `f_${String(index + 1).padStart(3, '0')}`,
          path: `video/tab/f/${file}`,
          weight: 80,
          type: "normal",
          description: `雾天视频 - ${file}`
        }))
      },
      thunderstorm: {
        name: "雷暴动画池",
        videos: [
          "thunder_1.webm", "thunder_2.webm", "thunder_3.webm", "thunder_4.webm"
        ].map((file, index) => ({
          id: `t_${String(index + 1).padStart(3, '0')}`,
          path: `video/tab/t/${file}`,
          weight: 10,
          type: "rare",
          description: `雷暴视频 - ${file}`
        }))
      }
    };

    // 应用修复
    window.aeScape.cardSystem.animationPools = fixedPools;
    
    // 验证修复结果
    let totalVideos = 0;
    console.log('🎭 修复后各天气类型视频数量:');
    for (const [weatherType, pool] of Object.entries(fixedPools)) {
      const count = pool.videos.length;
      totalVideos += count;
      console.log(`  • ${weatherType}: ${count} 个视频`);
    }
    
    console.log(`✅ 修复完成! 总计: ${totalVideos} 个视频`);
    return totalVideos;
  },

  /**
   * 显示视频统计
   */
  showVideoStats() {
    console.log('📊 视频播放统计:');
    console.log(`  • 已播放视频: ${this.stats.videosPlayed}`);
    console.log(`  • 播放错误: ${this.stats.errors}`);
    
    if (this.stats.startTime) {
      const elapsed = (Date.now() - this.stats.startTime) / 1000;
      console.log(`  • 运行时间: ${elapsed.toFixed(1)} 秒`);
      
      if (elapsed > 0) {
        const rate = (this.stats.videosPlayed / elapsed).toFixed(2);
        console.log(`  • 播放速率: ${rate} 视频/秒`);
      }
    }
  },

  /**
   * 快速测试所有功能
   */
  async quickTest() {
    console.log('🚀 开始快速功能测试...');
    
    // 1. 检查系统
    const systemOk = this.checkVideoSystem();
    if (!systemOk) {
      console.log('🔧 尝试修复动画池...');
      this.fixAnimationPools();
    }
    
    // 2. 测试单个视频播放
    console.log('🎬 测试单个视频播放...');
    await this.forcePlayVideo('clear');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. 测试触发机制
    console.log('🔄 测试触发机制...');
    await this.testTabOpenTrigger();
    
    console.log('✅ 快速测试完成');
  }
};

// 自动初始化
VideoTestSuite.init();

console.log('🎯 增强型视频测试套件已就绪！');
console.log('💡 运行 VideoTestSuite.quickTest() 进行快速测试');
console.log('🎠 运行 VideoTestSuite.startCarousel() 开始视频轮播');