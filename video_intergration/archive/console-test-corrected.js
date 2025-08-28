/**
 * 修正版控制台测试脚本
 * 测试正确的触发逻辑：前两次启动后打开tab才播放
 */

console.log('🎬 加载修正版视频测试脚本...');

// 创建全局测试对象
window.CorrectedVideoTest = {
  
  /**
   * 一键测试修正后的功能
   */
  async testCorrectedFeatures() {
    console.log('🔧 开始测试修正后的功能...');
    
    // 1. 修复动画池
    console.log('📝 步骤 1: 修复动画池...');
    this.fixAnimationPools();
    
    // 2. 测试启动计数逻辑
    console.log('🚀 步骤 2: 测试启动触发逻辑...');
    await this.testStartupTriggerLogic();
    
    // 3. 测试黑幕和动画效果
    console.log('🖤 步骤 3: 测试黑幕和呼吸感动画...');
    this.testUIAnimations();
    
    // 4. 测试视频播放时的黑幕同步
    console.log('🎬 步骤 4: 测试视频播放黑幕同步...');
    await this.testVideoPlaybackWithMask();
    
    console.log('✅ 修正功能测试完成!');
    console.log('💡 说明: 前两次启动时打开新tab会自动播放视频');
    console.log('💡 使用 CorrectedVideoTest.simulateRestart() 模拟重新启动');
  },

  /**
   * 修复动画池
   */
  fixAnimationPools() {
    if (!window.aeScape?.cardSystem) {
      console.error('❌ 动画系统未找到');
      return false;
    }

    console.log('🔧 修复动画池...');
    
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
          ...["rain_1.webm", "rain_2.webm", "rain_3.webm", "rain_6.webm", "rain_7.webm", "rain_8.webm", "rain_9.webm", "rain_10.webm", "rain_12.webm"].map((file, index) => ({
            id: `rain_${String(index + 1).padStart(3, '0')}`,
            path: `video/tab/r/${file}`,
            weight: 80,
            type: "normal",
            description: `雨天 - ${file}`
          })),
          ...["bottomview_1.webm", "bottomview_2.webm", "bottomview_4.webm"].map((file, index) => ({
            id: `rain_special_${String(index + 1).padStart(3, '0')}`,
            path: `video/tab/bv/${file}`,
            weight: 15,
            type: "special",
            description: `雨天特效 - ${file}`
          })),
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
   * 测试启动触发逻辑
   */
  async testStartupTriggerLogic() {
    if (!window.aeScape?.videoTriggerManager) {
      console.error('❌ 视频触发管理器未找到');
      return;
    }

    console.log('🔍 检查当前启动计数...');
    const manager = window.aeScape.videoTriggerManager;
    
    console.log('📈 当前状态:', {
      extensionStartCount: manager.state.extensionStartCount,
      lastStartTime: manager.state.lastStartTime,
      lastTabOpenTime: manager.state.lastTabOpenTime
    });

    // 测试触发检查
    const result = await manager.checkShouldTriggerVideo();
    console.log('🎯 触发检查结果:', result);

    if (result.shouldTrigger) {
      console.log(`✅ 会触发播放: ${result.reason}`);
      await this.playVideoByWeatherType(result.weatherType, result.reason);
    } else {
      console.log(`ℹ️ 不会触发播放: ${result.reason}`);
      console.log('💡 这是正常的，因为已经超过前两次启动');
    }
  },

  /**
   * 模拟重新启动（重置计数器进行测试）
   */
  async simulateRestart() {
    console.log('🔄 模拟重新启动...');
    
    if (window.aeScape?.videoTriggerManager) {
      try {
        // 重置启动计数
        window.aeScape.videoTriggerManager.state.extensionStartCount = 0;
        window.aeScape.videoTriggerManager.state.lastStartTime = 0;
        
        // 设置一个旧的会话结束时间
        await chrome.storage.local.set({ 
          lastSessionEnd: Date.now() - 2 * 60 * 60 * 1000 // 2小时前
        });
        
        console.log('✅ 已重置启动计数，现在可以测试前两次启动触发');
        
        // 立即测试
        await this.testStartupTriggerLogic();
        
      } catch (error) {
        console.error('❌ 模拟重启失败:', error);
      }
    }
  },

  /**
   * 测试UI动画效果
   */
  testUIAnimations() {
    console.log('🎨 检查UI动画状态...');
    
    // 检查黑幕
    const bootMask = document.getElementById('boot-mask');
    console.log('🖤 开场黑幕:', bootMask ? '存在' : '已移除');
    
    // 检查内容动画类
    const hasContentReady = document.body.classList.contains('content-ready');
    const hasThemeReady = document.body.classList.contains('theme-ready');
    
    console.log('📊 动画状态:');
    console.log(`  • content-ready: ${hasContentReady ? '✅' : '❌'}`);
    console.log(`  • theme-ready: ${hasThemeReady ? '✅' : '❌'}`);
    
    // 检查主容器透明度
    const mainContainer = document.querySelector('.main-container');
    if (mainContainer) {
      const opacity = window.getComputedStyle(mainContainer).opacity;
      console.log(`  • 主容器透明度: ${opacity}`);
    }

    // 如果需要，强制启用动画
    if (!hasContentReady) {
      console.log('🔧 强制启用内容呼吸感动画...');
      document.body.classList.add('content-ready');
    }
  },

  /**
   * 测试视频播放时的黑幕同步
   */
  async testVideoPlaybackWithMask() {
    console.log('🎬 测试视频播放黑幕同步...');
    
    if (window.aeScape?.videoManager?.animation) {
      const animation = window.aeScape.videoManager.animation;
      console.log('📊 视频动画状态:');
      console.log(`  • 是否初始化: ${animation.isInitialized}`);
      console.log(`  • 黑幕层: ${animation.blackOverlay ? '存在' : '缺失'}`);
      console.log(`  • 视频容器: ${animation.videoContainer ? '存在' : '缺失'}`);
    }
    
    // 测试播放一个视频
    console.log('🎬 测试播放视频（检查黑幕同步）...');
    await this.playVideoByWeatherType('clear', '黑幕同步测试');
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
      console.log(`🎬 播放 ${weatherType} 视频 (${reason})`);
      await window.aeScape.playVideoAnimation(weatherType, {
        reason: reason,
        triggerType: 'console_test'
      });
      console.log(`✅ ${weatherType} 视频播放成功`);
      return true;
    } catch (error) {
      console.error(`❌ ${weatherType} 视频播放失败:`, error);
      return false;
    }
  },

  /**
   * 获取系统状态
   */
  getStatus() {
    const status = {
      videoManager: !!window.aeScape?.videoManager,
      cardSystem: !!window.aeScape?.cardSystem,
      triggerManager: !!window.aeScape?.videoTriggerManager,
      videoCount: 0,
      startupCount: 0,
      hasBootMask: !!document.getElementById('boot-mask'),
      hasContentReady: document.body.classList.contains('content-ready'),
      hasThemeReady: document.body.classList.contains('theme-ready')
    };

    if (window.aeScape?.cardSystem?.animationPools) {
      for (const pool of Object.values(window.aeScape.cardSystem.animationPools)) {
        if (pool.videos) {
          status.videoCount += pool.videos.length;
        }
      }
    }

    if (window.aeScape?.videoTriggerManager?.state) {
      status.startupCount = window.aeScape.videoTriggerManager.state.extensionStartCount;
    }

    console.log('📊 系统状态:', status);
    return status;
  },

  /**
   * 显示帮助信息
   */
  help() {
    console.log('🎬 修正版视频测试控制台帮助:');
    console.log('');
    console.log('🔧 主要命令:');
    console.log('  • CorrectedVideoTest.testCorrectedFeatures() - 测试所有修正功能');
    console.log('  • CorrectedVideoTest.simulateRestart()      - 模拟重启（重置启动计数）');
    console.log('  • CorrectedVideoTest.getStatus()           - 查看系统状态');
    console.log('');
    console.log('🎯 修正内容:');
    console.log('  • 前两次启动后打开tab才自动播放（不是每次打开tab）');
    console.log('  • 0.3s黑幕淡入缓解主题切换闪烁');
    console.log('  • 0.8s内容呼吸感动画恢复');
    console.log('  • 视频播放时黑幕同步问题修复');
    console.log('');
    console.log('💡 测试流程:');
    console.log('  1. CorrectedVideoTest.testCorrectedFeatures() - 全面测试');
    console.log('  2. CorrectedVideoTest.simulateRestart()       - 模拟重启测试');
    console.log('  3. 重新加载页面查看实际效果');
  }
};

// 显示欢迎信息
console.log('✅ 修正版视频测试脚本已加载!');
console.log('');
console.log('🚀 快速开始:');
console.log('   CorrectedVideoTest.testCorrectedFeatures() - 测试所有修正功能');
console.log('');
console.log('📖 更多帮助:');
console.log('   CorrectedVideoTest.help()                  - 查看完整帮助');

// 自动检查状态
CorrectedVideoTest.getStatus();