// 体积云层顶点着色器
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