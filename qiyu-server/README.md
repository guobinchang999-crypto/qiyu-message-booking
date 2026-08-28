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
