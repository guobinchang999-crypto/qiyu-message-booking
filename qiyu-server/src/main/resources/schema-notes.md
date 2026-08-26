# 栖愈 MySQL 8.0 数据库设计说明

## 设计边界

- 系统按统一品牌门店建模，不包含门店经营类型、多经营主体、门店独立会员体系。
- 会员账户、优惠券、套餐卡均以 `ALL_STORES` 作为固定范围，并通过 CHECK 约束表达“全门店通用”。
- 前端所需状态、标签、下拉选项应由后端字典或资源查询接口返回；DDL 中的 `qy_dict_type`、`qy_dict_item` 可承载 mock 阶段和真实接口阶段的字典数据。

## 关键业务表

- 门店与服务：`qy_store`、`qy_store_business_day`、`qy_store_service`、`qy_service_category`、`qy_service_item`、`qy_service_item_tag`。
- 技师与排班：`qy_therapist`、`qy_therapist_skill`、`qy_therapist_service`、`qy_therapist_schedule`、`qy_therapist_leave`。
- 房间与资源占用：`qy_room`、`qy_resource_occupation`。
- 客户与登录：`qy_customer`、`qy_customer_login_identity`、`qy_customer_contact`、`qy_customer_favorite_store`。
- 预约与履约：`qy_booking`、`qy_booking_status_log`、`qy_checkin_record`、`qy_service_order`、`qy_service_order_log`。
- 支付与权益：`qy_payment_order`、`qy_member_account`、`qy_member_balance_transaction`、`qy_member_package_card`、`qy_member_package_item`、`qy_member_package_usage`、`qy_coupon_template`、`qy_customer_coupon`、`qy_coupon_usage`。
- 退款预留：`qy_refund_order` 独立记录退款申请、第三方退款流水和退款状态，避免把多次退款压扁在支付单字段中。
- 评价：`qy_service_review`、`qy_review_tag`、`qy_review_image`。
- 后台权限：`qy_admin_user`、`qy_admin_role`、`qy_admin_permission`、`qy_admin_user_role`、`qy_admin_role_permission`、`qy_admin_user_store_scope`。
- 运营报表：`qy_store_daily_metrics`、`qy_service_daily_metrics`、`qy_therapist_daily_metrics`、`qy_report_job_run` 用于看板和经营报表的日维度汇总，不替代明细交易表。

## 资源冲突设计

`qy_booking` 保存预约本身的服务时间和包含准备/清洁时间的占用时间：

- `scheduled_start_at` / `scheduled_end_at`：客户看到的服务时间。
- `occupied_start_at` / `occupied_end_at`：后端冲突校验使用的资源占用时间，包含服务项目的 `preparation_minutes` 和 `cleanup_minutes`。

`qy_resource_occupation` 是技师和房间的显式占用表。应用层创建、改期、更换技师、分配房间时，应在事务内查询同一资源下未释放状态的重叠区间，并配合数据库行锁或分布式锁防止并发超卖。MySQL 8.0 没有原生 exclusion constraint，因此最终冲突规则应由 domain/application 层执行。

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

`qy_booking` 和 `qy_service_order` 使用英文枚举值存储项目统一状态，并通过字典项映射为中文：

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
- 日汇总：门店、项目、技师三个维度分别落在 `qy_store_daily_metrics`、`qy_service_daily_metrics`、`qy_therapist_daily_metrics`。
- 任务追踪：`qy_report_job_run` 记录每日汇总任务的执行状态，便于后台排障和重跑。

报表表只保存统一品牌体系内的运营指标，不引入经营主体、门店经营类型或门店独立财务账户。

## 后续需确认

- 预约订金金额规则：固定金额、比例金额，还是按服务项目配置。
- 是否允许一个预约包含多个服务项目或多人多项目；当前 DDL 按 MVP 单项目预约建模。
- 技师跨门店执业规则：当前技师有主门店，跨店能力可后续通过排班表表达。
- 房间容量是否需要按服务项目、性别、设备做更细粒度限制；当前只保留 `room_kind` 和 `capacity`。
- 会员套餐是否需要跨项目通兑比例；当前按套餐卡下的项目次数建模。
- 优惠券适用范围是否会扩展到指定项目、指定时段或指定会员等级；当前只表达全门店通用，复杂规则可后续在模板上增加规则 JSON 或规则表。
- 支付、退款、微信登录的第三方流水字段需要在真实接入方案确定后细化；当前只保留 `external_trade_no` 和 `external_refund_no` 等稳定预留字段。
