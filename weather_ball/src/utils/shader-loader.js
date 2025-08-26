/**
 * 着色器加载工具
 */
import * as THREE from 'three';

// 简化的菲涅尔玻璃着色器（匹配参考图效果）
export const trueFresnelVertexShader = `
varying vec3 vWorldNormal;
varying vec3 vViewDirection;

void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const trueFresnelFragmentShader = `
uniform samplerCube envMap;

varying vec3 vWorldNormal;
varying vec3 vViewDirection;

void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(vViewDirection);
    
    // 菲涅尔系数 - 边缘更强
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 2.5);
    
    // 反射向量
    vec3 reflectDir = reflect(-viewDir, normal);
    vec3 reflectionColor = textureCube(envMap, reflectDir).rgb;
    
    // 透明基色（让HTML背景透过）
    vec3 baseColor = vec3(0.9, 0.95, 1.0);
    
    // 只在边缘有反射，中心完全透明
    vec3 finalColor = mix(baseColor * 0.1, reflectionColor, fresnel);
    
    // 边缘光晕效果
    float rim = pow(fresnel, 1.5);
    finalColor += rim * vec3(0.8, 0.9, 1.0) * 0.4;
    
    // 透明度：中心极透明，边缘适中
    float alpha = mix(0.02, 0.6, fresnel);
    
    gl_FragColor = vec4(finalColor, alpha);
}
`;

// 顶点着色器代码
export const fresnelGlassVertexShader = `
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vViewDirection;
varying vec2 vUv;

void main() {
    vUv = uv;
    
    // 计算世界空间位置和法线
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
    vWorldNormal = worldNormal;
    
    // 计算视角方向
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// 片元着色器代码
export const fresnelGlassFragmentShader = `
uniform samplerCube envMap;
uniform float fresnelBias;
uniform float fresnelScale;
uniform float fresnelPower;
uniform float opacity;
uniform float refractiveIndex;
uniform vec3 glassColor;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vViewDirection;
varying vec2 vUv;

void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(vViewDirection);
    
    // 计算 Fresnel 反射系数
    float fresnel = fresnelBias + fresnelScale * pow(1.0 - max(dot(viewDir, normal), 0.0), fresnelPower);
    
    // 反射向量
    vec3 reflectDir = reflect(-viewDir, normal);
    vec4 reflectionColor = textureCube(envMap, reflectDir);
    
    // 折射向量
    vec3 refractDir = refract(-viewDir, normal, 1.0 / refractiveIndex);
    vec4 refractionColor = textureCube(envMap, refractDir);
    
    // 增强边缘效果
    float edgeEffect = 1.0 - max(dot(viewDir, normal), 0.0);
    float rim = pow(edgeEffect, 1.8);
    float strongRim = pow(edgeEffect, 4.0);
    
    // 混合反射和折射
    vec3 finalColor = mix(refractionColor.rgb, reflectionColor.rgb, fresnel);
    
    // 添加玻璃本身的颜色
    finalColor = mix(finalColor, glassColor, 0.08);
    
    // 多层边缘高光效果
    finalColor += rim * 0.4;                    // 基础边缘光
    finalColor += strongRim * vec3(1.0, 1.0, 1.0) * 0.6; // 强烈边缘高光
    finalColor += strongRim * vec3(0.8, 0.9, 1.0) * 0.3; // 蓝色边缘光晕
    
    // 彩虹色散效果（参考图中的彩色边缘）
    float disperseR = pow(edgeEffect, 3.0);
    float disperseG = pow(edgeEffect, 3.5);
    float disperseB = pow(edgeEffect, 4.0);
    vec3 dispersion = vec3(disperseR, disperseG, disperseB) * 0.2;
    finalColor += dispersion;
    
    // 最终透明度结合 Fresnel 和边缘效应
    float finalOpacity = opacity + fresnel * 0.6 + rim * 0.3;
    
    gl_FragColor = vec4(finalColor, finalOpacity);
}
`;

// 体积云层着色器代码
export const volumeCloudVertexShader = `
varying vec3 vWorldPosition;
varying vec3 vObjectPosition;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    // 世界空间位置
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    // 对象空间位置（用于噪声计算）
    vObjectPosition = position;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const volumeCloudFragmentShader = `
uniform float time;
uniform vec3 cloudColor;
uniform vec3 weatherColor;
uniform float cloudDensity;
uniform float swirl;
uniform float weather;

varying vec3 vWorldPosition;
varying vec3 vObjectPosition;
varying vec3 vNormal;
varying vec2 vUv;

// 3D Perlin噪声函数
vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 4; i++) {
        value += amplitude * snoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    
    return value;
}

