1) 把“阈值描边”改成“相函数 + 伪体积法线”

你现在的“银边/高光”基本由阈值和一个与云无关的 rim 值硬提亮，导致统一描边感。改法：

用 噪声场的梯度近似体积法线 n；

用 Henyey–Greenstein 相函数按角度去出“前向散射银边”；

用 厚度(thickness) 而不是 pow(alpha) 来决定边缘过渡。

在 fragmentShader 里替换“rim / edgeHighlight / pow(alpha)”的那块，加入下面这段（标了 // NEW）：

// === NEW: 密度与梯度 ===
float densityRaw = n1*0.4 + n2*0.35 + n3*0.25;   // 用未锐化前的密度
float thresh = 0.52 - (uCloudCoverage-0.5)*0.12; // 门限随覆盖率微调
float thickness = clamp((densityRaw - thresh) / (1.0 - thresh), 0.0, 1.0);

// 局部梯度近似（屏幕空间+噪声域混合）
vec2 eps = vec2(1e-3, 0.0);
float dxf = fbm(p2 + vec2(eps.x,0.0)) - fbm(p2 - vec2(eps.x,0.0));
float dyf = fbm(p2 + vec2(0.0,eps.x)) - fbm(p2 - vec2(0.0,eps.x));
vec3 n = normalize(vec3(dxf, 0.6, dyf));        // y 轴权重大一点让法线更“立体”

// === NEW: HG 相函数（前向散射银边更自然）===
float cosTheta = clamp(dot(n, normalize(-uSunDir)), 0.0, 1.0);
float hg(float c, float g){ 
  float g2 = g*g; 
  return (1.0 - g2) / pow(1.0 + g2 - 2.0*g*c, 1.5); 
}
float forward = hg(cosTheta, clamp(uCloudAniso, 0.1, 0.75)); // 用 uCloudAniso 当 g

// 自阴影（一次项近似）：厚处更暗
float selfOcc = mix(1.0, 0.72, thickness);

// 漫反射 + 前向散射高光（银边）
vec3  baseCol = uCloudColor * (0.82 + 0.18*cosTheta);
float rimBoost = smoothstep(0.0, 0.25, 1.0 - cosTheta); // 只在掠射角提升
vec3  lit = baseCol * selfOcc + rimBoost * forward * 0.55;

// === NEW: alpha 用“厚度”平滑，而不是 pow(cloudAlpha) 锐化 ===
float alpha = smoothstep(0.0, 1.0, thickness);
col = mix(col, lit, alpha);


这样“亮边”来自角度和厚度，自然随云形变化，不会出现统一描边。
（原来那几行：rim = pow(dot(uSunDir, vec3(0,1,0)))...、edgeHighlight、cloudAlpha = pow(...) 都可以删掉或注释掉。）

2) 让太阳被“云厚度”真实遮挡（避免穿云发白）

现在太阳盘/光晕是直接加到天空上再与云 alpha 混，厚云挡不住太阳。改成：太阳亮度乘以云的透射率 T = exp(-k * thickness)：

// 在添加太阳盘之前计算 thickness（见上一步）
// 太阳盘 + 光晕（原本的）:
float disk = sunDisk(rd);
float glow = pow(max(dot(normalize(rd), normalize(uSunDir)), 0.0), 8.0);

// NEW: 云对太阳的遮挡（thickness 越厚越暗）
float trans = exp(-3.0 * thickness); // k=3~6 视口味
vec3 sunCol = disk * uSunGlow * vec3(1.0,0.95,0.88) + glow * 0.25 * vec3(1.0,0.9,0.8);
col += sunCol * trans;   // 而不是无脑相加

3) 雾要“随高度/视程”，不要按 vUv 做屏幕蒙版

你现在的雾是 vUv.y 的函数，看起来像一层固定渐变，容易把边缘洗粉。改成高度雾 + 视程雾的混合近似（即使是全屏 quad，也能用 rd.y 近似）：

// 替换现有雾
float camH = 0.0;                      // 相机高度（屏幕演示可先当 0）
float rayH = max(rd.y, 0.001);         // 向上的射线更少穿雾
float heightFog = exp(-uFogDensity * (rayH*80.0 + max(0.0, camH) * 0.5));
float distFog   = exp(-uFogDensity * 60.0 * (1.0 - rayH)); // 朝地平线雾更重
float fogF = clamp( min(heightFog, distFog), 0.0, 1.0 );

// 云体保护：厚处少吃雾，但不是直接 1
float fogProtect = mix(1.0, 0.6, thickness);
vec3  fogColor   = mix(vec3(0.86,0.89,0.95), col, 0.2); // 冷一点的高空雾基色
col = mix(fogColor, col, fogF * fogProtect);


这能保住云边层次，又有 iOS 那种“地平线更雾”的感觉。

