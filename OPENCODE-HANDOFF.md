# 栖愈预约系统 OpenCode 开发交接文档

> 交接日期：2026-08-31  
> 工作目录：`/Users/chang/IdeaProjects/qiyu-massage-booking`  
> 当前分支：`main`  
> 当前 HEAD：`05ad20b`（与 `origin/main` 一致）  
> 重要说明：HEAD 之后存在大量未提交开发成果，接手时必须以当前工作树为准，不能只以远端仓库为准。

## 1. 交接目标

本项目需要继续完成一个统一品牌的按摩预约系统，包含：

- `qiyu-server`：Spring Boot 后端、MySQL、Redis、MinIO、认证授权和数据权限。
- `qiyu-admin-pro`：React + TypeScript + Ant Design Pro 管理后台。
- `qiyu-client`：微信小程序原生框架 + TypeScript + TDesign MiniProgram 客户端。

用户已明确要求：

1. local/dev/prod 必须使用真实后端与真实持久化数据，不能在接口失败时自动回退 Mock。
2. Mock 只能保留为显式测试模式和测试夹具。
3. 后端数据库访问使用 MyBatis-Plus，禁止使用 `JdbcTemplate` 或手写 JDBC。
4. 后端接口不使用 `/api/v1` 前缀，当前接口直接从 `/auth`、`/admin`、`/bookings` 等路径开始。
5. API 返回值必须使用明确 DTO/VO，不允许用 `Map<String, Object>` 作为正式 API 契约。
6. 后端遵循 COLA Light 分层，Controller 保持轻薄。
7. 后端类和方法需要英文注释，核心业务逻辑需要解释业务意图和边界。
8. 数据字典、菜单、权限、运营文案等不能写死在前端，前端通过后端接口获取。
9. 数据权限必须由服务端强制执行，不能只依赖前端隐藏菜单或按钮。
10. 完成系统基础数据初始化，并将业务图片等资源上传到 MinIO。
11. 最终需要跑通管理后台和微信小程序的真实业务闭环。

## 2. 接手前必须阅读

按顺序阅读：

1. `AGENTS.md`
2. `README.md`
3. `DEVELOPMENT-PLAN.md`
4. `design/UI-DESIGN-SYSTEM.md`
5. `design/CODEX-UI-DEVELOPMENT-PROMPT.md`
6. `design/UI-ACCEPTANCE-CHECKLIST.md`
7. `skills/cola-architecture/SKILL.md`

注意：`DEVELOPMENT-PLAN.md` 第 1 至 12 节包含项目早期的 Mock 阶段规划，其中“默认 Mock”“保留接口失败回退”和 `/api/v1` 等描述已经过时。当前状态以该文档第 13 节、项目源码及本交接文档为准。`DEVELOPMENT-REMAINING-WORK.md` 也记录了较多历史过程，其中一些 `/api/v1`、Mock 默认和内存实现描述已经不再准确。

## 3. 当前 Git 状态

当前 `main` 的 HEAD 与远端一致，但工作树非常脏：

- 约 122 个已跟踪文件有修改。
- 约 7,900 行新增、2,000 行删除（仅 `git diff --stat` 的已跟踪文件统计）。
- 后端存在大量新增且尚未跟踪的 Controller、Application Service、Repository、Mapper、Entity、Flyway 文件和测试。
- 管理后台旧 Mock 数据文件已删除，新增多个真实接口 service 文件。
- 小程序远程服务和业务流程有大量未提交改动。

接手规则：

- 不要执行 `git reset --hard`、`git checkout -- .`、`git clean` 或重新 clone 后覆盖当前目录。
- 先执行 `git status --short` 和 `git diff --stat` 了解当前改动。
- 当前工作树中的成果尚未推送到远端，继续开发并验证后应统一提交。
- `qiyu-admin-pro/src/.umi/appData.json` 有大量生成内容变化，提交前应确认是否需要纳入版本控制。

## 4. 当前运行状态

交接时本机服务状态：

- 后端：`http://localhost:8080`，Java 进程 PID `47648`。
- 管理后台：`http://localhost:8000`，Node 进程 PID `18380`。
- 后端健康检查：`GET http://localhost:8080/health`。
- OpenAPI：`http://localhost:8080/swagger-ui.html`。
- 管理员账号：`admin`；初始密码由 `ADMIN_INITIAL_PASSWORD` 注入，不要写入仓库。

