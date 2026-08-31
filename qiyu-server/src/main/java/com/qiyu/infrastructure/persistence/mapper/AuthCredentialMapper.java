package com.qiyu.infrastructure.persistence.mapper;

import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

/** Restricted mapper for one-time credential bootstrap operations. */
public interface AuthCredentialMapper {
    @Select("SELECT COUNT(*) FROM sys_user_identity WHERE identity_type='PASSWORD' AND identifier='admin' AND credential_hash IS NULL AND deleted=0")
    long countUninitializedAdmin();

    @Update("UPDATE sys_user_identity SET credential_hash=#{hash},updated_by='credential-bootstrap',updated_at=CURRENT_TIMESTAMP WHERE identity_type='PASSWORD' AND identifier='admin' AND credential_hash IS NULL AND deleted=0")
    int initializeAdminPassword(@Param("hash") String hash);
}