vec3 swirlTransform(vec3 pos, float swirlAmount, float timeOffset) {
    float radius = length(pos.xz);
    float angle = atan(pos.z, pos.x);
    
    float swirlAngle = swirlAmount * radius + timeOffset;
    angle += swirlAngle;
    
    return vec3(
        radius * cos(angle),
        pos.y + sin(radius * 3.0 + timeOffset) * 0.1,
        radius * sin(angle)
    );
}

void main() {
    vec3 pos = vObjectPosition;
    float animTime = time * 0.3;
    
    vec3 swirlPos = swirlTransform(pos * 2.0, swirl * 2.0, animTime);
    
    float cloudNoise = 0.0;
    cloudNoise += fbm(swirlPos * 1.5 + vec3(animTime * 0.5, 0.0, 0.0)) * 0.6;
    cloudNoise += fbm(swirlPos * 3.0 + vec3(0.0, animTime * 0.3, animTime * 0.2)) * 0.3;
    cloudNoise += fbm(swirlPos * 8.0 + vec3(animTime * 0.8, 0.0, animTime * 0.4)) * 0.1;
    
    cloudNoise = (cloudNoise + 1.0) * 0.5;
    
    float cloud = smoothstep(1.0 - cloudDensity, 1.0, cloudNoise);
    
    // 极严格的球形约束，确保云层绝不飞出球体
    float radius = length(vObjectPosition);
    float sphereFade = 1.0 - smoothstep(0.4, 0.7, radius); // 更严格的边界
    cloud *= sphereFade;
    
    // 硬边界：超出0.7半径直接截断
    if (radius > 0.7) {
        cloud = 0.0;
    }
    
    float heightFade = smoothstep(-0.8, 0.5, vObjectPosition.y);
    cloud *= heightFade;
    
    cloud *= weather;
    
    vec3 baseCloudColor = mix(cloudColor, weatherColor, weather * 0.7);
    
    float scatter = pow(cloud, 0.8) * 0.3;
    baseCloudColor += scatter;
    
    float swirlColorVariation = sin(length(swirlPos.xz) * 4.0 + animTime) * 0.1 + 0.1;
    baseCloudColor *= (1.0 + swirlColorVariation);
    
    gl_FragColor = vec4(baseCloudColor, cloud * 0.8);
}
`;

/**
 * 创建体积云层材质
 */
export function createVolumeCloudMaterial(options = {}) {
    const defaults = {
        cloudColor: new THREE.Color(0x87CEEB),   // 天蓝色
        weatherColor: new THREE.Color(0x708090), // 灰色
        cloudDensity: 0.5,
        swirl: 1.0,
        weather: 0.8
    };
    
    const params = { ...defaults, ...options };
    
    return new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0.0 },
            cloudColor: { value: params.cloudColor },
            weatherColor: { value: params.weatherColor },
            cloudDensity: { value: params.cloudDensity },
            swirl: { value: params.swirl },
            weather: { value: params.weather }
        },
        vertexShader: volumeCloudVertexShader,
        fragmentShader: volumeCloudFragmentShader,
        transparent: true,
        side: THREE.DoubleSide, // 改为双面渲染
        depthWrite: false
    });
}

/**
 * 创建真正的菲涅尔玻璃材质（匹配参考图）
 */
export function createTrueFresnelGlassMaterial(envMap, options = {}) {
    const defaults = {
        glassStrength: 1.0,
        refractionStrength: 1.0,
        glassColor: new THREE.Color(0xffffff)
    };
    
    const params = { ...defaults, ...options };
    
    return new THREE.ShaderMaterial({
        uniforms: {
            envMap: { value: envMap },
            glassStrength: { value: params.glassStrength },
            refractionStrength: { value: params.refractionStrength },
            glassColor: { value: params.glassColor }
        },
        vertexShader: trueFresnelVertexShader,
        fragmentShader: trueFresnelFragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
    });
}

/**
 * 创建 Fresnel 玻璃材质（旧版本）
 */
export function createFresnelGlassMaterial(envMap, options = {}) {
    const defaults = {
        fresnelBias: 0.1,
        fresnelScale: 1.0,
        fresnelPower: 2.0,
        opacity: 0.15,
        refractiveIndex: 1.52,
        glassColor: new THREE.Color(0xffffff)
    };
    
    const params = { ...defaults, ...options };
    
    return new THREE.ShaderMaterial({
        uniforms: {
            envMap: { value: envMap },
            fresnelBias: { value: params.fresnelBias },
            fresnelScale: { value: params.fresnelScale },
            fresnelPower: { value: params.fresnelPower },
            opacity: { value: params.opacity },
            refractiveIndex: { value: params.refractiveIndex },
            glassColor: { value: params.glassColor }
        },
        vertexShader: fresnelGlassVertexShader,
        fragmentShader: fresnelGlassFragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    });
}