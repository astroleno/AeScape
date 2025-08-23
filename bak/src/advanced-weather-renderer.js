// 高质量天气渲染器 - 基于ref目录中的专业实现
// 整合了完整的天气系统：天空、云层、太阳、雨、雪、闪电等

// 使用全局THREE对象（与HTML中的script标签加载方式兼容）

// =============== 工具与常量 ===============
const DEG2RAD = Math.PI / 180;

function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
function lerp(a,b,t){ return a + (b-a)*t; }
function hslToRgb(h,s,l){
  const hue2rgb=(p,q,t)=>{ if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; };
  const q = l < .5 ? l*(1+s) : l+s-l*s, p = 2*l-q;
  return [hue2rgb(p,q,h+1/3), hue2rgb(p,q,h), hue2rgb(p,q,h-1/3)];
}
function colorFromHsl(h,s,l){ const [r,g,b]=hslToRgb(h,s,l); return new THREE.Color(r,g,b); }
function vecFromDeg(deg){ const r = deg*DEG2RAD; return new THREE.Vector2(Math.cos(r), Math.sin(r)); }

// =============== 天气参数模版（完整9种场景） ===============
const WEATHER_TEMPLATES = {
  'clear-day': {
    label: '晴天（日）',
    exposure: 1.5,
    fogDensity: 0.0001,
    sky: {
      topColor: new THREE.Color(0.05, 0.3, 0.8), // 深蓝天蓝色
      horizonColor: new THREE.Color(0.2, 0.6, 0.95), // 明亮的天蓝色
      bottomColor: new THREE.Color(0.6, 0.8, 1.0), // 浅蓝色
      mie: 0.005,
      rayleigh: 5.0,
    },
    sun: { elevDeg: 45, azimDeg: 120, diskSize: 0.035, glow: 1.2 },
    clouds: { density: 0.25, coverage: 0.25, speed: 0.06, scale: 1.8, detail: 0.6, aniso: 0.2, color: new THREE.Color(1,1,1) },
    wind: { speed: 0.6, dirDeg: 100 },
    precipitation: { type: 'none', intensity: 0 },
    lightning: { probability: 0, brightness: 0.0, decay: 0.25 }
  },

  'cloudy-day': {
    label: '多云（日）',
    exposure: 1.0,
    fogDensity: 0.001,
    sky: {
      topColor: colorFromHsl(0.58, 0.30, 0.58),
      horizonColor: colorFromHsl(0.58, 0.25, 0.72),
      bottomColor: colorFromHsl(0.10, 0.12, 0.92),
      mie: 0.05,
      rayleigh: 1.0,
    },
    sun: { elevDeg: 38, azimDeg: 140, diskSize: 0.03, glow: 0.9 },
    clouds: { density: 0.55, coverage: 0.55, speed: 0.08, scale: 1.6, detail: 0.9, aniso: 0.35, color: new THREE.Color(0.95,0.97,1.0) },
    wind: { speed: 0.8, dirDeg: 120 },
    precipitation: { type: 'none', intensity: 0 },
    lightning: { probability: 0, brightness: 0.0, decay: 0.25 }
  },

  'overcast': {
    label: '阴天',
    exposure: 0.95,
    fogDensity: 0.0032,
    sky: {
      topColor: new THREE.Color(0.72,0.75,0.82),
      horizonColor: new THREE.Color(0.76,0.78,0.84),
      bottomColor: new THREE.Color(0.82,0.84,0.88),
      mie: 0.06,
      rayleigh: 0.8,
    },
    sun: { elevDeg: 28, azimDeg: 160, diskSize: 0.025, glow: 0.6 },
    clouds: { density: 0.85, coverage: 0.85, speed: 0.07, scale: 1.4, detail: 1.2, aniso: 0.45, color: new THREE.Color(0.92,0.94,0.98) },
    wind: { speed: 0.9, dirDeg: 140 },
    precipitation: { type: 'none', intensity: 0 },
    lightning: { probability: 0, brightness: 0.0, decay: 0.25 }
  },

  'rain': {
    label: '小到中雨',
    exposure: 0.92,
    fogDensity: 0.004,
    sky: {
      topColor: new THREE.Color(0.58,0.64,0.74),
      horizonColor: new THREE.Color(0.66,0.70,0.78),
      bottomColor: new THREE.Color(0.72,0.76,0.82),
      mie: 0.07, rayleigh: 0.9
    },
    sun: { elevDeg: 22, azimDeg: 160, diskSize: 0.022, glow: 0.45 },
    clouds: { density: 0.92, coverage: 0.9, speed: 0.11, scale: 1.3, detail: 1.4, aniso: 0.55, color: new THREE.Color(0.90,0.93,0.98) },
    wind: { speed: 1.0, dirDeg: 160 },
    precipitation: { type: 'rain', intensity: 0.65 },
    lightning: { probability: 0.02, brightness: 0.75, decay: 0.22 }
  },

  'storm': {
    label: '雷暴',
    exposure: 0.9,
    fogDensity: 0.005,
    sky: {
      topColor: new THREE.Color(0.45,0.50,0.60),
      horizonColor: new THREE.Color(0.52,0.56,0.66),
      bottomColor: new THREE.Color(0.60,0.63,0.70),
      mie: 0.09, rayleigh: 0.7
    },
    sun: { elevDeg: 20, azimDeg: 180, diskSize: 0.02, glow: 0.3 },
    clouds: { density: 0.97, coverage: 0.97, speed: 0.14, scale: 1.15, detail: 1.6, aniso: 0.62, color: new THREE.Color(0.88,0.90,0.95) },
    wind: { speed: 1.3, dirDeg: 180 },
    precipitation: { type: 'rain', intensity: 0.95 },
    lightning: { probability: 0.25, brightness: 1.2, decay: 0.2 }
  },

  'snow': {
    label: '降雪',
    exposure: 0.98,
    fogDensity: 0.0045,
    sky: {
      topColor: new THREE.Color(0.80,0.85,0.94),
      horizonColor: new THREE.Color(0.86,0.90,0.96),
      bottomColor: new THREE.Color(0.92,0.94,0.98),
      mie: 0.05, rayleigh: 0.9
    },
    sun: { elevDeg: 24, azimDeg: 160, diskSize: 0.02, glow: 0.5 },
    clouds: { density: 0.88, coverage: 0.9, speed: 0.06, scale: 1.2, detail: 1.2, aniso: 0.4, color: new THREE.Color(0.96,0.98,1.0) },
    wind: { speed: 0.5, dirDeg: 140 },
    precipitation: { type: 'snow', intensity: 0.7 },
    lightning: { probability: 0, brightness: 0.0, decay: 0.25 }
  },

  'golden-hour': {
    label: '黄昏',
    exposure: 0.95,
    fogDensity: 0.0035,
    sky: {
      topColor: colorFromHsl(0.07, 0.35, 0.65),
      horizonColor: colorFromHsl(0.05, 0.45, 0.75),
      bottomColor: colorFromHsl(0.03, 0.55, 0.85),
      mie: 0.06, rayleigh: 1.6
    },
    sun: { elevDeg: 8, azimDeg: 250, diskSize: 0.055, glow: 1.6 },
    clouds: { density: 0.45, coverage: 0.5, speed: 0.07, scale: 1.7, detail: 1.0, aniso: 0.35, color: new THREE.Color(1.0,0.95,0.9) },
    wind: { speed: 0.6, dirDeg: 220 },
    precipitation: { type: 'none', intensity: 0 },
    lightning: { probability: 0, brightness: 0.0, decay: 0.25 }
  },

  'night-clear': {
    label: '夜晚（晴）',
    exposure: 0.85,
    fogDensity: 0.0038,
    sky: {
      topColor: new THREE.Color(0.06,0.08,0.14),
      horizonColor: new THREE.Color(0.10,0.12,0.18),
      bottomColor: new THREE.Color(0.12,0.14,0.20),
      mie: 0.02, rayleigh: 0.8
    },
    sun: { elevDeg: -20, azimDeg: 300, diskSize: 0.0, glow: 0.0 },
    clouds: { density: 0.15, coverage: 0.2, speed: 0.05, scale: 1.9, detail: 0.6, aniso: 0.2, color: new THREE.Color(0.9,0.95,1.0) },
    wind: { speed: 0.4, dirDeg: 320 },
    precipitation: { type: 'none', intensity: 0 },
    lightning: { probability: 0, brightness: 0.0, decay: 0.25 }
  },

  'night-storm': {
    label: '夜雷暴',
    exposure: 0.8,
    fogDensity: 0.0052,
    sky: {
      topColor: new THREE.Color(0.04,0.06,0.10),
      horizonColor: new THREE.Color(0.08,0.10,0.14),
      bottomColor: new THREE.Color(0.10,0.12,0.16),
      mie: 0.07, rayleigh: 0.5
    },
    sun: { elevDeg: -15, azimDeg: 20, diskSize: 0.0, glow: 0.0 },
    clouds: { density: 0.98, coverage: 0.98, speed: 0.12, scale: 1.2, detail: 1.6, aniso: 0.65, color: new THREE.Color(0.85,0.90,0.98) },
    wind: { speed: 1.2, dirDeg: 30 },
    precipitation: { type: 'rain', intensity: 0.9 },
    lightning: { probability: 0.35, brightness: 1.3, decay: 0.22 }
  }
};

