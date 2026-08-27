# 栖愈 MySQL 8.0 数据库设计说明

## 设计边界

- 系统按统一品牌门店建模，不包含门店经营类型、多经营主体、门店独立会员体系。
- 会员账户、优惠券、套餐卡均以 `ALL_STORES` 作为固定范围，并通过 CHECK 约束表达“全门店通用”。
- 前端所需状态、标签、下拉选项应由后端字典或资源查询接口返回；DDL 中的 `dict_type`、`dict_item` 可承载 mock 阶段和真实接口阶段的字典数据。

## 统一认证与数据权限

- `sys_user` 是客户和后台人员共用的统一身份主体，`user_type` 使用 `CUSTOMER` 或 `STAFF`。
- `sys_user_identity` 保存手机号、密码、微信标识等登录身份；认证字段不再放在业务资料表中。
- `sys_session` 保存服务端会话元数据和令牌哈希，数据库不保存明文访问令牌。
- `customer` 通过唯一的 `user_id` 关联客户身份；`staff` 通过唯一的 `user_id` 关联员工身份，`therapist.staff_id` 关联技师与员工资料。
- `sys_role`、`sys_permission`、`sys_menu` 及其关系表统一承载客户、普通员工、门店经理和总部管理员的角色权限。
- `sys_dept` 管理总部部门树，`region` 管理运营区域树，`store.region_id` 表达门店区域归属；部门不替代区域或门店。
- `sys_role_data_scope` / `sys_user_data_scope` 按“资源 + 操作”定义 `NONE`、`SELF`、`PRIMARY_STORE`、`ASSIGNED_STORES`、`REGION_STORES`、`ALL_STORES` 数据范围；区域向下展开为门店集合后再执行数据过滤。
- `sys_user_data_scope`、`sys_user_scope_store`、`sys_user_scope_region` 支持生效和失效时间，用于临时代班和跨店支援；用户范围覆盖同一资源操作上的角色范围。
- `sys_role_permission.effect` 和 `sys_user_permission.effect` 支持 `ALLOW` / `DENY`，显式拒绝优先于允许。`customer_store_relation` 表达客户在门店发生预约或消费后的业务关系，`audit_log` 记录敏感查看、取消、改期和授权类操作。
- `booking` 使用 `customer_id`、`created_by_user_id`、`assigned_user_id` 表达客户、创建人和负责员工；`service_order` 使用 `assigned_user_id` 和 `operator_user_id` 表达履约归属和操作审计。
- 客户只能访问自身数据，普通员工只能访问本人负责的数据，门店经理只能访问授权门店，总部管理员可以访问全门店数据；前端提交的用户或范围参数不能扩大后端授权范围。

## 关键业务表

- 门店与服务：`store`、`store_business_day`、`store_service`、`service_category`、`service_item`、`service_item_tag`。
- 技师与排班：`therapist`、`therapist_skill`、`therapist_service`、`therapist_schedule`、`therapist_leave`。
- 房间与资源占用：`room`、`resource_occupation`。
- 统一身份与客户员工资料：`sys_user`、`sys_user_identity`、`sys_session`、`customer`、`staff`、`customer_contact`、`customer_favorite_store`。
- 预约与履约：`booking`、`booking_status_log`、`checkin_record`、`service_order`、`service_order_log`。
- 支付与权益：`payment_order`、`member_account`、`member_balance_transaction`、`member_package_card`、`member_package_item`、`member_package_usage`、`coupon_template`、`customer_coupon`、`coupon_usage`。
- 退款预留：`refund_order` 独立记录退款申请、第三方退款流水和退款状态，避免把多次退款压扁在支付单字段中。
- 评价：`service_review`、`review_tag`、`review_image`。
- 系统权限：`sys_role`、`sys_permission`、`sys_menu`、`sys_user_role`、`sys_role_permission`、`sys_role_menu`、`sys_role_data_scope`、`sys_role_scope_store`、`sys_user_data_scope`、`sys_user_scope_store`。
- 运营报表：`store_daily_metrics`、`service_daily_metrics`、`therapist_daily_metrics`、`report_job_run` 用于看板和经营报表的日维度汇总，不替代明细交易表。

## 资源冲突设计

`booking` 保存预约本身的服务时间和包含准备/清洁时间的占用时间：

- `scheduled_start_at` / `scheduled_end_at`：客户看到的服务时间。
- `occupied_start_at` / `occupied_end_at`：后端冲突校验使用的资源占用时间，包含服务项目的 `preparation_minutes` 和 `cleanup_minutes`。

`resource_occupation` 是技师和房间的显式占用表。应用层创建、改期、更换技师、分配房间时，应在事务内查询同一资源下未释放状态的重叠区间，并配合数据库行锁或分布式锁防止并发超卖。MySQL 8.0 没有原生 exclusion constraint，因此最终冲突规则应由 domain/application 层执行。

冲突查询应至少排除：