重要：当前运行中的后端 JVM 启动早于最新的“角色显式 DENY”代码，因此它没有加载工作树中的最后一批权限代码。接手后的第一项运行操作应是停止 PID `47648`，使用 local profile 重新启动后端。

## 5. 基础设施与本地配置

### 5.1 MySQL

- 地址：`192.168.31.100:3306`
- 数据库：`qiyu_booking`
- 用户名默认：`root`
- 密码通过 `QIYU_LOCAL_DB_PASSWORD` 注入，不要提交明文。
- local profile 会执行 Flyway：`classpath:db/flyway`。
- 已真实连接并执行过基础迁移、登录、收藏、余额和数据权限可逆验证。

### 5.2 Redis

- 地址：`192.168.31.100:6379`
- 密码通过 `QIYU_LOCAL_REDIS_PASSWORD` 注入。
- 已用于真实短信验证码存取和单次消费验证。

### 5.3 MinIO

- API：`http://192.168.31.100:9000`
- Console：`http://192.168.31.100:9001`
- Access Key 默认：`minioadmin`
- Secret Key 仍未提供给当前开发会话；目标机保存位置为 `/opt/compose-stack/.env` 的 `MINIO_ROOT_PASSWORD`。
- Secret Key 通过 `QIYU_LOCAL_MINIO_SECRET_KEY` 注入。
- 默认桶：`qiyu-local`。
- 当前代码具备 SDK、固定对象名上传、资源种子和评价图片上传入口，但尚未在目标 MinIO 完成真实上传验收。

### 5.4 local 启动

不要把密码写进受版本控制文件。推荐创建未跟踪的 `qiyu-server/.env.local`：

