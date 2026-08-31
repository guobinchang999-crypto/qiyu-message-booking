package com.qiyu.infrastructure.persistence.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDate;
import java.time.LocalTime;

/** MyBatis-Plus persistence entity for therapist_schedule. */
@TableName("therapist_schedule")
public class TherapistScheduleEntity {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long therapistId;
    private Long storeId;
    private LocalDate workDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String scheduleStatus;
    private String remark;
    @TableLogic
    private Integer deleted;
    private String createdBy;
    private String updatedBy;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getTherapistId() { return therapistId; }
    public void setTherapistId(Long therapistId) { this.therapistId = therapistId; }
    public Long getStoreId() { return storeId; }
    public void setStoreId(Long storeId) { this.storeId = storeId; }
    public LocalDate getWorkDate() { return workDate; }
    public void setWorkDate(LocalDate workDate) { this.workDate = workDate; }
    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    public String getScheduleStatus() { return scheduleStatus; }
    public void setScheduleStatus(String scheduleStatus) { this.scheduleStatus = scheduleStatus; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
    public Integer getDeleted() { return deleted; }
    public void setDeleted(Integer deleted) { this.deleted = deleted; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
}
