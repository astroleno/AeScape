/**
 * 强制触发首次载入轮播 - 简化测试脚本
 */

console.log('🔥 强制触发首次载入轮播');

async function forceFirstLoadCarousel() {
  try {
    console.log('🧹 1. 清理存储状态...');
    await chrome.storage.local.remove(['hasFirstLoadCarousel']);
    await chrome.storage.local.set({ hasFirstLoadCarousel: false });
    console.log('✅ 存储状态已清理');
    
    console.log('⏰ 2. 等待2秒确保页面完全加载...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (!window.aeScape) {
      console.error('❌ window.aeScape不存在');
      return;
    }
    
    console.log('🔍 3. 检查系统状态...');
    console.log('videoSettings.enabled:', window.aeScape.videoSettings?.enabled);
    console.log('videoTriggerManager:', !!window.aeScape.videoTriggerManager);
    console.log('videoManager:', !!window.aeScape.videoManager);
    console.log('cardSystem:', !!window.aeScape.cardSystem);
    
    if (!window.aeScape.videoTriggerManager) {
      console.error('❌ videoTriggerManager未初始化');
      return;
    }
    
    console.log('🎯 4. 手动调用checkShouldTriggerVideo...');
    const triggerResult = await window.aeScape.videoTriggerManager.checkShouldTriggerVideo();
    console.log('触发结果:', triggerResult);
    
    if (triggerResult.shouldTrigger && triggerResult.needsCarousel) {
      console.log('🎪 5. 触发首次载入轮播!');
      
      // 记录触发
      await window.aeScape.videoTriggerManager.recordTrigger(triggerResult.triggerType, triggerResult.reason);
      
      // 执行轮播
      if (window.aeScape.startFirstLoadCarousel) {
        await window.aeScape.startFirstLoadCarousel();
        console.log('✅ 轮播已启动');
      } else {
        console.error('❌ startFirstLoadCarousel方法不存在');
      }
    } else {
      console.log('❌ 不满足触发条件:', triggerResult);
      
      // 强制触发轮播进行测试
      console.log('🔧 强制触发轮播进行测试...');
      if (window.aeScape.startFirstLoadCarousel) {
        await window.aeScape.startFirstLoadCarousel();
        console.log('✅ 强制轮播已启动');
      }
    }
    
  } catch (error) {
    console.error('❌ 强制触发失败:', error);
  }
}

// 等待页面完全初始化
setTimeout(forceFirstLoadCarousel, 3000);

// 导出手动调用
window.forceFirstLoadCarousel = forceFirstLoadCarousel;

console.log('💡 手动调用: forceFirstLoadCarousel()');