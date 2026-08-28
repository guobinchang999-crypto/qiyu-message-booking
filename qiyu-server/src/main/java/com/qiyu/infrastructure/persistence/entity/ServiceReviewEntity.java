package com.qiyu.infrastructure.persistence.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("service_review")
public class ServiceReviewEntity {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long bookingId;
    private Long serviceOrderId;
    private Long customerId;
    private Long storeId;
    private Long therapistId;
    private Long serviceItemId;
    private Integer therapistRating;
    private Integer environmentRating;
    private Integer serviceRating;
    private String tags;
    private String content;
    private Integer anonymous;
    private String status;
    private Integer deleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
    public Long getServiceOrderId() { return serviceOrderId; }
    public void setServiceOrderId(Long serviceOrderId) { this.serviceOrderId = serviceOrderId; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public Long getStoreId() { return storeId; }
    public void setStoreId(Long storeId) { this.storeId = storeId; }
    public Long getTherapistId() { return therapistId; }
    public void setTherapistId(Long therapistId) { this.therapistId = therapistId; }
    public Long getServiceItemId() { return serviceItemId; }
    public void setServiceItemId(Long serviceItemId) { this.serviceItemId = serviceItemId; }
    public Integer getTherapistRating() { return therapistRating; }
    public void setTherapistRating(Integer therapistRating) { this.therapistRating = therapistRating; }
    public Integer getEnvironmentRating() { return environmentRating; }
    public void setEnvironmentRating(Integer environmentRating) { this.environmentRating = environmentRating; }
    public Integer getServiceRating() { return serviceRating; }
    public void setServiceRating(Integer serviceRating) { this.serviceRating = serviceRating; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Integer getAnonymous() { return anonymous; }
    public void setAnonymous(Integer anonymous) { this.anonymous = anonymous; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getDeleted() { return deleted; }
    public void setDeleted(Integer deleted) { this.deleted = deleted; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
