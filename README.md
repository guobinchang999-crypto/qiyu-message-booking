# 栖愈｜推拿·SPA 预约系统

栖愈是一个面向统一品牌门店的按摩预约与门店运营系统，覆盖客户线上预约、到店核销、服务履约、订单结算、会员权益和总部运营管理。

本项目后续将拆分为三个核心模块：

- `qiyu-server`：Java 后端接口
- `qiyu-admin-pro`：React + Ant Design Pro 管理后台
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
- MyBatis-Plus
- Flyway
- MySQL 8
- Redis
- Sa-Token
- Springdoc OpenAPI
- MinIO Java SDK
- Maven

### 管理后台 `qiyu-admin-pro`

- React
- TypeScript
- Umi Max
- Ant Design 5
- Ant Design Pro Components（ProLayout / ProTable / ProForm / ProCard）
- Fetch API

### 客户端 `qiyu-client`

- 微信小程序原生框架
- TypeScript
- TDesign MiniProgram
- TDesign 主题定制
- Fetch API service with an explicit Mock test mode
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
├── qiyu-admin-pro/  # Ant Design Pro / Umi Max 管理后台
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
首次初始化空库时必须设置 `ADMIN_INITIAL_PASSWORD`；启动器只会为尚无哈希的 `admin` 身份写入 BCrypt，后续启动不会覆盖已设置密码。

### MinIO 资源种子

门店、服务项目和技师图片位于 `qiyu-server/src/main/resources/media-seed/`。配置 MinIO 密码后，首次执行以下命令会创建桶、上传固定对象并回写业务表资源 URL：

```bash
export QIYU_LOCAL_MINIO_ENABLED=true
export QIYU_LOCAL_MINIO_SEED_ENABLED=true
export QIYU_LOCAL_MINIO_SECRET_KEY='从目标环境安全获取的密码'
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

资源种子使用固定对象名，可重复执行。日常启动可将 `QIYU_LOCAL_MINIO_SEED_ENABLED` 设为 `false`；用户评价图片通过 `/reviews/images` 上传到 MinIO。

#### 桶访问策略

- **本地/演示环境**：将 `QIYU_LOCAL_MINIO_PUBLIC_READ=true` 与 `QIYU_LOCAL_MINIO_ENABLED=true` 一起设置，网关会在上传时给 `qiyu-local` 桶写入 `s3:GetObject` 公开读策略，让后台和小程序直接加载对象 URL。
- **生产环境**：`public-read` 必须保持 `false`（桶保持私有），改为以下任一受控方案，而不是公开读：
  1. **预签名 URL**：接口返回 `getPresignedObjectUrl` 生成的短期签名地址（推荐，可配合 `X-Amz-Expires` 控制时效）。
  2. **CDN + 私有回源**：桶配置 CDN 私有回源鉴权，对外只暴露 CDN 域名。
  3. **受控公开桶**：仅当图片无敏感信息且允许长期公开时，用独立只读策略的最小权限桶。
- `MinioObjectStorageGateway` 的 `public-read` 开关仅用于本地演示；生产接入时按上述方案之一实现，并在接口返回 URL 前完成签名或域名替换。

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
cd qiyu-admin-pro
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
- local/dev/prod 默认使用真实后端与持久化数据；Mock 仅作为显式选择的测试模式。
- 未配置微信支付、短信或对象存储凭据时，相关真实操作失败关闭，不伪造成功结果。

## CI/CD

本项目的 CI 与 CD 使用私有仓库 [`guobinchang999-crypto/github-pipelines`](https://github.com/guobinchang999-crypto/github-pipelines) 中的 `v2` 公共流水线。业务仓库只保留运行界面、[`.github/pipeline/project.yml`](.github/pipeline/project.yml) 项目清单和各应用自己的环境配置；构建、版本校验、容器部署、健康检查和回滚由公共仓库统一维护。

### CI：检查与打包

进入 **Actions → Qiyu CI Pipeline → Run workflow**，先用 GitHub 自带的分支选择器选择代码分支，再选择一个组件：

- **Java Backend**：运行 Maven 检查并发布 `qiyu-server` GHCR 镜像。
- **Admin Console**：运行 npm 检查并发布 `qiyu-admin` GHCR 镜像。
- **WeChat Mini Program**：运行完整校验并发布可部署的 ZIP Artifact。
- **Run tests and quality checks**：非 main 分支可取消；main 和 Pull Request 始终强制执行。

Pull Request 自动识别发生变化的组件，只运行检查和 Docker 构建验证，不登录 GHCR、不发布产物，也不读取任何环境密钥。修改 CI 入口或项目清单时会检查全部组件。

版本由源码人工维护，必须使用 `X.Y.Z`：Java 读取 `qiyu-server/pom.xml`，后台和小程序读取各自 `package.json` 并校验 `package-lock.json`。main 生成正式版本，其他分支生成可覆盖的 `X.Y.Z-SNAPSHOT`。精确部署某次容器构建时，应使用 Build Result 中的不可变 Digest。

```text
ghcr.io/<owner>/qiyu-server:0.1.0
ghcr.io/<owner>/qiyu-server:0.1.0-SNAPSHOT
ghcr.io/<owner>/qiyu-admin:0.1.0
qiyu-client-0.1.0-SNAPSHOT.zip
```

main 发布前会检查 Git Tag 和 GHCR 镜像是否重复。成功后创建 `qiyu-server-vX.Y.Z`、`qiyu-admin-vX.Y.Z` 或 `qiyu-client-vX.Y.Z`；小程序正式包同时保存为 GitHub Release Asset。CI 使用仓库内置 `GITHUB_TOKEN`，无需配置 `GHCR_USERNAME` 或 `GHCR_PAT`。

### CD：选择环境并部署

进入 **Actions → Qiyu CD Pipeline → Run workflow**：

1. **Use workflow from** 保持 `main`。GitHub 固定显示这个选择器，公共流水线还会再次拒绝非 main 调用。
2. 选择 **Java Backend**、**Admin Console** 或 **WeChat Mini Program**。
3. Environment 选择 `stage` 或 `production`。
4. Reference 输入 CI 的 Build Result 给出的值。

容器支持 `X.Y.Z-SNAPSHOT`、`X.Y.Z`、`sha256:<digest>` 或本项目对应镜像的完整 GHCR Digest 地址。`production` 拒绝 Snapshot。Stage 小程序使用 `artifact:<id>` 或正式版本；Production 小程序只接受正式 `X.Y.Z`，并上传标记为 `production-candidate` 的体验版，不自动提交微信审核或发布线上版本。

Java 和后台部署在环境专属自托管 Runner 上直接执行 Docker，不使用 SSH 或 Docker Compose。流水线先完成输入校验、GHCR 登录和镜像拉取，再停止旧容器。新容器通过 Docker HEALTHCHECK 后删除回滚容器；失败时保留有限日志并自动恢复旧容器。Flyway 已执行的数据库迁移不会随容器回滚，因此数据库变更必须保持向后兼容。

后台镜像通过 `/runtime-config.js` 接收环境 API 地址，同一个镜像可以部署到不同环境。小程序上传前会写入对应环境的 HTTPS API 地址并重新计算上传源码摘要。

### 应用配置与运行时解密

Java 环境配置直接保存在应用资源目录：

```text
qiyu-server/src/main/resources/application-stage.yml
qiyu-server/src/main/resources/application-production.yml
```

数据库密码、初始管理员密码等敏感值使用 Jasypt `ENC(...)` 密文。CD 不读取或解密业务配置，只将所选 GitHub Environment 的 `CONFIG_ENCRYPTION_KEY` 作为 `JASYPT_ENCRYPTOR_PASSWORD` 注入容器，并设置同名 Spring Profile。

生成单个属性密文：

```bash
mvn jasypt:encrypt-value \
  -Djasypt.encryptor.password="$CONFIG_ENCRYPTION_KEY" \
  -Djasypt.plugin.value='actual-secret'
