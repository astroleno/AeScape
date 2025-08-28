# AeScape 视频测试控制台指南

## 🎮 F12控制台测试脚本

在新标签页按F12打开控制台，复制粘贴以下脚本进行视频测试。

### 🔧 基础初始化检查

```javascript
// 1. 检查所有关键对象是否存在
console.log('=== AeScape 视频系统检查 ===');
console.log('主对象存在:', !!window.aeScape);
console.log('视频管理器:', !!window.aeScape?.videoManager);
console.log('抽卡系统:', !!window.aeScape?.cardSystem);
console.log('天气映射器:', !!WeatherVideoMapper);
console.log('API映射器:', !!WeatherAPIMapper);
console.log('视频触发器:', !!VideoTriggerManager);
console.log('=========================');
```

### 🎯 视频映射测试

```javascript
// 2. 测试视频映射系统
async function testVideoMapping() {
  console.log('\n🎯 测试视频映射系统');
  
  const mapper = new WeatherVideoMapper();
  const weatherTypes = ['clear', 'cloudy', 'rain', 'snow', 'fog', 'thunderstorm'];
  
  weatherTypes.forEach(weather => {
    const video = mapper.getVideoForWeather(weather);
    console.log(`${weather}:`, {
      path: video.videoPath,
      hasAlpha: video.hasAlpha,
      blendMode: video.blendMode,
      description: video.description
    });
  });
  
  // 测试统计信息
  console.log('映射统计:', mapper.getMappingStats());
}
testVideoMapping();
```

### 🎲 抽卡系统测试

```javascript
// 3. 测试抽卡系统
async function testCardSystem() {
  console.log('\n🎲 测试抽卡系统');
  
  const cardSystem = window.aeScape?.cardSystem || new AnimationCardSystem();
  const weatherTypes = ['clear', 'cloudy', 'rain', 'snow', 'fog', 'thunderstorm'];
  
  weatherTypes.forEach(weather => {
    console.log(`\n--- ${weather} 抽卡池 ---`);
    const pool = cardSystem.getAnimationPool(weather);
    console.log(`池名称: ${pool?.name || '未找到'}`);
    console.log(`视频数量: ${pool?.videos?.length || 0}`);
    
    if (pool?.videos?.length > 0) {
      // 抽5次卡
      for (let i = 1; i <= 5; i++) {
        const card = cardSystem.drawCard(weather);
        console.log(`第${i}次抽卡:`, {
          id: card.id,
          path: card.path,
          type: card.type,
          description: card.description
        });
      }
    }
  });
}
testCardSystem();
```

### 📹 完整视频轮播测试

```javascript
// 4. 完整视频轮播测试（慎用：会播放所有57个视频）
async function fullVideoPlaytest() {
  console.log('\n📹 开始完整视频轮播测试');
  
  if (!window.aeScape?.videoManager) {
    console.error('视频管理器未初始化！');
    return;
  }
  
  const videoManager = window.aeScape.videoManager;
  const cardSystem = window.aeScape.cardSystem;
  const weatherTypes = ['clear', 'cloudy', 'rain', 'snow', 'fog', 'thunderstorm'];
  
  let totalVideos = 0;
  let playedVideos = 0;
  let errors = 0;
  
  // 统计总视频数
  weatherTypes.forEach(weather => {
    const pool = cardSystem.getAnimationPool(weather);
    totalVideos += pool?.videos?.length || 0;
  });
  
  console.log(`总共需要测试 ${totalVideos} 个视频`);
  
  for (const weather of weatherTypes) {
    console.log(`\n🌤️ 测试 ${weather} 类型视频`);
    const pool = cardSystem.getAnimationPool(weather);
    
    if (!pool?.videos?.length) {
      console.warn(`${weather} 没有视频`);
      continue;
    }
    
    for (const video of pool.videos) {
      try {
        console.log(`播放: ${video.path} (${video.description})`);
        
        // 播放视频
        await videoManager.playWeatherVideo(weather, {
          intensity: 'medium',
          useGlass: false,
          useBottomView: false
        });
        
        playedVideos++;
        console.log(`✅ 播放成功 [${playedVideos}/${totalVideos}]`);
        
        // 等待视频播放完成（2秒）
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        errors++;
        console.error(`❌ 播放失败: ${video.path}`, error);
      }
    }
  }
  
  console.log(`\n🎬 轮播测试完成！`);
  console.log(`成功: ${playedVideos}, 失败: ${errors}, 总计: ${totalVideos}`);
  console.log(`成功率: ${((playedVideos / totalVideos) * 100).toFixed(1)}%`);
}

// 警告用户
console.log('⚠️  轮播测试将播放所有57个视频，需要约5分钟');
console.log('⚠️  确认要开始测试请运行: fullVideoPlaytest()');
```

