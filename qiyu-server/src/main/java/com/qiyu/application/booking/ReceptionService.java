package com.qiyu.application.booking;

import com.qiyu.application.auth.*;
import com.qiyu.application.booking.dto.ReceptionModels.*;
import com.qiyu.domain.booking.*;
import com.qiyu.domain.booking.gateway.BookingGateway;
import com.qiyu.domain.catalog.gateway.CatalogGateway;
import com.qiyu.domain.customer.gateway.CustomerLookupGateway;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import java.time.*;
import java.util.*;
import java.math.BigDecimal;

/** Staff reception coordinates existing booking rules, never a second lifecycle. */
@Service
public class ReceptionService {
    private final BookingGateway bookings;
    private final CatalogGateway catalog;
    private final AuthAppService auth;
    private final DataPermissionService permissions;
    private final BookingAssembler assembler;
    private final BookingAppService commands;
    private final BookingAvailabilityService availability;
    private final CustomerLookupGateway customers;
    private final ObjectProvider<BookingAuditRepository> audit;
    public ReceptionService(BookingGateway bookings, CatalogGateway catalog, AuthAppService auth,
            DataPermissionService permissions, BookingAssembler assembler, BookingAppService commands,
            BookingAvailabilityService availability, CustomerLookupGateway customers, ObjectProvider<BookingAuditRepository> audit) {
        this.bookings=bookings; this.catalog=catalog; this.auth=auth; this.permissions=permissions;
        this.assembler=assembler; this.commands=commands; this.availability=availability; this.customers=customers; this.audit=audit;
    }
    private boolean readable(AuthPrincipal p, Booking b) {
        return (p.hasPermission("booking:read") && permissions.canAccessBooking(p,b,"READ"))
            || (p.hasPermission("booking:checkin") && permissions.canAccessBooking(p,b,"CHECKIN"))
            || (p.hasPermission("service_order:read") && permissions.canAccessBooking(p,b,"READ"));
    }
    private Booking load(String id) {
        var p=auth.requireAdmin();
        var b=bookings.findById(id).orElseThrow(() -> new IllegalArgumentException("预约不存在"));
        if (!readable(p,b)) throw new SecurityException("没有权限访问该预约");
        return b;
    }
    private Entry entry(Booking b) {
        var p=auth.requireAdmin(); var actions=new ArrayList<String>();
        boolean update=p.hasPermission("booking:update") && permissions.canAccessBooking(p,b,"UPDATE");
        if (b.status()==BookingStatus.BOOKED) {
            if (p.hasPermission("booking:checkin") && permissions.canAccessBooking(p,b,"CHECKIN")) actions.add("checkin");
            if (update) actions.add("reschedule");
        }
        if (update && Set.of(BookingStatus.BOOKED,BookingStatus.CHECKED_IN,BookingStatus.WAITING_SERVICE).contains(b.status())) {
            actions.add("therapist"); actions.add("room");
        }
        if (update && Set.of(BookingStatus.CHECKED_IN,BookingStatus.WAITING_SERVICE).contains(b.status())) actions.add("start-service");
        if (update && b.status()==BookingStatus.IN_SERVICE) actions.add("finish-service");
        if (update && b.status()==BookingStatus.PENDING_SETTLEMENT) actions.add("settle");
        if (Set.of(BookingStatus.PENDING_PAYMENT,BookingStatus.BOOKED).contains(b.status())
                && p.hasPermission("booking:cancel") && permissions.canAccessBooking(p,b,"CANCEL")) actions.add("cancel");
        String roomName=catalog.rooms().stream().filter(r -> r.id().equals(b.roomId())).map(r -> r.name()).findFirst().orElse("待安排");
        return new Entry(assembler.toView(b),roomName,b.timeRange().occupiedFrom().toString(),b.timeRange().occupiedTo().toString(),b.version(),actions);
    }
    public Entry detail(String id) { return entry(load(id)); }
    public Page list(Query query) {
        var p=auth.requireAdmin();
        if (!p.hasPermission("booking:read") && !p.hasPermission("booking:checkin") && !p.hasPermission("service_order:read"))
            throw new SecurityException("没有权限查看预约");
        LocalDate start=blank(query.startDate())?null:LocalDate.parse(query.startDate());
        LocalDate end=blank(query.endDate())?start:LocalDate.parse(query.endDate());
        if (start!=null && end!=null && end.isBefore(start)) throw new IllegalArgumentException("结束日期不能早于开始日期");
        int page=query.pageNum()==null?1:query.pageNum(), size=query.pageSize()==null?20:query.pageSize();
        if (page<1 || size<1 || size>200) throw new IllegalArgumentException("分页范围无效");
        String keyword=blank(query.keyword())?"":query.keyword().trim().toLowerCase();
        var base=bookings.findAll().stream().filter(b -> readable(p,b))
            .filter(b -> blank(query.storeId()) || query.storeId().equals(b.storeId()))
            .filter(b -> start==null || !b.timeRange().serviceFrom().toLocalDate().isBefore(start))
            .filter(b -> end==null || !b.timeRange().serviceFrom().toLocalDate().isAfter(end))
            .filter(b -> blank(query.customerId()) || query.customerId().equals(b.customerId()))
            .filter(b -> keyword.isEmpty() || (b.id()+b.customerName()+b.mobile()).toLowerCase().contains(keyword))
            .sorted(Comparator.comparing((Booking b) -> b.timeRange().serviceFrom()).thenComparing(Booking::id)).toList();
        Map<String,Long> counts=new LinkedHashMap<>();
        for (BookingStatus s:BookingStatus.values()) counts.put(s.name(),base.stream().filter(b -> b.status()==s).count());
        var statuses=blank(query.status())?Set.<String>of():Set.copyOf(Arrays.asList(query.status().split(",")));
        for (String s:statuses) BookingStatus.valueOf(s);
        var filtered=base.stream().filter(b -> statuses.isEmpty() || statuses.contains(b.status().name())).toList();
        return new Page(filtered.stream().skip((long)(page-1)*size).limit(size).map(this::entry).toList(),filtered.size(),page,size,counts);
    }
    public Options options() {
        var p=auth.requireAdmin();
        if (!p.hasPermission("booking:read") && !p.hasPermission("booking:create") && !p.hasPermission("booking:checkin") && !p.hasPermission("service_order:read")) throw new SecurityException("无预约访问权限");
        var storeIds=catalog.stores().stream().filter(s -> p.canAccessStore("booking","READ",s.id())
            || p.canAccessStore("booking","CREATE",s.id()) || p.canAccessStore("booking","CHECKIN",s.id())
            || catalog.therapists().stream().anyMatch(t -> Objects.equals(t.id(),p.therapistId()) && t.storeId().equals(s.id())))
            .map(s -> s.id()).collect(java.util.stream.Collectors.toSet());
        return new Options(catalog.stores().stream().filter(s -> storeIds.contains(s.id())).map(s -> new Option(s.id(),s.name(),s.id(),null,null)).toList(),
            catalog.services().stream().map(s -> new Option(s.id(),s.name(),null,s.price(),s.durationMinutes())).toList(),
            catalog.therapists().stream().filter(t -> storeIds.contains(t.storeId())).map(t -> new Option(t.id(),t.name(),t.storeId(),t.extraFee(),null)).toList(),
            catalog.rooms().stream().filter(r -> storeIds.contains(r.storeId())).map(r -> new Option(r.id(),r.name(),r.storeId(),null,null)).toList());
    }
    public Availability availability(Placement input) {
        var p=auth.requireAdmin();
        Booking candidate;
        if (!blank(input.bookingId())) {
            var b=load(input.bookingId());
            permissions.requireBooking(p,b,"booking:update","UPDATE");
            if (!b.storeId().equals(input.storeId()) || !b.serviceId().equals(input.serviceId())) throw new IllegalArgumentException("改期不能更换门店或服务项目");
            candidate=b.candidate(input.therapistId(),input.roomId(),LocalDate.parse(input.date()),LocalTime.parse(input.startTime()),catalog.findService(input.serviceId()).durationMinutes());
        } else {
            requireCreate(input.storeId());
            candidate=BookingFactory.create("preview",input.storeId(),input.serviceId(),input.therapistId(),input.roomId(),"预览","","preview",
                LocalDate.parse(input.date()),LocalTime.parse(input.startTime()),catalog.findService(input.serviceId()).durationMinutes(),BookingStatus.BOOKED,
                BigDecimal.ZERO,BigDecimal.ZERO,BigDecimal.ZERO,BigDecimal.ZERO,BigDecimal.ZERO,BigDecimal.ZERO,"preview");
        }
        try { availability.validate(candidate); }
        catch (IllegalArgumentException ex) { return new Availability(false,ex.getMessage(),null,null); }
        return new Availability(true,"当前时段可预约",candidate.timeRange().occupiedFrom().toString(),candidate.timeRange().occupiedTo().toString());
    }
    public Entry resolve(Code input) {
        var p=auth.requireAdmin();
        if (!p.hasPermission("booking:checkin") || !p.canAccessStore("booking","CHECKIN",input.storeId())) throw new SecurityException("无当前门店核销权限");
        var matches=bookings.findAll().stream().filter(b -> readable(p,b) && input.code().trim().equals(b.verificationCode())).toList();
        var sameStore=matches.stream().filter(b -> b.storeId().equals(input.storeId())).toList();
        if (sameStore.isEmpty()) throw new IllegalArgumentException(matches.isEmpty()?"核销码无效或已失效，请客户刷新后重试":"该预约不属于当前门店，请切换至预约门店");
        if (sameStore.size()!=1) throw new IllegalArgumentException("核销码存在重复，请使用预约编号查找并核对客户");
        return entry(sameStore.get(0));
    }
    public synchronized Entry confirm(Code input) {
        if (blank(input.bookingId()) || input.version()==null) throw new IllegalArgumentException("请先查询并核对预约");
        var b=load(input.bookingId());
        permissions.requireBooking(auth.requireAdmin(),b,"booking:checkin","CHECKIN");
        if (!b.storeId().equals(input.storeId())) throw new IllegalArgumentException("预约门店不匹配");
        if (!input.code().trim().equals(b.verificationCode())) throw new IllegalArgumentException("核销码已失效，请重新查询");
        if (b.status()==BookingStatus.CHECKED_IN) return entry(b);
        if (b.status()==BookingStatus.CANCELLED) throw new IllegalArgumentException("预约已取消，不能核销");
        checkVersion(b,input.version());
        commands.checkIn(b.id()); return detail(b.id());
    }
    public synchronized Entry action(String id, Action input) {
        var b=load(id); checkVersion(b,input.version());
        if (!entry(b).actions().contains(input.action())) throw new IllegalArgumentException("该操作当前不可执行，请刷新预约");
        switch(input.action()) {
            case "checkin" -> commands.checkIn(id);
            case "start-service" -> commands.startService(id);
            case "finish-service" -> commands.finishService(id);
            case "settle" -> commands.completeSettlement(id);
            case "cancel" -> commands.cancel(id);
            default -> throw new IllegalArgumentException("未知操作");
        }
        return detail(id);
    }
    public synchronized Entry change(String id, Change input) {
        var b=load(id); checkVersion(b,input.version());
        commands.updateBooking(id,input.date(),input.startTime(),input.therapistId(),input.roomId()); return detail(id);
    }
    public List<Audit> history(String id) { load(id); var repository=audit.getIfAvailable(); return repository==null?List.of():repository.list(id); }
    public Customer lookup(CustomerInput input) {
        requireCreate(input.storeId()); String mobile=normalizeMobile(input.mobile());
        return customers.findByMobile(mobile).map(c -> new Customer(c.id(),c.name(),c.mobile())).orElse(null);
    }
    public Customer createCustomer(CustomerInput input) {
        requireCreate(input.storeId()); String mobile=normalizeMobile(input.mobile());
        if (blank(input.name()) || input.name().trim().length()>64) throw new IllegalArgumentException("请输入 1–64 字客户姓名");
        CustomerLookupGateway.Customer c;
        try { c=customers.create(mobile,input.name().trim()); }
        catch (DuplicateKeyException ex) { c=customers.findByMobile(mobile).orElseThrow(() -> new IllegalArgumentException("该手机号已有停用档案，请联系管理员")); }
        return new Customer(c.id(),c.name(),c.mobile());
    }
    private void requireCreate(String storeId) {
        var p=auth.requireAdmin();
        if (!p.hasPermission("booking:create") || !p.canAccessStore("booking","CREATE",storeId)) throw new SecurityException("无当前门店预约创建权限");
        catalog.findStore(storeId);
    }
    public static String normalizeMobile(String mobile) {
        String value=mobile==null?"":mobile.replaceAll("[\\s-]","").replaceFirst("^\\+86","");
        if (!value.matches("1[3-9]\\d{9}")) throw new IllegalArgumentException("请输入有效的 11 位手机号");
        return value;
    }
    private static boolean blank(String value) { return value==null || value.isBlank(); }
    private static void checkVersion(Booking b,long version) { if (b.version()!=version) throw new IllegalArgumentException("预约已被其他人员修改，请刷新后重试"); }
}