```bash
cd qiyu-server
cp .env.local.example .env.local
# 在 .env.local 中填写本机凭据
set -a
source .env.local
set +a
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

需要执行 MinIO 种子时额外设置：

```bash
export QIYU_LOCAL_MINIO_ENABLED=true
export QIYU_LOCAL_MINIO_SEED_ENABLED=true
export QIYU_LOCAL_MINIO_SECRET_KEY='从安全位置读取'
```

## 6. 数据库现状

### 6.1 DDL 与迁移

- 完整参考 DDL：`qiyu-server/src/main/resources/schema-mysql8.sql`
- Flyway 主目录：`qiyu-server/src/main/resources/db/flyway/`
- 当前迁移：`V1` 至 `V12`
- `V1__initial_schema.sql`：结构基线。
- `V2__base_data.sql`：系统用户、角色、权限、菜单、组织、字典和业务基础数据。
- `V3__booking_and_review_demo_data.sql`：预约和评价演示数据。
- `V4__remove_api_version_prefix.sql`：移除旧接口前缀相关配置。
- `V5__customer_booking_permissions.sql`：客户端预约权限。
- `V6` 至 `V12`：客户端 catalog、支付默认值清理、门店展示数据、资源种子补齐、房间备注、反馈命名、服务收藏等增量。

另有 `qiyu-server/src/main/resources/db/migration/V2__data_permission.sql`，它不在当前 local Flyway locations 中。接手时要确认其内容是否已经完整合并到 `db/flyway`/`schema-mysql8.sql`，避免维护两套迁移路径。

### 6.2 数据表范围

当前结构已经覆盖：

- 系统：`sys_user`、`sys_user_identity`、`sys_role`、`sys_permission`、`sys_menu`、`sys_dept`、角色/用户权限关系、角色/用户数据范围关系、会话、审计日志。
- 组织：`region`、`store`、`staff`。
- 资源：服务分类、服务项目、门店项目、技师、技师技能/服务/排班/请假、房间、营业日、资源占用、时间槽快照。
- 客户与会员：客户、联系人、门店关系、会员账户、余额流水、套餐卡、优惠券、收藏。
- 预约履约：预约、预约状态日志、签到、服务订单、服务订单日志。
- 支付：支付单、退款单（当前主要为边界预留，真实微信支付尚未接入）。
- 评价：评价、评价标签、评价图片。
- 报表：门店/技师/服务日指标、报表任务记录。

DDL 已按用户要求：

- 表名不使用 `qy_` 前缀。
- 不设置数据库外键。
- `KEY`/`UNIQUE KEY` 是索引，不是外键，仍然保留用于查询和唯一性约束。
- 字段应带中文 `COMMENT`；后续新增迁移需同步维护注释。

## 7. 后端已完成内容

### 7.1 架构和通用约束

- 使用 Java 21、Spring Boot 3、MyBatis-Plus、Flyway、MySQL、Redis、Sa-Token、MinIO SDK。
- 采用 `adapter/application/domain/infrastructure` 的 COLA Light 包结构。
- Controller 不直接访问 Mapper。
- 多处原有 `Map<String, Object>` 数据库投影和 API 返回已经迁移为类型化 Projection/DTO/VO。
- API 已去掉 `/api/v1`，主要路径为 `/auth`、`/catalog`、`/stores`、`/services`、`/therapists`、`/time-slots`、`/bookings`、`/reviews`、`/member`、`/admin`。

### 7.2 统一认证

- 管理员账号使用用户名密码登录。
- 客户端手机号验证码登录走同一套认证入口和身份上下文。
- MySQL 保存用户、身份和权限关系。
- Redis 保存短信验证码，验证码已验证为单次消费，重复使用会失败。
- `GET /auth/me` 返回当前身份和有效权限上下文。
- `POST /auth/logout` 退出会话。
- 管理员初始密码只在数据库尚无哈希时由启动器写入 BCrypt，不会在每次启动覆盖。

### 7.3 功能权限与数据权限

服务端已有权限上下文和数据过滤基础实现：

- 功能权限支持角色和用户级 `ALLOW`/`DENY`，`DENY` 优先。
- 数据范围类型：`NONE`、`SELF`、`PRIMARY_STORE`、`ASSIGNED_STORES`、`REGION_STORES`、`ALL_STORES`。
- 用户级覆盖支持门店 ID、区域 ID、`validFrom`、`validUntil`。
- 用户级覆盖可以删除并恢复角色默认范围。
- 列表、看板、客户、会员、报表、技师、排班等后台查询已逐步接入服务端解析的 `StoreAccess`。
- `SELF` 查询已按当前账号关联的 `therapistId` 过滤，不再仅按门店过滤。
- 客户手机号支持按字段权限完整显示或脱敏。
- 敏感操作和系统管理操作写入审计日志。

系统管理新增真实接口：

- `GET /admin/system/users/{id}/data-scope`
- `PUT /admin/system/users/{id}/data-scope`
- `DELETE /admin/system/users/{id}/data-scope`
- `GET /admin/system/data-scope-options`
- 组织、用户、角色、菜单、字典 CRUD 和审计日志查询。
- 用户密码重置入口。

真实 MySQL 已做过的可逆验证：

- 用户 `9002` 临时授予静安寺店和徐家汇店并设置有效期，读回数据与写入一致。
- 清除用户级覆盖后，`9002` 恢复角色默认 `PRIMARY_STORE`，返回 `inherited: true`。
- 经理列表只返回主门店数据。
- 技师/员工列表只返回当前技师关联记录。
- 员工看到的客户手机号已脱敏。
- 经理跨店写操作被拒绝。

### 7.4 客户端真实业务接口

已实现或接入的主要流程：

- catalog、门店、服务项目、技师、房间选项、时间槽。
- 预约确认摘要、创建、列表、详情、成功页。
- 再次预约草稿、改期草稿和改期提交。
- 取消、签到、刷新预约码。
- 支付参数准备和支付确认边界。
- 开始服务、完成服务、结算状态流转。
- 评价列表、提交和图片上传入口。
- 会员资料、门店收藏、服务收藏。

已完成真实 Redis/MySQL 验证：

- 短信验证码发送、登录、验证码重放拒绝。
- 服务收藏新增、查询、删除。
- 会员余额调整幂等：同一业务键重复请求不重复入账；测试后余额已恢复。

### 7.5 管理后台业务接口

已具备：

- 看板、预约、客户、会员、优惠券、门店、报表、技师、排班资源、可访问门店查询。
- 后台创建预约和改期。
- 门店、服务项目、技师、房间、排班 CRUD。
- 会员余额调整。
- 优惠券模板 CRUD。
- 系统组织、用户、角色、菜单、字典、审计管理。

## 8. 管理后台已完成内容

- React + TypeScript + Ant Design Pro/Ant Design 5 工程可启动。
- 当前默认连接真实后端，不再以 Mock 作为正常运行时回退。
- 已删除旧的 `src/mock/data.ts`、`services/mock.ts`、`services/system-mock.ts`。
- 页面覆盖看板、门店、预约、核销、服务订单、排班、技师、服务项目、房间、客户、会员、优惠券、报表和系统管理。
- 有真实登录态守卫、过期处理、角色菜单过滤和退出登录。
- 系统用户页支持数据范围编辑：本人、本门店、指定门店、区域及下级、全部门店、禁止访问、有效期和恢复角色默认。
- 角色页已增加允许权限和禁止权限两组字段及标签展示。
- 门店、服务、技师、房间、排班、会员余额和优惠券页面已经接入对应真实 service。

最近一次已知验证：

- `npm run typecheck` 通过。
- `npm run build` 通过。
- 管理后台 dev server 返回 HTTP 200。
- `admin` 登录后能进入后台。

## 9. 微信小程序已完成内容

- 15 个设计页面均已创建并注册：登录、首页、门店列表、门店详情、服务列表、服务详情、选择技师、选择时间、确认预约、预约成功、订单列表、预约详情、到店签到、服务评价、我的。
- 使用真实 WXML/WXSS/TDesign 组件，不以效果图作为整页背景。
- 预约草稿在门店、服务、技师、时间变化时会清理不兼容旧选择。
- 支持加载、错误、空态、重试、提交中禁用和重复点击锁。
- 预约、改期、取消、签到、支付边界、评价、图片上传、收藏和个人资料均有真实远程 service 映射。
- 页面路由、TabBar、状态枚举和大部分展示字典已集中管理。
- dev/prod 模式调用真实后端；Mock 仅保留显式测试模式。

最近一次完整 `npm run verify` 已通过，覆盖：

- TypeScript 检查和 JS 输出同步。
- 15 页注册、组件声明、路由与 TabBar 一致性。
- 产品边界、登录表单、首页推荐、定位入口、订单状态。
- 预约草稿、时间槽、创建/改期分流、签到/取消/预约码。
- 评价图片、评价提交回流和支付工具。

源码检查不能代替微信开发者工具和真机验收，这部分仍未完成。

## 10. 测试与验证现状

最近一次完整验证结果：

- 后端 `mvn test -q`：通过（发生在最新角色 DENY 改动之前）。
- 后端最新角色 DENY 改动：`mvn -q -DskipTests compile` 通过。
- 管理后台 `npm run typecheck`：通过。
- 管理后台 `npm run build`：通过，包含最新角色 DENY UI。
- 小程序 `npm run verify`：通过。
- `git diff --check`：在角色 DENY 改动之前通过。

现有测试：

- `qiyu-server/src/test/java/com/qiyu/QiyuServerApplicationTests.java`
- `qiyu-server/src/test/java/com/qiyu/application/auth/DataPermissionServiceTests.java`
- `qiyu-server/src/test/java/com/qiyu/application/member/CustomerFavoriteServiceTest.java`
- `qiyu-server/src/test/java/com/qiyu/application/member/MemberBalanceServiceTest.java`
- `qiyu-admin-pro`：`npm run typecheck` 与 `npm run build`（后台接口已由根目录 `scripts/smoke-api.mjs` 覆盖）
- `qiyu-client/scripts/smoke-*.mjs`
- 根目录 `scripts/smoke-api.mjs`

## 11. 当前正在进行但尚未完成的改动

### 11.1 角色显式 DENY

代码已经实现：

- `SystemModels.Role` / `RoleCommand` 增加 `deniedPermissionCodes`。
- 角色查询 SQL 分别聚合 `ALLOW` 和 `DENY`。
- 保存角色时分别写入两种 effect。
- 同一权限同时出现在允许和禁止集合时拒绝保存。
- 管理后台角色页可编辑和展示禁止权限。

尚未完成：

1. 重启后端加载最新代码。
2. 在真实 MySQL 创建一次性测试角色，验证允许/禁止权限读回。
3. 验证 allow/deny 重叠请求返回 400 且不产生脏角色。
4. 删除一次性角色，保证测试可逆。
5. 补跑完整 `mvn test -q` 和 `git diff --check`。

推荐真实验证使用全新随机角色编码，不修改现有生产式角色。

### 11.2 数据范围严格校验缺陷

`SystemManagementRepository.normalizedScopeType()` 当前对未知值调用 `scopeType(value)`；而 `scopeType()` 的默认分支返回 `SELF`。因此非法字符串可能被静默解释为“本人”，预期的“数据范围类型不正确”永远不会触发。

需要修复：

- 只接受六种英文枚举和五/六种明确中文标签。
- 增加中文“禁止访问”到 `NONE` 的映射。
- 未知值必须抛出 `IllegalArgumentException`。
- 增加单元或接口测试，证明非法值返回 400。

关键文件：`qiyu-server/src/main/java/com/qiyu/infrastructure/system/SystemManagementRepository.java`。

## 12. 未完成工作清单

### P0：数据权限与安全闭环

1. 完成第 11 节角色 DENY 和严格范围校验。
2. 为店长、技师、区域经理创建经用户确认的测试凭据，完成真实登录级多角色验收。当前这些身份的密码哈希为空；不要未经确认直接修改现有账号密码。
3. 覆盖列表、详情、创建、修改、取消、签到、履约、报表和导出的一致数据过滤。
4. 对伪造 `storeId`、跨店详情 ID、跨店写操作、跨区域筛选做端到端拒绝测试。
5. 补齐导出接口和 `appointment.export`、`customer.export`、`report.export` 等权限检查；目前导出能力不完整。
6. 核查手机号完整查看的审计行为。当前列表逐条记录可能产生大量审计日志，应调整为请求级或明确的“揭示手机号”操作级审计。
7. 检查打印、统计、看板是否与列表复用同一数据权限组件，确保先过滤原始数据再聚合。
8. 评估并补齐用户级 `sys_user_permission` 的后台 ALLOW/DENY 管理；当前角色级 DENY 有 UI，用户级表和认证引擎存在，但后台配置入口不完整。

### P0：去除真实运行时 Mock/内存实现

代码中仍存在以下显式 Mock/内存实现：

- `infrastructure/mock/InMemoryBookingGateway`
- `infrastructure/mock/MockCatalogGateway`
- `infrastructure/mock/MockCatalogProvider`
- `infrastructure/mock/MockCustomerLookupGateway`
- `infrastructure/catalog/MockCatalogMapper`
- `infrastructure/catalog/MockClientCatalogGateway`
- `infrastructure/coupon/MockCouponGateway`
- `infrastructure/member/MockMemberProfileGateway`
- `infrastructure/admin/InMemoryStoreManagementRepository`
- `infrastructure/room/InMemoryRoomManagementRepository`
- `infrastructure/serviceitem/InMemoryServiceManagementRepository`

接手者需要逐一检查它们的 Spring profile/条件装配：

- `mock` profile 可以保留。
- local/dev/prod 不得注入这些实现。
- 接口异常不得自动回退到 Mock。
- 预约、评价、会员、支付准备和后台运营查询必须确认真实 Repository 覆盖完整。

正式 API 边界的 `Map<String, Object>` 大部分已清理，但显式 Mock Provider 仍大量使用 Map。用户的要求是正式 API 不能使用 Map；建议也将 Mock fixture 逐步改为类型化测试模型，降低契约漂移。`AuditLogService` 中的 Map 用于 before/after JSON 快照，不是 HTTP 返回值，可以保留或改为明确审计快照类型。

### P0：MinIO 资源迁移

1. 从安全位置取得 MinIO Secret Key，不得提交到 Git。
2. 启用 `QIYU_LOCAL_MINIO_ENABLED` 和 `QIYU_LOCAL_MINIO_SEED_ENABLED`。
3. 启动后端，让 `MediaSeedRunner` 创建桶并上传 `media-seed` 下 9 张图片。
4. 验证对象名幂等、数据库 URL 回写、门店/服务/技师接口返回真实 URL。
5. 验证管理后台和微信小程序能够加载图片。
6. 设计生产桶访问策略。当前 `public-base-url` 是直接对象 URL，需明确私有桶签名 URL、CDN 或受控公开读方案。
7. 验证评价图片 multipart 上传、大小/类型限制、失败处理和数据库 `review_image` 持久化。

### P0：管理后台真实业务闭环

1. 逐页确认没有 Mock 回退，接口错误要展示错误态和重试。
2. 预约管理补齐完整改期、更换技师、分配房间和资源冲突提示。
3. 到店核销补齐失败态、重复提交保护、批量操作和审计展示。
4. 服务订单补齐签到后分配房间、开始服务、完成服务、待结算和结算全链路。
5. 门店、服务、技师、房间、排班 CRUD 做真实数据回读和刷新验证。
6. 客户、会员、余额、优惠券做边界校验、幂等和审计。
7. 看板和报表增加时间、门店筛选，校验数据范围后聚合。
8. 增加导出功能与权限控制。
9. 所有页面补齐加载、空态、错误、禁用、提交中和权限不足状态。
10. 使用浏览器对主要页面做桌面截图验收，检查表格、Drawer、Modal、长文本和窄屏布局。

### P0：微信小程序真实业务闭环

1. 在微信开发者工具导入 `qiyu-client` 并执行“构建 npm”。
2. 使用 dev 模式连接 `http://localhost:8080`（需要开发者工具合法域名/不校验配置）。
3. 用真实验证码登录，完成门店 -> 服务 -> 技师 -> 时间 -> 确认 -> 创建预约。
4. 验证订单详情、预约码刷新、签到、后台履约、完成、评价回流。
5. 验证收藏门店和服务真实持久化。
6. 验证手机号输入键盘、验证码倒计时、弱网、重复点击和 token 失效。
7. 验证定位拒绝、地图选择、导航、拨号、分享和客服等微信能力。
8. 对照 `design/` 中 15 张效果图和 `UI-ACCEPTANCE-CHECKLIST.md` 做常用机型截图验收。
9. 当前支付只保留真实适配器边界，未取得微信商户配置前必须失败关闭，不能模拟支付成功作为生产实现。

