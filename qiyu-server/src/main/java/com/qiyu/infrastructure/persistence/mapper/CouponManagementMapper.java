package com.qiyu.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qiyu.infrastructure.persistence.entity.CouponTemplateEntity;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/** MyBatis-Plus mapper with typed coupon reference queries. */
public interface CouponManagementMapper extends BaseMapper<CouponTemplateEntity> {
    /** Includes soft-deleted rows because the coupon-code unique key remains allocated. */
    @Select("SELECT COUNT(*) FROM coupon_template WHERE coupon_code=#{code}")
    long codeCountIncludingDeleted(@Param("code") String code);

    /** Counts issued customer coupons before template deletion. */
    @Select("SELECT COUNT(*) FROM customer_coupon WHERE coupon_template_id=#{templateId} AND deleted=0")
    long customerCouponCount(@Param("templateId") long templateId);
}
