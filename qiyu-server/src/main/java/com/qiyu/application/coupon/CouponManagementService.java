package com.qiyu.application.coupon;

import com.qiyu.application.auth.AuthAppService;
import com.qiyu.application.auth.AuthPrincipal;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** Coordinates typed coupon-template CRUD without implementing issuance or settlement behavior. */
@Service
public class CouponManagementService {
    private final AuthAppService authAppService;
    private final ObjectProvider<CouponManagementRepository> repositoryProvider;

    public CouponManagementService(AuthAppService authAppService,
                                   ObjectProvider<CouponManagementRepository> repositoryProvider) {
        this.authAppService=authAppService; this.repositoryProvider=repositoryProvider;
    }

    /** Returns all non-deleted templates after coupon read authorization. */
    public List<CouponView> list() { authAppService.requirePermission("coupon:read"); return repository().list().stream().map(CouponManagementService::view).toList(); }

    /** Creates a draft or active all-store template with mutually exclusive discount values. */
    @Transactional
    public CouponView create(CouponCommand command) {
        AuthPrincipal principal=authAppService.requirePermission("coupon:manage");
        String code=code(command.code());
        if(repository().codeExists(code)) throw new IllegalArgumentException("优惠券编码已存在");
        Values values=values(command);
        return view(repository().save(template(null,"coupon-"+code.toLowerCase(Locale.ROOT).replace('_','-'),code,values,0,0,
                String.valueOf(principal.userId()),String.valueOf(principal.userId()))));
    }

    /** Updates commercial fields but preserves stable code and real issue/use counters. */
    @Transactional
    public CouponView update(String couponId,CouponCommand command) {
        AuthPrincipal principal=authAppService.requirePermission("coupon:manage");
        CouponManagementRepository.CouponTemplate current=repository().find(couponId)
                .orElseThrow(()->new IllegalArgumentException("优惠券不存在"));
        if(!current.code().equals(code(command.code()))) throw new IllegalArgumentException("优惠券编码创建后不能修改");
        Values values=values(command);
        if(current.issuedCount()>0 || repository().customerCouponCount(current.databaseId())>0) {
            if(!java.util.Objects.equals(current.discountType(),values.type())
                || !sameAmount(current.discountAmount(),values.amount()) || !sameAmount(current.discountPercent(),values.percent())
                || !sameAmount(current.thresholdAmount(),values.threshold())
                || !java.util.Objects.equals(current.validStartAt(),values.start()) || !java.util.Objects.equals(current.validEndAt(),values.end()))
                throw new IllegalArgumentException("优惠券已有发放记录，不能修改优惠规则或有效期");
        }
        return view(repository().save(template(current.databaseId(),current.id(),current.code(),values,
                current.issuedCount(),current.usedCount(),current.createdBy(),String.valueOf(principal.userId()))));
    }

    /** Deletes only templates with no issuance history; used templates must be ended instead. */
    @Transactional
    public void delete(String couponId) {
        authAppService.requirePermission("coupon:manage");
        CouponManagementRepository.CouponTemplate current=repository().find(couponId)
                .orElseThrow(()->new IllegalArgumentException("优惠券不存在"));
        if(current.issuedCount()>0 || repository().customerCouponCount(current.databaseId())>0)
            throw new IllegalArgumentException("优惠券已有发放记录，不能删除，请改为结束状态");
        repository().delete(current.databaseId());
    }

    private CouponManagementRepository repository(){CouponManagementRepository value=repositoryProvider.getIfAvailable();if(value==null)throw new IllegalStateException("当前运行模式未配置优惠券持久化仓储");return value;}
    private static Values values(CouponCommand command){
        String type=required(command.discountType(),"优惠类型不能为空").toUpperCase(Locale.ROOT);
        if(!Set.of("FIXED","PERCENT").contains(type))throw new IllegalArgumentException("优惠类型不正确");
        BigDecimal amount="FIXED".equals(type)?positive(command.discountAmount(),"优惠金额必须大于0"):null;
        BigDecimal percent="PERCENT".equals(type)?positive(command.discountPercent(),"折扣比例必须大于0"):null;
        if(percent!=null&&percent.compareTo(BigDecimal.valueOf(100))>0)throw new IllegalArgumentException("折扣比例不能超过100");
        BigDecimal threshold=command.thresholdAmount()==null?BigDecimal.ZERO:command.thresholdAmount();
        if(threshold.signum()<0)throw new IllegalArgumentException("使用门槛不能小于0");
        if(command.validStartAt()==null||command.validEndAt()==null||!command.validEndAt().isAfter(command.validStartAt()))throw new IllegalArgumentException("优惠券结束时间必须晚于开始时间");
        String status=required(command.status(),"优惠券状态不能为空").toUpperCase(Locale.ROOT);
        if(!Set.of("DRAFT","ACTIVE","ENDED").contains(status))throw new IllegalArgumentException("优惠券状态不正确");
        return new Values(required(command.name(),"优惠券名称不能为空"),type,amount,percent,threshold,command.validStartAt(),command.validEndAt(),status);
    }
    private static CouponManagementRepository.CouponTemplate template(Long dbId,String id,String code,Values v,int issued,int used,String created,String updated){return new CouponManagementRepository.CouponTemplate(dbId,id,code,v.name(),v.type(),v.amount(),v.percent(),v.threshold(),v.start(),v.end(),issued,used,v.status(),created,updated);}
    private static CouponView view(CouponManagementRepository.CouponTemplate v){return new CouponView(v.id(),v.code(),v.name(),v.discountType(),v.discountAmount(),v.discountPercent(),v.thresholdAmount(),v.validStartAt(),v.validEndAt(),v.issuedCount(),v.usedCount(),v.status(),"ALL_STORES");}
    private static String code(String value){String code=required(value,"优惠券编码不能为空").toUpperCase(Locale.ROOT).replace('-','_');if(!code.matches("[A-Z0-9_]{2,32}"))throw new IllegalArgumentException("优惠券编码只能包含字母、数字和下划线");return code;}
    private static String required(String value,String message){if(value==null||value.isBlank())throw new IllegalArgumentException(message);return value.trim();}
    private static BigDecimal positive(BigDecimal value,String message){if(value==null||value.signum()<=0)throw new IllegalArgumentException(message);return value;}
    private static boolean sameAmount(BigDecimal left,BigDecimal right){return left==null?right==null:right!=null&&left.compareTo(right)==0;}

    public record CouponCommand(String code,String name,String discountType,BigDecimal discountAmount,
                                BigDecimal discountPercent,BigDecimal thresholdAmount,LocalDateTime validStartAt,
                                LocalDateTime validEndAt,String status){}
    public record CouponView(String id,String code,String name,String discountType,BigDecimal discountAmount,
                             BigDecimal discountPercent,BigDecimal thresholdAmount,LocalDateTime validStartAt,
                             LocalDateTime validEndAt,int issuedCount,int usedCount,String status,String scope){}
    private record Values(String name,String type,BigDecimal amount,BigDecimal percent,BigDecimal threshold,
                          LocalDateTime start,LocalDateTime end,String status){}
}
