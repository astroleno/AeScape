/**
 * 天景 AeScape - 沉浸式增强系统
 * 基于现有系统的三层粒子增强、仪式感构建、视差响应
 */

/**
 * 渐进式揭晓系统 - 三阶段仪式感体验
 */
class PreRevealationSystem {
  constructor(themeSystem) {
    this.themeSystem = themeSystem;
    this.phases = {
      ANTICIPATION: { duration: 300, intensity: 0.3 },  // 期待感营造
      REVELATION: { duration: 900, intensity: 1.5 },    // 天景降临
      INTEGRATION: { duration: 300, intensity: 0.8 }    // 回归tab
    };
  }

  /**
   * 构建仪式感体验
   */
  async buildRitualExperience(weatherType, timeSlot, currentTheme) {
    // 阶段1：期待感营造 (0-300ms)
    await this.createAnticipation(weatherType, currentTheme);
    
    // 阶段2：天景降临 (300-1200ms)
    await this.revealWeatherScene(weatherType, timeSlot);
    
    // 阶段3：回归tab (1200-1500ms)
    await this.integrateWithTab(currentTheme);
  }

  /**
   * 创建期待感 - 基于现有主题色彩
   */
  async createAnticipation(weatherType, theme) {
    // 环境预热：使用主题的primary色彩
    document.body.style.background = `
      radial-gradient(ellipse at center, 
        ${theme.primary} 0%, 
        transparent 70%)
    `;
    
    // 显示天气预兆
    this.showWeatherOmen(weatherType, theme);
    
    await this.delay(300);
  }

  /**
   * 天气预兆效果 - 与主题色彩统一
   */
  showWeatherOmen(weatherType, theme) {
    const omens = {
      rain: () => this.createRainOmen(theme),
      snow: () => this.createSnowOmen(theme),
      clear: () => this.createSunOmen(theme),
      cloudy: () => this.createCloudOmen(theme),
      thunderstorm: () => this.createThunderOmen(theme),
      fog: () => this.createFogOmen(theme)
    };
    
    if (omens[weatherType]) {
      omens[weatherType]();
    }
  }

  /**
   * 雨天预兆 - 使用雨天主题色彩
   */
  createRainOmen(theme) {
    const omen = document.createElement('div');
    omen.style.cssText = `
      position: fixed; inset: 0; z-index: 9997; pointer-events: none;
      background: linear-gradient(45deg, 
        transparent 48%, 
        ${theme.secondary} 49%, 
        ${theme.secondary} 51%, 
        transparent 52%),
      linear-gradient(-45deg, 
        transparent 48%, 
        ${theme.accent} 49%, 
        ${theme.accent} 51%, 
        transparent 52%);
      background-size: 4px 4px;
      animation: rain-gather 300ms ease-out forwards;
      opacity: 0;
    `;
    
    this.injectStyles(`
      @keyframes rain-gather {
        0% { opacity: 0; transform: translateY(-100vh); }
        100% { opacity: 0.4; transform: translateY(0); }
      }
    `);
    
    document.body.appendChild(omen);
    setTimeout(() => omen.remove(), 300);
  }

  /**
   * 雪天预兆 - 温度下降效果
   */
  createSnowOmen(theme) {
    const omen = document.createElement('div');
    omen.style.cssText = `
      position: fixed; inset: 0; z-index: 9997; pointer-events: none;
      background: radial-gradient(circle at 20% 80%, ${theme.primary} 0%, transparent 20%),
                  radial-gradient(circle at 80% 20%, ${theme.secondary} 0%, transparent 20%),
                  radial-gradient(circle at 40% 40%, ${theme.accent} 0%, transparent 20%);
      animation: snow-gather 300ms ease-out forwards;
      opacity: 0;
    `;
    
    this.injectStyles(`
      @keyframes snow-gather {
        0% { opacity: 0; filter: blur(10px); }
        100% { opacity: 0.3; filter: blur(0px); }
      }
    `);
    
    document.body.appendChild(omen);
    setTimeout(() => omen.remove(), 300);
  }

