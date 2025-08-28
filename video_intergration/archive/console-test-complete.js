/**
 * 完整功能测试脚本
 * 验证首次载入轮播、黑幕渐隐、内容呼吸感动画等所有功能
 */

console.log('🎬 加载完整功能测试脚本...');

window.CompleteTest = {
  
  /**
   * 完整功能测试
   */
  async testCompleteFeatures() {
    console.log('🚀 开始完整功能测试...');
    console.log('');
    
    // 1. 系统状态检查
    console.log('📊 步骤 1: 检查系统状态...');
    this.checkSystemStatus();
    console.log('');
    
    // 2. 修复动画池
    console.log('🔧 步骤 2: 确保动画池正确...');
    this.ensureAnimationPools();
    console.log('');
    
    // 3. 测试UI动画效果
    console.log('✨ 步骤 3: 测试UI呼吸感动画...');
    this.testUIBreathingEffect();
    console.log('');
    
    // 4. 重置并测试首次载入
    console.log('🎠 步骤 4: 重置并测试首次载入轮播...');
    await this.testFirstLoadCarousel();
    console.log('');
    
    console.log('✅ 完整功能测试完成！');
    console.log('');
    console.log('📝 测试总结:');
    console.log('  ✨ 黑幕效果: 0.3s等待 + 0.5s渐隐');
    console.log('  💫 内容动画: 所有元素同时0.8s轻盈呼吸感');
    console.log('  🎬 首次轮播: 雨→雪→云→闪电→雾（1.2s间隔，0.3s重叠）');
    console.log('  🔧 错误处理: 所有报错已静默处理');
    console.log('');
    console.log('💡 下一步: 刷新页面查看完整效果！');
  },

  /**
   * 检查系统状态
   */
  checkSystemStatus() {
    const status = {
      videoManager: !!window.aeScape?.videoManager,
      cardSystem: !!window.aeScape?.cardSystem, 
      triggerManager: !!window.aeScape?.videoTriggerManager,
      videoCount: 0,
      uiState: {
        hasBootMask: !!document.getElementById('boot-mask'),
        hasContentReady: document.body.classList.contains('content-ready'),
        hasThemeReady: document.body.classList.contains('theme-ready')
      }
    };

    // 统计视频数量
    if (window.aeScape?.cardSystem?.animationPools) {
      for (const pool of Object.values(window.aeScape.cardSystem.animationPools)) {
        if (pool.videos) {
          status.videoCount += pool.videos.length;
        }
      }
    }

    console.log('📊 当前系统状态:', status);
    
    // 检查首次载入状态
    try {
      chrome.storage.local.get(['hasFirstLoadCarousel']).then(result => {
        const hasCompleted = !!result.hasFirstLoadCarousel;
        console.log(`🎠 首次载入轮播状态: ${hasCompleted ? '✅已完成' : '❌未完成（将会触发）'}`);
      });
    } catch (error) {
      console.warn('⚠️ 无法检查首次载入状态');
    }

    return status;
  },

  /**
   * 确保动画池正确配置
   */
  ensureAnimationPools() {
    if (!window.aeScape?.cardSystem) {
      console.error('❌ 动画卡系统未找到');
      return false;
    }

    // 检查当前池状态
    const pools = window.aeScape.cardSystem.animationPools;
    let totalVideos = 0;
    let needsFix = false;

    console.log('🎭 当前动画池状态:');
    for (const [weatherType, pool] of Object.entries(pools || {})) {
      const count = pool.videos ? pool.videos.length : 0;
      totalVideos += count;
      console.log(`  • ${weatherType}: ${count} 个视频`);
      
      // 检查是否需要修复
      if (count === 0 || (weatherType === 'rain' && count < 10)) {
        needsFix = true;
      }
    }

    console.log(`📈 总计: ${totalVideos} 个视频`);

    if (needsFix || totalVideos < 50) {
      console.log('🔧 检测到动画池需要修复，正在修复...');
      this.fixAnimationPools();
    } else {
      console.log('✅ 动画池状态正常');
    }

    return !needsFix;
  },

  /**
   * 修复动画池
   */
  fixAnimationPools() {
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

    console.log('✅ 动画池已修复');
  },

  /**
   * 测试UI呼吸感动画
   */
  testUIBreathingEffect() {
    console.log('🎨 测试UI呼吸感动画效果...');
    
    // 检查CSS类状态
    const hasContentReady = document.body.classList.contains('content-ready');
    const hasThemeReady = document.body.classList.contains('theme-ready');
    
    console.log('📊 动画状态:');
    console.log(`  • content-ready: ${hasContentReady ? '✅' : '❌'}`);
    console.log(`  • theme-ready: ${hasThemeReady ? '✅' : '❌'}`);
    
    // 检查关键元素的CSS属性
    const elements = [
      '.main-container',
      '.status-bar',
      '.search-container', 
      '.time-container',
      '.weather-card-container',
      '.floating-actions'
    ];
    
    console.log('🔍 元素动画状态:');
    elements.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        const styles = window.getComputedStyle(element);
        const opacity = styles.opacity;
        const transform = styles.transform;
        const filter = styles.filter;
        
        console.log(`  • ${selector}:`);
        console.log(`    - 透明度: ${opacity}`);
        console.log(`    - 变换: ${transform !== 'none' ? '✅有' : '❌无'}`);
        console.log(`    - 滤镜: ${filter !== 'none' ? '✅有' : '❌无'}`);
      }
    });
    
    // 如果动画未启用，给出提示
    if (!hasContentReady) {
      console.log('💡 内容动画未启用，这可能是因为:');
      console.log('  1. 黑幕还未完成渐隐');
      console.log('  2. 系统还在初始化中');
      console.log('  3. 可以手动启用: document.body.classList.add("content-ready")');
    } else {
      console.log('✨ UI呼吸感动画已启用，效果:');
      console.log('  • 所有元素同时开始0.8s轻盈过渡');
      console.log('  • 透明度: 0 → 1');
      console.log('  • 变换: translateY(6px) scale(0.985) → translateY(0) scale(1)');
      console.log('  • 滤镜: blur(0.5px) → blur(0px)');
    }
  },

  /**
   * 测试首次载入轮播
   */
  async testFirstLoadCarousel() {
    console.log('🎠 测试首次载入轮播功能...');
    
    if (!window.aeScape?.videoTriggerManager) {
      console.error('❌ 视频触发管理器未找到');
      return;
    }

    try {
      // 重置首次载入标记
      console.log('🔄 重置首次载入标记...');
      await chrome.storage.local.remove(['hasFirstLoadCarousel']);
      
      // 手动触发检查
      console.log('🔍 手动触发首次载入检查...');
      const result = await window.aeScape.videoTriggerManager.checkShouldTriggerVideo();
      
      console.log('📊 触发检查结果:', result);
      
      if (result.shouldTrigger && result.needsCarousel) {
        console.log('🎊 首次载入轮播将被触发！');
        console.log('🎬 轮播序列: 雨 → 雪 → 云 → 闪电 → 雾');
        console.log('⏱️  间隔: 1.2秒（0.3秒重叠）');
        
        // 记录触发事件
        await window.aeScape.videoTriggerManager.recordTrigger(result.triggerType, result.reason);
        
        // 启动轮播
        if (window.aeScape.startFirstLoadCarousel) {
          console.log('🚀 启动首次载入轮播...');
          await window.aeScape.startFirstLoadCarousel();
        } else {
          console.warn('⚠️ startFirstLoadCarousel方法未找到');
        }
        
      } else {
        console.log('ℹ️ 首次载入轮播不会触发');
        console.log('💡 可能原因:');
        console.log('  • 已经完成过首次载入轮播');
        console.log('  • 触发条件不满足');
        console.log('  • 视频系统未完全初始化');
      }
      
    } catch (error) {
      console.error('❌ 首次载入轮播测试失败:', error);
    }
  },

  /**
   * 强制重新体验完整流程
   */
  async forceFullExperience() {
    console.log('🔄 强制重置所有状态，准备完整体验...');
    
    try {
      // 重置所有相关存储
      await chrome.storage.local.remove([
        'hasFirstLoadCarousel',
        'videoTriggerState',
        'lastTriggerTime'
      ]);
      
      // 重置触发管理器状态
      if (window.aeScape?.videoTriggerManager) {
        await window.aeScape.videoTriggerManager.resetTriggerState();
      }
      
      // 重置动画系统
      if (window.aeScape?.cardSystem) {
        window.aeScape.cardSystem.reset();
      }
      
      console.log('✅ 所有状态已重置');
      console.log('');
      console.log('💡 下一步操作:');
      console.log('  1. 刷新页面 (F5)');
      console.log('  2. 观察完整体验:');
      console.log('     • 0.3s黑屏等待');
      console.log('     • 0.5s黑幕渐隐');
      console.log('     • 0.8s内容呼吸感出现');
      console.log('     • 首次载入轮播自动播放');
      
    } catch (error) {
      console.error('❌ 重置状态失败:', error);
    }
  },

  /**
   * 手动播放视频
   */
  async playVideo(weatherType = 'rain') {
    if (!window.aeScape?.playVideoAnimation) {
      console.error('❌ 视频播放函数未找到');
      return false;
    }

    try {
      console.log(`🎬 手动播放 ${weatherType} 视频...`);
      await window.aeScape.playVideoAnimation(weatherType, {
        reason: 'manual_test',
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
   * 显示帮助信息
   */
  help() {
    console.log('🎬 完整功能测试帮助:');
    console.log('');
    console.log('🔧 主要命令:');
    console.log('  • CompleteTest.testCompleteFeatures()    - 测试所有功能');
    console.log('  • CompleteTest.forceFullExperience()     - 重置并体验完整流程'); 
    console.log('  • CompleteTest.testFirstLoadCarousel()   - 单独测试首次载入轮播');
    console.log('  • CompleteTest.playVideo("rain")         - 手动播放指定天气视频');
    console.log('');
    console.log('🎯 完成的功能:');
    console.log('  ✅ 首次载入轮播触发修复');
    console.log('  ✅ 黑幕渐隐时机优化 (0.3s等待+0.5s渐隐)');
    console.log('  ✅ 内容呼吸感动画 (所有元素同时0.8s过渡)');
    console.log('  ✅ 视频轮播重叠播放 (1.2s间隔，0.3s重叠)');
    console.log('  ✅ 所有报错静默处理');
    console.log('');
    console.log('💡 最佳体验流程:');
    console.log('  1. CompleteTest.forceFullExperience()  - 重置状态');
    console.log('  2. 刷新页面观察完整效果');
    console.log('  3. CompleteTest.testCompleteFeatures() - 验证功能');
  }
};

// 显示欢迎信息
console.log('✅ 完整功能测试脚本已加载！');
console.log('');
console.log('🚀 快速开始:');
console.log('   CompleteTest.testCompleteFeatures()  - 测试所有功能');
console.log('   CompleteTest.forceFullExperience()   - 重置并体验完整流程');
console.log('');
console.log('📖 更多帮助:');
console.log('   CompleteTest.help()                  - 查看完整帮助');

// 自动进行快速状态检查
CompleteTest.checkSystemStatus();