// Weather Engine Control Script
let weatherEngine = null;

// 状态信息更新
function updateStatus(message) {
  const statusDiv = document.getElementById('engine-status');
  if (statusDiv) {
    statusDiv.textContent = message;
  }
}

// 格式化时间显示
function formatTime(hours) {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  let period = '';
  let displayHour = h;
  
  if (h < 6) period = '凌晨';
  else if (h < 12) period = '上午';
  else if (h < 18) period = '下午';
  else period = '晚上';
  
  if (h === 0) displayHour = 12;
  else if (h > 12) displayHour = h - 12;
  
  return `${displayHour}:${m.toString().padStart(2, '0')} - ${period}`;
}

// 获取参数名
function getParamName(sliderId) {
  const paramMap = {
    'sun-altitude': 'sunAltitude',
    'sun-azimuth': 'sunAzimuth',
    'cloud-opacity': 'cloudOpacity',
    'cloud-speed': 'cloudSpeed',
    'fog-density': 'fogDensity',
    'camera-fov': 'cameraFov',
    'camera-distance': 'cameraDistance',
    'time-hours': 'timeOfDayHours'
  };
  return paramMap[sliderId] || sliderId;
}

// 更新滑块显示值
function updateSliderDisplay(slider) {
  const param = getParamName(slider.id);
  const value = parseFloat(slider.value);
  const valueDisplay = document.getElementById(slider.id + '-value');
  
  if (!valueDisplay) return;
  
  let displayValue = value;
  
  if (param.includes('Altitude') || param.includes('Azimuth') || param.includes('Fov')) {
    displayValue = value + '°';
  } else if (param === 'fogDensity') {
    displayValue = value.toFixed(3);
  } else if (param === 'cloudOpacity') {
    displayValue = value.toFixed(2);
  } else if (param === 'timeOfDayHours') {
    displayValue = value.toFixed(1);
    document.getElementById('time-display').textContent = formatTime(value);
  } else {
    displayValue = value.toFixed(1);
  }
  
  valueDisplay.textContent = displayValue;
}

// 处理滑块变化
function handleSliderChange(slider) {
  console.log('=== HANDLE SLIDER CHANGE CALLED ===');
  console.log('Slider element:', slider);
  console.log('Slider ID:', slider.id);
  
  const param = getParamName(slider.id);
  const value = parseFloat(slider.value);
  
  console.log('Slider changed:', param, value);
  
  // 更新显示值
  updateSliderDisplay(slider);
  
  // 检查引擎状态
  console.log('Weather engine:', weatherEngine);
  console.log('Control params:', weatherEngine ? weatherEngine.controlParams : null);
  
  // 更新引擎参数
  if (weatherEngine && weatherEngine.controlParams && param in weatherEngine.controlParams) {
    const oldValue = weatherEngine.controlParams[param];
    weatherEngine.controlParams[param] = value;
    console.log('Updated controlParams:', param, oldValue, '→', value);
    
    // 特殊处理
    if (param === 'timeOfDayHours') {
      console.log('Calculating sun position from time...');
      if (weatherEngine.calculateSunPositionFromTime) {
        weatherEngine.calculateSunPositionFromTime();
        console.log('Sun position calculated:', {
          altitude: weatherEngine.controlParams.sunAltitude,
          azimuth: weatherEngine.controlParams.sunAzimuth
        });
      }
    }
    
    if (param === 'sunAltitude' || param === 'sunAzimuth') {
      console.log('Updating sun position...');
      if (weatherEngine.updateSunPosition) {
        weatherEngine.updateSunPosition();
      }
    }
    
    console.log('Applying control params...');
    if (weatherEngine.applyControlParams) {
      weatherEngine.applyControlParams();
    }
    updateStatus(`已更新 ${param}: ${value}`);
  } else {
    console.warn('Control param not found:', param, 'Available params:', Object.keys(weatherEngine.controlParams || {}));
  }
}

