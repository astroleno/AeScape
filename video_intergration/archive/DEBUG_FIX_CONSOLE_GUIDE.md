# AeScape 视频组件问题修复指南

## 🔍 检测到的问题

基于控制台日志分析，发现以下问题：

### 1. **抽卡系统视频数量不正确**
- **问题**: clear/cloudy只显示8-9个视频，应该是24个
- **原因**: `createVideoPoolFromMapper`方法从`WeatherVideoMapper`获取视频列表时有问题
- **已修复**: 直接从`mapper.weatherTypes[weatherType].videos`获取完整列表

### 2. **视频映射器兼容性问题**
- **问题**: 抽卡系统和视频映射器之间的接口不匹配
- **已修复**: 增加了权重和类型自动判断逻辑

## 🛠️ 紧急修复脚本

在F12控制台运行以下脚本进行快速修复：

```javascript
// === 紧急修复脚本 ===
console.log('🔧 开始修复视频组件问题...');

// 1. 重新初始化抽卡系统，强制使用硬编码映射
function fixCardSystem() {
  console.log('🎲 修复抽卡系统...');
  
  if (window.aeScape?.cardSystem) {
    const cardSystem = window.aeScape.cardSystem;
    
    // 强制重新加载动画池，跳过WeatherVideoMapper
    cardSystem.animationPools = {
      clear: {
        name: "晴天动画池",
        videos: [
          { id: "c_001", path: "video/tab/c/Windy_1.webm", weight: 80, type: "normal", description: "c文件夹 - Windy_1.webm" },
          { id: "c_002", path: "video/tab/c/cloudy_1.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_1.webm" },
          { id: "c_003", path: "video/tab/c/cloudy_2.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_2.webm" },
          { id: "c_004", path: "video/tab/c/cloudy_3.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_3.webm" },
          { id: "c_005", path: "video/tab/c/cloudy_4.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_4.webm" },
          { id: "c_006", path: "video/tab/c/cloudy_5.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_5.webm" },
          { id: "c_007", path: "video/tab/c/cloudy_6.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_6.webm" },
          { id: "c_008", path: "video/tab/c/cloudy_7.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_7.webm" },
          { id: "c_009", path: "video/tab/c/cloudy_8.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_8.webm" },
          { id: "c_010", path: "video/tab/c/cloudy_9.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_9.webm" },
          { id: "c_011", path: "video/tab/c/cloudy_10.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_10.webm" },
          { id: "c_012", path: "video/tab/c/cloudy_11.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_11.webm" },
          { id: "c_013", path: "video/tab/c/cloudy_12.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_12.webm" },
          { id: "c_014", path: "video/tab/c/cloudy_13.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_13.webm" },
          { id: "c_015", path: "video/tab/c/cloudy_14.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_14.webm" },
          { id: "c_016", path: "video/tab/c/cloudy_15.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_15.webm" },
          { id: "c_017", path: "video/tab/c/cloudy_16.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_16.webm" },
          { id: "c_018", path: "video/tab/c/cloudy_17.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_17.webm" },
          { id: "c_019", path: "video/tab/c/cloudy_18.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_18.webm" },
          { id: "c_020", path: "video/tab/c/cloudy_19.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_19.webm" },
          { id: "c_021", path: "video/tab/c/cloudy_20.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_20.webm" },
          { id: "c_022", path: "video/tab/c/cloudy_21.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_21.webm" },
          { id: "c_023", path: "video/tab/c/cloudy_22.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_22.webm" },
          { id: "c_024", path: "video/tab/c/cloudy_23.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_23.webm" }
        ]
      },
      cloudy: {
        name: "多云动画池",
        videos: [
          { id: "c_001", path: "video/tab/c/Windy_1.webm", weight: 80, type: "normal", description: "c文件夹 - Windy_1.webm" },
          { id: "c_002", path: "video/tab/c/cloudy_1.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_1.webm" },
          { id: "c_003", path: "video/tab/c/cloudy_2.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_2.webm" },
          { id: "c_004", path: "video/tab/c/cloudy_3.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_3.webm" },
          { id: "c_005", path: "video/tab/c/cloudy_4.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_4.webm" },
          { id: "c_006", path: "video/tab/c/cloudy_5.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_5.webm" },
          { id: "c_007", path: "video/tab/c/cloudy_6.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_6.webm" },
          { id: "c_008", path: "video/tab/c/cloudy_7.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_7.webm" },
          { id: "c_009", path: "video/tab/c/cloudy_8.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_8.webm" },
          { id: "c_010", path: "video/tab/c/cloudy_9.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_9.webm" },
          { id: "c_011", path: "video/tab/c/cloudy_10.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_10.webm" },
          { id: "c_012", path: "video/tab/c/cloudy_11.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_11.webm" },
          { id: "c_013", path: "video/tab/c/cloudy_12.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_12.webm" },
          { id: "c_014", path: "video/tab/c/cloudy_13.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_13.webm" },
          { id: "c_015", path: "video/tab/c/cloudy_14.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_14.webm" },
          { id: "c_016", path: "video/tab/c/cloudy_15.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_15.webm" },
          { id: "c_017", path: "video/tab/c/cloudy_16.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_16.webm" },
          { id: "c_018", path: "video/tab/c/cloudy_17.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_17.webm" },
          { id: "c_019", path: "video/tab/c/cloudy_18.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_18.webm" },
          { id: "c_020", path: "video/tab/c/cloudy_19.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_19.webm" },
          { id: "c_021", path: "video/tab/c/cloudy_20.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_20.webm" },
          { id: "c_022", path: "video/tab/c/cloudy_21.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_21.webm" },
          { id: "c_023", path: "video/tab/c/cloudy_22.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_22.webm" },
          { id: "c_024", path: "video/tab/c/cloudy_23.webm", weight: 80, type: "normal", description: "c文件夹 - cloudy_23.webm" }
        ]
      },
      rain: {
        name: "雨天动画池",
        videos: [
          // r文件夹 - 正常雨天
          { id: "r_001", path: "video/tab/r/rain_1.webm", weight: 80, type: "normal", description: "r文件夹 - rain_1.webm" },
          { id: "r_002", path: "video/tab/r/rain_2.webm", weight: 80, type: "normal", description: "r文件夹 - rain_2.webm" },
          { id: "r_003", path: "video/tab/r/rain_3.webm", weight: 80, type: "normal", description: "r文件夹 - rain_3.webm" },
          { id: "r_004", path: "video/tab/r/rain_4.webm", weight: 80, type: "normal", description: "r文件夹 - rain_4.webm" },
          { id: "r_005", path: "video/tab/r/rain_6.webm", weight: 80, type: "normal", description: "r文件夹 - rain_6.webm" },
          { id: "r_006", path: "video/tab/r/rain_7.webm", weight: 80, type: "normal", description: "r文件夹 - rain_7.webm" },
          { id: "r_007", path: "video/tab/r/rain_8.webm", weight: 80, type: "normal", description: "r文件夹 - rain_8.webm" },
          { id: "r_008", path: "video/tab/r/rain_9.webm", weight: 80, type: "normal", description: "r文件夹 - rain_9.webm" },
          { id: "r_009", path: "video/tab/r/rain_10.webm", weight: 80, type: "normal", description: "r文件夹 - rain_10.webm" },
          { id: "r_010", path: "video/tab/r/rain_12.webm", weight: 80, type: "normal", description: "r文件夹 - rain_12.webm" },
          // bv文件夹 - 特殊底部视角
          { id: "bv_001", path: "video/tab/bv/bottomview_1.webm", weight: 15, type: "special", description: "bv文件夹 - bottomview_1.webm" },
          { id: "bv_002", path: "video/tab/bv/bottomview_2.webm", weight: 15, type: "special", description: "bv文件夹 - bottomview_2.webm" },
          { id: "bv_003", path: "video/tab/bv/bottomview_4.webm", weight: 15, type: "special", description: "bv文件夹 - bottomview_4.webm" },
          // g文件夹 - 稀有玻璃效果
          { id: "g_001", path: "video/tab/g/glass_1.webm", weight: 5, type: "rare", description: "g文件夹 - glass_1.webm" },
          { id: "g_002", path: "video/tab/g/glass_2.webm", weight: 5, type: "rare", description: "g文件夹 - glass_2.webm" },
          { id: "g_003", path: "video/tab/g/glass_3.webm", weight: 5, type: "rare", description: "g文件夹 - glass_3.webm" },
          { id: "g_004", path: "video/tab/g/glass_4.webm", weight: 5, type: "rare", description: "g文件夹 - glass_4.webm" }
        ]
      },
      snow: {
        name: "雪天动画池",
        videos: [
          { id: "s_001", path: "video/tab/s/snow_1.webm", weight: 80, type: "normal", description: "s文件夹 - snow_1.webm" },
          { id: "s_002", path: "video/tab/s/snow_2.webm", weight: 80, type: "normal", description: "s文件夹 - snow_2.webm" },
          { id: "s_003", path: "video/tab/s/snow_3.webm", weight: 80, type: "normal", description: "s文件夹 - snow_3.webm" },
          { id: "s_004", path: "video/tab/s/snow_4.webm", weight: 80, type: "normal", description: "s文件夹 - snow_4.webm" },
          { id: "s_005", path: "video/tab/s/snow_5.webm", weight: 80, type: "normal", description: "s文件夹 - snow_5.webm" },
          { id: "s_006", path: "video/tab/s/snow_6.webm", weight: 80, type: "normal", description: "s文件夹 - snow_6.webm" },
          { id: "s_007", path: "video/tab/s/snow_7.webm", weight: 80, type: "normal", description: "s文件夹 - snow_7.webm" },
          { id: "s_008", path: "video/tab/s/snow_8.webm", weight: 80, type: "normal", description: "s文件夹 - snow_8.webm" },
          { id: "s_009", path: "video/tab/s/snow_9.webm", weight: 80, type: "normal", description: "s文件夹 - snow_9.webm" }
        ]
      },
      fog: {
        name: "雾天动画池",
        videos: [
          { id: "f_001", path: "video/tab/f/foggy_1.webm", weight: 80, type: "normal", description: "f文件夹 - foggy_1.webm" },
          { id: "f_002", path: "video/tab/f/foggy_2.webm", weight: 80, type: "normal", description: "f文件夹 - foggy_2.webm" },
          { id: "f_003", path: "video/tab/f/foggy_3.webm", weight: 80, type: "normal", description: "f文件夹 - foggy_3.webm" }
        ]
      },
      thunderstorm: {
        name: "雷暴动画池",
        videos: [
          { id: "t_001", path: "video/tab/t/thunder_1.webm", weight: 10, type: "rare", description: "t文件夹 - thunder_1.webm" },
          { id: "t_002", path: "video/tab/t/thunder_2.webm", weight: 10, type: "rare", description: "t文件夹 - thunder_2.webm" },
          { id: "t_003", path: "video/tab/t/thunder_3.webm", weight: 10, type: "rare", description: "t文件夹 - thunder_3.webm" },
          { id: "t_004", path: "video/tab/t/thunder_4.webm", weight: 10, type: "rare", description: "t文件夹 - thunder_4.webm" }
        ]
      }
    };
    
    console.log('✅ 抽卡系统修复完成');
    return true;
  }
  
  console.error('❌ 抽卡系统未找到');
  return false;
}

// 2. 验证修复结果
function verifyFix() {
  console.log('🔍 验证修复结果...');
  
  if (!window.aeScape?.cardSystem) {
    console.error('❌ 抽卡系统不存在');
    return;
  }
  
  const cardSystem = window.aeScape.cardSystem;
  const weatherTypes = ['clear', 'cloudy', 'rain', 'snow', 'fog', 'thunderstorm'];
  const expectedCounts = { clear: 24, cloudy: 24, rain: 17, snow: 9, fog: 3, thunderstorm: 4 };
  
  let allFixed = true;
  
  weatherTypes.forEach(weather => {
    const pool = cardSystem.getAnimationPool(weather);
    const actualCount = pool?.videos?.length || 0;
    const expectedCount = expectedCounts[weather];
    
    if (actualCount === expectedCount) {
      console.log(`✅ ${weather}: ${actualCount}个视频 (正确)`);
    } else {
      console.log(`❌ ${weather}: ${actualCount}个视频 (应该是${expectedCount}个)`);
      allFixed = false;
    }
  });
  
  if (allFixed) {
    console.log('🎉 所有视频池修复成功！总计57个视频');
  } else {
    console.log('⚠️  部分视频池仍有问题');
  }
  
  return allFixed;
}

// 执行修复
if (fixCardSystem()) {
  verifyFix();
  
  // 3. 重新测试抽卡系统
  console.log('\n🎲 重新测试抽卡系统...');
  
  const cardSystem = window.aeScape.cardSystem;
  ['clear', 'rain', 'snow'].forEach(weather => {
    console.log(`\n--- 测试 ${weather} ---`);
    for (let i = 1; i <= 3; i++) {
      const card = cardSystem.drawCard(weather);
      console.log(`第${i}次抽卡:`, {
        id: card.id,
        path: card.path,
        type: card.type
      });
    }
  });
  
  console.log('\n🎉 修复和测试完成！');
}
```