### P1：生产化

1. OpenAPI 全接口契约回归测试。
2. 请求追踪 ID、结构化日志、指标、告警和更完整健康检查。
3. Redis 会话、验证码、幂等键和热点缓存的 TTL/失效策略梳理。
4. Flyway 发布校验、MySQL 备份恢复演练。
5. MinIO 生命周期、备份和访问控制。
6. CI：后端测试、后台 typecheck/build、小程序 verify、DDL/Flyway 校验、依赖漏洞扫描。
7. 真实微信支付、退款、套餐核销和财务结算必须等业务规则和商户资质明确后实施。

## 13. 建议接手执行顺序

### 第 1 批：保护当前成果并恢复可验证运行态

```bash
git status --short
git diff --check
```

停止旧后端，加载 local 环境变量后重启。确认：

```bash
curl http://localhost:8080/health
```

不要先整理大范围代码或生成文件，先确保当前成果能运行。

### 第 2 批：完成权限改造收尾

1. 修复非法数据范围静默变 `SELF`。
2. 做角色 ALLOW/DENY 真实库可逆测试。
3. 运行后端完整测试。
4. 增加详情、导出、报表和敏感字段测试。

### 第 3 批：确认 local 完全不使用 Mock

按 Bean/profile 逐项审计所有 `Mock*` 和 `InMemory*` 类，随后使用真实 MySQL/Redis 跑根目录 API smoke。发现真实实现缺失时优先补 Repository，而不是增加回退。