```

管理后台和小程序的 API 地址会下发到用户设备，因此分别放在组件自己的 `config/application-stage.json` 和 `config/application-production.json` 中，不进行无意义的前端加密。微信上传私钥是发布凭据，保存在 GitHub Environment 的 `WECHAT_UPLOAD_PRIVATE_KEY` Secret。

### 首次配置

1. 在公共 Pipeline 仓库的 **Settings → Actions → General → Access** 中允许本业务仓库调用私有 Reusable Workflows。
2. 创建 GitHub Environments：`stage`、`production`，各添加 Secret `CONFIG_ENCRYPTION_KEY`。Production 配置 Required Reviewers，并只允许 main 部署。
3. 准备 Linux x86_64 自托管 Runner：Stage 标签为 `qiyu-stage`，Production 标签为 `qiyu-production`。容器 Runner 需安装 Docker，并允许 Runner 用户无需 `sudo` 操作 Docker。
4. MySQL、Redis 和 MinIO 位于宿主机时，配置中的主机使用 `host.docker.internal`；宿主机服务必须监听 Docker 网桥可达地址。
5. 若部署小程序，在两个 Environment 中配置 `WECHAT_UPLOAD_PRIVATE_KEY`，并将固定出口 Runner 的公网 IP 加入微信代码上传白名单。

Java 固定映射 `8080:8080`，后台固定映射 `8001:80`。Stage 与 Production 使用同一个微信 AppID；前者上传体验版，后者上传候选体验版。


## 当前阶段

- 客户端 15 个页面和预约、履约、评价闭环已完成，并保留 Mock/真实接口双模式。
- 管理后台运营页面及组织、用户、角色、菜单、字典、审计页面已完成。
- 统一认证、角色权限、数据范围、Flyway 基线和系统基础数据已接入 MySQL 8.0。
- 后端正在按 `DEVELOPMENT-PLAN.md` 第 13 节逐步将剩余内存业务查询迁移到 MySQL。
- MinIO SDK、资源种子与上传接口已完成；目标环境需提供凭据后执行实际上传验收。
