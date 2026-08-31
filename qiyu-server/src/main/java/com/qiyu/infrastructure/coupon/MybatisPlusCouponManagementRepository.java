package com.qiyu.infrastructure.coupon;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qiyu.application.coupon.CouponManagementRepository;
import com.qiyu.infrastructure.persistence.entity.CouponTemplateEntity;
import com.qiyu.infrastructure.persistence.mapper.CouponManagementMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

/** Production coupon-template repository implemented with MyBatis-Plus. */
@Repository
@ConditionalOnProperty(name="qiyu.auth.persistence",havingValue="true")
public class MybatisPlusCouponManagementRepository implements CouponManagementRepository {
    private final CouponManagementMapper mapper;
    public MybatisPlusCouponManagementRepository(CouponManagementMapper mapper){this.mapper=mapper;}

    /** Loads all templates in deterministic database order. */
    @Override public List<CouponTemplate> list(){return mapper.selectList(new LambdaQueryWrapper<CouponTemplateEntity>().orderByDesc(CouponTemplateEntity::getId)).stream().map(MybatisPlusCouponManagementRepository::template).toList();}
    /** Resolves a stable API ID to its immutable business code. */
    @Override public Optional<CouponTemplate> find(String couponId){String code=databaseCode(couponId);return Optional.ofNullable(mapper.selectOne(new LambdaQueryWrapper<CouponTemplateEntity>().eq(CouponTemplateEntity::getCouponCode,code))).map(MybatisPlusCouponManagementRepository::template);}
    /** Checks active code uniqueness through MyBatis-Plus. */
    @Override public boolean codeExists(String code){return mapper.codeCountIncludingDeleted(code)>0;}
    /** Inserts or updates a template and returns values persisted on the entity. */
    @Override public CouponTemplate save(CouponTemplate value){CouponTemplateEntity entity=entity(value);if(entity.getId()==null)mapper.insert(entity);else mapper.updateById(entity);CouponTemplateEntity saved=mapper.selectById(entity.getId());if(saved==null)throw new IllegalStateException("优惠券保存成功但读取模型尚未同步");return template(saved);}
    /** Counts customer instances referencing a template. */
    @Override public long customerCouponCount(long databaseId){return mapper.customerCouponCount(databaseId);}
    /** Uses TableLogic metadata for soft deletion. */
    @Override public void delete(long databaseId){mapper.deleteById(databaseId);}

    private static CouponTemplateEntity entity(CouponTemplate value){CouponTemplateEntity e=new CouponTemplateEntity();e.setId(value.databaseId());e.setCouponCode(value.code());e.setCouponName(value.name());e.setCouponScope("ALL_STORES");e.setDiscountType(value.discountType());e.setDiscountAmount(value.discountAmount());e.setDiscountPercent(value.discountPercent());e.setThresholdAmount(value.thresholdAmount());e.setValidStartAt(value.validStartAt());e.setValidEndAt(value.validEndAt());e.setIssuedCount(value.issuedCount());e.setUsedCount(value.usedCount());e.setStatus(value.status());e.setCreatedBy(value.createdBy());e.setUpdatedBy(value.updatedBy());return e;}
    private static CouponTemplate template(CouponTemplateEntity e){String id="coupon-"+e.getCouponCode().toLowerCase(Locale.ROOT).replace('_','-');return new CouponTemplate(e.getId(),id,e.getCouponCode(),e.getCouponName(),e.getDiscountType(),e.getDiscountAmount(),e.getDiscountPercent(),e.getThresholdAmount(),e.getValidStartAt(),e.getValidEndAt(),e.getIssuedCount()==null?0:e.getIssuedCount(),e.getUsedCount()==null?0:e.getUsedCount(),e.getStatus(),e.getCreatedBy(),e.getUpdatedBy());}
    private static String databaseCode(String id){if(id==null||!id.startsWith("coupon-"))throw new IllegalArgumentException("优惠券编号格式不正确");return id.substring(7).replace('-','_').toUpperCase(Locale.ROOT);}
}
