# AeScape 抽卡系统实现路线图

## 🎯 项目目标

基于 `mech.md` 的设计理念，将 AeScape 打造成"天气驱动的沉浸式抽卡系统"，实现：
- **天井仪式感**：打开新标签页时的沉浸式体验
- **智能触发**：天气变化和持续时间的双重触发机制
- **抽卡新鲜感**：避免重复，增加惊喜的动画选择
- **极简常驻**：不打扰的日常使用体验

## 📅 开发阶段规划

### 第一阶段：核心抽卡系统 (1-2周)

#### 1.1 天气触发管理器
**文件**: `WeatherTriggerManager.js`
**功能**:
- [ ] 天气变化检测（5分钟阈值）
- [ ] 持续时间触发（30分钟阈值）
- [ ] 触发状态管理
- [ ] 本地存储同步

**测试用例**:
```javascript
// 测试天气变化触发
const trigger = new WeatherTriggerManager();
trigger.checkWeatherChange('rain'); // 应该触发
trigger.checkWeatherChange('rain'); // 不应该触发（5分钟内）

// 测试持续时间触发
trigger.checkDurationTrigger('rain'); // 30分钟后应该触发
```

#### 1.2 动画池管理器
**文件**: `VideoPoolManager.js`
**功能**:
- [ ] 加载动画池配置
- [ ] 视频权重管理
- [ ] 视频分类（normal/special/rare）
- [ ] 路径验证和错误处理

**配置结构**:
```json
{
  "clear": {
    "videos": [
      {"id": "clear_001", "weight": 80, "type": "normal"},
      {"id": "clear_002", "weight": 15, "type": "special"},
      {"id": "clear_003", "weight": 5, "type": "rare"}
    ]
  }
}
```

#### 1.3 抽卡算法
**文件**: `AnimationCardSystem.js`
**功能**:
- [ ] 权重随机选择
- [ ] 避免连续重复（3次限制）
- [ ] 彩蛋概率控制
- [ ] 兜底机制

**核心算法**:
```javascript
drawCard(weatherType) {
  const pool = this.getPool(weatherType);
  const available = this.filterAvailable(pool);
  return this.weightedRandom(available);
}
```

### 第二阶段：用户体验系统 (1-2周)

#### 2.1 用户体验控制器
**文件**: `UserExperienceController.js`
**功能**:
- [ ] 播放决策逻辑
- [ ] 每日播放限制
- [ ] 用户偏好管理
- [ ] 体验节奏控制

**决策流程**:
```javascript
shouldPlayAnimation() {
  // 1. 检查用户偏好
  // 2. 检查每日限制
  // 3. 检查天气触发
  // 4. 检查持续时间触发
  // 5. 返回决策结果
}
```

#### 2.2 存储管理器
**文件**: `StorageManager.js`
**功能**:
- [ ] 播放历史记录
- [ ] 用户偏好存储
- [ ] 统计数据管理
- [ ] 数据清理机制

**存储结构**:
```javascript
{
  playHistory: [...], // 播放历史
  userPreferences: {...}, // 用户偏好
  statistics: {...}, // 统计数据
  lastUpdate: timestamp // 最后更新时间
}
```

#### 2.3 配置管理
**文件**: `config/`
**功能**:
- [ ] `animation-pools.json` - 动画池配置
- [ ] `trigger-rules.json` - 触发规则配置
- [ ] `user-preferences.json` - 默认用户偏好

### 第三阶段：视觉效果增强 (1周)

#### 3.1 彩蛋特效系统
**文件**: `SpecialEffectsManager.js`
**功能**:
- [ ] 雨打玻璃效果
- [ ] 云层穿越效果
- [ ] 雷暴闪电效果
- [ ] 动态滤镜系统

**特效类型**:
```javascript
const effects = {
  'rain_glass': createRainGlassEffect,
  'cloud_tunnel': createCloudTunnelEffect,
  'lightning_storm': createLightningEffect
};
```

#### 3.2 动画过渡优化
**文件**: `video-intro.css` (增强)
**功能**:
- [ ] 更流畅的黑色背景过渡
- [ ] 彩蛋特效的CSS动画
- [ ] 性能优化的过渡效果
- [ ] 响应式适配

### 第四阶段：Chrome扩展集成 (1周)

#### 4.1 新标签页集成
**文件**: `chrome_store/js/newtab.js` (修改)
**功能**:
- [ ] 抽卡系统初始化
- [ ] 天气状态获取
- [ ] 动画播放控制
- [ ] 极简背景显示

