# Chrome Web Store 提交指南

## 📋 提交前清单

### ✅ 已完成项目
- [x] Manifest.json 配置正确
- [x] 图标文件规格符合要求 (16x16, 32x32, 48x48, 128x128)
- [x] 核心功能代码完整且无恶意内容
- [x] 权限申请合理（storage, geolocation, tabs, host_permissions）

### 🔴 必须删除的文件
在提交前，请删除以下开发文件：
```
- log.md (开发日志)
- todo.md (任务列表)  
- theme-test.html (测试文件)
- ss/ (截图文件夹)
- js/content-old.js (旧版文件)
- css/newtab-optimized.css (如不使用)
```

## ⚠️ 需要审查的权限

### 当前权限清单
- `storage` - ✅ 必需（存储API密钥和天气数据）
- `geolocation` - ⚠️ 需确认是否真正使用用户位置
- `tabs` - ⚠️ 审核严格，确保必要性
- `https://api.openweathermap.org/*` - ✅ 必需（天气API调用）

### 建议调整
```json
"permissions": [
  "storage"
  // 如果不获取用户位置，移除 "geolocation"
  // 如果不需要操作标签页，移除 "tabs"
]
```

## 📝 商店描述建议

### 当前描述
```
"description": "一页，容纳整个世界"
```

### 建议改进描述
```
"description": "天景 AeScape - 智能天气新标签页扩展，根据实时天气自动调整页面主题色彩，为您带来沉浸式的天气体验。支持全球城市天气查询，优雅的界面设计让每次打开新标签页都是一次视觉享受。"
```

## 🔧 版本建议
- 当前: `1.0.0`
- 建议: `0.1.0` (首次提交使用beta版本号)

## 🎯 扩展功能亮点
1. **动态主题系统** - 根据天气和时间自动变换主题
2. **OpenWeatherMap集成** - 准确的全球天气数据
3. **优雅UI设计** - 简洁现代的用户界面
4. **本地存储** - 智能缓存，减少API调用

## 📊 技术架构
- **Manifest V3** - 符合最新Chrome扩展标准
- **Service Worker** - 后台天气数据更新
- **Content Scripts** - 页面主题注入
- **Storage API** - 本地数据管理

## 🚀 提交流程
1. 删除开发文件
2. 调整权限配置（可选）
3. 更新版本号和描述
4. 打包为zip文件
5. 提交至Chrome Web Store Developer Dashboard

## 📋 商店审核要点
- ✅ 无恶意代码
- ✅ 功能描述准确
- ✅ 权限使用合理
- ✅ 用户隐私保护
- ✅ UI/UX体验良好

## 🔒 隐私说明
扩展仅在本地存储用户设置和天气数据，不收集或上传任何个人信息。天气数据通过OpenWeatherMap API获取，遵循其隐私政策。

---

**准备就绪！** 清理文件后即可提交Chrome Web Store审核。