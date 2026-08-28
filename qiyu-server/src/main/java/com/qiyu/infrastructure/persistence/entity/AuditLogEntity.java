package com.qiyu.infrastructure.persistence.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

@TableName("audit_log")
public class AuditLogEntity {
    @TableId(type = IdType.AUTO)
    private Long id;
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
}
