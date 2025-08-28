/**
 * 天景 AeScape - 流畅动画测试脚本
 * 基于ref版本fadeInSoft设计的动画改进验证
 */

console.log('🎬 AeScape 流畅动画测试开始');

// 测试配置
const testConfig = {
  // 强制清理首次载入状态，测试轮播
  clearFirstLoad: true,
  
  // 测试动画效果
  testAnimations: true,
  
  // 调试模式
  debug: true,
  
  // 测试黑幕渐隐时机
  testBootMask: true
};

// 动画测试工具
class AnimationTester {
  constructor() {
    this.animationLog = [];
    this.startTime = performance.now();
    
    if (testConfig.debug) {
      this.setupAnimationObserver();
    }
  }
  
  // 观察动画执行
  setupAnimationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target;
          const elapsed = (performance.now() - this.startTime).toFixed(1);
          
          if (target.classList.contains('content-ready')) {
            console.log(`⚡ [${elapsed}ms] content-ready类已添加到`, target.tagName);
          }
        }
      });
    });
    
    observer.observe(document.body, { 
      attributes: true, 
      subtree: true, 
      attributeFilter: ['class'] 
    });
    
    console.log('👀 动画观察器已启动');
  }
  
  // 测试动画时机
  testAnimationTimings() {
    const elements = [
      '.status-bar',
      '.main-container', 
      '.search-container',
      '.time-container',
      '.weather-card-container',
      '.floating-actions'
    ];
    
    console.log('🎨 测试动画时机和效果');
    
    elements.forEach((selector, index) => {
      const element = document.querySelector(selector);
      if (element) {
        const computedStyle = window.getComputedStyle(element);
        console.log(`📐 ${selector}:`, {
          opacity: computedStyle.opacity,
          transform: computedStyle.transform,
          filter: computedStyle.filter,
          animation: computedStyle.animation
        });
      }
    });
  }
  
  // 分析动画性能
  analyzeAnimationPerformance() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'measure') {
            console.log(`⏱️ 动画性能: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
          }
        });
      });
      
      observer.observe({ entryTypes: ['measure'] });
      
      // 测量关键动画阶段
      performance.mark('animation-start');
      
      setTimeout(() => {
        performance.mark('animation-complete');
        performance.measure('total-animation-time', 'animation-start', 'animation-complete');
      }, 1500); // fadeInSoft最长1400ms + 100ms缓冲
    }
  }
}

// 首次载入轮播测试器
class FirstLoadCarouselTester {
  constructor() {
    this.results = {
      triggered: false,
      weatherTypes: [],
      timing: [],
      errors: []
    };
  }
  
  // 强制触发首次载入轮播
  async forceTriggerFirstLoad() {
    console.log('🎠 强制触发首次载入轮播测试');
    
    try {
      // 清理存储状态
      if (testConfig.clearFirstLoad) {
        await chrome.storage.local.remove(['hasFirstLoadCarousel']);
        console.log('🧹 已清理首次载入标记');
      }
      
      // 等待页面完全加载
      setTimeout(async () => {
        if (window.aeScape && window.aeScape.checkSpecialTriggers) {
          console.log('🔍 手动触发特殊条件检查');
          await window.aeScape.checkSpecialTriggers();
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ 强制触发失败:', error);
      this.results.errors.push(error.message);
    }
  }
  
  // 监听轮播执行
  monitorCarousel() {
    // 劫持startFirstLoadCarousel方法进行监控
    if (window.aeScape && typeof window.aeScape.startFirstLoadCarousel === 'function') {
      const originalMethod = window.aeScape.startFirstLoadCarousel;
      
      window.aeScape.startFirstLoadCarousel = async function() {
        console.log('🎪 检测到首次载入轮播开始执行！');
        this.results.triggered = true;
        this.results.timing.push({ type: 'start', time: performance.now() });
        
        return originalMethod.call(this);
      }.bind(this);
      
      console.log('👂 轮播监听器已设置');
    }
    
    // 监听视频播放事件
    document.addEventListener('videoAnimationStart', (event) => {
      const { weatherType, reason } = event.detail;
      console.log(`🎥 检测到视频动画: ${weatherType} (原因: ${reason})`);
      
      this.results.weatherTypes.push(weatherType);
      this.results.timing.push({ 
        type: 'video', 
        weatherType, 
        reason, 
        time: performance.now() 
      });
    });
  }
  
  // 生成测试报告
  generateReport() {
    console.log('\n📊 首次载入轮播测试报告');
    console.log('=====================================');
    console.log('触发状态:', this.results.triggered ? '✅ 成功' : '❌ 失败');
    console.log('播放序列:', this.results.weatherTypes);
    console.log('时间节点:', this.results.timing);
    
    if (this.results.errors.length > 0) {
      console.log('错误信息:', this.results.errors);
    }
    
    // 验证轮播是否完整
    const expectedSequence = ['rain', 'snow', 'cloudy', 'thunderstorm', 'fog'];
    const isComplete = expectedSequence.every(type => 
      this.results.weatherTypes.includes(type)
    );
    
    console.log('轮播完整性:', isComplete ? '✅ 完整' : '⚠️ 不完整');
    console.log('=====================================\n');
    
    return {
      success: this.results.triggered && isComplete,
      details: this.results
    };
  }
}

// 黑幕渐隐测试器
class BootMaskTester {
  constructor() {
    this.maskEvents = [];
  }
  
  // 监控黑幕状态
  monitorBootMask() {
    const mask = document.querySelector('.boot-mask');
    if (!mask) {
      console.log('⚪ 未找到黑幕元素，可能已移除');
      return;
    }
    
    console.log('🖤 开始监控黑幕渐隐过程');
    
    // 监听透明度变化
    const observer = new MutationObserver(() => {
      const opacity = window.getComputedStyle(mask).opacity;
      const time = performance.now();
      
      this.maskEvents.push({ opacity: parseFloat(opacity), time });
      console.log(`🖤 黑幕透明度: ${opacity} (${time.toFixed(1)}ms)`);
    });
    
    observer.observe(mask, { 
      attributes: true, 
      attributeFilter: ['style'] 
    });
    
    // 监听移除事件
    const removalObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node === mask) {
            console.log('🗑️ 黑幕已移除 @', performance.now().toFixed(1) + 'ms');
            this.maskEvents.push({ removed: true, time: performance.now() });
          }
        });
      });
    });
    
    removalObserver.observe(document.body, { childList: true });
  }
  
  // 分析黑幕时机
  analyzeMaskTiming() {
    console.log('\n🖤 黑幕渐隐时机分析');
    console.log('=====================================');
    
    this.maskEvents.forEach((event, index) => {
      if (event.opacity !== undefined) {
        console.log(`${index + 1}. 透明度: ${event.opacity} @ ${event.time.toFixed(1)}ms`);
      } else if (event.removed) {
        console.log(`${index + 1}. 黑幕移除 @ ${event.time.toFixed(1)}ms`);
      }
    });
    
    console.log('=====================================\n');
  }
}

// 主测试流程
async function runSmoothAnimationTest() {
  console.log('🚀 启动流畅动画完整测试');
  
  // 初始化测试器
  const animationTester = new AnimationTester();
  const carouselTester = new FirstLoadCarouselTester();
  const maskTester = new BootMaskTester();
  
  // 启动各种监控
  if (testConfig.testAnimations) {
    animationTester.analyzeAnimationPerformance();
  }
  
  if (testConfig.testBootMask) {
    maskTester.monitorBootMask();
  }
  
  carouselTester.monitorCarousel();
  
  // 等待页面基础初始化
  setTimeout(() => {
    if (testConfig.testAnimations) {
      animationTester.testAnimationTimings();
    }
  }, 1000);
  
  // 强制触发首次载入轮播
  setTimeout(() => {
    carouselTester.forceTriggerFirstLoad();
  }, 1500);
  
  // 生成最终报告
  setTimeout(() => {
    console.log('\n🏁 流畅动画测试完成');
    console.log('=====================================');
    
    const carouselReport = carouselTester.generateReport();
    
    if (testConfig.testBootMask) {
      maskTester.analyzeMaskTiming();
    }
    
    console.log('📋 总体评估:');
    console.log('- 首次载入轮播:', carouselReport.success ? '✅ 通过' : '❌ 失败');
    console.log('- 动画流畅度: 🎨 请观察视觉效果');
    console.log('- 黑幕渐隐: 🖤 查看上方时机分析');
    
    console.log('=====================================');
    
    // 存储测试结果
    window.smoothAnimationTestResult = {
      carousel: carouselReport,
      timestamp: new Date().toISOString(),
      config: testConfig
    };
    
  }, 8000); // 给足时间执行完整轮播
}

// 页面加载完成后自动运行测试
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runSmoothAnimationTest);
} else {
  runSmoothAnimationTest();
}

// 导出测试工具供手动使用
window.SmoothAnimationTest = {
  run: runSmoothAnimationTest,
  AnimationTester,
  FirstLoadCarouselTester,
  BootMaskTester,
  config: testConfig
};

console.log('📝 流畅动画测试脚本已加载');
console.log('💡 手动运行: SmoothAnimationTest.run()');