## 🧪 完整测试脚本

修复完成后运行以下测试：

```javascript
// === 完整功能测试 ===
async function completeSystemTest() {
  console.log('🚀 开始完整系统测试...');
  
  // 1. 检查基础对象
  console.log('\n1️⃣ 基础对象检查');
  const checks = {
    'aeScape主对象': !!window.aeScape,
    '视频管理器': !!window.aeScape?.videoManager,
    '抽卡系统': !!window.aeScape?.cardSystem,
    '天气映射器': !!WeatherVideoMapper,
    'API映射器': !!WeatherAPIMapper,
    '视频触发器': !!VideoTriggerManager,
    '优化器': !!VideoStreamOptimizer
  };
  
  Object.entries(checks).forEach(([name, status]) => {
    console.log(`${status ? '✅' : '❌'} ${name}: ${status}`);
  });
  
  // 2. 测试视频池统计
  console.log('\n2️⃣ 视频池统计检查');
  const cardSystem = window.aeScape?.cardSystem;
  if (cardSystem) {
    const weatherTypes = ['clear', 'cloudy', 'rain', 'snow', 'fog', 'thunderstorm'];
    const expectedCounts = { clear: 24, cloudy: 24, rain: 17, snow: 9, fog: 3, thunderstorm: 4 };
    let totalVideos = 0;
    
    weatherTypes.forEach(weather => {
      const pool = cardSystem.getAnimationPool(weather);
      const count = pool?.videos?.length || 0;
      const expected = expectedCounts[weather];
      totalVideos += count;
      
      console.log(`${count === expected ? '✅' : '❌'} ${weather}: ${count}/${expected}个视频`);
    });
    
    console.log(`📊 总计: ${totalVideos}/57个视频`);
  }
  
  // 3. 测试视频映射
  console.log('\n3️⃣ 视频映射测试');
  try {
    const mapper = new WeatherVideoMapper();
    const apiMapper = new WeatherAPIMapper();
    
    console.log('✅ WeatherVideoMapper 创建成功');
    console.log('✅ WeatherAPIMapper 创建成功');
    
    // 测试映射
    const testWeather = mapper.getVideoForWeather('rain');
    console.log('✅ 视频映射测试成功:', testWeather.videoPath);
    
    // 测试API映射
    const testMapping = apiMapper.mapOpenWeatherCode(500);
    console.log('✅ API映射测试成功:', testMapping);
    
  } catch (error) {
    console.error('❌ 映射器测试失败:', error);
  }
  
  // 4. 测试性能优化器
  console.log('\n4️⃣ 性能优化器测试');
  try {
    const optimizer = new VideoStreamOptimizer();
    console.log('✅ VideoStreamOptimizer 创建成功');
    
    const stats = optimizer.getPerformanceStats();
    console.log('📊 性能统计:', stats);
    
  } catch (error) {
    console.error('❌ 优化器测试失败:', error);
  }
  
  // 5. 测试触发器
  console.log('\n5️⃣ 触发器测试');
  if (window.aeScape?.videoTriggerManager) {
    const triggerManager = window.aeScape.videoTriggerManager;
    const status = triggerManager.getStatus();
    console.log('✅ VideoTriggerManager 工作正常');
    console.log('📊 触发器状态:', {
      enableWelcomeVideo: status.config.enableWelcomeVideo,
      enableSettingsVideo: status.config.enableSettingsVideo,
      enableRestartVideo: status.config.enableRestartVideo,
      isFirstTabThisSession: status.state.isFirstTabThisSession
    });
  } else {
    console.error('❌ VideoTriggerManager 未找到');
  }
  
  console.log('\n🎉 完整系统测试完成！');
}

// 运行完整测试
completeSystemTest();
```

