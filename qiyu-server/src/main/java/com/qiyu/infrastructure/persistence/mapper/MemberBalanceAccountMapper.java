package com.qiyu.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qiyu.infrastructure.persistence.entity.MemberAccountEntity;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.Collection;

/** MyBatis-Plus mapper for member accounts and their scoped locking query. */
public interface MemberBalanceAccountMapper extends BaseMapper<MemberAccountEntity> {

    /**
     * Locks one account after proving that the operator can access at least one store where the
     * customer has booking history. Global users bypass the store predicate. The caller supplies
     * a non-empty fail-closed sentinel collection when no store is accessible.
     */
    @Select("""
            <script>
            SELECT ma.id AS database_id,
                   ma.customer_id,
                   COALESCE(NULLIF(c.nickname, ''), c.mobile) AS customer_name,
                   ma.balance_amount AS balance,
                   ma.status
            FROM member_account ma
            JOIN customer c ON c.id = ma.customer_id AND c.deleted = 0
            WHERE ma.id = #{accountId}
              AND ma.deleted = 0
              AND (#{allStores} = TRUE OR EXISTS (
                SELECT 1
                FROM booking b
                JOIN store s ON s.id = b.store_id AND s.deleted = 0
                WHERE b.customer_id = ma.customer_id
                  AND b.deleted = 0
                  AND CONCAT('store-', LOWER(REPLACE(s.store_code, '_', '-'))) IN
                    <foreach collection="storeIds" item="storeId" open="(" separator="," close=")">
                      #{storeId}
                    </foreach>
              ))
            FOR UPDATE
            </script>
            """)
    MemberBalanceAccountRow lockScopedAccount(
            @Param("accountId") long accountId,
            @Param("allStores") boolean allStores,
            @Param("storeIds") Collection<String> storeIds
    );
}
