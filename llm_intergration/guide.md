下面这份是给 Vibe Coding 工程同学的实现说明。目标是：在新标签页里提供一个“搜索/网址 + LLM 按钮”的双轨入口；点按钮后在目标 LLM 页面自动填入并发送（不调用模型 API），且“只注入一次、发完即走”。

# 0. 背景与目的

* 现在浏览器地址栏/搜索框只能走传统搜索或网址直达。我们希望在**不改变回车习惯**的前提下，新增一条并行通道：同样的输入，一键交给 ChatGPT / Gemini / DeepSeek / 豆包中的任一模型对话。
* 约束：不使用开放 API；不在 LLM 官网内嵌 iframe（被 CSP/XFO 拦截）；不常驻监听 DOM。

# 1. 目标与范围

* 新标签页提供一个自定义输入框：

  * 回车 → 正常搜索/直达网址（保持肌肉记忆）。
  * 右侧按钮（下拉可选平台）→ 打开对应 LLM 网页，并自动：聚焦输入框 → 写入文本 → 触发发送。
* 覆盖站点：ChatGPT、Gemini、DeepSeek、豆包。
* 成功标准：用户点击按钮后**无需再触键盘**，在 LLM 页面看到消息已发出并开始响应。

# 2. 用户体验流程

1. 用户在新标签页自定义输入框里输入。
2. 行为分流：

   * 回车：按默认搜索引擎或识别为 URL 直达。
   * 点按钮：把输入通过“携带参数/临时存储”的方式带到目标站，打开对应对话页。
3. 目标站加载后，扩展的 content script（只执行一次）：

   * 等待输入框可编辑（短轮询，最多 3–8s）。
   * 聚焦 → 写入文本 → 触发 `input/change` → 模拟提交（回车或点发送）。
   * 看到首条用户消息或模型回复块出现后结束流程。
4. 失败兜底：若超时或未登录，复制输入到剪贴板并提示一次，流程结束。

# 3. 技术路线（不调用 API）

* 新标签页覆盖：使用浏览器扩展的 `chrome_url_overrides.newtab`（Chrome/Edge）或同等能力（Firefox）。
* 输入分流：

  * 回车：走常规 `https://www.google.com/search?q=...` 或 URL。
  * 按钮：打开目标 LLM 基础路由（见第 5 节），同时把用户输入通过以下任一方式带过去：

    * `sessionStorage`/`localStorage`（以域为单位，需在跳转前写、到站后读，跨域不可见）；
    * `chrome.storage.session`（扩展可见，到站后 content script 读取）；
    * URL query/hash（如 `#q=...`，仅供我们脚本读取，不依赖官方解析）。
  * 建议采用：扩展 `storage.session` 传递（跨域可读），同时用 URL hash 做冗余。
* 到站注入：在目标域注册 `content_scripts`，匹配对应路径；脚本执行策略：

  * 仅在首次加载执行一次；设置 single-flight 标记（`sessionStorage`/`window.name`）避免重复。
  * “短轮询 + 超时”查找输入框与发送控件（80–120ms 间隔，最多 30–60 次），**不使用 MutationObserver 常驻监听**。
  * 成功或超时后清理所有计时器，结束脚本执行。

# 4. 就绪与提交判据（统一标准）

* 就绪条件（满足其中 2–3 项即可触发填充）：

  1. 找到候选输入框元素（可见、可编辑，非 disabled）。
  2. 发送按钮存在且非 disabled，或输入框上监听已生效（`input` 后 UI 状态变化）。
  3. 输入框有稳定属性（placeholder / aria-label / data-testid）可被读取到。
* 提交流程（一次性）：

  1. `focus()` 输入框；
  2. 写入文本：

     * `<textarea>`：赋值 `value`，随后派发 `input` 事件（`bubbles: true`）。
     * `contenteditable`：设置 `innerText` 或使用 `Selection` 写入，再派发 `input`。
  3. 模拟提交：优先触发表单 `submit`；否则派发 `keydown(Enter)`；仍不行则点击发送按钮。
* 成功判据：对话区域出现首条用户消息容器或模型回复容器。命中即结束。

