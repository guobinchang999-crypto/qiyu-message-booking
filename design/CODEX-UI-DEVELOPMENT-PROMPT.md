# Codex 前端 UI 开发提示词

> 用法：将本文件与同目录 `UI-DESIGN-SYSTEM.md`、`UI-ACCEPTANCE-CHECKLIST.md` 以及 15 张 `client-*-v2.png` 一起放入待开发仓库，随后把“可复制提示词”完整发送给 Codex。  
> 本提示词只要求完成客户端 UI、Mock 数据和可演示交互；真实业务流程与后端接口可以后续替换。

## 开发输入

- 设计规范：[`UI-DESIGN-SYSTEM.md`](./UI-DESIGN-SYSTEM.md)
- 验收标准：[`UI-ACCEPTANCE-CHECKLIST.md`](./UI-ACCEPTANCE-CHECKLIST.md)
- 15 张视觉参考图：
  - [`client-01-home-v2.png`](./client-01-home-v2.png)
  - [`client-02-store-detail-v2.png`](./client-02-store-detail-v2.png)
  - [`client-03-therapist-v2.png`](./client-03-therapist-v2.png)
  - [`client-04-time-v2.png`](./client-04-time-v2.png)
  - [`client-05-confirm-v2.png`](./client-05-confirm-v2.png)
  - [`client-06-login-v2.png`](./client-06-login-v2.png)
  - [`client-07-store-list-v2.png`](./client-07-store-list-v2.png)
  - [`client-08-service-list-v2.png`](./client-08-service-list-v2.png)
  - [`client-09-service-detail-v2.png`](./client-09-service-detail-v2.png)
  - [`client-10-success-v2.png`](./client-10-success-v2.png)
  - [`client-11-order-list-v2.png`](./client-11-order-list-v2.png)
  - [`client-12-booking-detail-v2.png`](./client-12-booking-detail-v2.png)
  - [`client-13-checkin-v2.png`](./client-13-checkin-v2.png)
  - [`client-14-review-v2.png`](./client-14-review-v2.png)
  - [`client-15-profile-v2.png`](./client-15-profile-v2.png)

---

## 可复制提示词

