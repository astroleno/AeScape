import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { PMREMGenerator } from 'three';

// 1) 建天空
const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

// 天空参数（可按天气/时间动态改）
const uniforms = sky.material.uniforms;
uniforms.turbidity.value = 2.0;     // 大气浑浊
uniforms.rayleigh.value  = 1.5;     // 瑞利散射
uniforms.mieCoefficient.value = 0.004;
uniforms.mieDirectionalG.value = 0.7;

// 太阳参数（方向通过经纬度+时间计算）
const sun = new THREE.Vector3();
function setSun(elevationDeg, azimuthDeg) {
  const phi = THREE.MathUtils.degToRad(90 - elevationDeg);
  const theta = THREE.MathUtils.degToRad(azimuthDeg);
  sun.setFromSphericalCoords(1, phi, theta);
  uniforms.sunPosition.value.copy(sun);
}

const pmremGen = new PMREMGenerator(renderer);
pmremGen.compileEquirectangularShader();

// 2) 从“场景”烘 PMREM 作为 environment
function bakeEnvFromSky() {
  // 仅 sky 在 scene 中时烘一次
  const envTex = pmremGen.fromScene(sky, 0.5).texture;
  scene.environment = envTex;
  // sky 仍可留作背景；若需要纯色背景，可 scene.background = null;
}

// 初始化
setSun(20, 130);
bakeEnvFromSky();

// 如果太阳位置/天气改变，只需小频率地重新 bake（例如 30~60s 一次）