  /**
   * 晴天预兆 - 光晕聚集
   */
  createSunOmen(theme) {
    const omen = document.createElement('div');
    omen.style.cssText = `
      position: fixed; inset: 0; z-index: 9997; pointer-events: none;
      background: radial-gradient(ellipse at center, 
        ${theme.primary} 0%, 
        ${theme.secondary} 30%, 
        transparent 70%);
      animation: sun-gather 300ms ease-out forwards;
      opacity: 0;
    `;
    
    this.injectStyles(`
      @keyframes sun-gather {
        0% { opacity: 0; transform: scale(0.5); }
        100% { opacity: 0.5; transform: scale(1); }
      }
    `);
    
    document.body.appendChild(omen);
    setTimeout(() => omen.remove(), 300);
  }

  /**
   * 多云/雾天预兆
   */
  createCloudOmen(theme) {
    this.createSunOmen(theme); // 与晴天类似
  }

  createFogOmen(theme) {
    this.createSnowOmen(theme); // 与雪天类似
  }

  /**
   * 雷暴预兆 - 电场聚集
   */
  createThunderOmen(theme) {
    const omen = document.createElement('div');
    omen.style.cssText = `
      position: fixed; inset: 0; z-index: 9997; pointer-events: none;
      background: ${theme.primary};
      animation: thunder-gather 300ms ease-out forwards;
      opacity: 0;
    `;
    
    this.injectStyles(`
      @keyframes thunder-gather {
        0% { opacity: 0; }
        50% { opacity: 0.8; }
        100% { opacity: 0; }
      }
    `);
    
    document.body.appendChild(omen);
    setTimeout(() => omen.remove(), 300);
  }

  revealWeatherScene(weatherType, timeSlot) {
    // 天景降临阶段 - 由视频播放系统处理
    return this.delay(900);
  }

  integrateWithTab(currentTheme) {
    // 回归tab阶段 - 恢复背景
    document.body.style.background = '';
    return this.delay(300);
  }

