/**
 * 最终修复版控制台测试脚本
 * 测试所有修复后的功能
 */

console.log('🎬 加载最终修复版测试脚本...');

window.FinalFixedTest = {
  
  /**
   * 一键测试所有修复
   */
  async testAllFixes() {
    console.log('🔧 开始测试所有修复功能...');
    
    // 1. 检查系统状态
    console.log('📝 步骤 1: 检查系统状态...');
    this.checkSystemStatus();
    
    // 2. 修复动画池
    console.log('📝 步骤 2: 修复动画池...');
    this.fixAnimationPools();
    
    // 3. 测试首次载入轮播
    console.log('🎠 步骤 3: 模拟首次载入轮播...');
    await this.simulateFirstLoadCarousel();
    
    // 4. 测试UI动画
    console.log('🎨 步骤 4: 测试UI动画效果...');
    this.testUIAnimations();
    
    console.log('✅ 所有功能测试完成!');
    console.log('💡 说明:');
    console.log('  • 首次载入会播放轮播：雨→雪→云→闪电→雾（1.2s间隔，0.3s重叠）');
    console.log('  • 之后按正常触发机制工作');
    console.log('  • 0.3s黑幕淡出 + 0-0.5s内容渐进淡入');
    console.log('  • 修复了VideoStreamOptimizer和AnimationCardSystem报错');
  },

  /**
   * 检查系统状态
   */
  checkSystemStatus() {
    const status = {
      videoManager: !!window.aeScape?.videoManager,
      cardSystem: !!window.aeScape?.cardSystem,
      triggerManager: !!window.aeScape?.videoTriggerManager,
      hasFirstLoadCarousel: false,
      videoCount: 0,
      hasBootMask: !!document.getElementById('boot-mask'),
      hasContentReady: document.body.classList.contains('content-ready'),
      hasThemeReady: document.body.classList.contains('theme-ready')
    };

    // 检查首次载入状态
    try {
      chrome.storage.local.get(['hasFirstLoadCarousel']).then(result => {
        status.hasFirstLoadCarousel = !!result.hasFirstLoadCarousel;
        console.log('📊 首次载入轮播状态:', status.hasFirstLoadCarousel ? '已完成' : '未完成');
      });
    } catch (error) {
      console.warn('无法检查首次载入状态');
    }

    // 统计视频数量
    if (window.aeScape?.cardSystem?.animationPools) {
      for (const pool of Object.values(window.aeScape.cardSystem.animationPools)) {
        if (pool.videos) {
          status.videoCount += pool.videos.length;
        }
      }
    }

    console.log('📊 系统状态:', status);
    return status;
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
   * 模拟首次载入轮播
   */
  async simulateFirstLoadCarousel() {
    console.log('🔄 模拟首次载入轮播测试...');
    
    // 重置首次载入标记
    try {
      await chrome.storage.local.remove(['hasFirstLoadCarousel']);
      console.log('✅ 已重置首次载入标记');
      
      // 手动触发轮播
      if (window.aeScape?.startFirstLoadCarousel) {
        console.log('🎠 手动启动轮播...');
        await window.aeScape.startFirstLoadCarousel();
      } else {
        console.warn('⚠️ startFirstLoadCarousel方法未找到');
        
        // 手动实现轮播
        const weatherTypes = ['rain', 'snow', 'cloudy', 'thunderstorm', 'fog'];
        console.log('🎬 手动执行轮播:', weatherTypes.join(' ⟶ '));
        
        for (let i = 0; i < weatherTypes.length; i++) {
          const weatherType = weatherTypes[i];
          const delay = i * 1200; // 1.2s间隔
          
          setTimeout(async () => {
            console.log(`🎬 轮播第${i + 1}/${weatherTypes.length}: ${weatherType}`);
            await this.playVideo(weatherType, '首次轮播测试');
          }, delay);
        }
      }
      
    } catch (error) {
      console.error('❌ 模拟首次载入失败:', error);
    }
  },

  /**
   * 测试UI动画效果
   */
  testUIAnimations() {
    console.log('🎨 测试UI动画效果...');
    
    // 检查CSS类
    const hasContentReady = document.body.classList.contains('content-ready');
    const hasThemeReady = document.body.classList.contains('theme-ready');
    
    console.log('📊 动画状态:');
    console.log(`  • content-ready: ${hasContentReady ? '✅' : '❌'}`);
    console.log(`  • theme-ready: ${hasThemeReady ? '✅' : '❌'}`);
    
    // 检查各元素透明度
    const elements = [
      '.main-container',
      '.status-bar', 
      '.search-container',
      '.time-container',
      '.weather-card-container',
      '.floating-actions'
    ];
    
    elements.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        const opacity = window.getComputedStyle(element).opacity;
        const transform = window.getComputedStyle(element).transform;
        console.log(`  • ${selector}: 透明度=${opacity}, 变换=${transform !== 'none' ? '有' : '无'}`);
      }
    });
    
    // 如果动画未启用，强制启用
    if (!hasContentReady) {
      console.log('🔧 强制启用内容动画...');
      document.body.classList.add('content-ready');
      
      setTimeout(() => {
        console.log('✨ 内容呼吸感动画已启用');
      }, 100);
    }

    // 测试黑幕
    const bootMask = document.getElementById('boot-mask');
    console.log(`🖤 开场黑幕: ${bootMask ? '存在' : '已移除（正常）'}`);
  },

  /**
   * 播放视频
   */
  async playVideo(weatherType, reason = 'test') {
    if (!window.aeScape?.playVideoAnimation) {
      console.error('❌ 视频播放函数未找到');
      return false;
    }

    try {
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
   * 重置所有系统（用于重新测试）
   */
  async resetAllSystems() {
    console.log('🔄 重置所有系统...');
    
    try {
      // 重置首次载入标记
      await chrome.storage.local.remove(['hasFirstLoadCarousel']);
      
      // 重置触发管理器
      if (window.aeScape?.videoTriggerManager) {
        await window.aeScape.videoTriggerManager.resetTriggerState();
      }
      
      // 重置动画卡系统
      if (window.aeScape?.cardSystem) {
        window.aeScape.cardSystem.reset();
      }
      
      console.log('✅ 系统重置完成，刷新页面可重新体验首次载入轮播');
      
    } catch (error) {
      console.error('❌ 系统重置失败:', error);
    }
  },

  /**
   * 显示帮助信息
   */
  help() {
    console.log('🎬 最终修复版测试帮助:');
    console.log('');
    console.log('🔧 主要命令:');
    console.log('  • FinalFixedTest.testAllFixes()         - 测试所有修复功能');
    console.log('  • FinalFixedTest.simulateFirstLoadCarousel() - 模拟首次载入轮播');  
    console.log('  • FinalFixedTest.resetAllSystems()      - 重置所有系统');
    console.log('  • FinalFixedTest.playVideo("rain")      - 手动播放视频');
    console.log('');
    console.log('🎯 修复内容总结:');
    console.log('  • ✅ 首次载入轮播（雨雪云闪电雾，1.2s间隔，0.3s重叠）');
    console.log('  • ✅ 0.3s黑幕淡出缓解主题切换闪烁');
    console.log('  • ✅ 0-0.5s内容渐进淡入呼吸感');
    console.log('  • ✅ 修复VideoStreamOptimizer预加载报错');
    console.log('  • ✅ 修复AnimationCardSystem映射报错');
    console.log('  • ✅ 错误处理和静默机制');
    console.log('');
    console.log('💡 使用建议:');
    console.log('  1. FinalFixedTest.testAllFixes()  - 全面测试');
    console.log('  2. 刷新页面查看实际效果');
    console.log('  3. FinalFixedTest.resetAllSystems() - 重置重测');
  }
};

// 显示欢迎信息
console.log('✅ 最终修复版测试脚本已加载!');
console.log('');
console.log('🚀 快速开始:');
console.log('   FinalFixedTest.testAllFixes()    - 测试所有修复功能');
console.log('');
console.log('📖 更多帮助:');
console.log('   FinalFixedTest.help()            - 查看完整帮助');

// 自动检查状态
FinalFixedTest.checkSystemStatus();