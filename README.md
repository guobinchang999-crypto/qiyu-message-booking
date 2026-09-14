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

CI 与 CD 分开维护：`.github/workflows/ci.yml` 负责检查和打包，`.github/workflows/cd-java.yml` 负责将已经发布的 Java 后端镜像部署到所选环境。CD 不重新编译源码，也不使用 Docker Compose。

### 手动打包

进入仓库的 **Actions → Qiyu CI Pipeline → Run workflow**，先用 GitHub 自带的分支下拉框选择代码分支，再从 **Select component to build** 下拉框中选择一个组件。默认选择 **Java Backend**：

- **Java Backend**：构建并推送 `qiyu-server` Docker 镜像。
- **Admin Console**：构建并推送 `qiyu-admin` Docker 镜像。
- **WeChat Mini Program**：生成可以导入微信开发者工具的 ZIP Artifact。
- **Run tests and quality checks**：非 main 分支可以取消；main 分支始终强制执行。

手动运行每次打包一个组件，并始终以 **Build Result** 作为最后一个节点。成功后，该节点会集中显示源码版本、提交、镜像地址、不可变 Digest 地址、GHCR 页面链接和拉取命令；小程序则显示 Artifact 下载链接和摘要。Pull Request 会自动识别变化的组件并执行检查，可同时检查多个组件；它不会登录 GHCR，也不会发布任何产物。修改统一 CI 工作流时会检查全部组件。

### 版本与产物

版本由源码维护，CI 不自动修改版本：

- Java 后端：`qiyu-server/pom.xml` 的 Maven `project.version`。
- 管理后台：`qiyu-admin-pro/package.json`，并与 `package-lock.json` 保持一致。
- 微信小程序：`qiyu-client/package.json`，并与 `package-lock.json` 保持一致。

版本必须使用 `X.Y.Z` 格式。更新前端版本时，在对应目录执行 `npm version patch --no-git-tag-version` 可以同时更新两个 npm 文件。

main 分支产物直接使用源码版本，例如：

```text
ghcr.io/<repository-owner>/qiyu-server:0.1.0
ghcr.io/<repository-owner>/qiyu-admin:0.1.0
qiyu-client-0.1.0.zip
```

非 main 分支只增加 Snapshot 后缀，例如：

```text
ghcr.io/<repository-owner>/qiyu-server:0.1.0-SNAPSHOT
ghcr.io/<repository-owner>/qiyu-admin:0.1.0-SNAPSHOT
qiyu-client-0.1.0-SNAPSHOT.zip
```

Snapshot 标签允许覆盖，方便 CD 始终通过确定的版本标签部署最新一次 Snapshot 构建。需要锁定某次构建时，使用 **Build Result** 中的 `ghcr.io/...@sha256:...` 不可变地址。Docker Action 自带的构建摘要和 `.dockerbuild` 记录已关闭，避免它们覆盖主要交付信息。

main 发布前会检查组件 Git Tag 和 GHCR 镜像标签是否重复。发布成功后创建 `qiyu-server-vX.Y.Z`、`qiyu-admin-vX.Y.Z` 或 `qiyu-client-vX.Y.Z` 标签；再次发布相同组件版本会失败。

### Java 后端部署

进入 **Actions → Qiyu Java CD Pipeline → Run workflow**：

1. 保持 GitHub 固定显示的 **Use workflow from** 为 `main`。它表示从哪个 Git 分支读取 CD 工作流定义，并不表示部署哪个版本的应用；GitHub 的原生界面无法隐藏此选择器。工作流会在 GitHub 托管 Runner 上先校验该值，非 `main` 时不会进入自托管服务器。
2. 在 **Deployment environment** 下拉框中选择目标环境。选项直接来自仓库 **Settings → Environments**。
3. 在 **Image version or digest** 中填写以下任一形式：

```text
0.0.1-SNAPSHOT
0.0.1
sha256:<64位小写十六进制摘要>
ghcr.io/<repository-owner>/qiyu-server@sha256:<64位小写十六进制摘要>
```

CD 只允许部署当前仓库所属账号下的 `qiyu-server` 镜像。版本输入会转换为完整 GHCR 地址，Digest 输入用于精确重放或回滚某一次构建。GitHub 的手动运行界面不能动态读取 GHCR 标签，因此版本或 Digest 使用文本输入。

环境名同时决定配置和目标服务器：任务声明对应的 GitHub Environment，因此自动读取该环境下的 Variables/Secrets；任务只会发送到带有 `qiyu-<环境名>` 标签的 Linux x86_64 自托管 Runner。例如，`stage` 对应 `qiyu-stage`，`production` 对应 `qiyu-production`。不同环境使用独立并发锁，可以同时部署；同一环境的部署会排队。

脚本会先拉取镜像，再停止并保留当前容器；新容器在 180 秒内通过 `/actuator/health` 检查后才删除旧容器。启动失败或健康检查失败时会自动恢复旧容器，并将工作流标记为失败。Flyway 已执行的数据库迁移不会被容器回滚撤销，因此迁移必须保持向后兼容。