// 初始化引擎
async function initEngine() {
  updateStatus('正在初始化天气引擎...');
  
  try {
    const container = document.getElementById('weather-container');
    weatherEngine = new FullWeatherEngine(container);
    
    // 等待引擎初始化完成
    await weatherEngine.initializationPromise;
    
    console.log('Weather engine initialization completed');
    updateStatus('引擎运行正常 - 所有系统已启动');
    
    // 隐藏加载提示
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }
    
    // 初始化控制功能
    initControls();
    
  } catch (error) {
    console.error('Weather engine initialization failed:', error);
    updateStatus('引擎初始化失败: ' + error.message);
    
    // 隐藏加载提示
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }
}

// 初始化控制功能
function initControls() {
  console.log('Initializing controls...');
  
  if (!weatherEngine || !weatherEngine.controlParams) {
    console.error('Weather engine or controlParams not available');
    return;
  }
  
  // 设置滑块事件监听器
  const sliders = document.querySelectorAll('input[type="range"]');
  console.log('Found sliders:', sliders.length);
  
  sliders.forEach((slider, index) => {
    console.log(`Setting up slider ${index + 1}:`, slider.id);
    console.log('Slider element:', slider);
    
    // 测试基础事件
    slider.oninput = function() {
      console.log('=== ONINPUT TRIGGERED ===');
      console.log('This slider:', this);
      console.log('This ID:', this.id);
      console.log('This value:', this.value);
      handleSliderChange(this);
    };
    
    // 也添加 click 事件测试
    slider.onclick = function() {
      console.log('=== ONCLICK TRIGGERED ===');
      console.log('Slider clicked:', this.id);
    };
    
    // 初始化滑块显示值
    const param = getParamName(slider.id);
    if (weatherEngine.controlParams && param in weatherEngine.controlParams) {
      slider.value = weatherEngine.controlParams[param];
      console.log(`Initialized slider ${slider.id} with value:`, weatherEngine.controlParams[param]);
      // 触发一次更新显示值
      updateSliderDisplay(slider);
    }
    
    console.log(`Slider ${slider.id} setup complete`);
  });
  
  console.log('All sliders setup completed');
  
  // 设置天气按钮事件监听器
  const weatherButtons = document.querySelectorAll('.weather-btn');
  weatherButtons.forEach(button => {
    button.onclick = function() {
      const weatherType = this.getAttribute('data-weather');
      
      // 更新按钮状态
      weatherButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // 更新天气
      if (weatherEngine.controlParams) {
        weatherEngine.controlParams.weatherType = weatherType;
        if (weatherEngine.updateWeatherType) {
          weatherEngine.updateWeatherType();
        }
        updateStatus(`切换到${this.textContent}天气`);
      }
    };
  });
  
  // 设置重置按钮事件监听器
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.onclick = function() {
      if (weatherEngine.resetControlParams) {
        weatherEngine.resetControlParams();
        
        // 重置所有滑块值
        const sliders = document.querySelectorAll('input[type="range"]');
        sliders.forEach(slider => {
          const param = getParamName(slider.id);
          if (weatherEngine.controlParams && param in weatherEngine.controlParams) {
            slider.value = weatherEngine.controlParams[param];
            updateSliderDisplay(slider);
          }
        });
        
        // 重置天气按钮
        const weatherButtons = document.querySelectorAll('.weather-btn');
        weatherButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-weather="clear"]').classList.add('active');
        
        updateStatus('已重置为默认值');
      }
    };
  }
  
  // 初始化时间显示
  document.getElementById('time-display').textContent = formatTime(weatherEngine.controlParams.timeOfDayHours || 12);
  
  console.log('Controls initialized successfully');
  
  // 添加测试函数到全局作用域
  window.testEngine = weatherEngine;
  window.testSunPosition = function() {
    console.log('Testing sun position update...');
    if (weatherEngine.controlParams) {
      weatherEngine.controlParams.sunAltitude = 45;
      if (weatherEngine.updateSunPosition) {
        weatherEngine.updateSunPosition();
      }
      if (weatherEngine.applyControlParams) {
        weatherEngine.applyControlParams();
      }
    }
    console.log('Sun position test completed');
  };
  
  window.testCloudOpacity = function() {
    console.log('Testing cloud opacity update...');
    if (weatherEngine.controlParams) {
      weatherEngine.controlParams.cloudOpacity = 0.8;
      if (weatherEngine.applyControlParams) {
        weatherEngine.applyControlParams();
      }
    }
    console.log('Cloud opacity test completed');
  };
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing engine...');
  initEngine();
});