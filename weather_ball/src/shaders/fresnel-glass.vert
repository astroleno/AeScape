// Fresnel 玻璃球顶点着色器
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