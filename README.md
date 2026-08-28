# 栖愈｜推拿·SPA 预约系统

栖愈是一个面向统一品牌门店的按摩预约与门店运营系统，覆盖客户线上预约、到店核销、服务履约、订单结算、会员权益和总部运营管理。

本项目后续将拆分为三个核心模块：

- `qiyu-server`：Java 后端接口
- `qiyu-admin`：React + Ant Design Pro 管理后台
- `qiyu-client`：微信小程序客户端

当前仓库已包含客户端 UI 设计图与设计规范文档，后续代码实现应以 `design/` 目录作为视觉和验收基准。

## 产品定位

栖愈定位为自然、克制、温暖、东方轻奢的按摩与 SPA 预约系统。系统重点解决：

- 客户快速选择常去门店、附近门店、服务项目、技师和预约时间。
- 门店前台完成客户签到、核销、分配房间、开始服务和完成服务。
- 总部统一管理服务项目、价格、技师、房间、排班、会员权益和经营数据。
- 会员余额、优惠券、套餐权益保持统一品牌语义，前端统一表达为“全门店通用”。

项目不在前端展示门店经营类型，不出现多经营主体或门店独立会员体系等语义。

## 核心范围

### 客户端小程序

- 手机号登录
- 首页推荐：常去门店优先，其次附近门店
- 门店列表与门店详情
- 服务项目列表与服务详情
- 技师选择：指定技师或系统自动分配
- 日期与时间选择
- 确认预约与支付订金
- 预约成功结果页
- 订单列表与预约详情
- 到店核销码与签到
- 服务评价
- 个人中心、会员权益、优惠券和套餐展示

### 管理后台

- 总部运营看板
- 门店管理
- 预约管理
- 到店核销
- 服务订单
- 排班管理
- 技师管理
- 服务项目管理
- 房间管理
- 客户管理
- 会员管理
- 优惠券管理
- 经营报表
- 系统设置

### 后端接口

- 用户登录与认证
- 门店、服务项目、技师、房间资源管理
- 预约创建、改期、取消和状态流转
- 技师排班与房间占用冲突校验
- 到店签到、核销、开始服务、完成服务
- 订单、支付、退款预留
- 会员权益、优惠券、套餐卡预留
- 管理后台统计与报表接口

## 业务状态

预约和服务订单状态统一为：

```text
待支付 → 已预约 → 已签到 → 待服务 → 服务中 → 待结算 → 已完成
```

异常状态包括：

```text
已取消
```

后续如需要扩展爽约、退款、门店取消、改期中等状态，应先更新接口契约、UI 状态和验收清单。

## 技术栈

### 后端 `qiyu-server`

- Java 21
- Spring Boot 3
- Spring Web
- Spring Validation
- Spring JDBC
- Flyway
- MySQL 8
- Redis
- Sa-Token
- Springdoc OpenAPI
- MinIO Java SDK
- Maven

### 管理后台 `qiyu-admin`

- React
- TypeScript
- Ant Design Pro
- Ant Design 5
- Fetch API
- Umi 或 Vite 方案预留

### 客户端 `qiyu-client`

- 微信小程序原生框架
- TypeScript
- TDesign MiniProgram
- TDesign 主题定制
- Mock Service
- 轻量状态管理

## 仓库结构

```text
qiyu-massage-booking/
├── AGENTS.md
├── README.md
├── design/
│   ├── UI-DESIGN-SYSTEM.md
│   ├── CODEX-UI-DEVELOPMENT-PROMPT.md
│   ├── UI-ACCEPTANCE-CHECKLIST.md
│   └── client-*-v2.png
├── qiyu-server/      # Spring Boot 后端 API、Flyway 与资源种子
├── qiyu-admin/       # Ant Design Pro / Umi 管理后台
└── qiyu-client/      # 微信小程序客户端
```

## 设计资料

开发客户端 UI 前必须阅读：

- `DEVELOPMENT-PLAN.md`：项目开发顺序、Mock 策略、阶段目标和验收标准。
- `design/UI-DESIGN-SYSTEM.md`：UI 设计规范、颜色、字体、组件、状态和页面映射。
- `design/CODEX-UI-DEVELOPMENT-PROMPT.md`：给 Codex 或开发者使用的小程序 UI 开发提示词。
- `design/UI-ACCEPTANCE-CHECKLIST.md`：页面验收清单、适配检查和问题记录格式。