// =============== Sky+Cloud 全屏着色器 ===============
const SkyCloudShader = {
  uniforms: {
    uTime: { value: 0 },
    uExposure: { value: 1.0 },
    uFogDensity: { value: 0.0008 }, // 更少的雾

    uTopColor: { value: new THREE.Color(0.1,0.4,0.9) }, // 更蓝
    uHorizonColor: { value: new THREE.Color(0.3,0.7,1.0) }, // 更亮
    uBottomColor: { value: new THREE.Color(0.7,0.85,1.0) }, // 更纯
    uRayleigh: { value: 4.0 }, // 更强的散射
    uMie: { value: 0.008 }, // 更强的米氏散射

    uSunDir: { value: new THREE.Vector3(0,1,0) },
    uSunDiskSize: { value: 0.04 },
    uSunGlow: { value: 2.0 }, // 更强的光晕

    uCloudDensity: { value: 0.3 },
    uCloudCoverage: { value: 0.4 },
    uCloudSpeed: { value: 0.08 },
    uCloudScale: { value: 1.5 },
    uCloudDetail: { value: 1.0 },
    uCloudAniso: { value: 0.3 },
    uCloudColor: { value: new THREE.Color(1,1,1) },
    uWindDir: { value: new THREE.Vector2(1,0) },

    uLightning: { value: 0.0 },
uRimLight: { value: 1.5 },  // 降低默认银边强度
uCloudSharpness: { value: 1.8 }  // 降低默认锐利度
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;

    varying vec2 vUv;

    uniform float uTime, uExposure, uFogDensity;
    uniform vec3 uTopColor, uHorizonColor, uBottomColor;
    uniform float uRayleigh, uMie;

    uniform vec3 uSunDir;
    uniform float uSunDiskSize, uSunGlow;

    uniform float uCloudDensity, uCloudCoverage, uCloudSpeed, uCloudScale, uCloudDetail, uCloudAniso;
    uniform vec3  uCloudColor;
    uniform vec2  uWindDir;

    uniform float uLightning;
uniform float uRimLight;
uniform float uCloudSharpness;

    // ====== 2D Hash/Noise/FBM ======
    float hash12(vec2 p){
      vec3 p3 = fract(vec3(p.xyx) * .1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    float noise(vec2 p){
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash12(i + vec2(0.0,0.0));
      float b = hash12(i + vec2(1.0,0.0));
      float c = hash12(i + vec2(0.0,1.0));
      float d = hash12(i + vec2(1.0,1.0));
      vec2 u = f*f*(3.0-2.0*f);
      return mix(a, b, u.x) + (c - a)*u.y*(1.0 - u.x) + (d - b)*u.x*u.y;
    }

    float fbm(vec2 p){
      float v = 0.0;
      float a = 0.55;
      v += noise(p); p *= 2.02;
      v += noise(p)*a; a *= 0.55; p *= 2.02;
      v += noise(p)*a; a *= 0.55; p *= 2.02;
      v += noise(p)*a;
      return v / (1.0 + 0.55 + 0.55*0.55 + 0.55*0.55*0.55);
    }

    // 梯度计算 - 用于法线近似
    vec2 gradient(vec2 p) {
      float eps = 0.01;
      float dx = fbm(p + vec2(eps, 0.0)) - fbm(p - vec2(eps, 0.0));
      float dy = fbm(p + vec2(0.0, eps)) - fbm(p - vec2(0.0, eps));
      return vec2(dx, dy) / (2.0 * eps);
    }

    // Henyey-Greenstein 相函数
    float phaseHG(float cosTheta, float g) {
      float g2 = g * g;
      return (1.0 - g2) / pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5);
    }

    // 屏幕到天空方向映射 - 长焦镜头效果
    vec3 screenDir(vec2 uv){
      vec2 ndc = (uv * 2.0 - 1.0);
      float y = clamp(ndc.y, -1.0, 1.0);
      // 长焦镜头效果：减少拉伸，增加压缩感
      float k = mix(0.1, 0.3, (y+1.0)*0.5); // 大幅减少x轴拉伸
      vec3 dir = normalize(vec3(ndc.x*k, y, 2.5)); // 增加z距离，模拟长焦
      return dir;
    }

    // 物理天空颜色
    vec3 skyColor(vec3 rd){
      float mu = max(dot(normalize(rd), normalize(uSunDir)), 0.0);
      float elevation = max(rd.y, 0.0);
      
      // 改进的瑞利散射
      float rayleigh = pow(elevation, 0.4) * uRayleigh;
      
      // 改进的米氏散射
      float mie = pow(mu, 8.0) * uMie * 50.0;
      
      // 天空颜色渐变 - 长焦镜头效果
      vec3 skyGradient = mix(uBottomColor, uHorizonColor, pow(elevation, 0.7)); // 减少渐变
      skyGradient = mix(skyGradient, uTopColor, pow(elevation, 2.0)); // 增加顶部过渡
      
      // 添加太阳光晕
      vec3 sunGlow = mie * vec3(1.0, 0.95, 0.85);
      
      // 组合效果
      vec3 finalColor = skyGradient + sunGlow;
      
      return finalColor;
    }

    // 太阳盘
    float sunDisk(vec3 rd){
      vec3 sd = normalize(uSunDir);
      float mu = dot(rd, sd);
      float disk = smoothstep(cos(uSunDiskSize*1.2), cos(uSunDiskSize), mu);
      return disk;
    }

    void main(){
      vec3 rd = screenDir(vUv);

      // 基础天空
      vec3 col = skyColor(rd);

      // 太阳盘与光晕（在云层之后计算）
      float disk = sunDisk(rd);
      float glow = pow(max(dot(normalize(rd), normalize(uSunDir)), 0.0), 8.0);
      
      // 太阳基础强度
      vec3 sunBase = disk * uSunGlow * vec3(1.0,0.95,0.88);
      vec3 glowBase = glow * 0.25 * vec3(1.0,0.9,0.8);
      
      // 暂时保存太阳，等云层处理后再应用

      // 云层 - iOS风格的体积感
      vec2 wind = normalize(uWindDir);
      float t = uTime * uCloudSpeed;
      
      // 多层云朵创造体积感 - 长焦镜头效果
      vec2 p1 = (vUv*1.2 - 0.3) * (1.2 * uCloudScale); // 减少缩放
      vec2 p2 = (vUv*1.5 + 0.1) * (1.8 * uCloudScale); // 减少缩放
      vec2 p3 = (vUv*1.8 - 0.2) * (1.5 * uCloudScale); // 减少缩放

      p1 += wind * t * 0.4; // 减慢移动
      p2 += wind * t * 0.8;
      p3 += wind * t * 0.6;

      float n1 = fbm(p1 * (0.8 + uCloudAniso * 0.2)); // 减少细节
      float n2 = fbm(p2 * (1.1 + uCloudDetail * 0.4));
      float n3 = fbm(p3 * (0.6 + uCloudDetail * 0.3));

      // === NEW: 两层云，近远分治 ===
      float densityRaw = n1*0.4 + n2*0.35 + n3*0.25;
      float thresh = 0.52 - (uCloudCoverage-0.5)*0.12;

      // 层 1（近）
      float nearD = fbm(p2 * (1.1 + uCloudDetail*0.45));
      float nearThick = clamp((nearD - (thresh-0.04)) / (1.0 - (thresh-0.04)), 0.0, 1.0);

      // 层 2（远）
      float farD  = fbm(p1 * (0.85 + uCloudDetail*0.25));
      float farThick = clamp((farD - (thresh+0.02)) / (1.0 - (thresh+0.02)), 0.0, 1.0);

      // === NEW: HG 相函数（前向散射银边更自然）===
      vec2 eps = vec2(1e-3, 0.0);
      float dxf = fbm(p2 + vec2(eps.x,0.0)) - fbm(p2 - vec2(eps.x,0.0));
      float dyf = fbm(p2 + vec2(0.0,eps.x)) - fbm(p2 - vec2(0.0,eps.x));
      vec3 n = normalize(vec3(dxf, 0.6, dyf));
      
      float cosTheta = clamp(dot(n, normalize(-uSunDir)), 0.0, 1.0);
      float hg(float c, float g){ 
        float g2 = g*g; 
        return (1.0 - g2) / pow(1.0 + g2 - 2.0*g*c, 1.5); 
      }
      float forward = hg(cosTheta, clamp(uCloudAniso, 0.1, 0.75));

      // 自阴影（基于近层厚度）
      float selfOcc = mix(1.0, 0.72, nearThick);

      // 漫反射 + 前向散射高光（银边）
      vec3  baseCol = uCloudColor * (0.82 + 0.18*cosTheta);
      float rimBoost = smoothstep(0.0, 0.25, 1.0 - cosTheta);

      // 近层受光更强、混合更"实"
      vec3 nearLit = (baseCol * 0.95 + rimBoost * forward * 0.70) * selfOcc;
      vec3 farLit  = (baseCol * 0.85 + rimBoost * forward * 0.35) * mix(1.0, selfOcc, 0.7);

      float aNear = smoothstep(0.0, 1.0, nearThick);
      float aFar  = smoothstep(0.0, 1.0, farThick) * 0.65;

      // 混合远层和近层
      col = mix(col, farLit,  aFar);
      col = mix(col, nearLit, aNear);

      // 厚度用于太阳遮挡和雾效保护
      float thickness = mix(farThick, nearThick, aNear / (aNear + aFar + 0.001));

      // NEW: 云对太阳的遮挡（thickness 越厚越暗）
      float trans = exp(-3.0 * thickness); // k=3~6 视口味
      vec3 sunCol = sunBase + glowBase * 0.6;
      col += sunCol * trans;   // 而不是无脑相加

      // NEW: 雾要"随高度/视程"，不要按 vUv 做屏幕蒙版
      float camH = 0.0;                      // 相机高度（屏幕演示可先当 0）
      float rayH = max(rd.y, 0.001);         // 向上的射线更少穿雾
      float heightFog = exp(-uFogDensity * (rayH*80.0 + max(0.0, camH) * 0.5));
      float distFog   = exp(-uFogDensity * 60.0 * (1.0 - rayH)); // 朝地平线雾更重
      float fogF = clamp( min(heightFog, distFog), 0.0, 1.0 );

      // 云体保护：厚处少吃雾，但不是直接 1
      float fogProtect = mix(1.0, 0.6, thickness);
      vec3  fogColor   = mix(vec3(0.86,0.89,0.95), col, 0.2); // 冷一点的高空雾基色
      col = mix(fogColor, col, fogF * fogProtect);

      // 闪电
      if(uLightning > 0.001){
        col += uLightning * vec3(1.0, 0.97, 0.9);
      }

      // Tone: 让渲染器的 ACES 接管对比，不在 shader 里再重 Gamma
      col *= uExposure;           // 保留曝光
      // col = pow(col, vec3(0.6));  // ← 删除这句
      
      // 确保颜色在有效范围内
      col = clamp(col, 0.0, 1.0);
      
      gl_FragColor = vec4(col, 1.0);
    }
  `
};

// =============== 降水系统 ===============
class PrecipitationSystem {
  constructor(type, intensity, windVec){
    this.type = type;
    this.intensity = intensity;
    this.wind = windVec.clone();
    this.group = new THREE.Group();
    this.bounds = new THREE.Vector2(1,1);
    this._init();
  }

  _init(){
    if(this.type==='none' || this.intensity<=0){ return; }

    const countBase = (this.type==='rain') ? 5000 : 4000;
    const count = Math.floor(countBase * clamp(this.intensity, 0.05, 1));

    if (this.type === 'rain') {
      this._createRainDrops(count);
    } else if (this.type === 'snow') {
      this._createSnowFlakes(count);
    }
  }

  _createRainDrops(count) {
    // iOS风格的雨滴 - 使用线条创造轨迹感
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 6); // 每个雨滴2个点
    const velocities = new Float32Array(count * 3);
    const lengths = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 8;
      const y = Math.random() * 6 - 3;
      const z = (Math.random() - 0.5) * 8;
      
      const length = 0.3 + Math.random() * 0.4; // iOS风格的短雨滴

      // 雨滴的起点和终点
      positions[i * 6] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = z;
      
      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = y - length;
      positions[i * 6 + 5] = z;

      velocities[i * 3] = this.wind.x * 0.3 + (Math.random() - 0.5) * 0.2;
      velocities[i * 3 + 1] = -6 - Math.random() * 3; // iOS风格的中等速度
      velocities[i * 3 + 2] = this.wind.y * 0.3 + (Math.random() - 0.5) * 0.2;
      
      lengths[i] = length;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('length', new THREE.BufferAttribute(lengths, 1));

    const material = new THREE.LineBasicMaterial({
      color: 0x4FC3F7, // iOS风格的浅蓝色
      transparent: true,
      opacity: 0.6,
      blending: THREE.NormalBlending,
      depthWrite: false,
      linewidth: 1
    });

    this.rainLines = new THREE.LineSegments(geometry, material);
    this.group.add(this.rainLines);
  }

  _createSnowFlakes(count) {
    // iOS风格的雪花 - 使用小而精致的雪花
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = Math.random() * 8 - 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

      velocities[i * 3] = this.wind.x * 0.2 + (Math.random() - 0.5) * 0.1;
      velocities[i * 3 + 1] = -1 - Math.random() * 0.8; // iOS风格的缓慢飘落
      velocities[i * 3 + 2] = this.wind.y * 0.2 + (Math.random() - 0.5) * 0.1;
      
      sizes[i] = 0.1 + Math.random() * 0.15; // iOS风格的小雪花
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      color: 0xFFFFFF, // 纯白色雪花
      size: 0.15,
      transparent: true,
      opacity: 0.8,
      blending: THREE.NormalBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.snowPoints = new THREE.Points(geometry, material);
    this.group.add(this.snowPoints);
  }

  update(dt){
    if (this.rainLines) {
      this._updateRainDrops(dt);
    }
    if (this.snowPoints) {
      this._updateSnowFlakes(dt);
    }
  }

  _updateRainDrops(dt) {
    const positions = this.rainLines.geometry.attributes.position.array;
    const velocities = this.rainLines.geometry.attributes.velocity.array;
    const lengths = this.rainLines.geometry.attributes.length.array;

    for (let i = 0; i < positions.length; i += 6) {
      const rainIndex = Math.floor(i / 6);
      const vx = velocities[rainIndex * 3];
      const vy = velocities[rainIndex * 3 + 1];
      const vz = velocities[rainIndex * 3 + 2];
      const length = lengths[rainIndex];

      // 移动雨滴的两个端点
      positions[i] += vx * dt;
      positions[i + 1] += vy * dt;
      positions[i + 2] += vz * dt;
      
      positions[i + 3] += vx * dt;
      positions[i + 4] += vy * dt;
      positions[i + 5] += vz * dt;

      // 重置超出范围的雨滴
      if (positions[i + 1] < -4) {
        const x = (Math.random() - 0.5) * 8;
        const z = (Math.random() - 0.5) * 8;
        const y = 4;
        
        positions[i] = x;
        positions[i + 1] = y;
        positions[i + 2] = z;
        
        positions[i + 3] = x;
        positions[i + 4] = y - length;
        positions[i + 5] = z;
      }
    }

    this.rainLines.geometry.attributes.position.needsUpdate = true;
  }

  _updateSnowFlakes(dt) {
    const positions = this.snowPoints.geometry.attributes.position.array;
    const velocities = this.snowPoints.geometry.attributes.velocity.array;

    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += velocities[i] * dt;
      positions[i + 1] += velocities[i + 1] * dt;
      positions[i + 2] += velocities[i + 2] * dt;

      // 重置超出范围的雪花
      if (positions[i + 1] < -4) {
        positions[i] = (Math.random() - 0.5) * 10;
        positions[i + 1] = 4;
        positions[i + 2] = (Math.random() - 0.5) * 10;
      }
    }

    this.snowPoints.geometry.attributes.position.needsUpdate = true;
  }

  dispose(){
    if (this.rainLines) {
      this.rainLines.geometry.dispose();
      this.rainLines.material.dispose();
      this.rainLines = null;
    }
    if (this.snowPoints) {
      this.snowPoints.geometry.dispose();
      this.snowPoints.material.dispose();
      this.snowPoints = null;
    }
    this.group.clear();
  }
}

// =============== 闪电控制 ===============
class LightningController {
  constructor(){
    this.energy = 0;
    this.decay = 0.2;
    this.perSec = 0;
    this.brightness = 1.0;
    this._t = 0;
  }
  configure(probability, brightness, decay){
    this.perSec = probability || 0;
    this.brightness = brightness || 1.0;
    this.decay = decay || 0.2;
  }
  update(dt){
    if(this.perSec > 0){
      const p = 1.0 - Math.pow(1.0 - this.perSec, dt);
      if(Math.random() < p){
        this.energy = Math.max(this.energy, this.brightness);
      }
    }
    if(this.energy > 0){
      const k = Math.pow(0.1, dt / this.decay);
      this.energy *= k;
      if(this.energy < 0.01) this.energy = 0;
    }
    return this.energy;
  }
}

// =============== 主渲染器 ===============
class AdvancedWeatherRenderer {
  constructor(){
    this.container = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.screenMesh = null;

    this.precip = null;
    this.lightning = new LightningController();

    this._caps = null;
    this._clock = new THREE.Clock();
    this._raf = 0;

    this._currentKey = 'clear-day';
  }

  async init(container, caps){
    this.container = container;
    this._caps = caps || { dpr: Math.min(window.devicePixelRatio||1, 2) };

    // Renderer - 使用ACESFilmic色调映射增加对比度
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(this._caps.dpr || 1);
    this.renderer.setSize(container.clientWidth, container.clientHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    // Scene + Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // 全屏 Shader Quad
    const quadGeo = new THREE.PlaneGeometry(2,2);
    const quadMat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(SkyCloudShader.uniforms),
      vertexShader: SkyCloudShader.vertexShader,
      fragmentShader: SkyCloudShader.fragmentShader
    });
    this.screenMesh = new THREE.Mesh(quadGeo, quadMat);
    this.scene.add(this.screenMesh);

    // 初始模版
    const h = new Date().getHours();
    const key = (h >= 18 || h < 6) ? 'night-clear' : 'clear-day';
    this.applyTemplate(key);

    // 监听尺寸
    const onResize = () => this.resize(window.innerWidth, window.innerHeight);
    this._onResize = onResize;
    window.addEventListener('resize', onResize);

    // 启动主循环
    this._clock.start();
    const loop = () => {
      this._raf = requestAnimationFrame(loop);
      this._frame();
    };
    loop();

    return this;
  }

  // 应用天气模板
  applyTemplate(key){
    if(!WEATHER_TEMPLATES[key]) key = 'clear-day';
    this._currentKey = key;
    const t = WEATHER_TEMPLATES[key];

    // 曝光/雾
    this.renderer.toneMappingExposure = t.exposure;
    this.screenMesh.material.uniforms.uExposure.value = t.exposure;
    this.screenMesh.material.uniforms.uFogDensity.value = t.fogDensity;

    // 天空
    this.screenMesh.material.uniforms.uTopColor.value.copy(t.sky.topColor);
    this.screenMesh.material.uniforms.uHorizonColor.value.copy(t.sky.horizonColor);
    this.screenMesh.material.uniforms.uBottomColor.value.copy(t.sky.bottomColor);
    this.screenMesh.material.uniforms.uRayleigh.value = t.sky.rayleigh;
    this.screenMesh.material.uniforms.uMie.value = t.sky.mie;

    // 太阳方向
    const elev = t.sun.elevDeg * DEG2RAD;
    const azim = t.sun.azimDeg * DEG2RAD;
    const sunDir = new THREE.Vector3(
      Math.sin(azim) * Math.cos(elev),
      Math.sin(elev),
      Math.cos(azim) * Math.cos(elev)
    );
    this.screenMesh.material.uniforms.uSunDir.value.copy(sunDir);
    this.screenMesh.material.uniforms.uSunDiskSize.value = t.sun.diskSize;
    this.screenMesh.material.uniforms.uSunGlow.value = t.sun.glow;

    // 云
    this.screenMesh.material.uniforms.uCloudDensity.value = t.clouds.density;
    this.screenMesh.material.uniforms.uCloudCoverage.value = t.clouds.coverage;
    this.screenMesh.material.uniforms.uCloudSpeed.value = t.clouds.speed;
    this.screenMesh.material.uniforms.uCloudScale.value = t.clouds.scale;
    this.screenMesh.material.uniforms.uCloudDetail.value = t.clouds.detail;
    this.screenMesh.material.uniforms.uCloudAniso.value = t.clouds.aniso;
    this.screenMesh.material.uniforms.uCloudColor.value.copy(t.clouds.color);

    // 风向
    const wind = vecFromDeg(t.wind.dirDeg);
    wind.multiplyScalar(clamp(t.wind.speed, 0, 2.0));
    this.screenMesh.material.uniforms.uWindDir.value.set(wind.x, wind.y);

    // 闪电
    this.lightning.configure(t.lightning.probability, t.lightning.brightness, t.lightning.decay);

    // 降水
    if(this.precip){ this.scene.remove(this.precip.group); this.precip.dispose(); this.precip = null; }
    if(t.precipitation.type !== 'none' && t.precipitation.intensity > 0){
      this.precip = new PrecipitationSystem(t.precipitation.type, t.precipitation.intensity, wind);
      this.scene.add(this.precip.group);
    }
  }

  // 手动参数更新接口
  updateParams(params){
    const uniforms = this.screenMesh.material.uniforms;
    
    if (params.sunAltitude !== undefined || params.sunAzimuth !== undefined) {
      const elev = (params.sunAltitude || 45) * DEG2RAD;
      const azim = (params.sunAzimuth || 180) * DEG2RAD;
      const sunDir = new THREE.Vector3(
        Math.sin(azim) * Math.cos(elev),
        Math.sin(elev),
        Math.cos(azim) * Math.cos(elev)
      );
      uniforms.uSunDir.value.copy(sunDir);
    }
    
    if (params.cloudOpacity !== undefined) {
      uniforms.uCloudDensity.value = params.cloudOpacity;
    }
    
    if (params.cloudSpeed !== undefined) {
      uniforms.uCloudSpeed.value = params.cloudSpeed;
    }
    
    if (params.fogDensity !== undefined) {
      uniforms.uFogDensity.value = params.fogDensity;
    }
    
    if (params.exposure !== undefined) {
      this.renderer.toneMappingExposure = params.exposure;
      uniforms.uExposure.value = params.exposure;
    }
    
    if (params.rimLight !== undefined) {
      // 边缘光照通过修改shader中的rim值来实现
      // 这里我们通过uniform传递给shader
      if (!uniforms.uRimLight) {
        uniforms.uRimLight = { value: params.rimLight };
      } else {
        uniforms.uRimLight.value = params.rimLight;
      }
    }
    
    if (params.cloudSharpness !== undefined) {
      // 云层锐利度通过修改shader中的sharpness值来实现
      // 这里我们通过uniform传递给shader
      if (!uniforms.uCloudSharpness) {
        uniforms.uCloudSharpness = { value: params.cloudSharpness };
      } else {
        uniforms.uCloudSharpness.value = params.cloudSharpness;
      }
    }
    
    if (params.cameraFov !== undefined) {
      // 注意：这个渲染器使用正交相机，FOV参数不适用
      console.log('Note: This renderer uses orthographic camera, FOV parameter not applicable');
    }
    
    if (params.cameraDistance !== undefined) {
      // 注意：这个渲染器使用固定正交相机，距离参数不适用
      console.log('Note: This renderer uses fixed orthographic camera, distance parameter not applicable');
    }
  }

  _frame(){
    const dt = this._clock.getDelta();
    const t = this.screenMesh.material.uniforms;

    // 时间推进
    t.uTime.value += dt;

    // 闪电脉冲
    const e = this.lightning.update(dt);
    t.uLightning.value = Math.max(t.uLightning.value*0.96, e);

    // 降水推进
    if(this.precip) this.precip.update(dt);

    // 绘制
    this.renderer.render(this.scene, this.camera);
  }

  resize(w, h){
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(this._caps?.dpr || Math.min(window.devicePixelRatio||1, 3));
  }

  destroy(){
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize);
    if(this.precip){ this.precip.dispose(); }
    if(this.screenMesh){
      this.screenMesh.geometry.dispose();
      this.screenMesh.material.dispose();
    }
    this.renderer.dispose();
    if(this.renderer.domElement && this.renderer.domElement.parentNode){
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

// 导出到全局作用域，使HTML中的脚本可以访问
if (typeof window !== 'undefined') {
  window.AdvancedWeatherRenderer = AdvancedWeatherRenderer;
  window.WEATHER_TEMPLATES = WEATHER_TEMPLATES;
}