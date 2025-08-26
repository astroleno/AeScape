### 评估结论（可行性）
- 结论：可以实现，技术路线清晰，不调用任何模型 API 与 iframe，也能做到“只注入一次、发完即走”。
- 复杂度：中等（新标签页 UI + 4 平台差异化选择器与提交流程 + 单次注入机制 + 弱网/未登录兜底）。
- 风险点：目标站点选择器改版、Shadow DOM/动态加载导致选择器失效、剪贴板权限与用户手势约束。

### 需要的权限与清单
- 必需
  - chrome_url_overrides.newtab（覆盖新标签页）
  - storage（存放待发送文本、状态标记）
  - content_scripts（匹配 ChatGPT/Gemini/DeepSeek/豆包对话页）
- 建议
  - clipboardWrite（兜底失败时复制到剪贴板更稳定）
- 可选
  - tabs（从新标签页打开目标站点、或作为兜底广播消息时更方便）

### 关键实现要点
- 新标签页输入分流
  - Enter：走默认搜索/URL 直达
  - LLM 按钮：chrome.tabs.create 打开所选平台对话页；用 chrome.storage.session 传输文本（建议）+ URL hash 冗余备份
- 单次注入
  - content script 首次命中即设置 single-flight 标记（sessionStorage/window.name/chrome.storage.session）
  - 80–120ms 短轮询查找输入框与发送控件，超时 3–8s；无 MutationObserver 常驻
  - 成功或超时后清理全部计时器与监听，立即退出
- 自动填充与提交
  - 命中就绪条件（找到可编辑输入 + 可提交）后：
    - focus() → 写入（textarea.value + input 事件 / contenteditable.innerText + input 事件）
    - 尝试 form.submit() → 模拟 Enter → 点击发送按钮（多级兜底）
  - 成功判据：首条用户消息或模型回复容器出现
- 失败兜底
  - 未登录/跳登录：立即把文本复制到剪贴板并 toast 提示一次
  - 超时：提示“页面未就绪/网络慢，请手动粘贴”，清理并结束
- 稳定性策略
  - 选择器用稳定属性优先（placeholder/aria/data-testid/role），多锚点兜底
  - 对每站实现最少2–3个候选选择器路径；命中任一即可
  - 将选择器表与触发方式抽象成每站一个适配器，便于维护

### 站点适配摘要
- ChatGPT
  - 路由：/（主对话页）
  - 输入：textarea；data-testid="prompt-textarea" 或 placeholder 包含“Message ChatGPT”
  - 提交：form.submit() → Enter → 点击纸飞机
- Gemini
  - 路由：/app
  - 输入：contenteditable div；aria-label 包含 “Message Gemini”
  - 提交：input → Enter → 点击发送
- DeepSeek
  - 路由：/chat
  - 输入：textarea；placeholder “Send a message...”
  - 提交：Enter → 点击发送
- 豆包
  - 路由：/chat
  - 输入：textarea；中文 placeholder（如“输入你的问题…”）
  - 提交：Enter → 点击发送

### 风险与缓解
- 选择器失效：采用多锚点、按优先级尝试；集中配置化，便于热修
- Shadow DOM/动态渲染：短轮询 + 超时；必要时在候选容器内再查找
- 剪贴板权限：添加 clipboardWrite；若受限则提示用户手动复制（同时尝试 navigator.clipboard 写入）
- 登录态：检测到登录页元素即判定未登录，触发剪贴板兜底 + 提示

### 验收与度量
- P95：普通网速 3s 内自动发送；弱网 8s 内成功或兜底提示
- 成功率：已登录前提下 10 次冷启动 ≥9 次成功
- 资源：任务完成后无活跃计时器/监听器（可在 DevTools Performance 验证）
- 可维护性：替换任一站点 placeholder 其余锚点仍能命中

### 里程碑拆分（建议）
- M1：新标签页 UI 与输入分流（搜索/LLM 按钮）
- M2：传参通道（storage.session + URL hash）与单次注入基类
- M3：ChatGPT 适配实现与测试
- M4：Gemini/DeepSeek/豆包适配与测试
- M5：弱网与未登录兜底、日志与埋点
- M6：回归测试与选择器回退策略完善

如果你同意，我可以按上述里程碑直接开始实现，并在 `manifest.json` 增补所需权限与四站 `content_scripts`，随后落地新标签页入口与第一站 ChatGPT 的适配。