目标服务器上的 MySQL、Redis 和可选 MinIO 通过 `host.docker.internal` 访问。部署命令会自动添加 `host.docker.internal:host-gateway`，宿主机服务仍需监听 Docker 网桥可达地址，并允许来自 Docker 网桥的连接。容器默认使用 `db` profile，可在对应 Environment 中通过 `SPRING_PROFILE` 修改；端口映射为 `8080:8080`，重启策略为 `unless-stopped`。

部署成功或失败后，任务 Summary 会显示目标环境、操作者、输入值、完整镜像地址、不可变 Digest、健康状态、回滚状态和应用入口。

### GitHub 配置

在仓库 **Settings → Secrets and variables → Actions** 配置仓库级参数，以便手动打包任意分支。

Variables（非私密）：

| 名称 | 说明 |
| --- | --- |
| `GHCR_USERNAME` | 创建 `GHCR_PAT` 的 GitHub 用户名 |

Secrets（私密）：

| 名称 | 说明 |
| --- | --- |
| `GHCR_PAT` | GitHub Container Registry 访问令牌，需要 `write:packages` 权限；需要删除镜像时再增加 `delete:packages` |

main 发布标签需要工作流具有 `contents: write` 权限。如果仓库将 Actions 默认权限限制为只读，需要在 **Settings → Actions → General → Workflow permissions** 允许工作流写入仓库内容。小程序 Artifact 保留30天。

### Java CD 环境配置

每新增一个部署环境，都按以下约定配置：

1. 在该环境的 Linux x86_64 服务器安装 Docker，确保部署用户无需 `sudo` 即可执行 `docker ps`。
2. 在 **Settings → Actions → Runners → New self-hosted runner** 注册服务器，添加 `qiyu-<环境名>` 标签，并将 Runner 安装成系统服务。当前 Stage 演示服务器已注册为 `qiyu-stage`。
3. 创建同名 GitHub Environment，例如 `stage` 或 `production`，并在 **Deployment branches and tags** 中只允许 `main`。
4. 在每个 Environment 中使用下列同名 Variables 和 Secrets，并填写该环境自己的值。仓库已有的 `GHCR_USERNAME` 与 `GHCR_PAT` 继续复用；CD 只需要读取私有镜像。

Variables：

| 名称 | 必填 | 说明 |
| --- | --- | --- |
| `APP_BASE_URL` | 是 | 当前环境的服务入口，例如 `http://<server>:8080` |
| `QIYU_DB_URL` | 是 | 使用 `host.docker.internal` 的完整 JDBC URL |
| `QIYU_REDIS_PORT` | 否 | Redis 端口，默认 `6379` |
| `SPRING_PROFILE` | 否 | Spring Profile，默认 `db` |
| `JAVA_OPTS` | 否 | JVM 参数；省略时使用镜像默认值 |
| `QIYU_MINIO_ENABLED` | 否 | 默认 `false` |
| `QIYU_MINIO_ENDPOINT` | 启用 MinIO 时 | MinIO S3 API 地址 |
| `QIYU_MINIO_BUCKET` | 启用 MinIO 时 | 桶名称 |
| `QIYU_MINIO_PUBLIC_BASE_URL` | 否 | 对外资源 URL 前缀 |
| `QIYU_MINIO_PUBLIC_READ` | 否 | 默认 `false` |
| `QIYU_MINIO_SEED_ENABLED` | 否 | 默认 `false` |

Secrets：

| 名称 | 必填 | 说明 |
| --- | --- | --- |
| `QIYU_DB_USERNAME` | 是 | 当前环境的数据库用户名 |
| `QIYU_DB_PASSWORD` | 是 | 当前环境的数据库密码 |
| `QIYU_REDIS_PASSWORD` | 否 | Redis 无认证时省略 |
| `ADMIN_INITIAL_PASSWORD` | 首次初始化时 | 已存在管理员数据后可以省略 |
| `QIYU_MINIO_ACCESS_KEY` | 启用 MinIO 时 | MinIO 访问键 |
| `QIYU_MINIO_SECRET_KEY` | 启用 MinIO 时 | MinIO 密钥 |

自托管 Runner 必须保持在线并能访问 GitHub、GHCR 和宿主机依赖。不要让 Pull Request 工作流使用任何 `qiyu-<环境名>` 标签；当前 CI 仍只使用 GitHub 托管 Runner。

## 当前阶段

- 客户端 15 个页面和预约、履约、评价闭环已完成，并保留 Mock/真实接口双模式。
- 管理后台运营页面及组织、用户、角色、菜单、字典、审计页面已完成。
- 统一认证、角色权限、数据范围、Flyway 基线和系统基础数据已接入 MySQL 8.0。
- 后端正在按 `DEVELOPMENT-PLAN.md` 第 13 节逐步将剩余内存业务查询迁移到 MySQL。
- MinIO SDK、资源种子与上传接口已完成；目标环境需提供凭据后执行实际上传验收。
