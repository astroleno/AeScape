/**
 * 天空渐变工具
 * 根据天气和时间创建天空渐变背景
 */

import * as THREE from 'three';

/**
 * 创建天空渐变背景
 */
export function createSkyGradient(params) {
  // 固定使用深蓝到浅蓝渐变，如用户要求
  const gradientColors = {
    top: 0x1e3a8a,    // 深蓝
    bottom: 0x87ceeb  // 浅蓝
  };
  
  // 创建渐变纹理
  return createGradientTexture(gradientColors);
}

/**
 * 获取渐变颜色
 */
function getGradientColors(timeOfDay, weatherCode, sunAltitude) {
  // 基础颜色配置 - 更符合参考图片的风格
  const colorSchemes = {
    // 晴天
    clear: {
      dawn: { top: 0x87ceeb, bottom: 0xb8d4f0 },
      day: { top: 0x4a90e2, bottom: 0x87ceeb },
      dusk: { top: 0xff7e67, bottom: 0xffb74d },
      night: { top: 0x2c3e50, bottom: 0x34495e }
    },
    
    // 多云
    cloudy: {
      dawn: { top: 0x7fb3d3, bottom: 0xc9dae8 },
      day: { top: 0x5dade2, bottom: 0x89c4e7 },
      dusk: { top: 0xd4949a, bottom: 0xf2b5b8 },
      night: { top: 0x2c3e50, bottom: 0x34495e }
    },
    
    // 雨天
    rain: {
      dawn: { top: 0x4a6373, bottom: 0x6b8395 },
      day: { top: 0x3a5a6b, bottom: 0x4a6373 },
      dusk: { top: 0x2f4f4f, bottom: 0x4a6373 },
      night: { top: 0x1a1a1a, bottom: 0x2c3e50 }
    },
    
    // 雪天
    snow: {
      dawn: { top: 0xe8f4f8, bottom: 0xf5f9fc },
      day: { top: 0xd6e9f0, bottom: 0xe8f4f8 },
      dusk: { top: 0xc4d3e0, bottom: 0xe8f4f8 },
      night: { top: 0x2c3e50, bottom: 0x34495e }
    },
    
    // 雾天
    fog: {
      dawn: { top: 0xc9d6d3, bottom: 0xe8efed },
      day: { top: 0xb8c8c4, bottom: 0xd4e2de },
      dusk: { top: 0xa9b8b4, bottom: 0xc9d6d3 },
      night: { top: 0x2c3e50, bottom: 0x34495e }
    },
    
    // 雷暴
    thunderstorm: {
      dawn: { top: 0x2f4f4f, bottom: 0x4a6373 },
      day: { top: 0x1a2e3a, bottom: 0x2f4f4f },
      dusk: { top: 0x1a1a1a, bottom: 0x2f4f4f },
      night: { top: 0x0d1a1a, bottom: 0x1a2e3a }
    }
  };
  
  // 根据太阳高度角确定时间段
  let effectiveTimeOfDay = timeOfDay;
  if (!effectiveTimeOfDay) {
    if (sunAltitude > 10) {
      effectiveTimeOfDay = 'day';
    } else if (sunAltitude > -6) {
      effectiveTimeOfDay = sunAltitude > 0 ? 'dusk' : 'dawn';
    } else {
      effectiveTimeOfDay = 'night';
    }
  }
  
  // 获取颜色方案
  const scheme = colorSchemes[weatherCode] || colorSchemes.clear;
  return scheme[effectiveTimeOfDay] || scheme.day;
}

/**
 * 创建渐变纹理
 */
function createGradientTexture(colors) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  
  const ctx = canvas.getContext('2d');
  
  // 创建垂直线性渐变（天空效果）
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  
  // 添加多个渐变停止点以实现更自然的天空效果
  const topColor = `#${colors.top.toString(16).padStart(6, '0')}`;
  const bottomColor = `#${colors.bottom.toString(16).padStart(6, '0')}`;
  const midColor = interpolateColor(colors.top, colors.bottom, 0.3);
  
  gradient.addColorStop(0, topColor);           // 天顶
  gradient.addColorStop(0.3, midColor);         // 中间过渡
  gradient.addColorStop(0.7, bottomColor);      // 地平线
  gradient.addColorStop(1, bottomColor);        // 底部
  
  // 填充渐变
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 512);
  
  // 添加一些大气散射效果
  addAtmosphericScattering(ctx, colors);
  
  // 创建纹理
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.flipY = false;
  
  return texture;
}

/**
 * 颜色插值
 */
function interpolateColor(color1, color2, factor) {
  const r1 = (color1 >> 16) & 0xff;
  const g1 = (color1 >> 8) & 0xff;
  const b1 = color1 & 0xff;
  
  const r2 = (color2 >> 16) & 0xff;
  const g2 = (color2 >> 8) & 0xff;
  const b2 = color2 & 0xff;
  
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * 添加大气散射效果
 */
function addAtmosphericScattering(ctx, colors) {
  // 创建径向渐变来模拟太阳光散射
  const centerX = 1024 * 0.7; // 太阳位置
  const centerY = 512 * 0.8;
  
  const scatterGradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, 300
  );
  
  // 根据天气类型调整散射颜色
  let scatterColor = 'rgba(255, 200, 100, 0.1)'; // 默认暖色散射
  
  scatterGradient.addColorStop(0, scatterColor);
  scatterGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
  scatterGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = scatterGradient;
  ctx.fillRect(0, 0, 1024, 512);
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * 创建线性渐变纹理（备用方案）
 */
export function createLinearGradientTexture(colors) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  
  const ctx = canvas.getContext('2d');
  
  // 创建线性渐变
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  
  // 添加渐变停止点
  gradient.addColorStop(0, `#${colors.top.toString(16).padStart(6, '0')}`);
  gradient.addColorStop(1, `#${colors.bottom.toString(16).padStart(6, '0')}`);
  
  // 填充渐变
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  
  // 创建纹理
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  
  return texture;
}