# 5. 站点对照（输入框类型 / 稳定锚点 / 推荐落地路由 / 提交方式）

> 选择器用“优先稳定属性，避免类名”，实际实现时按此优先级编写多重兜底。

* ChatGPT（`https://chat.openai.com/`）

  * 输入框：`<textarea>`
  * 锚点建议：`data-testid="prompt-textarea"` 或 placeholder 包含 “Message ChatGPT”
  * 落地路由：`/`（主对话页）
  * 提交：`form.submit()` 或 `Enter`，按钮为“纸飞机”
* Gemini（`https://gemini.google.com/`）

  * 输入框：`<div contenteditable="true">`
  * 锚点建议：`aria-label` 包含 “Message Gemini”
  * 落地路由：`/app`（对话页）
  * 提交：派发 `input` 后 `Enter` 或点击发送按钮
* DeepSeek（`https://deepseek.com/chat`）

  * 输入框：`<textarea>`
  * 锚点建议：placeholder 类似 “Send a message...”（以英文为主），可加 `role`/`aria` 兜底
  * 落地路由：`/chat`
  * 提交：`Enter` 或点击按钮
* 豆包（如 `https://www.doubao.com/chat` 或官方当前域）

  * 输入框：`<textarea>`
  * 锚点建议：中文 placeholder（如“输入你的问题…”），可加 `aria-label`
  * 落地路由：`/chat`
  * 提交：`Enter` 或点击按钮

说明：

* 以上路由以“能直接出现可输入区域”为目标，避免先点“新建对话”的额外步骤。
* 若产品改版导致直达页多一步，短轮询会等待新 DOM 出现；超过超时即兜底，不做二次监听。

# 6. 单次注入与清理（关键要求）

* 打单次标记：在 content script 入口读取并写入 single-flight 标记（扩展 `storage.session` 或 `sessionStorage`）。
* 定时器清理：不论成功/失败，最后统一 `clearTimeout/clearInterval`。
* 失败兜底：

  * 未登录/跳到登录页：立即复制输入到剪贴板并提示一次（不再等待）。
  * 超时：提示“网络慢/页面未就绪，可重试或手动粘贴”，流程结束。
* 不做持久监听：不挂全局 `MutationObserver`、不保持长连接。

# 7. 权限、合规与安全

* 权限最小化：

  * `chrome_url_overrides.newtab`
  * `storage`（使用 `chrome.storage.session`）
  * 针对四站点的 `content_scripts` 注入匹配
* 不注入除目标域之外的页面；不读取页面内容，只操作输入框与发送控件。
* 不存用户对话历史；仅在会话内短暂保存“待发送文本”，发出后立即清除。

# 8. 错误与边界处理

* 站点改版：选择器采用“多锚点兜底”（placeholder/aria/data-testid/元素类型）；一处失效，其余可用。
* 极弱网：最多等待 8 秒；超过则复制到剪贴板并结束。
* 重复点击按钮：检测 single-flight 标记，拒绝重复发送。
* 未聚焦导致热键无效：我们主动 `focus()` 输入框；若失败则降级点击发送按钮。

# 9. 验收标准（可量化）

* 正常网络：从点击 LLM 按钮到消息发出，P95 ≤ 3 秒。
* 弱网 3G：P95 ≤ 8 秒或进入兜底提示。
* 成功率：在已登录前提下，10 次冷启动中 ≥ 9 次完成自动发送。
* 无后台残留：任务结束后无活动计时器/监听器。
* 可维护性：修改任一站点的 placeholder 仍有其它锚点命中（通过模拟测试验证）。

# 10. 可选增强（不影响本期）

* 平台记忆：记住上次选择的目标 LLM。
* 关键字前缀：在输入框支持 `g 关键词` 走 Google、`b 关键词` 走 Bing 等；按钮始终走 LLM。
* 失败提示位：在目标页右上角显示一次“已尝试自动发送/已复制到剪贴板”。

——

这版实现能满足：**用户点按钮后无需再按键**、**只注入一次**、**不驻留监听**，并且覆盖 ChatGPT / Gemini / DeepSeek / 豆包四站点。若无异议，我们按此方案拆分任务并出测试用例。
