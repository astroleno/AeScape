background.js:580 Creating WeatherServiceWorker instance...
background.js:13 WeatherServiceWorker constructor called
background.js:18 Service Worker init starting...
background.js:21 Setting default location...
background.js:63 Setting default location...
background.js:71 Using hardcoded Shanghai location: {
  "lat": 31.2304,
  "lon": 121.4737,
  "name": "上海"
}
background.js:594 Service Worker installed
background.js:76 Location saved to storage
background.js:30 Loading initial data...
background.js:95 Loading initial data...
background.js:104 Updating weather data...
background.js:127 updateWeatherData called with location: {
  "lat": 31.2304,
  "lon": 121.4737,
  "name": "上海"
}
background.js:588 Service Worker activated
background.js:112 Updating air quality data...
background.js:195 空气质量数据获取暂时禁用
background.js:119 Initial data loading completed
background.js:34 Setting up scheduled updates...
background.js:38 Setting up message listener...
background.js:42 Setting up install listener...
background.js:46 Weather Service Worker initialized successfully
background.js:49 Service Worker is ready to handle messages
full-weather-engine.js:941 DOM Content Loaded, starting FullWeatherEngine...
full-weather-engine.js:90 === FullWeatherEngine init started ===
full-weather-engine.js:93 Step 1: Setting up Three.js...
full-weather-engine.js:124 Setting up Three.js scene...
full-weather-engine.js:157 Three.js renderer added to container
full-weather-engine.js:158 Renderer size: 1920 x 826
full-weather-engine.js:170 Camera created - position: 0 0 0
full-weather-engine.js:171 Camera fov: 75
full-weather-engine.js:172 Camera aspect: 2.324455205811138
full-weather-engine.js:236 Sky sphere created
full-weather-engine.js:118 初始化失败: TypeError: Cannot set properties of null (setting 'roughness')
    at FullWeatherEngine.setWetness (full-weather-engine.js:444:30)
    at FullWeatherEngine.setupRain (full-weather-engine.js:392:10)
    at FullWeatherEngine.setupThreeJS (full-weather-engine.js:202:10)
    at FullWeatherEngine.init (full-weather-engine.js:94:12)
    at new FullWeatherEngine (full-weather-engine.js:86:10)
    at HTMLDocument.<anonymous> (full-weather-engine.js:943:17)
init @ full-weather-engine.js:118
full-weather-engine.js:944 FullWeatherEngine started successfully
