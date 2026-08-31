package com.qiyu.infrastructure.persistence.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;

import java.math.BigDecimal;

/** MyBatis-Plus persistence model for therapist master data. */
@TableName("therapist")
public class TherapistEntity {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long staffId;
    private String therapistCode;
    private Long storeId;
    private String therapistName;
    private String avatarUrl;
    private String portraitUrl;
    private String levelName;
    private Integer experienceYears;
    private BigDecimal rating;
    private Integer serviceCount;
    private BigDecimal specifyFeeAmount;
    private String status;
    private String introduction;
    private Integer sortOrder;
    private Integer enabled;
    @TableLogic
    private Integer deleted;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getStaffId() { return staffId; }
    public void setStaffId(Long staffId) { this.staffId = staffId; }
    public String getTherapistCode() { return therapistCode; }
    public void setTherapistCode(String therapistCode) { this.therapistCode = therapistCode; }
    public Long getStoreId() { return storeId; }
    public void setStoreId(Long storeId) { this.storeId = storeId; }
    public String getTherapistName() { return therapistName; }
    public void setTherapistName(String therapistName) { this.therapistName = therapistName; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getPortraitUrl() { return portraitUrl; }
    public void setPortraitUrl(String portraitUrl) { this.portraitUrl = portraitUrl; }
    public String getLevelName() { return levelName; }
    public void setLevelName(String levelName) { this.levelName = levelName; }
    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }
    public BigDecimal getRating() { return rating; }
    public void setRating(BigDecimal rating) { this.rating = rating; }
    public Integer getServiceCount() { return serviceCount; }
    public void setServiceCount(Integer serviceCount) { this.serviceCount = serviceCount; }
    public BigDecimal getSpecifyFeeAmount() { return specifyFeeAmount; }
    public void setSpecifyFeeAmount(BigDecimal specifyFeeAmount) { this.specifyFeeAmount = specifyFeeAmount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getIntroduction() { return introduction; }
    public void setIntroduction(String introduction) { this.introduction = introduction; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public Integer getEnabled() { return enabled; }
    public void setEnabled(Integer enabled) { this.enabled = enabled; }
    public Integer getDeleted() { return deleted; }
    public void setDeleted(Integer deleted) { this.deleted = deleted; }
}
