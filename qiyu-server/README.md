# qiyu-server

Spring Boot 3 MVP mock API for 栖愈｜推拿·SPA.

## Start

```bash
mvn spring-boot:run
```

- API base: `http://localhost:8080/api/v1`
- OpenAPI UI: `http://localhost:8080/swagger-ui.html`

This MVP uses in-memory mock data only. MySQL, Redis, payment, and real authentication are not required.

认证 Mock 接口：

- `POST /api/v1/auth/send-code`：发送演示验证码，固定返回 `123456`，有效期 60 秒。
- `POST /api/v1/auth/login`：使用手机号和验证码获取 Mock token。真实微信登录、短信供应商和 token 持久化待后续接入。

预约履约 Mock 接口：

- `POST /api/v1/bookings/{id}/checkin`：已预约 → 已签到
- `POST /api/v1/bookings/{id}/start-service`：已签到/待服务 → 服务中
- `POST /api/v1/bookings/{id}/finish-service`：服务中 → 待结算
- `POST /api/v1/bookings/{id}/settle`：待结算 → 已完成
- `GET /api/v1/time-slots`：按门店、技师、服务时长及准备/清洁缓冲返回可预约时段；技师占用存在时间重叠时返回 `FULL`

状态转换由领域对象校验，非法状态转换返回 HTTP 400。创建和改期的 Mock 资源检查与保存在应用服务临界区内完成；正式数据库接入时仍需替换为事务和数据库锁。
