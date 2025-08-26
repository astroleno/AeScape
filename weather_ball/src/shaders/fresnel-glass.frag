// Fresnel 玻璃球片元着色器
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
    
    // 边缘增强效果
    float edgeEffect = 1.0 - max(dot(viewDir, normal), 0.0);
    float rim = pow(edgeEffect, 2.0);
    
    // 混合反射和折射
    vec3 finalColor = mix(refractionColor.rgb, reflectionColor.rgb, fresnel);
    
    // 添加玻璃本身的颜色
    finalColor = mix(finalColor, glassColor, 0.1);
    
    // 边缘高光
    finalColor += rim * 0.3;
    
    // 最终透明度结合 Fresnel 和边缘效应
    float finalOpacity = opacity + fresnel * 0.5 + rim * 0.2;
    
    gl_FragColor = vec4(finalColor, finalOpacity);
}