### 第 4 批：MinIO

取得密钥后执行资源种子和评价图片真实上传验收。没有密钥时不要阻塞其他主线，但需保留明确未完成状态。

### 第 5 批：三端端到端

1. 后台完成创建/排班/房间/履约。
2. 小程序完成预约、签到、评价。
3. 不同角色验证数据范围和字段脱敏。
4. 执行浏览器和微信开发者工具视觉验收。

### 第 6 批：提交

完成一轮稳定验证后再提交。提交前至少执行：

```bash
cd qiyu-server && mvn test
cd ../qiyu-admin-pro && npm run typecheck && npm run build
cd ../qiyu-client && npm run verify
cd .. && git diff --check
```

检查 `.env.local`、日志、密钥、IDE 临时文件和不应提交的 Umi 生成物没有进入提交。

## 14. 关键文件索引

### 后端认证与权限

- `qiyu-server/src/main/java/com/qiyu/application/auth/`
- `qiyu-server/src/main/java/com/qiyu/application/auth/DataPermissionService.java`
- `qiyu-server/src/main/java/com/qiyu/application/auth/DbAuthPrincipalProvider.java`
- `qiyu-server/src/main/java/com/qiyu/infrastructure/persistence/mapper/AuthAccessMapper.java`
- `qiyu-server/src/main/java/com/qiyu/infrastructure/system/SystemManagementRepository.java`
- `qiyu-server/src/main/java/com/qiyu/infrastructure/persistence/mapper/SystemManagementMapper.java`
- `qiyu-server/src/main/java/com/qiyu/adapter/system/SystemManagementController.java`

