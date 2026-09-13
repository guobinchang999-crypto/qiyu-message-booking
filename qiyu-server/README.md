# qiyu-server

栖愈统一后端 API，使用 Spring Boot 3、MyBatis-Plus、Flyway、MySQL 8、Sa-Token 和 MinIO。

## Start

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

- API base: `http://localhost:8080`
- OpenAPI UI: `http://localhost:8080/swagger-ui.html`

默认 profile 使用内存数据供自动化测试；`local` profile 使用 MySQL、真实权限数据和 MyBatis-Plus 仓储。支付仍为明确的接口占位，不会调用真实支付渠道。

统一认证接口：

- `POST /auth/send-code`：发送本地验证码。
- `POST /auth/login`：客户端和管理后台共用，按 `clientType` 与 `grantType` 选择认证策略。
- `GET /auth/me`：返回服务端计算的角色、功能权限、数据范围和字段权限。
- `POST /auth/logout`：注销当前会话。

预约履约接口：

- `POST /bookings/{id}/checkin`：已预约 → 已签到
- `POST /bookings/{id}/start-service`：已签到/待服务 → 服务中
- `POST /bookings/{id}/finish-service`：服务中 → 待结算
- `POST /bookings/{id}/settle`：待结算 → 已完成
- `GET /time-slots`：按门店、技师、服务时长及准备/清洁缓冲返回可预约时段。

状态转换由领域对象校验，非法状态转换返回 HTTP 400。数据库访问统一通过 MyBatis-Plus Mapper 和领域 Gateway 完成；Controller 不直接读写数据库。
### Local MinIO resource seeding

Copy `.env.local.example` to a local, untracked env file and set
`QIYU_LOCAL_MINIO_SECRET_KEY`. Start with `QIYU_LOCAL_MINIO_ENABLED=true` and
`QIYU_LOCAL_MINIO_SEED_ENABLED=true` to upload the bundled seed images to the
configured bucket. The runner updates the corresponding catalog records only
after each object upload succeeds; credentials are never stored in source.

## 云效 Flow 后端流水线

配置文件为仓库根目录的 `.flow/qiyu-pipeline.yaml`。流程为 Java P3C 扫描和 Maven 测试 → Docker 多阶段构建并推送 ACR → 主机 `docker run` 部署。默认构建 `main`，镜像和容器名为 `qiyu-server`，部署使用 `db` profile、`8080:8080` 端口映射。该流水线仅负责后端。

日常维护只需关注两个位置：云效变量组维护环境值；流水线 `run` 负责登录、拉取、启动和健康等待。部署不依赖 Compose，主机只需安装 Docker。`docker-compose.yml` 仅用于本地或手工部署，流水线不再上传和下载该文件。

### 变量如何维护

建议使用两层通用变量组，并将项目工程参数集中保留在 YAML 顶部：

| 位置 | 建议名称 | 管理内容 |
| --- | --- | --- |
| 跨项目通用变量组 | `aliyun-acr-guangzhou` | ACR 仓库域名、命名空间、登录凭据 |
| 栖愈环境变量组 | `qiyu-db-env` | 执行用户、宿主机端口、MySQL、Redis、可选 MinIO |
| YAML `variables` | 项目工程参数与模板取值字段 | 代码库、默认分支、Codeup 服务连接、构建环境、工具版本、ACR 服务连接/地域、主机组、后端目录、镜像/容器名、健康等待时间 |

在 **流水线 Flow → 全局设置 → 通用变量组** 创建两个变量组，按下方表格填写变量；然后在目标流水线的 **编辑 → 变量和缓存 → 通用变量组** 中依次关联公共组和栖愈环境组。这里的名称是建议名称，不是已经创建的云端资源。

也可以将 YAML 顶部注释中的 `variableGroups` 改为实际 ID 后启用。使用真实变量组 ID，不要填展示名称；选择 UI 关联或 YAML 声明一种方式即可。新增其他环境时新建环境组，每条流水线只关联一个目标环境组。

```yaml
variableGroups:
  - <公共变量组实际ID>
  - <栖愈环境变量组实际ID>
```

同名变量的静态优先级为：步骤配置 > YAML `variables` > YAML 关联变量组 > UI 字符变量 > UI 关联变量组。同一种关联方式中，排在后面的变量组覆盖前面的值。运行时输入还可以覆盖普通变量，但不支持覆盖私密变量。**仅运行期 `${KEY}` 读取的共享参数不重复定义在 YAML 中**，避免修改变量组后仍然读取旧的 YAML 值。

首行 `# template=true` 用于将代码源、构建节点等调度前所需字段从顶部变量渲染出来；这些工程元数据集中在 YAML 中管理。`jdkVersion`、`mavenVersion`、`serviceConnection`、`region`、`machineGroup` 等枚举和资源选择器字段在流水线运行前校验，只接受 `{{ .KEY }}` 模板取值，不接受 `${KEY}`；这些值必须定义在 YAML `variables` 中，不能只放在变量组。普通任务参数通过 `${KEY}` 使用普通变量和变量组，部署脚本通过环境变量读取值，不把密码拼入 Shell 源码。不要把密钥写入模板变量、命令文本或镜像构建参数。

