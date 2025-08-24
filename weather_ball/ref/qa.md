好的，锁定在「方案 A（Sky → PMREM → scene.environment）」但反射一直不对，通常是下面这些坑。按命中率从高到低给你一套**快查清单** + **修复办法**：

---

## 1) `scene.environment` 没真正生效

**症状**：背景能看到天空，但金属/玻璃没反射或很淡。
**排查**

* 控制台打印：`console.log(!!scene.environment, scene.environment?.isTexture)` 应为 `true true`。
* 你的模型材质是否用 `MeshStandardMaterial / MeshPhysicalMaterial`？（`Basic/Lambert/Phong`都不吃 IBL）
* 材质是否设置了：`material.envMapIntensity > 0`（建议 0.6–1.5 先试）

**修复**

```js
scene.environment = pmremGen.fromScene(sky, 0.2).texture;
scene.background = null; // 背景可以保留 sky，但不影响反射
renderer.toneMappingExposure = 1.0; // 过低会“洗掉”反射
traversePBR(scene, (m)=> m.envMapIntensity = 1.0);
```

---

## 2) “烘焙错了”：PMREM 时场景里混入了别的物体

**症状**：反射里出现奇怪物体/颜色，或整体亮度异常。
**原因**：`PMREMGenerator.fromScene(sky)` 时，除了 sky 还有别的 mesh 可见。
**修复（两选一）**

* **临时隐藏**其它物体：

  ```js
  const hides = [];
  scene.traverse(o => { if(o !== sky && o.visible){ o.visible=false; hides.push(o);} });
  const env = pmremGen.fromScene(sky, 0.2).texture;
  hides.forEach(o=>o.visible=true);
  scene.environment = env;
  ```
* **单独建一个只含 Sky 的临时场景**来烘焙（最稳）。

---

## 3) 太阳位置更新了，但**没有重烘 PMREM**

**症状**：你改了 `sunPosition`，视觉天空变了，但反射高光不动。
**修复**：改完太阳或 Sky 的任何参数后，**重新 bake**：

```js
uniforms.sunPosition.value.copy(sun);
const env = pmremGen.fromScene(sky, 0.2).texture;
scene.environment = env;
```

> 注意节流：每 30–60s 一次，或只有关键变化时烘焙。

---

## 4) `sigma`（模糊量）太大导致“没反射”

**症状**：反射糊成一片，没有高光细节。
**修复**：`fromScene(sky, sigma)` 的 `sigma` 取 0.0–0.5；先试 `0.1~0.3`，不要 1.0 以上。

---

## 5) 材质或光能参数让反射“被吃掉”

**常见点**

* `roughness` 太高（>0.8）反射会被糊没；先试 `roughness=0.2~0.4` 看对比。
* `metalness` 太低（<0.2）金属感不明显；先试 `metalness=0.8`。
* `clearcoat` / `ior` / `attenuationColor` 等物理参数设置不当会淡化反射。

**一次性排查**

```js
traversePBR(scene, (m) => {
  m.roughness = Math.min(m.roughness ?? 0.4, 0.6);
  m.metalness = Math.max(m.metalness ?? 0.0, 0.6);
  m.envMapIntensity = Math.max(m.envMapIntensity ?? 1.0, 1.0);
});
```

---

## 6) 渲染器色彩/物理开关不当

**症状**：整体灰、发白或反射显得“死”。
**修复（按 Three r150+ 习惯值）**

```js
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.physicallyCorrectLights = true; // 物理一致性更好
// renderer.useLegacyLights = false; // 新版本默认已 false
```

---

## 7) Sky 体量/朝向问题

**症状**：天空像在模型“里面”，反射方向怪。
**要点**

* `sky.scale.setScalar(10000)`（足够大）；默认 Sky 是朝内渲染的（BackSide），一般无需改。
* 太阳方位计算别反了：

  ```js
  // elevation: 地平线上方角度，azimuth: 从北顺时针角度（按你定义）
  const phi = THREE.MathUtils.degToRad(90 - elevation);
  const theta = THREE.MathUtils.degToRad(azimuth);
  sun.setFromSphericalCoords(1, phi, theta);
  uniforms.sunPosition.value.copy(sun);
  ```
* 如果你把 `scene.background = sky` 期待它影响反射：**不行**，反射只看 `scene.environment`。

---

## 8) 你用的材质不是 PBR

**症状**：怎么调都没反射。
**修复**：确认模型材质是 `MeshStandardMaterial` 或 `MeshPhysicalMaterial`；避免 `MeshBasic/Lambert/Phong/Matcap`。

---

## 9) 资源或对象被过早 `dispose()`

**症状**：初次有反射，后来莫名没了或变黑。
**修复**：不要在把 `envTex` 赋给 `scene.environment` 后立刻 `dispose()` 它；正确做法是：

```js
const rt = pmremGen.fromScene(sky, 0.2);
scene.environment = rt.texture;
// 仅当你完全不再需要时才 dispose:
// rt.dispose(); // 通常可保留到卸载
// pmremGen 也别急着 dispose，除非整个页面收尾
```

---

## 10) 插件环境特有的限制（Chrome 新标签页）

**症状**：WebGL2/扩展被降级导致 PMREM 质量差。
**建议**

* 在 `manifest.json` 里使用 `offscreen` 或确保新标签页脚本能拿到 WebGL2 上下文。
* DevTools 里 `renderer.capabilities.isWebGL2` 查看是否 WebGL2；不是也能跑，但质量/性能略降。
* `document.visibilityState` 为 `hidden` 时，延迟烘焙，避免首帧黑屏。

---

## 一键自检小用例（最小可复现实验）

把下列测试放到你的场景里，若反射正常，说明是**环境设置**之外的别处出错（如材质/参数/遮挡）：

```js
// 1) 放一颗“标准测试球”
const geo = new THREE.SphereGeometry(0.5, 64, 64);
const mat = new THREE.MeshPhysicalMaterial({
  metalness: 1.0,
  roughness: 0.15,
  envMapIntensity: 1.2,
  clearcoat: 0.0
});
const testBall = new THREE.Mesh(geo, mat);
testBall.position.set(0, 1, 0);
scene.add(testBall);

// 2) 强制一次重新 bake 并打印状态
const env = pmremGen.fromScene(sky, 0.2).texture;
scene.environment = env;
console.log('ENV OK?', !!scene.environment, renderer.outputColorSpace, renderer.toneMapping, renderer.toneMappingExposure);
```

---

### 实操顺序（建议你就按这 6 步走）

1. 确认 **PBR 材质** + `envMapIntensity`。
2. 只保留 Sky（隐藏其它物体）→ **重烘 PMREM**。
3. 恢复其它物体 → 看反射是否正确。
4. 调低 `roughness`、提高 `metalness`，调 `toneMappingExposure`。
5. 改太阳位置 → **再次重烘**，确认高光会移动。
6. 若仍异常，检查 **色彩空间 / dispose / WebGL1 降级**。

需要的话，我可以帮你把这套自检代码嵌进你现有的天气球项目，做一个 `debug/EnvInspector` 开关，方便你一键验证每一步。
