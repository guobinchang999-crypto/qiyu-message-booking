package com.qiyu.application.admin;

import com.qiyu.application.admin.dto.ManagementModels.*;
import com.qiyu.application.auth.*;
import com.qiyu.application.room.RoomManagementService;
import com.qiyu.application.serviceitem.ServiceManagementService;
import com.qiyu.application.coupon.CouponManagementService;
import com.qiyu.domain.catalog.gateway.CatalogGateway;
import com.qiyu.domain.auth.DataScopeType;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import java.util.*;
import java.math.*;
import java.time.*;
import java.util.function.Predicate;

/** Coordinates permission-scoped management queries without coupling callers to persistence. */
@Service
@org.springframework.transaction.annotation.Transactional(readOnly=true)
public class ManagementQueryService {
    private final AuthAppService auth;
    private final AdminQueryService admin;
    private final RoomManagementService rooms;
    private final ServiceManagementService services;
    private final CouponManagementService coupons;
    private final CatalogGateway catalog;
    private final ObjectProvider<ManagementReadRepository> repository;
    public ManagementQueryService(AuthAppService auth, AdminQueryService admin, RoomManagementService rooms,
        ServiceManagementService services, CouponManagementService coupons, CatalogGateway catalog,
        ObjectProvider<ManagementReadRepository> repository) {
        this.auth=auth; this.admin=admin; this.rooms=rooms; this.services=services;
        this.coupons=coupons; this.catalog=catalog; this.repository=repository;
    }
    public List<Option> stores(String resource) {
        if (!Set.of("store","therapist","room","customer","member","report","dashboard","schedule","booking").contains(resource))
            throw new IllegalArgumentException("不支持的门店筛选");
        var principal=auth.requirePermission(resource+":read");
        String scopeResource=resource.equals("dashboard")?"report":resource;
        return catalog.stores().stream().filter(s->principal.canAccessStore(scopeResource,"READ",s.id()))
            .map(s->new Option(s.id(),s.name())).toList();
    }
    public Page<?> resources(String resource, Query q) {
        q.validate();
        return switch(resource) {
            case "stores" -> page(admin.stores().stream().filter(r->text(q.keyword(),r.name(),r.address(),r.manager()))
                .filter(r->equal(q.status(),r.status()) && equal(q.region(),r.district()))
                .filter(r->q.enabled()==null || q.enabled().equals(r.enabled())).toList(),q);
            case "therapists" -> page(admin.therapists().stream().filter(r->text(q.keyword(),r.name(),r.mobile()))
                .filter(r->equal(q.storeId(),r.storeId()) && equal(q.status(),r.status()) && equal(q.level(),r.level()))
                .filter(r->q.category()==null || q.category().isBlank() || r.skills().contains(q.category()))
                .filter(r->q.enabled()==null || q.enabled()==r.enabled()).toList(),q);
            case "rooms" -> page(rooms.list().stream().filter(r->text(q.keyword(),r.name(),r.note()))
                .filter(r->equal(q.storeId(),r.storeId()) && equal(q.status(),r.status()) && equal(q.category(),r.kind()))
                .filter(r->q.enabled()==null || q.enabled()==r.enabled()).toList(),q);
            case "services" -> page(services.list().stream().filter(r->text(q.keyword(),r.name(),r.code()))
                .filter(r->equal(q.status(),r.status()) && equal(q.category(),r.category()))
                .filter(r->q.enabled()==null || q.enabled()==r.enabled()).toList(),q);
            case "coupons" -> page(coupons.list().stream().filter(r->text(q.keyword(),r.name(),r.code()))
                .filter(r->equal(q.status(),r.status())).toList(),q);
            default -> throw new IllegalArgumentException("不支持的资源");
        };
    }
    public long impact(String resource,String id){
        String code=switch(resource){
            case "stores" -> admin.stores().stream().filter(r->r.id().equals(id)).map(r->r.code()).findFirst().orElseThrow(()->new SecurityException("没有权限查看该门店"));
            case "therapists" -> admin.therapists().stream().filter(r->r.id().equals(id)).map(r->r.code()).findFirst().orElseThrow(()->new SecurityException("没有权限查看该技师"));
            case "rooms" -> rooms.list().stream().filter(r->r.id().equals(id)).map(r->r.id()).findFirst().orElseThrow(()->new SecurityException("没有权限查看该房间"));
            case "services" -> services.list().stream().filter(r->r.id().equals(id)).map(r->r.code()).findFirst().orElseThrow(()->new SecurityException("没有权限查看该项目"));
            default -> throw new IllegalArgumentException("不支持的资源");
        };
        return repo().unfinished(resource,code);
    }
    public Page<Customer> customers(Query q, boolean members) {
        q.validate(); var p=auth.requirePermission(members?"member:read":"customer:read");
        var result=repo().customers(access(p,members?"member":"customer",q.storeId()),q,members);
        return new Page<>(result.list().stream().map(c->new Customer(c.id(),c.memberId(),c.name(),
            p.hasPermission("customer:reveal_phone")?c.phone():mask(c.phone()), c.memberLevel(),c.lastVisitAt(),c.totalBookings(),
            p.hasPermission("finance:view")?c.totalSpend():null,
            members?c.balance():null,members?c.packageBalance():0,members?c.couponCount():0)).toList(),result.total(),result.pageNum(),result.pageSize());
    }
    public Page<Ledger> ledger(String memberId, Query q) {
        q.validate(); var p=auth.requirePermission("member:read");
        var all=repo().customers(access(p,"member",null),new Query(null,null,null,null,null,null,null,null,null,1,200,null,null,q.customerId()),true);
        if(q.customerId()==null || all.list().stream().noneMatch(c->memberId.equals(c.memberId())))
            throw new SecurityException("没有权限查看该会员流水");
        return repo().ledger(memberId,q);
    }
    public Page<CouponRecord> couponRecords(String templateId, Query q) {
        q.validate();
        var p=auth.requirePermission(templateId==null?"member:read":"coupon:read");
        return repo().coupons(access(p,templateId==null?"member":"coupon",q.storeId()),q,templateId);
    }
    public Analytics analytics(Query q, boolean dashboard) {
        q.validate(); dates(q);
        var p=auth.requirePermission(dashboard?"dashboard:read":"report:read");
        var access=access(p,"report",q.storeId());
        var rows=new ArrayList<>(repo().metrics(access,q,false));
        Comparator<Metric> comparator=switch(q.sort()==null?"revenue":q.sort()) {
            case "bookingCount" -> Comparator.comparingLong(Metric::bookingCount);
            case "completedCount" -> Comparator.comparingLong(Metric::completedCount);
            case "completionRate" -> Comparator.comparing(Metric::completionRate);
            case "averageTicket" -> Comparator.comparing(Metric::averageTicket);
            default -> Comparator.comparing(Metric::revenue);
        };
        rows.sort(("ascend".equals(q.order())?comparator:comparator.reversed()).thenComparing(Metric::id));
        var summary=metric("total","全部",rows.stream().mapToLong(Metric::bookingCount).sum(),
            rows.stream().mapToLong(Metric::completedCount).sum(),rows.stream().map(Metric::revenue).reduce(BigDecimal.ZERO,BigDecimal::add));
        var points=repo().metrics(access,q,true); var indexed=new HashMap<String,Metric>();
        points.forEach(point->indexed.put(point.id(),point)); var trend=new ArrayList<Metric>();
        for(var day=LocalDate.parse(q.startDate());!day.isAfter(LocalDate.parse(q.endDate()));day=day.plusDays(1))
            trend.add(indexed.getOrDefault(day.toString(),metric(day.toString(),day.toString(),0,0,BigDecimal.ZERO)));
        return new Analytics(summary,trend,page(rows,q),LocalDateTime.now().toString(),
            "按预约日期统计；预约数含已取消记录。完成率=完成数/预约数。已完成订单金额沿用订单净额（项目及指定费减优惠和余额抵扣），不代表现金实收。");
    }
    public String export(Query q) {
        auth.requirePermission("report:export");
        var first=analytics(q,false);
        var rows=new ArrayList<>(first.stores().list());
        rows.clear();
        for(int index=1; (long)(index-1)*200<first.stores().total();index++){
            var pageQuery=new Query(q.keyword(),q.storeId(),q.status(),q.category(),q.level(),q.region(),q.enabled(),
                q.startDate(),q.endDate(),index,200,q.sort(),q.order(),q.customerId());
            rows.addAll(analytics(pageQuery,false).stores().list());
        }
        var csv=new StringBuilder("门店,预约数,完成数,完成率(%),已完成订单金额,平均完成订单金额\r\n");
        for(var row:rows){
            String name=row.name().replace("\"","\"\"").replace("\r"," ").replace("\n"," ");
            if(name.matches("^[=+@-].*"))name="'"+name;
            csv.append("\"").append(name).append("\",").append(row.bookingCount()).append(',').append(row.completedCount())
                .append(',').append(row.completionRate()).append(',').append(row.revenue()).append(',').append(row.averageTicket()).append("\r\n");
        }
        return csv.toString();
    }
    public static Metric metric(String id,String name,long count,long completed,BigDecimal revenue) {
        return new Metric(id,name,count,completed,revenue,
            count==0?BigDecimal.ZERO:BigDecimal.valueOf(completed*100).divide(BigDecimal.valueOf(count),2,RoundingMode.HALF_UP),
            completed==0?BigDecimal.ZERO:revenue.divide(BigDecimal.valueOf(completed),2,RoundingMode.HALF_UP));
    }
    private static void dates(Query q) {
        if(q.startDate()==null || q.endDate()==null) throw new IllegalArgumentException("请选择日期范围");
        var start=LocalDate.parse(q.startDate()); var end=LocalDate.parse(q.endDate());
        if(end.isBefore(start)||end.isAfter(start.plusYears(1))) throw new IllegalArgumentException("日期范围须在一年以内");
    }
    private ManagementReadRepository repo(){var value=repository.getIfAvailable();if(value==null)throw new IllegalStateException("当前环境未配置管理查询数据源");return value;}
    private static AdminOperationsReadRepository.StoreAccess access(AuthPrincipal p,String resource,String storeId) {
        var scope=p.scopeFor(resource,"READ");
        if(storeId!=null&&!storeId.isBlank()&&!scope.allowsStore(storeId)) throw new SecurityException("没有权限访问该门店");
        return new AdminOperationsReadRepository.StoreAccess(storeId==null&&scope.allowsAllStores(),
            storeId==null?scope.storeIds():Set.of(storeId),scope.scopeTypes().contains(DataScopeType.SELF)?p.therapistId():null);
    }
    public static <T> Page<T> page(List<T> list,Query q){q.validate();return new Page<>(list.stream().skip((long)(q.page()-1)*q.size()).limit(q.size()).toList(),list.size(),q.page(),q.size());}
    private static boolean equal(String filter,String value){return filter==null||filter.isBlank()||filter.equals(value);}
    private static boolean text(String filter,String...values){return filter==null||filter.isBlank()||Arrays.stream(values).anyMatch(v->v!=null&&v.toLowerCase(Locale.ROOT).contains(filter.trim().toLowerCase(Locale.ROOT)));}
    private static String mask(String phone){return phone==null||phone.length()<7?phone:phone.substring(0,3)+"****"+phone.substring(phone.length()-4);}
}
