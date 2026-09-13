package com.qiyu.infrastructure.persistence.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@TableName("booking")
public class BookingEntity {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String bookingNo;
    private String requestId;
    private Long customerId;
    private Long storeId;
    private Long serviceItemId;
    private String therapistMode;
    private Long therapistId;
    private Long roomId;
    private LocalDateTime scheduledStartAt;
    private LocalDateTime scheduledEndAt;
    private LocalDateTime occupiedStartAt;
    private LocalDateTime occupiedEndAt;
    private Integer guestCount;
    private String contactName;
    private String contactMobile;
    private String bookingSource;
    private String status;
    private BigDecimal itemAmount;
    private BigDecimal therapistFeeAmount;
    private BigDecimal discountAmount;
    private BigDecimal balanceDeductionAmount;
    private BigDecimal depositDueAmount;
    private BigDecimal paidAmount;
    private Long createdByUserId;
    private LocalDateTime createdAt;
    @Version
    private Integer version;
    @TableLogic
    private Integer deleted;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getBookingNo() { return bookingNo; }
    public void setBookingNo(String bookingNo) { this.bookingNo = bookingNo; }
    public String getRequestId() { return requestId; }
    public void setRequestId(String requestId) { this.requestId = requestId; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public Long getStoreId() { return storeId; }
    public void setStoreId(Long storeId) { this.storeId = storeId; }
    public Long getServiceItemId() { return serviceItemId; }
    public void setServiceItemId(Long serviceItemId) { this.serviceItemId = serviceItemId; }
    public String getTherapistMode() { return therapistMode; }
    public void setTherapistMode(String therapistMode) { this.therapistMode = therapistMode; }
    public Long getTherapistId() { return therapistId; }
    public void setTherapistId(Long therapistId) { this.therapistId = therapistId; }
    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }
    public LocalDateTime getScheduledStartAt() { return scheduledStartAt; }
    public void setScheduledStartAt(LocalDateTime value) { this.scheduledStartAt = value; }
    public LocalDateTime getScheduledEndAt() { return scheduledEndAt; }
    public void setScheduledEndAt(LocalDateTime value) { this.scheduledEndAt = value; }
    public LocalDateTime getOccupiedStartAt() { return occupiedStartAt; }
    public void setOccupiedStartAt(LocalDateTime value) { this.occupiedStartAt = value; }
    public LocalDateTime getOccupiedEndAt() { return occupiedEndAt; }
    public void setOccupiedEndAt(LocalDateTime value) { this.occupiedEndAt = value; }
    public Integer getGuestCount() { return guestCount; }
    public void setGuestCount(Integer guestCount) { this.guestCount = guestCount; }
    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }
    public String getContactMobile() { return contactMobile; }
    public void setContactMobile(String contactMobile) { this.contactMobile = contactMobile; }
    public String getBookingSource() { return bookingSource; }
    public void setBookingSource(String bookingSource) { this.bookingSource = bookingSource; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public BigDecimal getItemAmount() { return itemAmount; }
    public void setItemAmount(BigDecimal itemAmount) { this.itemAmount = itemAmount; }
    public BigDecimal getTherapistFeeAmount() { return therapistFeeAmount; }
    public void setTherapistFeeAmount(BigDecimal value) { this.therapistFeeAmount = value; }
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal value) { this.discountAmount = value; }
    public BigDecimal getBalanceDeductionAmount() { return balanceDeductionAmount; }
    public void setBalanceDeductionAmount(BigDecimal value) { this.balanceDeductionAmount = value; }
    public BigDecimal getDepositDueAmount() { return depositDueAmount; }
    public void setDepositDueAmount(BigDecimal value) { this.depositDueAmount = value; }
    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal value) { this.paidAmount = value; }
    public Long getCreatedByUserId() { return createdByUserId; }
    public void setCreatedByUserId(Long value) { this.createdByUserId = value; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public Integer getDeleted() { return deleted; }
    public void setDeleted(Integer deleted) { this.deleted = deleted; }
}
