---
name: cola-architecture
description: 面向栖愈后端开发的实用阿里巴巴 COLA 架构指导，包括各层职责、命名约定、业务模块组织，以及选择 COLA Light 或完整 COLA 的规则。开发或审查 qiyu-server 后端架构时使用。
---

# 技能：栖愈后端 COLA 架构设计

> **范围：仅限后端。** 此技能仅适用于 Java Spring Boot 后端（`qiyu-server/`）。不要将此技能中的 COLA 分层、命名约定或架构规则应用于 React 管理后台（`qiyu-admin-pro/`）或微信小程序客户端（`qiyu-client/`）。

## 1. 目的

此技能将阿里巴巴 COLA 架构转化为适用于栖愈预约系统后端开发的实用规则。

此技能适用于：

- Spring Boot 后端开发
- 单体或模块化单体项目
- 预约、核销、排班、订单、会员等业务系统
- 需要稳定分层和清晰依赖方向的 AI 辅助编程

此技能应帮助代理：

- 选择合适的 COLA 变体
- 将代码放入正确的层
- 一致地使用 COLA 命名
- 避免过度设计
- 保持业务逻辑可读且可维护

## 2. COLA 在本项目中的含义

COLA = Clean Object-Oriented and Layered Architecture（整洁的面向对象分层架构）。

在栖愈后端中，将 COLA 视为：

- 以业务用例为中心的分层
- 明确分离入站请求、应用编排、领域规则和技术实现
- 在预约冲突、订单状态、排班规则等有价值的地方表达领域模型
- AI 可以反复遵循的稳定代码组织模式

COLA 是工程约束，不是形式负担。简单查询可以保持务实，复杂规则需要进入领域层。

## 3. COLA 模式选择

### 模式 A：COLA Light（本项目默认）

使用单个 Spring Boot 项目，通过 package 实现分层。

推荐结构：

```text
qiyu-server/
└── src/main/java/com/qiyu
    ├── adapter
    ├── application
    ├── domain
    ├── infrastructure
    └── QiyuApplication.java
```

适用情况：

- 项目是单个部署单元
- 团队规模较小
- 系统规模为小型或中型
- 希望减少 Maven 多模块形式负担
- 需要让 AI 更稳定地生成和维护代码

默认规则：

- 如果用户没有明确要求 Maven 多模块，则使用 COLA Light。
- 不要一开始创建完整 COLA 多模块工程。

### 模式 B：完整 COLA 多模块

使用明确的 Maven 或 Gradle 模块。

推荐结构：

```text
qiyu-server/
├── qiyu-client
├── qiyu-adapter
├── qiyu-app
├── qiyu-domain
├── qiyu-infrastructure
└── qiyu-start
```

适用情况：

- 模块边界十分重要
- 契约需要独立发布或共享
- 团队协作复杂
- 需要通过构建模块隔离领域和外部 adapter

只有在用户明确要求完整多模块架构时才使用此模式。

## 4. 各层职责

### 4.1 adapter

职责：

- 接收入站流量
- 将 HTTP 请求适配为 application 调用
- 参数绑定和基础校验
- 调用 application 层
- 返回统一响应

可能包含：

- REST controller
- request / response assembler
- scheduler trigger
- MQ consumer

典型命名：

- BookingController
- StoreAdminController
- TherapistController
- CheckinController
- BookingAssembler

规则：

- 不包含核心业务逻辑
- 不直接调用 mapper、repository 或 DAO
- 不处理复杂状态流转
- 不做预约冲突计算

### 4.2 application

这是用例编排层。

职责：

- 执行 command 和 query
- 定义事务边界
- 协调领域对象和领域服务
- 调用 gateway
- 组装输出结果
- 安排用例步骤顺序

常用子包：

- command
- query
- service
- executor

典型命名：

- BookingCreateCmdExe
- BookingCancelCmdExe
- CheckinConfirmCmdExe
- ServiceStartCmdExe
- TherapistScheduleQueryExe
- BookingAppService

规则：

- application 负责编排，但不应成为上帝层
- 可复用业务规则属于 domain 时，应将其移入 domain
- 查询流程可以务实处理，不强行复杂建模
- 行为简单时可以使用 `*AppService`
- 行为由 command 驱动且规则较多时，优先使用 `*CmdExe` / `*QueryExe`
- 管理类 CRUD 出站端口（`*Repository` / `*Gateway` 接口）可以放在 application；核心业务出站端口必须放在 domain（见 5.12）
- 查询与命令规模都较大时，按 `BookingQueryService`（读）/ `BookingAppService`（写）拆分，并抽出 `*Assembler`、`*Authorizer`、`*PricingCalculator` 等共享组件，避免服务膨胀
- 用例契约类型（Command / Query / VO / Models / Payload 等请求与响应模型）按官方 COLA Light 约定放在 `application/<module>/dto` 子包，不要散放在业务包根目录（完整多模块 COLA 中这些类型属于 client 模块）

### 4.3 domain

这是表达业务含义的层。

职责：

- 领域实体
- 值对象
- 领域服务
- gateway 接口
- 不变量检查
- 业务概念
- 具有业务含义的行为

建议业务模块：

- auth
- store
- serviceitem
- therapist
- schedule
- room
- booking
- order
- checkin
- member
- coupon

