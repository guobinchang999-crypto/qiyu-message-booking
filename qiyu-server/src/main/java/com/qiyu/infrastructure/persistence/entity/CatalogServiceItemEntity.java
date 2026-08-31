package com.qiyu.infrastructure.persistence.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;

import java.math.BigDecimal;

/** MyBatis-Plus persistence entity for the service_item table. */
@TableName("service_item")
public class CatalogServiceItemEntity {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String serviceCode;
    private Long categoryId;
    private String serviceName;
    private String coverUrl;
    private Integer durationMinutes;
    private Integer preparationMinutes;
    private Integer cleanupMinutes;
    private BigDecimal priceAmount;
    private BigDecimal memberPriceAmount;
    private String description;
    private String serviceSteps;
    private String suitablePeople;
    private String notices;
    private Integer salesCount;
    private String status;
    private Integer sortOrder;
    @TableLogic
    private Integer deleted;
    private String createdBy;
    private String updatedBy;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getServiceCode() { return serviceCode; }
    public void setServiceCode(String serviceCode) { this.serviceCode = serviceCode; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    public String getCoverUrl() { return coverUrl; }
    public void setCoverUrl(String coverUrl) { this.coverUrl = coverUrl; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public Integer getPreparationMinutes() { return preparationMinutes; }
    public void setPreparationMinutes(Integer preparationMinutes) { this.preparationMinutes = preparationMinutes; }
    public Integer getCleanupMinutes() { return cleanupMinutes; }
    public void setCleanupMinutes(Integer cleanupMinutes) { this.cleanupMinutes = cleanupMinutes; }
    public BigDecimal getPriceAmount() { return priceAmount; }
    public void setPriceAmount(BigDecimal priceAmount) { this.priceAmount = priceAmount; }
    public BigDecimal getMemberPriceAmount() { return memberPriceAmount; }
    public void setMemberPriceAmount(BigDecimal memberPriceAmount) { this.memberPriceAmount = memberPriceAmount; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getServiceSteps() { return serviceSteps; }
    public void setServiceSteps(String serviceSteps) { this.serviceSteps = serviceSteps; }
    public String getSuitablePeople() { return suitablePeople; }
    public void setSuitablePeople(String suitablePeople) { this.suitablePeople = suitablePeople; }
    public String getNotices() { return notices; }
    public void setNotices(String notices) { this.notices = notices; }
    public Integer getSalesCount() { return salesCount; }
    public void setSalesCount(Integer salesCount) { this.salesCount = salesCount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public Integer getDeleted() { return deleted; }
    public void setDeleted(Integer deleted) { this.deleted = deleted; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
}
