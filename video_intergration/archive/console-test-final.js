/**
 * 最终控制台测试脚本
 * 一键测试和修复所有视频相关功能
 * 
 * 使用方法：
 * 1. 打开新标签页（F12 -> Console）
 * 2. 复制粘贴这整个脚本并按回车
 * 3. 运行测试命令
 */

console.log('🎬 加载最终视频测试脚本...');

// 创建全局测试对象
window.FinalVideoTest = {
  
  /**
   * 一键修复所有问题并测试
   */
  async fixAndTest() {
    console.log('🔧 开始一键修复和测试...');
    
    // 1. 修复动画池
    console.log('📝 步骤 1: 修复动画池...');
    this.fixAnimationPools();
    
    // 2. 重置触发系统
    console.log('🔄 步骤 2: 重置触发系统...');
    await this.resetAllTriggers();
    
    // 3. 测试自动播放
    console.log('🎬 步骤 3: 测试前两次自动播放...');
    await this.testTabOpenTriggers();
    
    // 4. 测试手动播放
    console.log('✋ 步骤 4: 测试手动播放...');
    await this.testManualPlayback();
    
    // 5. 开始轮播测试
    console.log('🎠 步骤 5: 开始轮播测试...');
    this.startQuickCarousel();
    
    console.log('✅ 一键修复和测试完成!');
    console.log('💡 使用 FinalVideoTest.stopCarousel() 停止轮播');
    console.log('💡 使用 FinalVideoTest.playVideo("rain") 手动播放视频');
  },

  /**
   * 修复动画池问题
   */
  fixAnimationPools() {
    if (!window.aeScape?.cardSystem) {
      console.error('❌ 动画系统未找到');
      return false;
    }

    console.log('🔧 修复动画池...');
    
    // 直接覆盖动画池配置
    window.aeScape.cardSystem.animationPools = {
      clear: {
        name: "晴天动画池",
        videos: [
          "Windy_1.webm", "cloudy_1.webm", "cloudy_2.webm", "cloudy_3.webm", "cloudy_4.webm",
          "cloudy_5.webm", "cloudy_6.webm", "cloudy_7.webm", "cloudy_8.webm", "cloudy_9.webm",
          "cloudy_10.webm", "cloudy_11.webm", "cloudy_12.webm", "cloudy_13.webm", "cloudy_14.webm",
          "cloudy_15.webm", "cloudy_16.webm", "cloudy_17.webm", "cloudy_18.webm", "cloudy_19.webm",
          "cloudy_20.webm"
        ].map((file, index) => ({
          id: `clear_${String(index + 1).padStart(3, '0')}`,
          path: `video/tab/c/${file}`,
          weight: 80,
          type: "normal",
          description: `晴天 - ${file}`
        }))
      },
      cloudy: {
        name: "多云动画池",
        videos: [
          "Windy_1.webm", "cloudy_1.webm", "cloudy_2.webm", "cloudy_3.webm", "cloudy_4.webm",
          "cloudy_5.webm", "cloudy_6.webm", "cloudy_7.webm", "cloudy_8.webm", "cloudy_9.webm",
          "cloudy_10.webm", "cloudy_11.webm", "cloudy_12.webm", "cloudy_13.webm", "cloudy_14.webm",
          "cloudy_15.webm", "cloudy_16.webm", "cloudy_17.webm", "cloudy_18.webm", "cloudy_19.webm",
          "cloudy_20.webm"
        ].map((file, index) => ({
          id: `cloudy_${String(index + 1).padStart(3, '0')}`,
          path: `video/tab/c/${file}`,
          weight: 80,
          type: "normal",
          description: `多云 - ${file}`
        }))
      },
      rain: {
        name: "雨天动画池",
        videos: [
          // r 文件夹
          ...["rain_1.webm", "rain_2.webm", "rain_3.webm", "rain_6.webm", "rain_7.webm", "rain_8.webm", "rain_9.webm", "rain_10.webm", "rain_12.webm"].map((file, index) => ({
            id: `rain_${String(index + 1).padStart(3, '0')}`,
            path: `video/tab/r/${file}`,
            weight: 80,
            type: "normal",
            description: `雨天 - ${file}`
          })),
          // bv 特殊文件夹
          ...["bottomview_1.webm", "bottomview_2.webm", "bottomview_4.webm"].map((file, index) => ({
            id: `rain_special_${String(index + 1).padStart(3, '0')}`,
            path: `video/tab/bv/${file}`,
            weight: 15,
            type: "special",
            description: `雨天特效 - ${file}`
          })),
          // g 稀有文件夹
          ...["glass_1.webm", "glass_2.webm", "glass_3.webm", "glass_4.webm"].map((file, index) => ({
            id: `rain_rare_${String(index + 1).padStart(3, '0')}`,
            path: `video/tab/g/${file}`,
            weight: 5,
            type: "rare",
            description: `雨天稀有 - ${file}`
          }))
        ]
      },
      snow: {
        name: "雪天动画池",
        videos: [
          "snow_1.webm", "snow_2.webm", "snow_3.webm", "snow_4.webm", "snow_5.webm",
          "snow_6.webm", "snow_7.webm", "snow_8.webm", "snow_9.webm"
        ].map((file, index) => ({
          id: `snow_${String(index + 1).padStart(3, '0')}`,
          path: `video/tab/s/${file}`,
          weight: 80,
          type: "normal",
          description: `雪天 - ${file}`
        }))
      },
      fog: {
        name: "雾天动画池",
        videos: [
          "foggy_1.webm", "foggy_2.webm", "foggy_3.webm"
        ].map((file, index) => ({
          id: `fog_${String(index + 1).padStart(3, '0')}`,
          path: `video/tab/f/${file}`,
          weight: 80,
          type: "normal",
          description: `雾天 - ${file}`
        }))
      },
      thunderstorm: {
        name: "雷暴动画池",
        videos: [
          "thunder_1.webm", "thunder_2.webm", "thunder_3.webm", "thunder_4.webm"
        ].map((file, index) => ({
          id: `thunderstorm_${String(index + 1).padStart(3, '0')}`,
          path: `video/tab/t/${file}`,
          weight: 10,
          type: "rare",
          description: `雷暴 - ${file}`
        }))
      }
    };

    // 验证修复结果
    let totalVideos = 0;
    const pools = window.aeScape.cardSystem.animationPools;
    console.log('📊 修复后视频统计:');
    for (const [weatherType, pool] of Object.entries(pools)) {
      const count = pool.videos.length;
      totalVideos += count;
      console.log(`  • ${weatherType}: ${count} 个视频`);
    }
    console.log(`🎯 总计: ${totalVideos} 个视频`);
    
    return totalVideos;
  },

  /**
   * 重置所有触发器
   */
  async resetAllTriggers() {
    // 重置视频触发管理器
    if (window.aeScape?.videoTriggerManager) {
      try {
        await window.aeScape.videoTriggerManager.resetTriggerState();
        console.log('✅ 视频触发器已重置');
      } catch (error) {
        console.warn('⚠️ 重置视频触发器失败:', error);
      }
    }

    // 重置动画卡系统
    if (window.aeScape?.cardSystem) {
      try {
        window.aeScape.cardSystem.reset();
        console.log('✅ 动画卡系统已重置');
      } catch (error) {
        console.warn('⚠️ 重置动画卡系统失败:', error);
      }
    }
  },

  /**
   * 测试标签页打开触发
   */
  async testTabOpenTriggers() {
    if (!window.aeScape?.videoTriggerManager) {
      console.error('❌ 视频触发管理器未找到');
      return;
    }

    console.log('🔄 测试前两次标签页自动播放...');

    // 测试第一次
    console.log('📍 测试第一次标签页打开...');
    const result1 = await window.aeScape.videoTriggerManager.checkShouldTriggerVideo();
    console.log('🎯 第一次结果:', result1);
    
    if (result1.shouldTrigger) {
      await this.playVideoByWeatherType(result1.weatherType, '第一次自动播放');
    }

    // 等待一下
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 测试第二次
    console.log('📍 测试第二次标签页打开...');
    const result2 = await window.aeScape.videoTriggerManager.checkShouldTriggerVideo();
    console.log('🎯 第二次结果:', result2);
    
    if (result2.shouldTrigger) {
      await this.playVideoByWeatherType(result2.weatherType, '第二次自动播放');
    }

    // 等待一下
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 测试第三次（应该不会触发）
    console.log('📍 测试第三次标签页打开（应该不触发）...');
    const result3 = await window.aeScape.videoTriggerManager.checkShouldTriggerVideo();
    console.log('🎯 第三次结果:', result3);
    
    if (result3.shouldTrigger) {
      console.log('⚠️ 警告: 第三次仍然触发了，可能存在问题');
    } else {
      console.log('✅ 正确: 第三次没有触发');
    }
  },

  /**
   * 测试手动播放
   */
  async testManualPlayback() {
    console.log('🎮 测试手动播放各种天气...');
    
    const weatherTypes = ['clear', 'cloudy', 'rain', 'snow', 'fog', 'thunderstorm'];
    
    for (const weatherType of weatherTypes) {
      console.log(`🎬 手动播放: ${weatherType}`);
      await this.playVideoByWeatherType(weatherType, '手动测试');
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  },

  /**
   * 播放指定天气类型的视频
   */
  async playVideoByWeatherType(weatherType, reason = 'test') {
    if (!window.aeScape?.playVideoAnimation) {
      console.error('❌ 视频播放函数未找到');
      return false;
    }

    try {
      await window.aeScape.playVideoAnimation(weatherType, {
        reason: reason,
        triggerType: 'console_test'
      });
      console.log(`✅ ${weatherType} 视频播放成功 (${reason})`);
      return true;
    } catch (error) {
      console.error(`❌ ${weatherType} 视频播放失败:`, error);
      return false;
    }
  },

  /**
   * 开始快速轮播
   */
  startQuickCarousel() {
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
    }

    console.log('🎠 开始快速轮播 (3秒间隔)...');
    
    const weatherTypes = ['clear', 'cloudy', 'rain', 'snow', 'fog', 'thunderstorm'];
    let currentIndex = 0;

    this.carouselTimer = setInterval(async () => {
      const weatherType = weatherTypes[currentIndex];
      console.log(`🎬 轮播播放: ${weatherType} [${currentIndex + 1}/${weatherTypes.length}]`);
      
      await this.playVideoByWeatherType(weatherType, '轮播测试');
      
      currentIndex = (currentIndex + 1) % weatherTypes.length;
    }, 3000);

    console.log('✅ 轮播已开始');
  },

  /**
   * 停止轮播
   */
  stopCarousel() {
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
      this.carouselTimer = null;
      console.log('⏹️ 轮播已停止');
    }
  },

  /**
   * 手动播放视频（简化接口）
   */
  async playVideo(weatherType = 'clear') {
    return await this.playVideoByWeatherType(weatherType, '手动播放');
  },

  /**
   * 获取当前系统状态
   */
  getStatus() {
    const status = {
      videoManager: !!window.aeScape?.videoManager,
      cardSystem: !!window.aeScape?.cardSystem,
      triggerManager: !!window.aeScape?.videoTriggerManager,
      videoCount: 0,
      tabOpenCount: 0
    };

    if (window.aeScape?.cardSystem?.animationPools) {
      for (const pool of Object.values(window.aeScape.cardSystem.animationPools)) {
        if (pool.videos) {
          status.videoCount += pool.videos.length;
        }
      }
    }

    if (window.aeScape?.videoTriggerManager?.state) {
      status.tabOpenCount = window.aeScape.videoTriggerManager.state.tabOpenCount;
    }

    console.log('📊 系统状态:', status);
    return status;
  },

  /**
   * 显示帮助信息
   */
  help() {
    console.log('🎬 视频测试控制台帮助:');
    console.log('');
    console.log('🔧 主要命令:');
    console.log('  • FinalVideoTest.fixAndTest()     - 一键修复所有问题并开始测试');
    console.log('  • FinalVideoTest.playVideo("rain") - 手动播放指定天气视频');
    console.log('  • FinalVideoTest.stopCarousel()   - 停止轮播测试');
    console.log('  • FinalVideoTest.getStatus()      - 查看系统状态');
    console.log('');
    console.log('🎮 天气类型:');
    console.log('  • clear, cloudy, rain, snow, fog, thunderstorm');
    console.log('');
    console.log('💡 建议使用流程:');
    console.log('  1. FinalVideoTest.fixAndTest()  - 首次运行');
    console.log('  2. FinalVideoTest.playVideo()   - 测试单个视频');
    console.log('  3. FinalVideoTest.stopCarousel() - 完成测试');
  }
};

// 显示欢迎信息
console.log('✅ 最终视频测试脚本已加载!');
console.log('');
console.log('🚀 快速开始:');
console.log('   FinalVideoTest.fixAndTest()  - 一键修复和测试所有功能');
console.log('');
console.log('📖 更多帮助:');
console.log('   FinalVideoTest.help()        - 查看完整帮助');

// 自动检查状态
FinalVideoTest.getStatus();