**集成代码**:
```javascript
class AeScapeNewTab {
  async initialize() {
    const weather = await this.getWeather();
    if (this.shouldPlayAnimation(weather)) {
      const video = this.drawCard(weather.type);
      await this.playAnimation(video);
    }
    this.showMinimalBackground();
  }
}
```

#### 4.2 设置页面集成
**文件**: `chrome_store/popup.html` (修改)
**功能**:
- [ ] 动画开关控制
- [ ] 每日播放限制设置
- [ ] 彩蛋概率调整
- [ ] 用户偏好管理

### 第五阶段：测试和优化 (1周)

#### 5.1 单元测试
**文件**: `test/`
**测试覆盖**:
- [ ] 天气触发逻辑
- [ ] 抽卡算法
- [ ] 存储管理
- [ ] 用户体验控制

#### 5.2 性能优化
**优化项目**:
- [ ] 视频预加载策略
- [ ] 内存使用优化
- [ ] 网络请求缓存
- [ ] 动画性能监控

#### 5.3 用户体验测试
**测试项目**:
- [ ] 不同天气场景测试
- [ ] 长时间使用测试
- [ ] 用户反馈收集
- [ ] 性能基准测试

## 🛠️ 开发工具和环境

### 技术栈
- **前端**: JavaScript ES6+, CSS3, HTML5
- **测试**: Jest (单元测试)
- **构建**: 原生JavaScript (无需构建工具)
- **存储**: localStorage, Chrome Storage API

### 开发环境
- **编辑器**: VS Code
- **浏览器**: Chrome DevTools
- **版本控制**: Git
- **文档**: Markdown

## 📋 具体任务清单

### 第1周任务
- [ ] 创建 `WeatherTriggerManager.js`
- [ ] 创建 `VideoPoolManager.js`
- [ ] 创建 `AnimationCardSystem.js`
- [ ] 编写基础测试用例
- [ ] 创建配置文件结构

### 第2周任务
- [ ] 创建 `UserExperienceController.js`
- [ ] 创建 `StorageManager.js`
- [ ] 完善配置管理
- [ ] 集成现有视频系统
- [ ] 基础功能测试

### 第3周任务
- [ ] 创建 `SpecialEffectsManager.js`
- [ ] 增强CSS动画效果
- [ ] 实现彩蛋特效
- [ ] 性能优化
- [ ] 视觉效果测试

### 第4周任务
- [ ] Chrome扩展集成
- [ ] 新标签页改造
- [ ] 设置页面更新
- [ ] 端到端测试
- [ ] 用户文档更新

### 第5周任务
- [ ] 全面测试
- [ ] 性能优化
- [ ] Bug修复
- [ ] 文档完善
- [ ] 发布准备

## 🎯 成功标准

### 功能标准
- [ ] 天气变化时100%触发动画
- [ ] 30分钟持续触发机制正常工作
- [ ] 抽卡算法避免连续重复
- [ ] 彩蛋概率控制在预期范围
- [ ] 存储系统稳定可靠

### 性能标准
- [ ] 动画加载时间 < 500ms
- [ ] 内存使用 < 100MB
- [ ] 存储空间 < 10MB
- [ ] 不影响新标签页打开速度

### 用户体验标准
- [ ] 动画流畅度 > 60fps
- [ ] 用户满意度 > 4.5/5
- [ ] 每日使用率 > 80%
- [ ] 用户反馈积极

## 🚀 风险控制

### 技术风险
- **视频加载失败**: 实现降级机制
- **存储空间不足**: 定期清理旧数据
- **性能问题**: 监控和优化机制

### 用户体验风险
- **动画过于频繁**: 智能触发控制
- **用户厌倦**: 抽卡机制保持新鲜感
- **兼容性问题**: 多浏览器测试

## 📈 后续规划

### 短期优化 (1-2个月)
- [ ] 用户行为分析
- [ ] 动画效果优化
- [ ] 性能监控系统
- [ ] 用户反馈收集

### 中期扩展 (3-6个月)
- [ ] 个性化推荐
- [ ] 社交分享功能
- [ ] 更多天气类型
- [ ] 移动端适配

### 长期愿景 (6个月+)
- [ ] AI驱动的动画生成
- [ ] 云端同步系统
- [ ] 社区内容平台
- [ ] 商业化探索

---

这个路线图将确保 AeScape 抽卡系统按计划、高质量地实现，为用户带来真正的"天井仪式"体验！
