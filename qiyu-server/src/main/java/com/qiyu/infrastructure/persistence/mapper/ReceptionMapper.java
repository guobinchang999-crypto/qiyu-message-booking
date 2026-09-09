package com.qiyu.infrastructure.persistence.mapper;

import com.qiyu.domain.customer.gateway.CustomerLookupGateway.Customer;
import com.qiyu.application.booking.dto.ReceptionModels.Audit;
import org.apache.ibatis.annotations.*;
import java.util.List;
import java.util.Map;

public interface ReceptionMapper {
    @Select("SELECT CAST(id AS CHAR) id, COALESCE(nickname,'') name, mobile FROM customer WHERE mobile=#{mobile} AND status='ENABLED' AND deleted=0")
    Customer customer(String mobile);
    @Insert("INSERT INTO sys_user(user_type,display_name,status) VALUES('CUSTOMER',#{name},'ENABLED')")
    @Options(useGeneratedKeys=true, keyProperty="id")
    int insertUser(Map<String,Object> user);
    @Insert("INSERT INTO customer(user_id,mobile,nickname) VALUES(#{userId},#{mobile},#{name})")
    int insertCustomer(@Param("userId") long userId, @Param("mobile") String mobile, @Param("name") String name);
    @Select("""
            SELECT CAST(a.id AS CHAR) id, COALESCE(u.display_name,'系统') operator,
                   a.action_code action, CAST(a.before_data AS CHAR) before_data,
                   CAST(a.after_data AS CHAR) after_data, CAST(a.created_at AS CHAR) created_at
            FROM audit_log a LEFT JOIN sys_user u ON u.id=a.operator_user_id
            WHERE a.resource_type='booking' AND a.resource_id=#{bookingId}
            ORDER BY a.id DESC LIMIT 100
            """)
    List<Audit> bookingAudit(String bookingId);
}