```text
你是一名资深微信小程序前端工程师。请在当前仓库中实现“栖愈｜推拿·SPA”微信小程序客户端 UI。

一、先检查再实施

1. 先阅读仓库结构、package.json、project.config.json、app.json、现有页面和组件，不要覆盖用户已有代码。
2. 完整阅读以下输入：
   - UI-DESIGN-SYSTEM.md
   - UI-ACCEPTANCE-CHECKLIST.md
   - client-01-home-v2.png 至 client-15-profile-v2.png
3. 输出简短实施清单，随后直接开始实现；不要因为缺少后端而停下，使用类型安全的 Mock Service 完成 UI 演示。
4. 如现有项目与本提示词冲突，保留用户已有业务代码，并将 UI 层逐步适配；不要进行无关重构。

二、固定技术栈

- 微信小程序原生框架，不使用 Taro、UniApp、React 或 Vue。
- TypeScript。
- TDesign MiniProgram 1.15.x，通过 npm 安装；package.json 使用 `tdesign-miniprogram: ^1.15.0` 并提交锁文件。
- WXML + WXSS，开启适合当前项目的 TypeScript、ESLint 和格式检查。
- 使用微信原生页面路由与分包能力；没有明确收益时不要引入额外 UI 框架。
- 全局预约草稿使用一个轻量、类型安全的 `store/booking.ts` 单例管理，提供 get/update/reset/subscribe；不要为 UI 演示额外引入大型状态管理库。
- 数据访问通过 `services` 接口；Mock 实现与未来真实 API 使用相同返回类型。

三、视觉实现约束

- UI-DESIGN-SYSTEM.md 是最高视觉规范，对应 PNG 是页面构图和内容参考，TDesign 默认样式为最后兜底。
- 页面必须用真实 WXML/WXSS、TDesign 组件和业务组件实现，禁止把整张效果图设置成背景或 Image。
- 不从截图中裁切含文字、按钮、二维码、图标或人物信息的区域充当控件。
- 所有颜色、间距、字号、圆角、阴影和层级引用语义化 Token，集中放在 `styles/tokens.wxss`；页面禁止散落品牌色硬编码。
- Logo 使用独立透明图片资源；如果仓库中暂时没有 Logo，使用明确标记的占位资源，不用普通文本冒充最终 Logo。
- 页面标题允许使用系统宋体回退，正文和数字使用苹方/系统无衬线；不下载或内嵌额外中文字体包。
- 以 750rpx 开发，重点校验 375px、390px、430px 宽度；适配状态栏、微信胶囊按钮和底部安全区。
- 固定栏不能遮挡内容；所有可点击区域不小于 44px × 44px。
- 图片缺失时使用与目标比例一致的占位图组件，保留未来替换入口；不能拉伸图片。

四、品牌与业务语义

- 品牌固定为“栖愈｜推拿·SPA”，视觉为自然、克制、温暖、东方轻奢。
- 客户端不展示门店经营类型，不添加任何门店渠道身份标签。
- 首页门店推荐顺序固定为：常去门店 → 附近门店。
- 默认权益文案使用“会员权益·全门店通用”。
- 不虚构真实支付、手机号验证码、定位、地图导航或客服能力；UI 演示通过可替换适配器/Mock 实现，并在代码中清楚标注接入点。

五、建议目录

在兼容现有仓库的前提下使用以下职责划分：

miniprogram/
  app.ts
  app.json
  app.wxss
  pages/
    login/
    home/
    stores/
    store-detail/
    services/
    service-detail/
    therapist-select/
    time-select/
    booking-confirm/
    booking-success/
    orders/
    booking-detail/
    checkin/
    review/
    profile/
  components/
    qy-navbar/
    qy-tab-bar/
    qy-bottom-action/
    qy-store-card/
    qy-service-card/
    qy-therapist-card/
    qy-time-slot/
    qy-order-card/
    qy-status-view/
    qy-image/
  custom-tab-bar/
  styles/
    tokens.wxss
    utilities.wxss
  types/
    domain.ts
    ui.ts
  store/
    booking.ts
  services/
    contracts.ts
    mock-service.ts
  mock/
    fixtures.ts
  utils/
    safe-area.ts
    format.ts
  assets/
    images/
    icons/

若仓库已有清晰目录，应复用并映射以上职责，不要为了完全一致而搬迁所有文件。

六、必须实现的15个页面

1. 登录 `client-06-login-v2.png`
   - 品牌 Hero、手机号、验证码、协议勾选、登录/注册、微信快捷登录。
   - 包含默认、聚焦、格式错误、验证码倒计时、提交中状态。

2. 首页 `client-01-home-v2.png`
   - Hero、快捷入口、常去门店、附近门店、精选项目、会员权益和统一 TabBar。
   - 明确保持“常去门店 → 附近门店”的展示顺序。

3. 门店列表 `client-07-store-list-v2.png`
   - 搜索、距离/评分/营业状态筛选、常去门店、附近门店、地图入口。
   - 包含加载、空结果、定位失败和重试状态。

4. 门店详情 `client-02-store-detail-v2.png`
   - 图片轮播、门店摘要、导航/电话入口、权益提示、项目/技师/评价 Tabs、折叠信息、固定预约栏。

5. 服务列表 `client-08-service-list-v2.png`
   - 门店切换、搜索、分类 Tabs、项目列表、统一 TabBar。

6. 服务详情 `client-09-service-detail-v2.png`
   - Hero、价格与会员价、时长、服务介绍、服务步骤、适合人群、注意事项、技师、评价和固定预约栏。

7. 选择技师 `client-03-therapist-v2.png`
   - 指定技师/系统自动分配互斥切换、技师卡、选中摘要和下一步。

8. 选择时间 `client-04-time-v2.png`
   - 门店与项目摘要、横向日期、上午/下午/晚上 Tabs、时间槽四种状态、迟到提示和下一步。

9. 确认预约 `client-05-confirm-v2.png`
   - 门店/项目/技师/时间修改入口、人数、预约人、备注、权益、费用明细、规则勾选、确认并支付。
   - 展示成功 Modal；提交需要防重复触发。

10. 预约成功 `client-10-success-v2.png`
    - 成功结果、预约编号、门店、项目、技师、时间、提醒、导航/联系、详情和返回首页。

11. 订单列表 `client-11-order-list-v2.png`
    - 状态 Tabs、订单卡、按状态提供动作列表、统一 TabBar。
    - 动作由 Mock 数据的 `availableActions` 驱动，不在卡片组件内写死。

12. 预约详情 `client-12-booking-detail-v2.png`
    - 状态 Steps、二维码与六位码、门店/项目/技师/时间、预约人、支付信息、规则、固定操作栏。

13. 到店签到 `client-13-checkin-v2.png`
    - 预约摘要、大二维码、六位码、刷新说明、进度、我已到店、导航/联系。
    - 签到动作幂等；成功后显示明确反馈，重复点击不重复提交。

14. 服务评价 `client-14-review-v2.png`
    - 三组星级、满意标签、300字文本、图片上传、匿名开关、规则勾选和提交反馈。

15. 我的 `client-15-profile-v2.png`
    - 用户与会员信息、余额/套餐/优惠券、预约快捷入口、最近预约、功能列表、退出登录和统一 TabBar。
    - 手机号脱敏；会员权益统一显示为全门店通用。

七、公共组件要求

- `qy-navbar`：动态状态栏、返回、居中标题、可选右侧动作。
- `qy-tab-bar`：统一四项导航和安全区；整项可点击；当前页状态一致。
- `qy-bottom-action`：主次操作布局、Loading、禁用、安全区和内容占位。
- `qy-store-card`：支持首页紧凑版和列表完整版，props 不包含门店经营类型。
- `qy-service-card`：支持横向列表、双列精选和详情摘要变体。
- `qy-therapist-card`：支持选择、禁用、附加费和最近可约状态。
- `qy-time-slot`：`available | selected | limited | full` 四态，禁用态不触发事件。
- `qy-order-card`：根据数据渲染状态和动作，向上抛出 `action` 事件。
- `qy-status-view`：统一 skeleton/loading/empty/error/offline，支持重试事件。
- `qy-image`：统一 aspectFill、占位、加载失败和 lazy-load。

组件命名必须表达业务语义，禁止出现 `container1`、`group2`、`image3` 等无意义名称。

八、最小类型接口

在 `types/domain.ts` 中至少定义以下类型，并由页面、Mock 和组件共同使用：

- `Store`：id、name、cover、gallery、distanceKm、rating、address、businessStatus、nextAvailableAt、isFrequent、facilities。
- `ServiceItem`：id、name、category、cover、durationMinutes、price、memberPrice、salesCount、tags、description。
- `Therapist`：id、name、avatar、portrait、level、experienceYears、skills、rating、serviceCount、specifyFee、nextAvailableAt、availability。
- `TimeSlot`：id、startAt、period、status，其中 status 为 `available | limited | full`；选中态属于 UI 状态，不污染服务数据。
- `BookingDraft`：storeId、serviceId、therapistMode、therapistId、slotId、guestCount、contact、remark、benefitSelection。
- `Booking`：id、code、status、store、service、therapist、scheduledAt、contact、payment、availableActions。
- `BookingStatus`：`pending_payment | upcoming | in_service | completed | cancelled`。
- `OrderAction`：`pay | cancel | reschedule | contact | show_code | rebook | review | view_detail`。
- `PaymentSummary`：itemAmount、therapistFee、discountAmount、balanceDeduction、depositDue、paidAmount。
- `AsyncViewState<T>`：idle/loading/success/empty/error，保留错误消息和重试能力。

在 `services/contracts.ts` 定义接口，不依赖 Mock 细节：

- 获取首页数据、门店列表/详情、项目列表/详情、技师列表、可约时间。
- 创建预约、查询订单、签到、提交评价。
- 所有写操作接收 `requestId` 或等价幂等键。

九、Mock 与交互规则

- Mock 数据在15页之间必须一致：静安寺店、张雨薇、肩颈舒缓、2026年8月1日14:00等示例不可在不同页面互相矛盾。
- 模拟请求延迟，并提供可切换的成功、空数据、错误和弱网场景。
- 真实支付、登录、地图、电话、图片上传通过 adapter 封装；演示环境给出清晰提示，不伪造真实成功。
- 页面事件必须完整绑定，无死按钮；尚未确定的业务动作调用具名 handler，并用 TODO 标注真实接口接入点。
- 登录、支付、签到、评价提交均要防止重复点击。

十、状态与适配要求

- 每个远程数据页面实现 Skeleton、Loading、Empty、Error/Retry；需要时实现 Offline。
- 表单保留用户输入，错误后不得清空。
- 列表图片 lazy-load；失败时使用统一占位。
- 长文本、系统字体放大、窄屏下允许合理换行，不能遮挡价格和主操作。
- 固定 Navbar、Tabs、Bottom Action、TabBar 正确处理安全区和滚动占位。
- Modal、Toast、Dialog 的层级必须高于固定栏；页面热点不能被透明层拦截。

十一、实施顺序

阶段1：基础设施
- 确认项目可构建；安装并配置 TDesign。
- 建立 tokens、全局样式、安全区工具、类型、Mock Service。
- 完成 Navbar、TabBar、Bottom Action、Status View、Image。

阶段2：发现与预约
- 登录、首页、门店列表/详情、服务列表/详情。
- 技师、时间、确认预约、预约成功。

阶段3：订单与复购
- 订单列表、预约详情、签到、评价、我的。

阶段4：状态与视觉验收
- 补齐加载、空态、错误、禁用和弱网。
- 在375/390/430宽度生成页面截图，与参考图逐页对比并修正。

十二、验证与交付

- 运行项目现有的 TypeScript、Lint、单元测试和构建命令；没有脚本时补充最小可用脚本，但不要伪造通过结果。
- 使用微信开发者工具构建 npm 并完成预览；如当前环境无法启动开发者工具，明确列出尚需人工执行的步骤。
- 对纯函数、状态映射和格式化工具写单元测试；对公共组件至少验证关键 props/事件和四态渲染。
- 按 UI-ACCEPTANCE-CHECKLIST.md 逐页检查并记录结果。
- 最终报告必须包含：完成页面、公共组件、Mock 场景、执行过的检查、未完成项、需接入的真实能力和视觉差异说明。
- 不要只报告“已完成”；提供可复核的文件路径、命令结果和页面清单。

完成标准：15页均由真实组件构建；视觉和状态符合设计规范；导航与核心演示链路无死链；构建和静态检查通过；没有门店经营类型或门店独立会员体系内容。
```

## 使用建议

1. 将本目录复制进待开发仓库的 `design/qiyu-client/`，保持图片和文档相对路径不变。
2. 首次开发使用上方完整提示词；后续单页修正时引用对应 PNG、设计规范章节和验收清单页面行。
3. 如果业务流程文档随后补齐，将其优先级设为“业务规则高于本提示词，但不得随意改变视觉令牌”。
4. Codex 输出实施清单后，应让它继续执行，而不是只生成静态代码示例。

## 相关文档

- UI 设计规范：[`UI-DESIGN-SYSTEM.md`](./UI-DESIGN-SYSTEM.md)
- UI 验收清单：[`UI-ACCEPTANCE-CHECKLIST.md`](./UI-ACCEPTANCE-CHECKLIST.md)

