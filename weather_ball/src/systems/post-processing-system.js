/**
 * 后处理系统
 * 添加辉光、锐化等效果增强真实感
 */

import * as THREE from 'three';

export class PostProcessingSystem {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.enabled = true;
    
    this.init();
  }

  init() {
    // 创建渲染目标
    this.renderTarget = new THREE.WebGLRenderTarget(
      this.renderer.domElement.width,
      this.renderer.domElement.height,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType
      }
    );

    // 创建后处理材质
    this.createPostProcessMaterial();
    
    // 创建全屏四边形
    this.createFullscreenQuad();
  }

  createPostProcessMaterial() {
    this.postProcessMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uExposure: { value: 1.2 },
        uContrast: { value: 1.3 },
        uSaturation: { value: 1.1 },
        uVignette: { value: 0.3 }
      },
      
      vertexShader: `
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform float uExposure;
        uniform float uContrast;
        uniform float uSaturation;
        uniform float uVignette;
        varying vec2 vUv;
        
        // 色调映射
        vec3 toneMapping(vec3 color) {
          // ACES Filmic
          color *= uExposure;
          const float a = 2.51;
          const float b = 0.03;
          const float c = 2.43;
          const float d = 0.59;
          const float e = 0.14;
          return clamp((color * (a * color + b)) / (color * (c * color + d) + e), 0.0, 1.0);
        }
        
        // 对比度调整
        vec3 adjustContrast(vec3 color, float contrast) {
          return (color - 0.5) * contrast + 0.5;
        }
        
        // 饱和度调整
        vec3 adjustSaturation(vec3 color, float saturation) {
          float luminance = dot(color, vec3(0.299, 0.587, 0.114));
          return mix(vec3(luminance), color, saturation);
        }
        
        // 晕影效果
        float vignette(vec2 uv, float intensity) {
          float dist = distance(uv, vec2(0.5));
          return 1.0 - smoothstep(0.3, 0.7, dist * intensity);
        }
        
        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);
          vec3 color = texel.rgb;
          
          // 应用色调映射
          color = toneMapping(color);
          
          // 调整对比度
          color = adjustContrast(color, uContrast);
          
          // 调整饱和度
          color = adjustSaturation(color, uSaturation);
          
          // 应用晕影
          float vignetteStrength = vignette(vUv, uVignette);
          color *= vignetteStrength;
          
          // 轻微的颜色分级（偏蓝色调）
          color.b += 0.02;
          
          gl_FragColor = vec4(color, texel.a);
        }
      `
    });
  }

  createFullscreenQuad() {
    const geometry = new THREE.PlaneGeometry(2, 2);
    this.fullscreenQuad = new THREE.Mesh(geometry, this.postProcessMaterial);
    
    // 创建后处理场景
    this.postProcessScene = new THREE.Scene();
    this.postProcessScene.add(this.fullscreenQuad);
    
    // 创建正交相机
    this.postProcessCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  render() {
    if (!this.enabled) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // 第一遍：渲染到纹理
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);

    // 第二遍：后处理
    this.postProcessMaterial.uniforms.tDiffuse.value = this.renderTarget.texture;
    this.postProcessMaterial.uniforms.uTime.value = performance.now() * 0.001;
    
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.postProcessScene, this.postProcessCamera);
  }

  resize(width, height) {
    this.renderTarget.setSize(width, height);
  }

  destroy() {
    if (this.renderTarget) {
      this.renderTarget.dispose();
    }
    if (this.postProcessMaterial) {
      this.postProcessMaterial.dispose();
    }
    if (this.fullscreenQuad && this.fullscreenQuad.geometry) {
      this.fullscreenQuad.geometry.dispose();
    }
  }
}