### 🎨 单个天气类型测试

```javascript
// 5. 测试单个天气类型（推荐用于快速测试）
async function testWeatherType(weatherType = 'rain', count = 3) {
  console.log(`\n🎨 测试 ${weatherType} 天气类型 (${count}次)`);
  
  if (!window.aeScape?.videoManager) {
    console.error('视频管理器未初始化！');
    return;
  }
  
  const videoManager = window.aeScape.videoManager;
  
  for (let i = 1; i <= count; i++) {
    try {
      console.log(`第${i}次播放 ${weatherType}`);
      
      await videoManager.playWeatherVideo(weatherType, {
        intensity: ['light', 'medium', 'heavy'][Math.floor(Math.random() * 3)],
        useGlass: Math.random() > 0.8,
        useBottomView: Math.random() > 0.9
      });
      
      console.log(`✅ 第${i}次播放成功`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ 第${i}次播放失败:`, error);
    }
  }
  
  console.log(`${weatherType} 测试完成`);
}

// 使用示例
console.log('🎯 快速测试某个天气类型:');
console.log('testWeatherType("rain", 3)     // 测试雨天3次');
console.log('testWeatherType("snow", 2)     // 测试雪天2次');
console.log('testWeatherType("thunderstorm", 1) // 测试雷暴1次');
```

### 🔍 视频文件检查

```javascript
// 6. 检查视频文件完整性
async function checkVideoFiles() {
  console.log('\n🔍 检查视频文件完整性');
  
  const cardSystem = window.aeScape?.cardSystem || new AnimationCardSystem();
  const weatherTypes = ['clear', 'cloudy', 'rain', 'snow', 'fog', 'thunderstorm'];
  
  let totalFiles = 0;
  let validFiles = 0;
  let invalidFiles = [];
  
  for (const weather of weatherTypes) {
    const pool = cardSystem.getAnimationPool(weather);
    console.log(`\n--- 检查 ${weather} ---`);
    
    if (!pool?.videos?.length) {
      console.warn(`❌ ${weather} 没有视频文件`);
      continue;
    }
    
    for (const video of pool.videos) {
      totalFiles++;
      
      try {
        // 创建视频元素测试
        const testVideo = document.createElement('video');
        testVideo.muted = true;
        testVideo.preload = 'metadata';
        
        const isValid = await new Promise((resolve) => {
          let resolved = false;
          
          testVideo.onloadedmetadata = () => {
            if (resolved) return;
            resolved = true;
            resolve(true);
          };
          
          testVideo.onerror = (e) => {
            if (resolved) return;
            resolved = true;
            resolve(false);
          };
          
          // 3秒超时
          setTimeout(() => {
            if (resolved) return;
            resolved = true;
            resolve(false);
          }, 3000);
          
          testVideo.src = video.path;
        });
        
        if (isValid) {
          validFiles++;
          console.log(`✅ ${video.path}`);
        } else {
          invalidFiles.push(video.path);
          console.log(`❌ ${video.path} - 加载失败`);
        }
        
      } catch (error) {
        invalidFiles.push(video.path);
        console.log(`❌ ${video.path} - 错误:`, error.message);
      }
    }
  }
  
  console.log(`\n📊 文件检查结果:`);
  console.log(`总文件数: ${totalFiles}`);
  console.log(`有效文件: ${validFiles}`);
  console.log(`无效文件: ${invalidFiles.length}`);
  console.log(`有效率: ${((validFiles / totalFiles) * 100).toFixed(1)}%`);
  
  if (invalidFiles.length > 0) {
    console.log(`\n❌ 无效文件列表:`);
    invalidFiles.forEach(file => console.log(`  - ${file}`));
  }
}

// 运行文件检查
console.log('🔍 检查所有视频文件: checkVideoFiles()');
```

### ⚡ 性能监控

```javascript
// 7. 性能监控和统计
async function performanceMonitor() {
  console.log('\n⚡ 性能监控');
  
  const getMemoryInfo = () => {
    if (performance.memory) {
      const memory = performance.memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
      };
    }
    return 'Memory API不可用';
  };
  
  const initialMemory = getMemoryInfo();
  console.log('初始内存:', initialMemory);
  
  // 监控视频播放性能
  if (window.aeScape?.videoManager) {
    console.log('视频管理器状态:', window.aeScape.videoManager.getStatus());
  }
  
  // 性能观察器
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('video') || entry.name.includes('webm')) {
          console.log('资源加载:', entry.name, '耗时:', entry.duration + 'ms');
        }
      });
    });
    
    observer.observe({entryTypes: ['resource']});
    
    setTimeout(() => {
      observer.disconnect();
      console.log('停止性能监控');
      console.log('当前内存:', getMemoryInfo());
    }, 30000);
  }
}