典型命名：

- Booking
- BookingStatus
- BookingTimeRange
- TherapistSchedule
- RoomOccupation
- BookingDomainService
- ScheduleConflictChecker
- BookingGateway
- TherapistGateway
- RoomGateway

规则：

- 出站端口和 gateway 接口属于 domain
- 实体应表达业务含义，而不是数据库结构
- domain 不依赖 adapter/web 细节
- domain 不暴露持久化 DO 作为核心契约
- 预约冲突、状态流转、服务时间占用等核心规则优先放在 domain

### 4.4 infrastructure

这是出站和技术实现层。

职责：

- 实现 gateway
- 持久化
- mapper / repository / DAO
- 外部 HTTP/RPC 集成
- cache / message 实现
- 存储模型与领域模型转换
- 技术配置

典型命名：

- BookingGatewayImpl
- TherapistGatewayImpl
- RoomGatewayImpl
- BookingMapper
- BookingRepositoryImpl
- RedisBookingLock
- WechatPayClient

规则：

- 实现上层定义的接口
- 不向上泄漏持久化模型
- 将外部协议细节保留在此层
- 不包含 UI 或 web 请求语义

### 4.5 client（仅完整 COLA 多模块使用）

职责：

- 外部契约定义
- command / query / request 对象
- response / view 对象
- 必要时定义 API 接口
- 共享的面向客户端 DTO

典型命名：

- BookingCreateCmd
- BookingQuery
- BookingVO
- TimeSlotVO
- TherapistVO

规则：

- 不放业务规则
- 不放基础设施关注点
- 保持面向契约

### 4.6 start（仅完整 COLA 多模块使用）

职责：

- Spring Boot 启动
- 配置组装
- 依赖装配入口
- 环境引导

规则：

- 不包含业务逻辑
- 不进行领域编排
- 不实现 endpoint

## 5. 栖愈后端核心实践规则

1. 默认使用 **COLA Light** 组织后端。
2. 后端代码先按业务模块组织，再按 COLA 分层。
3. adapter 保持轻量，不堆积业务 if/else。
4. application 放置用例步骤编排和事务。
5. domain 放置预约冲突、订单状态、服务占用、排班规则等核心业务规则。
6. infrastructure 放置 gateway 实现、持久化、缓存和外部集成。
7. 务实处理 query 流程，不要对简单读取 API 过度建模。
8. 避免从 adapter 或 application 直接访问 mapper 或 DAO；除非任务明确需要，并且依赖方向仍然清晰。
9. API 边界使用 DTO / Command / Query / VO，不直接返回持久化实体。
10. 状态流转必须通过明确枚举或领域方法表达。
11. 技术配置类（MyBatis-Plus、Sa-Token、Scheduling 等）放在 `infrastructure/config`，不要建顶层 `config` 包。
12. 出站端口双规：核心业务端口（booking、catalog、coupon、payment、member 等参与业务不变量）放在 domain/gateway；管理类 CRUD 端口（门店/系统/角色/菜单等管理维护）放在 application 层对应模块。两者都不能在 application 直接 import 基础设施实现类。
13. domain 中的 `catalog` 记录（Store/ServiceItem/Therapist/Room）是稳定的共享读模型快照，允许携带展示字段；行为类不变量必须放在聚合与领域服务中，不写入这些读模型。
14. 聚合构建统一走 `BookingFactory`（demo/create/restore 表达意图），不要使用望远镜式构造函数；预约编号使用 `BookingNo` 值对象。
15. 预约创建必须携带 `requestId` 幂等键并走唯一索引兜底；更新必须携带乐观锁 version；资源占用冲突校验依赖资源主表行锁，不能只靠内存 `synchronized`。

## 6. 推荐包结构

COLA Light 下推荐按层组织，并在每层内按业务模块拆包：

```text
com.qiyu
├── adapter
│   ├── booking
│   ├── checkin
│   ├── store
│   ├── therapist
│   └── scheduling
├── application
│   ├── booking
│   │   └── dto        ← 用例契约：BookingCreateCommand / BookingVO / BookingOperationVO
│   ├── schedule
│   ├── order
│   └── member
│       └── dto
├── domain
│   ├── booking
│   ├── schedule
│   ├── room
│   ├── therapist
│   └── gateway
└── infrastructure
    ├── persistence
    ├── cache
    ├── config
    ├── auth
    └── integration
```

当某个业务模块变大时，可以在该模块内部继续拆分 command、query、model、gateway、assembler。

## 7. 预约业务建模建议

优先建模这些领域概念：

- Booking：预约聚合，负责状态、预约时间、客户、门店、服务项目、技师和房间的核心一致性。
- BookingStatus：预约状态枚举。
- BookingTimeRange：预约时间范围，包含服务前准备和服务后清洁占用。
- TherapistSchedule：技师排班。
- RoomOccupation：房间占用。
- ScheduleConflictChecker：预约冲突校验服务。

第一期不要过度建模复杂营销、财务结算或工资提成。尚未明确的业务只保留接口和 Mock 数据。

## 8. 最终目标

将 COLA 作为以业务为中心的架构约束，而不是形式负担。

优先保证：

- 结构清晰可读
- AI 生成的代码稳定
- 依赖方向明确
- 预约核心规则可维护
- 单体系统可持续演进