### 后端业务

- `qiyu-server/src/main/java/com/qiyu/adapter/booking/BookingController.java`
- `qiyu-server/src/main/java/com/qiyu/application/booking/BookingAppService.java`
- `qiyu-server/src/main/java/com/qiyu/application/admin/AdminQueryService.java`
- `qiyu-server/src/main/java/com/qiyu/infrastructure/persistence/mapper/AdminOperationsMapper.java`
- `qiyu-server/src/main/java/com/qiyu/adapter/review/ReviewController.java`
- `qiyu-server/src/main/java/com/qiyu/infrastructure/media/MediaSeedRunner.java`

### 管理后台

- `qiyu-admin-pro/src/services/http.ts`
- `qiyu-admin-pro/src/services/remote.ts`
- `qiyu-admin-pro/src/services/system-service.ts`
- `qiyu-admin-pro/src/layouts/AdminLayout.tsx`
- `qiyu-admin-pro/src/pages/System/Users/index.tsx`
- `qiyu-admin-pro/src/pages/System/Roles/index.tsx`

### 微信小程序

- `qiyu-client/miniprogram/services/config.ts`
- `qiyu-client/miniprogram/services/http.ts`
- `qiyu-client/miniprogram/services/booking-service.ts`
- `qiyu-client/miniprogram/services/remote-service.ts`
- `qiyu-client/miniprogram/store/booking.ts`
- `qiyu-client/miniprogram/constants/navigation.ts`