performanceMonitor();
```

### 🧪 特殊触发器测试

```javascript
// 8. 测试特殊触发器
async function testSpecialTriggers() {
  console.log('\n🧪 测试特殊触发器');
  
  if (!window.aeScape?.videoTriggerManager) {
    console.error('视频触发管理器未初始化！');
    return;
  }
  
  const triggerManager = window.aeScape.videoTriggerManager;
  
  // 获取当前状态
  console.log('当前状态:', triggerManager.getStatus());
  
  // 模拟各种触发条件
  const testScenarios = [
    { type: 'welcome', description: '模拟首次安装' },
    { type: 'settings', description: '模拟设置完成' },
    { type: 'restart', description: '模拟浏览器重启' },
    { type: 'update', description: '模拟扩展更新' }
  ];
  
  for (const scenario of testScenarios) {
    console.log(`\n测试: ${scenario.description}`);
    
    // 设置相应的存储标记
    switch (scenario.type) {
      case 'welcome':
        await chrome.storage.local.set({ shouldShowWelcomeVideo: true });
        break;
      case 'settings':
        await chrome.storage.local.set({ 
          settingsChanged: true, 
          settingsChangeTime: Date.now() 
        });
        break;
      case 'restart':
        triggerManager.state.isFirstTabThisSession = true;
        triggerManager.state.hasTriggeredThisSession = false;
        break;
      case 'update':
        await chrome.storage.local.set({ 
          recentUpdate: true, 
          updateTime: Date.now() 
        });
        break;
    }
    
    // 检查是否应该触发
    const result = await triggerManager.checkShouldTriggerVideo();
    console.log('触发结果:', result);
    
    if (result.shouldTrigger) {
      console.log(`✅ ${scenario.description} 触发成功`);
    } else {
      console.log(`❌ ${scenario.description} 未触发: ${result.reason}`);
    }
  }
  
  // 获取触发历史
  const history = await triggerManager.getTriggerHistory(5);
  console.log('\n触发历史:', history);
}

console.log('🧪 测试特殊触发器: testSpecialTriggers()');
```

## 🚀 快速测试组合

```javascript
// 一键运行基础测试
async function quickTest() {
  console.log('🚀 开始快速测试...');
  
  // 基础检查
  console.log('1/4 基础检查...');
  testVideoMapping();
  
  // 抽卡测试
  console.log('2/4 抽卡测试...');
  testCardSystem();
  
  // 播放测试（只测试雨天）
  console.log('3/4 播放测试...');
  await testWeatherType('rain', 1);
  
  // 文件检查
  console.log('4/4 文件检查...');
  // await checkVideoFiles(); // 可选：检查所有文件
  
  console.log('✅ 快速测试完成！');
}

console.log('');
console.log('🎮 === AeScape 视频测试控制台 ===');
console.log('quickTest()              - 运行快速测试');
console.log('testWeatherType("rain")  - 测试指定天气');
console.log('fullVideoPlaytest()      - 完整轮播测试');
console.log('checkVideoFiles()        - 检查所有文件');
console.log('testSpecialTriggers()    - 测试特殊触发');
console.log('performanceMonitor()     - 性能监控');
console.log('================================');
```

## ⚠️ 注意事项

1. **首次运行**: 确保页面已完全加载，所有脚本已初始化
2. **网络环境**: 视频文件较大，确保网络连接良好
3. **内存使用**: 完整轮播测试会消耗较多内存，建议关闭其他标签页
4. **错误处理**: 如果遇到错误，请检查控制台日志并重新初始化页面
5. **Chrome版本**: 确保使用支持webm格式的现代Chrome版本

## 🔧 故障排除

```javascript
// 重置视频系统
function resetVideoSystem() {
  console.log('🔧 重置视频系统...');
  
  // 停止所有视频
  document.querySelectorAll('video').forEach(video => {
    video.pause();
    video.remove();
  });
  
  // 清理缓存
  if (window.aeScape?.videoResourceManager) {
    window.aeScape.videoResourceManager.clearCache();
  }
  
  // 重新初始化
  if (window.aeScape?.initializeVideoModule) {
    window.aeScape.initializeVideoModule();
  }
  
  console.log('✅ 视频系统已重置');
}

console.log('🔧 故障排除: resetVideoSystem()');
```