开发后端接口前必须阅读：

- `skills/cola-architecture/SKILL.md`：Java 后端 COLA Light 分层、命名约定和业务模块组织规则。

当前 `design/` 目录中的 15 张客户端效果图是微信小程序 UI 的视觉基准。实现时必须使用真实 WXML/WXSS/TDesign 组件还原，不允许把整张效果图作为页面底图。

## 开发入口

三个模块均保留显式 Mock 模式；本地管理后台默认连接真实后端，小程序可通过环境配置切换 `mock`、`dev` 和 `prod`。

```bash
# 后端接口：先在 shell 或 IDE 中加载 local 环境变量
cd qiyu-server
cp .env.local.example .env.local
# 将密码写入未纳入版本控制的 .env.local，再导入当前 shell
set -a; source .env.local; set +a
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

后端默认端口为 `8080`，OpenAPI 页面为 `http://localhost:8080/swagger-ui.html`。`local` profile 会连接 MySQL、执行 Flyway，并启用数据库认证和数据权限上下文。

### MinIO 资源种子

门店、服务项目和技师图片位于 `qiyu-server/src/main/resources/media-seed/`。配置 MinIO 密码后，首次执行以下命令会创建桶、上传固定对象并回写业务表资源 URL：

```bash
export QIYU_LOCAL_MINIO_ENABLED=true
export QIYU_LOCAL_MINIO_SEED_ENABLED=true
export QIYU_LOCAL_MINIO_SECRET_KEY='从目标环境安全获取的密码'
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

资源种子使用固定对象名，可重复执行。日常启动可将 `QIYU_LOCAL_MINIO_SEED_ENABLED` 设为 `false`；用户评价图片通过 `/reviews/images` 上传到 MinIO。

后端启动后，可以在仓库根目录执行接口联通 smoke。该脚本会覆盖客户端远程联调的主要契约，包括 catalog、门店/服务/技师/时间槽、预约创建/详情/成功页、支付参数准备与确认、预约码刷新、改期、取消、评价图片上传、评价提交回流和会员资料：

```bash
node scripts/smoke-api.mjs
```

如后端地址不是默认值，可通过 `QIYU_API_BASE_URL` 覆盖，例如：

```bash
QIYU_API_BASE_URL=http://localhost:8080 node scripts/smoke-api.mjs
```

```bash
# 管理后台
cd qiyu-admin
npm install
npm run dev
```

管理后台默认端口为 `8000`，访问 `http://localhost:8000`。

```bash
# 微信小程序客户端
cd qiyu-client
npm install
```

小程序请使用微信开发者工具导入 `qiyu-client/` 目录，并执行“构建 npm”。`project.config.json` 已指向 `miniprogram/`。

## 工程原则

- 业务逻辑放在后端应用层或领域层，不放在 Controller 中堆叠。
- API 边界使用 DTO、Command、Query、VO，不直接暴露数据库实体。
- 前端优先使用设计系统和组件库能力，避免重复硬编码样式。
- 管理后台保持企业级后台风格，重视信息密度、筛选、表格、状态和批量操作。
- 小程序客户端保持温暖、自然、克制的 TDesign Mobile 风格。
- 业务流程尚未确定的部分保留 Mock 接口和事件入口，不擅自补造真实业务规则。
- 测试环境未搭建完成前，所有接口交互默认使用 Mock 数据。

## 当前阶段

- 客户端 15 个页面和预约、履约、评价闭环已完成，并保留 Mock/真实接口双模式。
- 管理后台运营页面及组织、用户、角色、菜单、字典、审计页面已完成。
- 统一认证、角色权限、数据范围、Flyway 基线和系统基础数据已接入 MySQL 8.0。
- 后端正在按 `DEVELOPMENT-PLAN.md` 第 13 节逐步将剩余内存业务查询迁移到 MySQL。
- MinIO SDK、资源种子与上传接口已完成；目标环境需提供凭据后执行实际上传验收。
