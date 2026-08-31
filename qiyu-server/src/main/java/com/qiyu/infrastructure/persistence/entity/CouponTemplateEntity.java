package com.qiyu.infrastructure.persistence.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** MyBatis-Plus entity for the global-brand coupon template. */
@TableName("coupon_template")
public class CouponTemplateEntity {
    @TableId(type = IdType.AUTO) private Long id;
    private String couponCode;
    private String couponName;
    private String couponScope;
    private String discountType;
    private BigDecimal discountAmount;
    private BigDecimal discountPercent;
    private BigDecimal thresholdAmount;
    private LocalDateTime validStartAt;
    private LocalDateTime validEndAt;
    private Integer issuedCount;
    private Integer usedCount;
    private String status;
    @TableLogic private Integer deleted;
    private String createdBy;
    private String updatedBy;

    public Long getId() { return id; } public void setId(Long value) { id=value; }
    public String getCouponCode() { return couponCode; } public void setCouponCode(String value) { couponCode=value; }
    public String getCouponName() { return couponName; } public void setCouponName(String value) { couponName=value; }
    public String getCouponScope() { return couponScope; } public void setCouponScope(String value) { couponScope=value; }
    public String getDiscountType() { return discountType; } public void setDiscountType(String value) { discountType=value; }
    public BigDecimal getDiscountAmount() { return discountAmount; } public void setDiscountAmount(BigDecimal value) { discountAmount=value; }
    public BigDecimal getDiscountPercent() { return discountPercent; } public void setDiscountPercent(BigDecimal value) { discountPercent=value; }
    public BigDecimal getThresholdAmount() { return thresholdAmount; } public void setThresholdAmount(BigDecimal value) { thresholdAmount=value; }
    public LocalDateTime getValidStartAt() { return validStartAt; } public void setValidStartAt(LocalDateTime value) { validStartAt=value; }
    public LocalDateTime getValidEndAt() { return validEndAt; } public void setValidEndAt(LocalDateTime value) { validEndAt=value; }
    public Integer getIssuedCount() { return issuedCount; } public void setIssuedCount(Integer value) { issuedCount=value; }
    public Integer getUsedCount() { return usedCount; } public void setUsedCount(Integer value) { usedCount=value; }
    public String getStatus() { return status; } public void setStatus(String value) { status=value; }
    public Integer getDeleted() { return deleted; } public void setDeleted(Integer value) { deleted=value; }
    public String getCreatedBy() { return createdBy; } public void setCreatedBy(String value) { createdBy=value; }
    public String getUpdatedBy() { return updatedBy; } public void setUpdatedBy(String value) { updatedBy=value; }
}
