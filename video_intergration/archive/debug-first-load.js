/**
 * 首次载入轮播调试脚本
 */

console.log('🔍 首次载入轮播调试开始');

async function debugFirstLoad() {
  console.log('\n📋 1. 检查存储状态');
  console.log('=====================================');
  
  try {
    const storage = await chrome.storage.local.get([
      'hasFirstLoadCarousel',
      'videoTriggerState',
      'shouldShowWelcomeVideo',
      'settingsChanged',
      'recentUpdate'
    ]);
    
    console.log('存储状态:', storage);
    console.log('hasFirstLoadCarousel:', storage.hasFirstLoadCarousel);
    console.log('首次载入状态:', !storage.hasFirstLoadCarousel ? '✅ 应该触发' : '❌ 已完成');
  } catch (error) {
    console.error('❌ 存储检查失败:', error);
  }
  
  console.log('\n📋 2. 检查视频系统初始化');
  console.log('=====================================');
  
  if (window.aeScape) {
    console.log('✅ aeScape实例存在');
    console.log('videoSettings:', window.aeScape.videoSettings);
    console.log('videoTriggerManager:', !!window.aeScape.videoTriggerManager);
    console.log('videoManager:', !!window.aeScape.videoManager);
    console.log('cardSystem:', !!window.aeScape.cardSystem);
  } else {
    console.log('❌ aeScape实例不存在');
  }
  
  console.log('\n📋 3. 手动触发检查');
  console.log('=====================================');
  
  if (window.aeScape?.videoTriggerManager) {
    try {
      const triggerResult = await window.aeScape.videoTriggerManager.checkShouldTriggerVideo();
      console.log('触发检查结果:', triggerResult);
      
      if (triggerResult.shouldTrigger && triggerResult.needsCarousel) {
        console.log('✅ 应该触发首次载入轮播');
        
        console.log('\n📋 4. 手动执行轮播');
        console.log('=====================================');
        
        if (window.aeScape.startFirstLoadCarousel) {
          console.log('🎠 开始手动执行轮播...');
          await window.aeScape.startFirstLoadCarousel();
        } else {
          console.log('❌ startFirstLoadCarousel方法不存在');
        }
      } else {
        console.log('❌ 不应该触发轮播:', triggerResult.reason);
      }
    } catch (error) {
      console.error('❌ 触发检查失败:', error);
    }
  } else {
    console.log('❌ videoTriggerManager不存在');
  }
  
  console.log('\n📋 5. 清理状态重新测试');
  console.log('=====================================');
  
  console.log('🧹 清理hasFirstLoadCarousel状态...');
  try {
    await chrome.storage.local.remove(['hasFirstLoadCarousel']);
    console.log('✅ 状态已清理');
    
    // 等待一下再重新检查
    setTimeout(async () => {
      console.log('🔄 重新检查...');
      if (window.aeScape?.checkSpecialTriggers) {
        await window.aeScape.checkSpecialTriggers();
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ 清理失败:', error);
  }
}

// 等待页面完全加载后执行
setTimeout(debugFirstLoad, 2000);

// 导出手动调用函数
window.debugFirstLoad = debugFirstLoad;

console.log('💡 手动调用: debugFirstLoad()');