- `RELEASED`
- `CANCELLED`
- 软删除记录

仍应纳入冲突判断：

- `HELD`
- `OCCUPIED`

## 字典与前端选项

DDL 初始化了核心字典类型，包括预约状态、支付状态、技师状态、房间状态、时间槽状态、营业状态、优惠券状态、后台用户状态、排班状态、签到状态、资源占用状态、服务上下架状态、会员账户状态和评价状态。

客户端和管理后台最终不应硬编码这些状态文案。Mock 阶段可以保留同名测试数据，但页面调用方式应逐步切换为后端字典接口和资源选项接口。

## 状态约束取舍

`booking` 和 `service_order` 使用英文枚举值存储项目统一状态，并通过字典项映射为中文：

```text
PENDING_PAYMENT=待支付
BOOKED=已预约
CHECKED_IN=已签到
WAITING_SERVICE=待服务
IN_SERVICE=服务中
PENDING_SETTLEMENT=待结算
COMPLETED=已完成
CANCELLED=已取消
```

数据库层使用 CHECK 约束兜底状态集合，合法状态流转顺序仍应放在 domain/application 层，避免直接更新表字段绕过业务规则。

支付、退款、排班、房间、技师、时间槽等状态也保存在字典表中，后端接口应按字典返回可展示文案和排序，前端只消费接口结果。

## 运营报表设计

后台看板和经营报表优先从明细表实时查询或异步汇总：

- 明细来源：预约、服务订单、支付、退款、会员余额流水、套餐使用、优惠券核销、评价。
- 日汇总：门店、项目、技师三个维度分别落在 `store_daily_metrics`、`service_daily_metrics`、`therapist_daily_metrics`。
- 任务追踪：`report_job_run` 记录每日汇总任务的执行状态，便于后台排障和重跑。

报表表只保存统一品牌体系内的运营指标，不引入经营主体、门店经营类型或门店独立财务账户。

## 外键策略

`schema-mysql8.sql` 不创建数据库级外键约束。各关联字段仍保留明确的 `*_id` 命名、唯一索引和查询索引，关联完整性由应用层负责：

- 创建、修改和删除关联数据时，由 application/domain 层执行存在性和状态校验。
- 预约、履约、支付和权益等跨表写操作应在事务内完成，并通过资源冲突校验和幂等控制保证一致性。
- 删除或停用数据前，应由业务服务检查关联记录，不能依赖数据库外键阻止误操作。
- `CHECK` 约束继续保留，用于兜底校验状态集合、金额、时间范围和全门店通用范围等单表不变量。

## 表名与初始化说明

- 所有业务表使用不带 `qy_` 前缀的表名；历史索引名称中的 `qy_` 仅为索引命名标识，不代表表前缀。
- 执行 `schema-mysql8.sql` 会先创建或切换到 `qiyu_booking` 数据库，再按依赖逆序删除并重建表，适用于可重建的开发或测试环境。
- 该 DDL 只负责结构，不写入管理员密码、令牌或其他环境密钥；`admin` 超级管理员应由后端初始化流程使用密码哈希创建。
- 已存在的开发库不要重复执行完整重建脚本；应先备份，再按一次性迁移执行 `db/migration/V2__data_permission.sql`。该迁移新增组织、权限范围、审计表及必要字段和索引，不删除业务数据。

## Local 环境配置

- `application-local.yml` 连接本机开发网络中的 MySQL、Redis 和 MinIO，使用 `SPRING_PROFILES_ACTIVE=local` 启用。
- MySQL、Redis、MinIO 的密码只从 `QIYU_LOCAL_DB_PASSWORD`、`QIYU_LOCAL_REDIS_PASSWORD`、`QIYU_LOCAL_MINIO_SECRET_KEY` 读取；可参考 `qiyu-server/.env.local.example`，不要把真实密码提交到仓库。
- 当前 MinIO 仅配置连接属性，上传模块接入时应消费 `qiyu.storage.minio` 配置，不应在业务代码中硬编码地址或凭据。

## 后续需确认

- 预约订金金额规则：固定金额、比例金额，还是按服务项目配置。
- 是否允许一个预约包含多个服务项目或多人多项目；当前 DDL 按 MVP 单项目预约建模。
- 技师跨门店执业规则：当前技师有主门店，跨店能力可后续通过排班表表达。
- 房间容量是否需要按服务项目、性别、设备做更细粒度限制；当前只保留 `room_kind` 和 `capacity`。
- 会员套餐是否需要跨项目通兑比例；当前按套餐卡下的项目次数建模。
- 优惠券适用范围是否会扩展到指定项目、指定时段或指定会员等级；当前只表达全门店通用，复杂规则可后续在模板上增加规则 JSON 或规则表。
- 支付、退款、微信登录的第三方流水字段需要在真实接入方案确定后细化；当前只保留 `external_trade_no` 和 `external_refund_no` 等稳定预留字段。
