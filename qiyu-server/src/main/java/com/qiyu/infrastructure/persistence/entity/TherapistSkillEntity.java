package com.qiyu.infrastructure.persistence.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;

/** MyBatis-Plus persistence model for ordered therapist skills. */
@TableName("therapist_skill")
public class TherapistSkillEntity {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long therapistId;
    private String skillName;
    private Integer sortOrder;
    @TableLogic
    private Integer deleted;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getTherapistId() { return therapistId; }
    public void setTherapistId(Long therapistId) { this.therapistId = therapistId; }
    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public Integer getDeleted() { return deleted; }
    public void setDeleted(Integer deleted) { this.deleted = deleted; }
}
