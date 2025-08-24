weather-ball.js:100 Canvas dimensions: 400 x 400
weather-ball.js:101 Canvas existing context: WebGLRenderingContext {canvas: canvas#weather-ball, drawingBufferWidth: 400, drawingBufferHeight: 400, drawingBufferColorSpace: 'srgb', unpackColorSpace: 'srgb', …}
weather-ball.js:109 THREE.WebGLRenderer: A WebGL context could not be created. Reason:  Canvas has an existing context of a different type
onContextCreationError @ chunk-X3JBSZVA.js?v=d4e32b68:40270
getContext @ chunk-X3JBSZVA.js?v=d4e32b68:40001
WebGLRenderer @ chunk-X3JBSZVA.js?v=d4e32b68:40020
initRenderer @ weather-ball.js:109
WeatherBall @ weather-ball.js:27
createWeatherBall @ weather-ball.js:859
(anonymous) @ index.html:294
weather-ball.js:109 THREE.WebGLRenderer: A WebGL context could not be created. Reason:  Canvas has an existing context of a different type
onContextCreationError @ chunk-X3JBSZVA.js?v=d4e32b68:40270
getContext @ chunk-X3JBSZVA.js?v=d4e32b68:40001
WebGLRenderer @ chunk-X3JBSZVA.js?v=d4e32b68:40022
initRenderer @ weather-ball.js:109
WeatherBall @ weather-ball.js:27
createWeatherBall @ weather-ball.js:859
(anonymous) @ index.html:294
weather-ball.js:109 THREE.WebGLRenderer: Error creating WebGL context.
WebGLRenderer @ chunk-X3JBSZVA.js?v=d4e32b68:40030
initRenderer @ weather-ball.js:109
WeatherBall @ weather-ball.js:27
createWeatherBall @ weather-ball.js:859
(anonymous) @ index.html:294
weather-ball.js:119 Failed to create WebGL renderer: Error: Error creating WebGL context.
    at new WebGLRenderer (chunk-X3JBSZVA.js?v=d4e32b68:40025:19)
    at WeatherBall.initRenderer (weather-ball.js:109:23)
    at new WeatherBall (weather-ball.js:27:10)
    at createWeatherBall (weather-ball.js:859:10)
    at index.html:294:23
initRenderer @ weather-ball.js:119
WeatherBall @ weather-ball.js:27
createWeatherBall @ weather-ball.js:859
(anonymous) @ index.html:294
weather-ball.js:129 Fallback: Created new canvas
weather-ball.js:162 Renderer setup - alpha: true
weather-ball.js:188 Camera position: _Vector3 {x: 0, y: 0, z: 3}
weather-ball.js:189 Camera looking at origin
weather-ball.js:200 Added enhanced lighting for better material visibility
weather-ball.js:217 Sphere geometry created - vertices: 561
weather-ball.js:432 Creating Sky object...
weather-ball.js:435 Sky object created successfully
weather-ball.js:443 Sky parameters set
weather-ball.js:455 Sun position set: _Vector3 {x: 0.7198463103929541, y: 0.3420201433256688, z: -0.6040227735550536}
weather-ball.js:472 Starting environment bake from Sky...
weather-ball.js:478 Baking environment texture from Sky...
weather-ball.js:480 sigmaRadians, 0.1, is too large and will clip, as it requested 49 samples when the maximum is set to 20
_halfBlur @ chunk-X3JBSZVA.js?v=d4e32b68:33295
_blur @ chunk-X3JBSZVA.js?v=d4e32b68:33260
fromScene @ chunk-X3JBSZVA.js?v=d4e32b68:33021
bakeEnvironmentFromSky @ weather-ball.js:480
createProperSkyHDRI @ weather-ball.js:458
createGlassMaterial @ weather-ball.js:248
createBaseSphere @ weather-ball.js:220
initScene @ weather-ball.js:203
WeatherBall @ weather-ball.js:30
createWeatherBall @ weather-ball.js:859
(anonymous) @ index.html:294
weather-ball.js:480 sigmaRadians, 0.1, is too large and will clip, as it requested 49 samples when the maximum is set to 20
_halfBlur @ chunk-X3JBSZVA.js?v=d4e32b68:33295
_blur @ chunk-X3JBSZVA.js?v=d4e32b68:33269
fromScene @ chunk-X3JBSZVA.js?v=d4e32b68:33021
bakeEnvironmentFromSky @ weather-ball.js:480
createProperSkyHDRI @ weather-ball.js:458
createGlassMaterial @ weather-ball.js:248
createBaseSphere @ weather-ball.js:220
initScene @ weather-ball.js:203
WeatherBall @ weather-ball.js:30
createWeatherBall @ weather-ball.js:859
(anonymous) @ index.html:294
weather-ball.js:488 Environment baked from Sky using PMREM
weather-ball.js:489 ENV OK? true srgb 4 1
weather-ball.js:460 Proper Three.js Sky HDRI system created
weather-ball.js:278 PBR glass ball created with proper Sky HDRI
weather-ball.js:279 Material metalness: 1
weather-ball.js:280 Material roughness: 0.05
weather-ball.js:281 Material envMapIntensity: 3
weather-ball.js:228 Sphere created with material: MeshPhysicalMaterial opacity: 0.3
weather-ball.js:229 Sphere material details: {transparent: true, transmission: 0.7, envMap: false, color: 'ffffff', emissive: '0', …}
weather-ball.js:237 Sphere position: _Vector3 {x: 0, y: 0, z: 0}
weather-ball.js:238 Sphere scale: _Vector3 {x: 1, y: 1, z: 1}
weather-ball.js:239 Sphere visible: true
weather-ball.js:422 Scene background set to transparent - HTML gradient visible
atmosphere-system.js:16 Atmosphere system initialized
cloud-system.js:15 Cloud system initialized
particle-system.js:15 Particle system initialized
weather-ball.js:630 Rendering - Scene objects: 10 Sphere visible: true
index.html:423 天气球测试页面已加载
weather-ball.js:274 Environment map applied to glass material
content.js:116 Uncaught (in promise) TypeError: Cannot read properties of null (reading 'style')
    at AeScapeFloatingBall.createFloatingBall (content.js:116:32)
    at AeScapeFloatingBall.init (content.js:596:10)
createFloatingBall @ content.js:116
init @ content.js:596
await in init
AeScapeFloatingBall @ content.js:13
(anonymous) @ content.js:622
content.js:1696 Preloaded 315 local cards to cache
weather-ball.js:630 Rendering - Scene objects: 10 Sphere visible: true
weather-ball.js:630 Rendering - Scene objects: 10 Sphere visible: true
content.js:1701 Force preloading more content...
content.js:1717 Force preloading quotes: 6 cards needed
content.js:1717 Force preloading facts: 8 cards needed
content.js:1717 Force preloading advice: 8 cards needed
content.js:1717 Force preloading catfacts: 11 cards needed
weather-ball.js:630 Rendering - Scene objects: 10 Sphere visible: true
weather-ball.js:630 Rendering - Scene objects: 10 Sphere visible: true
content.js:1717 Force preloading cocktails: 9 cards needed
weather-ball.js:422 Scene background set to transparent - HTML gradient visible
weather-ball.js:630 Rendering - Scene objects: 10 Sphere visible: true
weather-ball.js:422 Scene background set to transparent - HTML gradient visible
content.js:1717 Force preloading datafacts: 6 cards needed
content.js:1746 Force preload completed. Total cache size: 363
weather-ball.js:630 Rendering - Scene objects: 10 Sphere visible: true
weather-ball.js:630 Rendering - Scene objects: 10 Sphere visible: true
weather-ball.js:630 Rendering - Scene objects: 10 Sphere visible: true
weather-ball.js:630 Rendering - Scene objects: 10 Sphere visible: true
weather-ball.js:422 Scene background set to transparent - HTML gradient visible
weather-ball.js:630 Rendering - Scene objects: 10 Sphere visible: true
weather-ball.js:422 Scene background set to transparent - HTML gradient visible
weather-ball.js:630 Rendering - Scene objects: 10 Sphere visible: true
weather-ball.js:422 Scene background set to transparent - HTML gradient visible
weather-ball.js:422 Scene background set to transparent - HTML gradient visible
weather-ball.js:630 Rendering - Scene objects: 10 Sphere visible: true
weather-ball.js:422 Scene background set to transparent - HTML gradient visible
weather-ball.js:630 Rendering - Scene objects: 10 Sphere visible: true
weather-ball.js:422 Scene background set to transparent - HTML gradient visible
weather-ball.js:422 Scene background set to transparent - HTML gradient visible
weather-ball.js:422 Scene background set to transparent - HTML gradient visible
weather-ball.js:630 Rendering - Scene objects: 10 Sphere visible: true
weather-ball.js:422 Scene background set to transparent - HTML gradient visible
weather-ball.js:422 Scene background set to transparent - HTML gradient visible
weather-ball.js:630 Rendering - Scene objects: 10 Sphere visible: true
weather-ball.js:422 Scene background set to transparent - HTML gradient visible
weather-ball.js:630 Rendering - Scene objects: 10 Sphere visible: true
weather-ball.js:630 Rendering - Scene objects: 10 Sphere visible: true
weather-ball.js:630 Rendering - Scene objects: 10 Sphere visible: true
weather-ball.js:630 Rendering - Scene objects: 10 Sphere visible: true
