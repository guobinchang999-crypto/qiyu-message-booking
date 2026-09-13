# 门店资源、客户中心与经营分析改版验收记录

更新日期：2026-09-10。已完成代码、隔离浏览器及独立 MySQL 验收库的核心接口验证；尚非全部角色和并发场景的生产上线验收结论。

## 已实现

- 门店、技师、服务项目和房间采用服务端筛选分页、详情抽屉及分区编辑；资料与状态操作分离，删除收纳到更多。门店详情关联专用资源页面，房间支持当日占用。
- 客户与会员合并为客户中心，名单与资产分别授权；旧 /members 地址进入资产视图。详情连接预约、会员资产、余额流水和持券记录。
- 余额调整默认空金额，确认前展示预计余额；同一内容重试复用请求号。优惠券展示明确折扣表达及预览，已发放券限制修改存量规则。
- 经营概览和报表共享日期筛选，展示完整汇总、日期趋势、门店排名及授权预约明细，支持排序和条件导出。
- 独立管理门店选项、URL 查询状态、请求过期保护、44px 控件及未保存提示。

## 接口与统计口径

新增接口均位于 /admin/management，保留原有接口兼容。

| 接口 | 用途 |
| --- | --- |
| store-options | 按模块权限取得门店选项 |
| stores / therapists / rooms / services | 资源筛选及真实分页 |
| customers / members | 客户、资产分页与稳定关联 ID |
| members/{id}/ledger | 经客户与会员关联校验的余额流水 |
| coupon-records | 权限范围内领取及使用记录 |
| {resource}/{id}/impact | 未完成预约影响数量 |
| analytics / analytics/export | 同条件汇总、日期序列、排名及导出 |

统计按预约日期归属；完成数只计 COMPLETED。完成订单金额沿用项目金额 + 技师费用 - 优惠 - 余额抵扣，不代表银行到账或现金实收。完成率使用总完成数 / 总预约数，平均金额使用总完成金额 / 总完成数，不平均门店比例。空日期补零；响应提供更新时间与口径。

资源分页目前在服务端对授权列表过滤后切页；客户和会员通过 SQL 执行筛选、计数与分页。大规模资源数据下仍需评估改为数据库分页。

## 已执行验证

- 前端 npm run typecheck、npm run build 通过。
- antd lint src --format json：新增管理组件无问题；全量扫描仍有 13 条既有系统用户/审计页面用法提示。
- 后端测试报告合计 106 项，失败 0、错误 0（全套运行后修正隔离 SQL fixture，再重跑对应测试类）。新增覆盖权限交集、手机号脱敏、跨店访问拒绝、分页、稳定关联 ID、统计日期与金额、券规则保护。
- 隔离浏览器脚本 scripts/admin-management-visual-smoke.mjs 通过，生成 9 张截图；模拟余额请求提交成功但响应丢失，重试使用同一请求号且只生成一笔流水。
- git diff --check 通过。既有未提交改动保留。

## 截图

截图来自本地前端与内存 HTTP fixture，不是生产数据，也不证明真实后端链路通过。SQL 回归使用独立 H2 MySQL 兼容模式。

- [门店列表 1366×768](./admin-resources-stores-1366.png)
- [门店详情 1366×768](./admin-resources-detail-1366.png)
- [资源编辑 1024×768](./admin-resources-form-1024.png)
- [房间当日占用 1920×1080](./admin-resources-occupancy-1920.png)
- [会员资产 1366×768](./admin-customers-assets-1366.png)
- [客户详情 1024×768](./admin-customer-detail-1024.png)
- [优惠券编辑 1024×768](./admin-coupons-form-1024.png)
- [经营概览 1920×1080](./admin-analysis-overview-1920.png)
- [经营预约明细 1366×768](./admin-analysis-drilldown-1366.png)

运行截图脚本前先启动本地前端 localhost:8000，然后运行 node scripts/admin-management-visual-smoke.mjs；脚本使用独立 Chrome profile 和临时内存 API，不连接业务数据库。

开启 QIYU_REAL_UI=1，并提供 QIYU_ISOLATED_DATABASE 与 QIYU_ISOLATED_ADMIN_PASSWORD 后，脚本在 fixture 验证结束后使用真实登录接口切换到本机 18098 独立库实例。以下三张已完成真实登录页面检查：

- [真实门店列表 1366×768](./admin-real-stores-1366.png)
- [真实会员资产 1024×768](./admin-real-members-1024.png)
- [真实经营概览 1920×1080](./admin-real-analysis-1920.png)

走查修正了真实会员等级 GOLD 的中文显示及对应搜索映射，并统一了零值和非零值趋势柱的日期基线。平板宽表格保留横向滚动，不压缩金额与操作。

## 尚待完成的联调与验收

22:57 重新检查 MySQL 已恢复，独立验收库 qiyu_admin_ui_20260910 完成全部 17 个 Flyway 迁移。验收实例仅监听本机 18098，关闭 MinIO 和媒体种子；没有改动原 qiyu_booking 业务库。

scripts/admin-management-real-smoke.mjs 已通过真实管理员登录、独立门店选项、七类列表分页（3 家门店、3 位技师、9 个房间、3 个项目、2 位客户、1 位会员、1 张券模板）、资源影响数量、30 日趋势与总数一致性、CSV 导出、持券查询，以及余额同一请求号重放验证。测试会员仅增加 1 元，持久化流水只新增一笔。该脚本要求显式声明隔离库和测试密码，不允许指向业务环境。

本次另外修正报表翻页被排序回调重置、分析门店未跨页面恢复、旧结果误用新条件打开明细的问题；隔离浏览器已增加对应断言并通过。

本轮结束时已停止临时 18098 后端实例，保留独立验收库供后续回归；未删除数据、未提交或覆盖原有工作区改动。最新类型检查、生产构建、管理组件 antd lint（0 条）及 12 张截图回归通过。

以下仍需继续验证：

- 真实 MySQL 事务锁、并发资源变更和写入冲突回归。
- 总部、店长、前台、客户/会员权限不重合账号的真实登录走查。
- 大数据多页导出与查询一致性、全部核心操作键盘链路，以及资源跨页面返回的滚动位置检查。

## 设计参考

借鉴公开资料的信息组织与流程，不声称验证过第三方登录后的全部界面：

- [有赞：员工排班与关联服务](https://help.youzan.com/displaylist/detail_53_53-2-281109)
- [有赞：客户详情与资产展示](https://help.youzan.com/displaylist/detail_44_44-2-80851)
- [有赞：经营数据筛选与报表](https://help.youzan.com/displaylist/detail_6_6-2-41145)
- [有赞：领取与使用记录](https://help.youzan.com/displaylist/detail_4_4-1-282937)
- [美团客满满公开介绍](https://k.meituan.com/home)