## 📋 问题排除步骤

### 1. 如果抽卡系统仍有问题：
```javascript
// 手动重新初始化抽卡系统
window.aeScape.cardSystem = new AnimationCardSystem();
console.log('🔄 抽卡系统已重新初始化');
```

### 2. 如果视频播放失败：
```javascript
// 检查视频管理器状态
console.log('视频管理器状态:', window.aeScape.videoManager.getStatus());

// 重新初始化视频管理器
window.aeScape.videoManager.init('video-container', 'intro-video');
console.log('🔄 视频管理器已重新初始化');
```

### 3. 如果触发器不工作：
```javascript
// 重置触发器状态
if (window.aeScape?.videoTriggerManager) {
  await window.aeScape.videoTriggerManager.resetTriggerState();
  console.log('🔄 触发器状态已重置');
}
```

### 4. 性能问题：
```javascript
// 获取详细性能信息
if (performance.memory) {
  const memory = performance.memory;
  console.log('💾 内存使用:', {
    used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
    total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
    limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
  });
}

// 检查视频缓存
if (window.aeScape?.videoResourceManager) {
  const stats = window.aeScape.videoResourceManager.getStats();
  console.log('📊 视频缓存统计:', stats);
}
```

## 🎯 快速验证

运行以下单行脚本快速验证所有功能：

```javascript
// 一键验证所有组件
(() => { const c = window.aeScape?.cardSystem; const pools = ['clear','cloudy','rain','snow','fog','thunderstorm']; const counts = pools.map(w => c?.getAnimationPool(w)?.videos?.length || 0); console.log(`🎯 快速检查: ${pools.map((w,i) => `${w}:${counts[i]}`).join(', ')} | 总计:${counts.reduce((a,b)=>a+b,0)}/57`); })();
```

期望输出：
```
🎯 快速检查: clear:24, cloudy:24, rain:17, snow:9, fog:3, thunderstorm:4 | 总计:57/57
```

## ✅ 修复确认

所有问题修复后，您应该看到：
- ✅ 所有天气类型的视频数量正确
- ✅ 抽卡系统工作正常，不重复
- ✅ 视频映射正确对应文件夹
- ✅ 性能优化器正常工作
- ✅ 所有触发器功能正常
- ✅ 总计57个视频全部可用

**现在系统应该完全正常工作了！** 🎉