## 15. 已知风险和注意事项

- 当前改动量很大且未提交，任何清理工作树的操作都可能造成不可恢复的数据损失。
- 运行中的后端不是最后源码版本，必须重启后再判断接口行为。
- 历史文档包含已过时的 Mock 和 `/api/v1` 描述，不能机械照搬。
- 真实多角色登录验收缺少经确认的测试密码；不要擅自修改现有员工凭据。
- MinIO 缺 Secret Key，资源迁移尚未完成。
- 角色 DENY 已编译但未完成真实数据库验收。
- 数据范围非法值静默回退 `SELF` 是明确缺陷，优先修复。
- `CouponManagementController` 等少数新增类代码格式和方法注释仍不符合用户要求，需要继续整理。
- 正式业务代码仍需继续搜索 `Map<String, Object>`；审计 JSON 快照与显式 Mock fixture 可区别处理，HTTP 返回契约必须类型化。
- 需要确认评价列表图片 URL 已从持久化数据完整回读；当前 `ReviewController` 已携带 `imageUrls`，仍应加入接口回归测试防止再次丢失。
- 不要将微信支付占位实现改成模拟成功；外部凭据未配置时应明确失败。

## 16. 当前完成度判断

从“页面和接口骨架”角度，三个模块主体已经存在；从“无需 Mock、真实数据、权限可靠、资源完整、可上线验收”的最终目标判断，项目仍未完成。

粗略剩余工作量：

- 权限与安全闭环：约 3 至 5 人日。
- local 真实 Repository/Mock 清理和接口契约：约 4 至 7 人日。
- MinIO 上传与资源验收：取得密钥后约 1 至 2 人日。
- 管理后台逐页真实流程和异常态：约 7 至 12 人日。
- 小程序开发者工具/真机联调和 UI 修复：约 5 至 8 人日。
- 自动化、部署和生产化基础：约 5 至 10 人日。

以上是单人连续开发的工程估算，不包含等待微信支付资质、短信供应商、正式域名、证书和产品规则确认的时间。接手时应优先完成 P0 闭环，不要同时扩展复杂营销、财务或多经营主体模型。
