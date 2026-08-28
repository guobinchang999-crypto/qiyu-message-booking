package com.qiyu.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qiyu.infrastructure.persistence.entity.AuditLogEntity;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Param;

public interface AuditLogMapper extends BaseMapper<AuditLogEntity> {
    @Insert("""
            INSERT INTO audit_log(operator_user_id,action_code,resource_type,resource_id,before_data,after_data)
            VALUES(#{userId},#{actionCode},#{resourceType},#{resourceId},CAST(#{beforeJson} AS JSON),CAST(#{afterJson} AS JSON))
            """)
    int insertSummary(@Param("userId") long userId, @Param("actionCode") String actionCode,
                      @Param("resourceType") String resourceType, @Param("resourceId") String resourceId,
                      @Param("beforeJson") String beforeJson, @Param("afterJson") String afterJson);
}
