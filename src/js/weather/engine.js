/**
 * Three.js 天气渲染引擎
 * 基于 weather.html 提取的核心渲染逻辑
 */
export class WeatherEngine {
  constructor(container) {
    this.container = container
    this.renderer = null
    this.scene = null
    this.camera = null
    this.composer = null
    this.bloomPass = null
    this.afterimagePass = null
    
    this.ambientLight = null
    this.directionalLight = null
    this.lightningLight = null
    
    this.ground = null
    this.groundMat = null
    this.cloudGroup = null
    this.cloud1 = null
    this.cloud2 = null
    this.cloudTex = null
    
    this.isRaining = false
    this.isSnowing = false
    this.currentTime = 'day'
    this.particleCount = 5000
    this.particleSpeed = 10
    this.lightBase = 0.6
    
    this.rainMesh = null
    this.RAIN_COUNT = 0
    this.BASE_SPEED = 10
    this.POS = null
    this.VEL = null
    this._M = null
    this._Q = null
    this._V = null
    this._S = null
    
    this.splashMesh = null
    this.SPL_LIFE = null
    this.SPL_POS = null
    this.MAX_SPL = 800
    this.SPL_DT = 0.25
    
    this.WIND_BASE = 0.8
    this.WIND_GUST = 0.6
    this.WIND_DIR = 90
    this.WIND_VEC = null
    
    this.lightningTimer = 0
    this.lightningActive = false
    this.lightningBias = 0.015
    
    this.PRESET = {
      day: {
        fogCol: 0x8ec5df,
        fogDen: 0.03,
        amb: 0.8,
        dir: 1.0,
        dirCol: 0xffffff,
        bgTop: 0x87CEEB,
        bgBot: 0xE0F7FA,
        bloom: 0.45
      },
      night: {
        fogCol: 0x0b1a2e,
        fogDen: 0.055,
        amb: 0.22,
        dir: 0.55,
        dirCol: 0x8080ff,
        bgTop: 0x0A192F,
        bgBot: 0x112240,
        bloom: 0.75
      },
      cloudy: {
        fogCol: 0x6d93a7,
        fogDen: 0.045,
        amb: 0.6,
        dir: 0.7,
        dirCol: 0xeceff1,
        bgTop: 0x7fa7bd,
        bgBot: 0xa8c4d3,
        bloom: 0.50
      }
    }
    
    this.init()
  }

  init() {
    this.setupRenderer()
    this.setupScene()
    this.setupLights()
    this.setupGround()
    this.initClouds()
    this.setupPostProcessing()
    this.initSplashPool()
    this.setupEventListeners()
    
    // 默认设置
    this.setupRain()
    this.applyEnv('day')
    
    this.animate()
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.physicallyCorrectLights = true
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    this.container.appendChild(this.renderer.domElement)
  }

  setupScene() {
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x8ec5df, 0.03)

    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 220)
    this.camera.position.set(0, 1.7, 7)
    this.camera.lookAt(0, 1.4, 0)
  }

  setupLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, this.lightBase)
    this.scene.add(this.ambientLight)

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
    this.directionalLight.position.set(3, 5, 2)
    this.scene.add(this.directionalLight)

    this.lightningLight = new THREE.PointLight(0xffffff, 0, 50)
    this.lightningLight.position.set(0, 8, -6)
    this.scene.add(this.lightningLight)
  }

  setupGround() {
    this.groundMat = new THREE.MeshStandardMaterial({
      color: 0x9aa0a6,
      roughness: 0.95,
      metalness: 0.0
    })
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), this.groundMat)
    this.ground.rotation.x = -Math.PI / 2
    this.ground.receiveShadow = true
    this.scene.add(this.ground)
  }

  setupPostProcessing() {
    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.55,
      0.85,
      0.85
    )
    this.composer.addPass(this.bloomPass)
    
    this.afterimagePass = new AfterimagePass()
    this.afterimagePass.uniforms['damp'].value = 0.92
    this.composer.addPass(this.afterimagePass)
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onResize())
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.composer.setSize(window.innerWidth, window.innerHeight)
  }

  animate() {
    requestAnimationFrame(() => this.animate())
    
    const now = performance.now()
    const dt = Math.min(0.05, (this.animate._last ? (now - this.animate._last) : 16) / 1000)
    this.animate._last = now

    this.updateWind(dt)
    this.updateLightning(dt)
    this.updateRain(dt)
    this.updateSnow(dt)
    this.updateSplash(dt)
    this.updateClouds()

    this.composer.render()
  }

  updateWind(dt) {
    const gust = this.noise1D(now * 0.0007)
    const base = this.WIND_BASE + gust * this.WIND_GUST
    const wd = THREE.MathUtils.degToRad((this.WIND_DIR + 180) % 360)
    this.WIND_VEC.set(Math.sin(wd), 0, Math.cos(wd)).multiplyScalar(base)
  }

  updateLightning(dt) {
    this.lightningTimer -= dt
    if (this.lightningTimer <= 0 && this.currentTime === 'night' && this.isRaining) {
      if (Math.random() < this.lightningBias) {
        this.triggerLightning()
        this.lightningTimer = 3 + Math.random() * 5
      } else {
        this.lightningTimer = 0.5 + Math.random() * 1.5
      }
    }
  }

  // ... 其他方法将从 weather.html 提取
  // 这里省略了具体实现，保留核心结构

  /**
   * 应用天气状态
   * @param {Object} state 天气状态对象
   */
  applyWeatherState(state) {
    // 实现将从 weather.html 的 applyWeatherState 函数移植
    console.log('Applying weather state:', state)
  }

  /**
   * 清理资源
   */
  dispose() {
    if (this.renderer) {
      this.renderer.dispose()
    }
    // 清理其他资源...
  }
}