4) 后期处理别再“放大伪像”

片尾有一组 col *= uExposure; col = pow(col, vec3(0.6)); 再乘锐度，这会把半透明边缘的伪像、halo 放大。建议改为：

// Tone: 让渲染器的 ACES 接管对比，不在 shader 里再重 Gamma
col *= uExposure;           // 保留曝光
// col = pow(col, vec3(0.6));  // ← 删除这句
// 也别再乘 1.1 的“锐度”，交给多频细节与法线来做

5) 两层云，近远分治（速度、对比、频率都不同）

iOS 的味道很大一部分来自分层与视差。最小修改：保留你现有三路噪声，但把它们拆成两层混合，近层更锐、动得更快、受光更强；远层更软、更慢、对比更低：

// 层 1（近）
float nearD = fbm(p2 * (1.1 + uCloudDetail*0.45));
float nearThick = clamp((nearD - (thresh-0.04)) / (1.0 - (thresh-0.04)), 0.0, 1.0);

// 层 2（远）
float farD  = fbm(p1 * (0.85 + uCloudDetail*0.25));
float farThick = clamp((farD - (thresh+0.02)) / (1.0 - (thresh+0.02)), 0.0, 1.0);

// 近层受光更强、混合更“实”
vec3 nearLit = (baseCol * 0.95 + rimBoost * forward * 0.70) * selfOcc;
vec3 farLit  = (baseCol * 0.85 + rimBoost * forward * 0.35) * mix(1.0, selfOcc, 0.7);

float aNear = smoothstep(0.0, 1.0, nearThick);
float aFar  = smoothstep(0.0, 1.0, farThick) * 0.65;

col = mix(col, farLit,  aFar);
col = mix(col, nearLit, aNear);


这样近层云在长焦下会“更清楚”，远层做氛围填充，不至于糊成一片。

6) 雨/雪：别用 LineBasicMaterial 指望 linewidth，改成“拉伸的面片”

大多数平台 LineBasicMaterial.linewidth 不生效，雨看起来就像“一把细针”。最小侵入式替换：

用 InstancedMesh 的相机面朝四边形（quad），在 vertex 里按速度方向拉伸（模拟运动模糊）；

在 fragment 里做纵向渐隐（头尾淡）、横向高斯（中间亮边缘淡）。

伪代码（雨）：

// JS：每滴雨是一个实例
const geo = new THREE.PlaneGeometry(1, 1); // 单位 quad
const mat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false,
  uniforms: { uCamRight: {value: new THREE.Vector3()}, uCamUp: {value: new THREE.Vector3()} },
  vertexShader: `
    attribute vec3 velocity;
    attribute float length;
    varying float vT;
    void main(){
      // 面向相机的基（billboard）
      vec3 right = normalize(cross(vec3(0,0,1), vec3(0,1,0)));
      vec3 up    = vec3(0,1,0);

      // 沿速度方向拉伸（雨滴长度）
      vec3 dir = normalize(velocity);
      vec3 p = instanceMatrix[3].xyz;              // 每滴雨的位置
      vec2 quad = position.xy;                     // -0.5~0.5
      p += dir * quad.y * length;                  // 纵向拉伸
      p += normalize(cross(dir, vec3(0,0,1))) * quad.x * 0.02; // 横向很细

      vT = quad.y * 0.5 + 0.5;                     // 0~1，用于尾部淡出
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }`,
  fragmentShader: `
    varying float vT;
    void main(){
      float head = smoothstep(0.0, 0.2, vT);
      float tail = 1.0 - smoothstep(0.8, 1.0, vT);
      float alpha = head * tail;        // 中段最亮，头尾淡
      gl_FragColor = vec4(0.70,0.85,1.0, alpha*0.8);
    }`
});


雪也同理，但不拉伸，而是随机摆动，分三层大小（少量大颗前景 + 主体中颗 + 远处细颗），前景可稍虚（sizeAttenuation + fragment 里做一点软化）。

7) 模板与配色的微调（更像 iOS）

天空：顶部更冷、更暗一点，地平线更暖白；

曝光：把模板里 exposure 收到 0.95~1.1 区间；

云色：别纯白，偏 (0.95, 0.97, 1.0)；

雾：默认极低（0.001~0.003），只在阴天/雨雪才稍升。
（这些你模板里已有雏形，主要是别再叠“pow(0.6)”那种全局对比。）

小结（为什么这几刀能“像 iOS”）

边缘：由“角度 + 厚度”决定（HG 相函数 + 梯度法线），不会再是统一描边；

体积感：近/远两层 + 自阴影一次项，长焦下仍有结构；

太阳：被厚云真实遮掉，不会穿云白爆；

雾：基于高度/视程，既有层次又不糊边；

雨/雪：由线→面，解决 linewidth 与“针线感”