参考：[云效通用变量组](https://help.aliyun.com/zh/yunxiao/user-guide/common-variable-group)、[YAML 变量及优先级](https://help.aliyun.com/zh/yunxiao/user-guide/variables)、[模板渲染](https://help.aliyun.com/zh/yunxiao/user-guide/use-template-syntax-for-dynamic-pipeline-rendering)。

### 公共组：aliyun-acr-guangzhou

下列普通参数复用参考项目的配置。变量值填写字面值，不在变量组的值里再嵌套 `${OTHER_KEY}`。

| 变量 | 填写值 | 私密 |
| --- | --- | --- |
| `ACR_DOCKER_REGISTRY` | `crpi-6wv2xqvvff7kqh35.cn-guangzhou.personal.cr.aliyuncs.com` | 否 |
| `ACR_NAMESPACE` | `chang_stage_666` | 否 |
| `ACR_USERNAME` | 当前 ACR 登录用户名 | 是 |
| `ACR_PASSWORD` | 当前 ACR 登录密码 | 是 |

`ACR_REGION` 和 `ACR_SERVICE_CONNECTION` 用于 `region`、`serviceConnection` 这类模板取值字段，必须保留在 YAML 顶部 `variables` 中，不要放进变量组。镜像推送使用 ACR 服务连接；主机上的 `docker pull` 使用 ACR 用户名和密码，两者都需要配置。ACR 实例已由域名确定，不再保留无步骤消费的 `ACR_INSTANCE` 变量。杭州的公共构建节点与广州的 ACR 属于不同配置项，不需要把构建节点也改成广州。

### 环境组：qiyu-db-env

| 变量 | 填写值或默认行为 | 私密 |
| --- | --- | --- |
| `DEPLOY_USER` | `root` | 否 |
| `HOST_PORT` | `8080`；未配置时默认使用此值 | 否 |
| `SPRING_PROFILE` | `db`；未配置时默认使用 `db` | 否 |
| `QIYU_DB_URL` | 目标 MySQL 的完整 JDBC URL，数据库为栖愈专用库 | 否 |
| `QIYU_DB_USERNAME` | 目标 MySQL 用户名 | 是 |
| `QIYU_DB_PASSWORD` | 目标 MySQL 密码，必填 | 是 |
| `QIYU_REDIS_HOST` | 容器可以访问的 Redis 地址，必填 | 否 |
| `QIYU_REDIS_PORT` | `6379`；未配置时也使用此默认值 | 否 |
| `QIYU_REDIS_PASSWORD` | Redis 密码；无认证时允许不设置 | 是 |
| `ADMIN_INITIAL_PASSWORD` | 首次初始化数据库时必填；已有管理员密码时可省略 | 是 |
| `QIYU_MINIO_ENABLED` | `false`；未配置时关闭 | 否 |
| `QIYU_MINIO_ENDPOINT` | MinIO S3 API 地址；启用 MinIO 时必填 | 否 |
| `QIYU_MINIO_ACCESS_KEY` | MinIO 访问键；启用时必填 | 是 |
| `QIYU_MINIO_SECRET_KEY` | MinIO 密钥；启用时必填 | 是 |
| `QIYU_MINIO_BUCKET` | 目标桶名称；启用时必填 | 否 |
| `QIYU_MINIO_PUBLIC_BASE_URL` | 图片 URL 基础地址；省略时使用 endpoint | 否 |
| `QIYU_MINIO_PUBLIC_READ` | `false`；仅在明确允许公开的演示桶上设置 `true` | 否 |
| `QIYU_MINIO_SEED_ENABLED` | `false`；首次导入资源时按需开启，要求 MinIO 同时启用 | 否 |

`MACHINE_GROUP_ID` 用于 `machineGroup` 模板取值字段，必须保留在 YAML 顶部 `variables` 中，不要放进变量组。

JDBC URL 示例（将主机替换为容器实际可达地址）：

```text
jdbc:mysql://<mysql-host>:3306/qiyu_booking?useUnicode=true&characterEncoding=utf8&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai
```

不要把本地 `.env.local` 上传到流水线，也不要把密码放进 JDBC URL。容器中的 `127.0.0.1` 指向容器本身，不能用它表示宿主机上的 MySQL 或 Redis。

`db` profile 已绑定 `QIYU_DB_*`，但没有绑定 `QIYU_REDIS_*`。Compose 将 Redis 参数映射为 Spring 标准的 `SPRING_DATA_REDIS_*`，将 MinIO 参数映射为 `QIYU_STORAGE_MINIO_*`，无需修改应用代码。启用 MinIO 本身不实现私有图片的预签名访问；访问方案仍遵循上方的资源访问约束。

### YAML 工程参数

代码地址、默认分支和 Codeup 服务连接分别通过 `CODE_REPO_URL`、`CODE_BRANCH`、`CODEUP_SERVICE_CONNECTION` 配置。构建节点通过 `BUILD_RUNNER_GROUP`、`BUILD_RUNNER_IMAGE` 配置。调整这类顶部变量后，先使用云效模板预览确认解析结果。

- `JDK_VERSION=21`、`MAVEN_VERSION=3.9.3`：用于云效扫描和测试，通过 `{{ .JDK_VERSION }}`、`{{ .MAVEN_VERSION }}` 写入步骤；枚举字段不接受 `${KEY}`。镜像内部打包继续使用现有 Dockerfile 中的 Maven 3.9.9 / Java 21；这些参数不改变 Docker 基础镜像。
- `ACR_SERVICE_CONNECTION=y9izf8ngrb1d7ujd`、`ACR_REGION=cn-guangzhou`：供 `serviceConnection`、`region` 模板取值，必须保留在 YAML。
- `MACHINE_GROUP_ID=jyzF7etQsLIAiFek`：供 `machineGroup` 模板取值，必须保留在 YAML。
- `MAVEN_SETTINGS_PATH=/root/.m2/settings.xml`：云效测试任务的 Maven 配置路径；不会自动传入 Docker 多阶段构建。
- `SERVER_DIR=qiyu-server`：统一决定扫描、测试、Dockerfile 和 Docker 上下文路径。
- `IMAGE_NAME=qiyu-server`、`CONTAINER_NAME=qiyu-server`：镜像仓库名称和部署容器名称。
- `CONTAINER_PORT=8080`：同时设置应用监听端口、Docker 端口映射和容器健康探针。
- `RESTART_POLICY=unless-stopped`：容器重启策略。
- `HEALTH_TIMEOUT_SECONDS=180`：部署脚本等待容器健康检查通过的超时秒数。
- `P3C_RULE_SET`：沿用参考项目规则集合，不额外设置质量阈值。

镜像标签由云效内置的 `${PIPELINE_ID}-${BUILD_NUMBER}` 生成，不需要在变量组维护。构建和部署使用同一组变量直接组合镜像地址，不使用 `latest`。`serviceConnection`、`region`、`machineGroup`、`jdkVersion`、`mavenVersion` 这类字段只在模板渲染阶段取值，不能改为由变量组维护；其他 `${KEY}` 参数可以移到变量组，但应先移除同名 YAML 定义并通过云效模板预览确认。

### 首次使用与部署行为

1. 确认上述服务连接能读取栖愈代码仓库、推送 `chang_stage_666/qiyu-server`，且目标主机已加入主机组。
2. 在目标 Linux 主机安装 Docker，确保执行用户能运行 Docker，主机及容器可访问 ACR、MySQL、Redis 和按需启用的 MinIO。
3. 配置并关联变量组；首次初始化设置 `ADMIN_INITIAL_PASSWORD`。Flyway 会在应用启动时执行现有迁移，测试通过不代表目标 MySQL 的迁移已经验证。
4. 将 `.flow/qiyu-pipeline.yaml` 导入云效 YAML 编辑器，执行模板预览及平台校验。步骤名称沿用参考配置，仍需以当前租户的校验结果确认兼容性。
5. 将配置与待发布代码合入默认分支后手动运行；YAML 没有增加提交自动发布触发器。

部署由 `VMDeploy` 的 `run` 脚本直接完成，不下载制品：登录 ACR、拉取镜像、移除同名旧容器、`docker run` 启动新容器，然后轮询 `docker ps` 等待健康状态。必填变量缺失时脚本立即失败；脚本里的 `$${KEY:-default}` 是云效转义写法，主机端按 Shell 默认值展开。

核心命令（完整参数见流水线 `run`）：

```bash
docker pull "$IMAGE_FULL_NAME"
docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER_NAME" --restart "$RESTART_POLICY" -p "$${HOST_PORT:-8080}:$CONTAINER_PORT" ...
```

端口冲突由 Docker 报错，不自动停止其他服务。单容器更新存在短暂中断，不自动回滚。ACR 登录信息写入临时 Docker 配置目录，退出时删除；容器环境变量在主机执行时注入，不写入仓库。

`docker-compose.yml` 保留给本地或手工部署使用；手工运行时仍需设置 `IMAGE_FULL_NAME`。旧的 `QIYU_IMAGE_REPOSITORY` / `QIYU_IMAGE_TAG` 两个变量不再使用，`HEALTH_POLL_SECONDS` 也不再需要。

参考：[docker run](https://docs.docker.com/reference/cli/docker/container/run/)、[docker ps 过滤器](https://docs.docker.com/reference/cli/docker/container/ls/)。