  /**
   * 注入CSS样式
   */
  injectStyles(cssText) {
    if (!document.querySelector('#pre-revelation-styles')) {
      const style = document.createElement('style');
      style.id = 'pre-revelation-styles';
      document.head.appendChild(style);
    }
    
    const styleSheet = document.querySelector('#pre-revelation-styles');
    styleSheet.textContent += cssText;
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 三层粒子增强系统
 */
class TripleLayerEnhancer {
  constructor(videoManager) {
    this.videoManager = videoManager;
    this.layers = {
      core: null,    // 细节层：保持清晰
      glow: null,    // 光晕层：增强存在感
      depth: null    // 近景层：制造深度
    };
    this.isEnhanced = false;
  }

  /**
   * 创建三层增强结构
   */
  enhanceVideoLayers(videoElement, weatherType) {
    if (this.isEnhanced) return;
    
    const container = videoElement.parentElement;
    
    // 1. 核心层：保持原有清晰度
    this.layers.core = videoElement;
    this.layers.core.classList.add('fx-core');
    
    // 2. 光晕层：同视频源，增强粒子可见度
    this.layers.glow = this.createGlowLayer(videoElement);
    container.appendChild(this.layers.glow);
    
    // 3. 近景层：放大版本，制造前后景差
    this.layers.depth = this.createDepthLayer(videoElement);
    container.appendChild(this.layers.depth);
    
    // 应用天气特定的增强效果
    this.applyWeatherSpecificEnhancements(weatherType);
    
    // 注入增强样式
    this.injectEnhancementStyles();
    
    this.isEnhanced = true;
  }

  /**
   * 创建光晕增强层
   */
  createGlowLayer(originalVideo) {
    const glowVideo = originalVideo.cloneNode(true);
    glowVideo.classList.add('fx-glow');
    glowVideo.id = originalVideo.id + '-glow';
    glowVideo.style.cssText = `
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover; pointer-events: none;
      z-index: ${parseInt(originalVideo.style.zIndex || '0') + 1};
      
      /* 粒子增强效果 */
      filter: brightness(1.5) contrast(1.5) blur(2px) 
              drop-shadow(0 0 6px rgba(255,255,255,0.6))
              drop-shadow(0 0 12px rgba(255,255,255,0.35));
      
      /* 轻微放大增加存在感 */
      transform: scale(1.1);
      opacity: 0.8;
      mix-blend-mode: screen;
      
      /* 峰值增强动画 */
      animation: glow-pulse 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    `;
    
    // 同步播放
    originalVideo.addEventListener('loadeddata', () => {
      glowVideo.src = originalVideo.src;
      glowVideo.currentTime = originalVideo.currentTime;
    });
    
    originalVideo.addEventListener('play', () => {
      glowVideo.play().catch(() => {});
    });
    
    originalVideo.addEventListener('pause', () => {
      glowVideo.pause();
    });
    
    return glowVideo;
  }

  /**
   * 创建近景深度层
   */
  createDepthLayer(originalVideo) {
    const depthVideo = originalVideo.cloneNode(true);
    depthVideo.classList.add('fx-depth');
    depthVideo.id = originalVideo.id + '-depth';
    depthVideo.style.cssText = `
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover; pointer-events: none;
      z-index: ${parseInt(originalVideo.style.zIndex || '0') + 2};
      
      /* 近景效果：放大+模糊 */
      transform: scale(1.35);
      filter: blur(3px) brightness(1.2);
      opacity: 0.6;
      mix-blend-mode: lighten;
      
      /* 轻微时间偏移创造残影效果 */
      animation: depth-flow 1.2s ease-out;
    `;
    
    // 同步播放 + 轻微偏移
    originalVideo.addEventListener('loadeddata', () => {
      depthVideo.src = originalVideo.src;
      setTimeout(() => {
        if (depthVideo.readyState >= 2) {
          depthVideo.currentTime = originalVideo.currentTime + 0.03; // 约一帧偏移
        }
      }, 100);
    });
    
    originalVideo.addEventListener('play', () => {
      setTimeout(() => {
        depthVideo.play().catch(() => {});
      }, 30); // 30ms延迟播放
    });
    
    originalVideo.addEventListener('pause', () => {
      depthVideo.pause();
    });
    
    return depthVideo;
  }

  /**
   * 应用天气特定增强
   */
  applyWeatherSpecificEnhancements(weatherType) {
    const enhancements = {
      rain: () => this.enhanceRainEffect(),
      snow: () => this.enhanceSnowEffect(), 
      clear: () => this.enhanceCloudEffect(),
      cloudy: () => this.enhanceCloudEffect(),
      thunderstorm: () => this.enhanceThunderEffect(),
      fog: () => this.enhanceFogEffect()
    };
    
    if (enhancements[weatherType]) {
      enhancements[weatherType]();
    }
  }

  /**
   * 雨天增强：强化雨滴轨迹
   */
  enhanceRainEffect() {
    if (this.layers.glow) {
      this.layers.glow.style.filter += ` contrast(1.8)`;
    }
    
    if (this.layers.depth) {
      this.layers.depth.style.transform += ` skew(2deg, 0deg)`;
      this.layers.depth.style.mixBlendMode = 'screen';
    }
  }

  /**
   * 雪天增强：增加雪花亮度和体积感
   */
  enhanceSnowEffect() {
    if (this.layers.glow) {
      this.layers.glow.style.filter += ` brightness(2.0)`;
    }
    
    if (this.layers.depth) {
      this.layers.depth.style.opacity = '0.8';
      this.layers.depth.style.filter += ` saturate(0)`;
    }
  }

  /**
   * 云层增强：增强边缘定义
   */
  enhanceCloudEffect() {
    if (this.layers.glow) {
      this.layers.glow.style.filter = `brightness(1.3) contrast(1.4) blur(1px)`;
      this.layers.glow.style.mixBlendMode = 'lighten';
    }
  }

  /**
   * 雾天增强
   */
  enhanceFogEffect() {
    this.enhanceCloudEffect(); // 与云层类似
  }

  /**
   * 雷暴增强：电光效果
   */
  enhanceThunderEffect() {
    if (this.layers.glow) {
      this.layers.glow.style.filter += ` hue-rotate(240deg)`;
      this.layers.glow.style.mixBlendMode = 'overlay';
    }
    
    // 添加随机闪光效果
    this.addLightningFlash();
  }

  /**
   * 闪电效果
   */
  addLightningFlash() {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(200, 200, 255, 0.8);
      pointer-events: none;
      animation: lightning-flash 150ms ease-out;
    `;
    
    this.injectStyles(`
      @keyframes lightning-flash {
        0%, 100% { opacity: 0; }
        50% { opacity: 1; }
      }
    `);
    
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 150);
  }

  /**
   * 注入增强样式
   */
  injectEnhancementStyles() {
    if (document.querySelector('#enhancement-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'enhancement-styles';
    style.textContent = `
      /* 光晕层峰值脉冲 */
      @keyframes glow-pulse {
        0% { 
          filter: brightness(1.5) contrast(1.5) blur(2px) 
                  drop-shadow(0 0 6px rgba(255,255,255,0.6));
          opacity: 0.8; 
          transform: scale(1.1);
        }
        30% { 
          filter: brightness(2.2) contrast(2.0) blur(1px) 
                  drop-shadow(0 0 12px rgba(255,255,255,0.9))
                  drop-shadow(0 0 24px rgba(255,255,255,0.5));
          opacity: 1; 
          transform: scale(1.15);
        }
        80% { 
          filter: brightness(1.8) contrast(1.7) blur(1.5px) 
                  drop-shadow(0 0 8px rgba(255,255,255,0.7));
          opacity: 0.9; 
          transform: scale(1.12);
        }
        100% { 
          filter: brightness(1.5) contrast(1.5) blur(2px) 
                  drop-shadow(0 0 6px rgba(255,255,255,0.6));
          opacity: 0.8; 
          transform: scale(1.1);
        }
      }

      /* 近景层流动效果 */
      @keyframes depth-flow {
        0% { 
          transform: scale(1.35) translateY(5px); 
          opacity: 0.6; 
        }
        50% { 
          transform: scale(1.38) translateY(0px); 
          opacity: 0.8; 
        }
        100% { 
          transform: scale(1.35) translateY(-5px); 
          opacity: 0.6; 
        }
      }

      /* 渐晕增强对比度 */
      .weather-vignette {
        position: fixed; inset: 0; z-index: 9998; pointer-events: none;
        background: radial-gradient(ellipse at center, 
          transparent 30%, 
          rgba(0,0,0,0.4) 80%,
          rgba(0,0,0,0.7) 100%);
        animation: fade-vignette 1.5s ease-out forwards;
      }

      @keyframes fade-vignette {
        0% { opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    
    document.head.appendChild(style);
  }

  injectStyles(cssText) {
    if (!document.querySelector('#additional-styles')) {
      const style = document.createElement('style');
      style.id = 'additional-styles';
      document.head.appendChild(style);
    }
    
    const styleSheet = document.querySelector('#additional-styles');
    styleSheet.textContent += cssText;
  }

  /**
   * 清理增强层
   */
  cleanup() {
    if (this.layers.glow) {
      this.layers.glow.remove();
      this.layers.glow = null;
    }
    if (this.layers.depth) {
      this.layers.depth.remove();
      this.layers.depth = null;
    }
    this.layers.core = null;
    this.isEnhanced = false;
  }
}

/**
 * 沉浸式视差系统
 */
class ImmersiveParallax {
  constructor() {
    this.isActive = false;
    this.sensitivity = 0.8;
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.dampening = 0.1;
    this.animationId = null;
  }

  /**
   * 激活视差响应
   */
  activate(videoContainer) {
    this.isActive = true;
    this.setupMouseTracking();
    this.startParallaxAnimation(videoContainer);
  }

  /**
   * 设置鼠标跟踪
   */
  setupMouseTracking() {
    this.mouseMoveHandler = (e) => {
      if (!this.isActive) return;
      
      // 将鼠标位置转换为-1到1的范围
      this.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    
    document.addEventListener('mousemove', this.mouseMoveHandler);
  }

  /**
   * 启动视差动画循环
   */
  startParallaxAnimation(container) {
    const animate = () => {
      if (!this.isActive) return;
      
      // 使用阻尼产生平滑过渡
      this.mouseX += (this.targetX - this.mouseX) * this.dampening;
      this.mouseY += (this.targetY - this.mouseY) * this.dampening;
      
      // 计算各层的偏移量
      const coreOffset = {
        x: this.mouseX * 3 * this.sensitivity,
        y: this.mouseY * 2 * this.sensitivity
      };
      
      const glowOffset = {
        x: this.mouseX * 5 * this.sensitivity,
        y: this.mouseY * 3 * this.sensitivity
      };
      
      const depthOffset = {
        x: this.mouseX * 8 * this.sensitivity,
        y: this.mouseY * 5 * this.sensitivity
      };
      
      // 应用变换
      const coreLayer = container.querySelector('.fx-core');
      const glowLayer = container.querySelector('.fx-glow');
      const depthLayer = container.querySelector('.fx-depth');
      
      if (coreLayer) {
        coreLayer.style.transform = 
          `translate3d(${coreOffset.x}px, ${coreOffset.y}px, 0)`;
      }
      
      if (glowLayer) {
        const currentTransform = glowLayer.style.transform || '';
        const scaleMatch = currentTransform.match(/scale\([^)]+\)/);
        const scale = scaleMatch ? scaleMatch[0] : 'scale(1.1)';
        glowLayer.style.transform = 
          `translate3d(${glowOffset.x}px, ${glowOffset.y}px, 0) ${scale}`;
      }
      
      if (depthLayer) {
        const currentTransform = depthLayer.style.transform || '';
        const scaleMatch = currentTransform.match(/scale\([^)]+\)/);
        const scale = scaleMatch ? scaleMatch[0] : 'scale(1.35)';
        depthLayer.style.transform = 
          `translate3d(${depthOffset.x}px, ${depthOffset.y}px, 0) ${scale}`;
      }
      
      this.animationId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  /**
   * 停用视差效果
   */
  deactivate() {
    this.isActive = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    if (this.mouseMoveHandler) {
      document.removeEventListener('mousemove', this.mouseMoveHandler);
      this.mouseMoveHandler = null;
    }
  }
}

/**
 * 完整的沉浸式增强管理器
 */
class ImmersiveEnhancementManager {
  constructor(videoWeatherManager, themeSystem) {
    this.videoManager = videoWeatherManager;
    this.themeSystem = themeSystem;
    
    // 初始化各个增强系统
    this.preReveal = new PreRevealationSystem(themeSystem);
    this.tripleLayer = new TripleLayerEnhancer(videoWeatherManager);
    this.parallax = new ImmersiveParallax();
    
    this.isEnhancementActive = false;
  }

  /**
   * 主要增强入口 - 完整的沉浸式体验
   */
  async enhanceWeatherExperience(weatherType, timeSlot, temperature = 20, options = {}) {
    if (this.isEnhancementActive) return;
    this.isEnhancementActive = true;
    
    try {
      // 1. 获取当前主题配置
      const baseTheme = this.themeSystem.getTheme(weatherType, 
        new Date().getHours(), 
        timeSlot === 'night'
      );
      
      // 2. 构建仪式感体验 (0-300ms)
      if (options.enableRitual !== false) {
        await this.preReveal.buildRitualExperience(weatherType, timeSlot, baseTheme);
      }
      
      // 3. 启动视频播放（原有逻辑）
      const playResult = await this.videoManager.playWeatherVideo(weatherType, {
        intensity: options.intensity || 'medium',
        ...options
      });
      
      if (playResult && this.videoManager.animation?.videoContainer) {
        const container = this.videoManager.animation.videoContainer;
        const videoElement = container.querySelector('video');
        
        // 4. 应用三层粒子增强
        if (options.enableLayerEnhancement !== false && videoElement) {
          this.tripleLayer.enhanceVideoLayers(videoElement, weatherType);
        }
        
        // 5. 激活视差响应
        if (options.enableParallax !== false) {
          setTimeout(() => {
            this.parallax.activate(container);
          }, 100); // 稍微延迟确保层级创建完成
        }
        
        // 6. 创建渐晕效果
        if (options.enableVignette !== false) {
          this.createEnhancedVignette(baseTheme);
        }
        
        // 7. 设置清理定时器
        setTimeout(() => {
          this.cleanup();
        }, options.duration || 1500);
      }
      
    } catch (error) {
      console.error('ImmersiveEnhancement: Enhancement failed', error);
      this.cleanup();
    }
  }

  /**
   * 创建增强渐晕效果
   */
  createEnhancedVignette(theme) {
    const vignette = document.createElement('div');
    vignette.className = 'weather-vignette-enhanced';
    vignette.style.cssText = `
      position: fixed; inset: 0; z-index: 9998; pointer-events: none;
      background: radial-gradient(ellipse at center, 
        transparent 25%, 
        ${theme.primary}10 60%,
        ${theme.secondary}20 85%,
        ${theme.primary}40 100%);
      animation: enhanced-vignette 1.5s ease-out forwards;
    `;
    
    // 动态CSS样式注入
    if (!document.querySelector('#enhanced-vignette-styles')) {
      const style = document.createElement('style');
      style.id = 'enhanced-vignette-styles';
      style.textContent = `
        @keyframes enhanced-vignette {
          0% { opacity: 0; transform: scale(1.1); }
          25% { opacity: 1; transform: scale(1.05); }
          75% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.95); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(vignette);
    setTimeout(() => vignette.remove(), 1500);
  }

  /**
   * 手动触发增强（用于测试和演示）
   */
  async manualTrigger(weatherType, timeSlot = null, options = {}) {
    const currentHour = new Date().getHours();
    const inferredTimeSlot = timeSlot || this.getTimeSlot(currentHour);
    
    await this.enhanceWeatherExperience(weatherType, inferredTimeSlot, 20, {
      intensity: 'high',
      enableRitual: true,
      enableLayerEnhancement: true,
      enableParallax: true,
      enableVignette: true,
      ...options
    });
  }

  /**
   * 获取时间段
   */
  getTimeSlot(hour) {
    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 14) return 'noon';
    if (hour >= 14 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 19) return 'sunset';
    if (hour >= 19 && hour < 22) return 'evening';
    return 'night';
  }

  /**
   * 清理所有增强效果
   */
  cleanup() {
    this.parallax.deactivate();
    this.tripleLayer.cleanup();
    this.isEnhancementActive = false;
    
    // 清理可能残留的DOM元素
    document.querySelectorAll('.weather-vignette, .weather-vignette-enhanced')
      .forEach(el => el.remove());
  }

  /**
   * 获取增强状态
   */
  getStatus() {
    return {
      isActive: this.isEnhancementActive,
      parallaxActive: this.parallax.isActive,
      availableWeatherTypes: this.videoManager.getSupportedWeatherTypes(),
      currentTheme: this.themeSystem.currentTheme
    };
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PreRevealationSystem,
    TripleLayerEnhancer, 
    ImmersiveParallax,
    ImmersiveEnhancementManager
  };
}