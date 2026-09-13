package com.qiyu.infrastructure.admin;

import com.qiyu.application.admin.*;
import com.qiyu.application.admin.dto.ManagementModels.*;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;
import java.util.*;
import java.sql.*;

/** Parameterized read queries with permission predicates applied before pagination and aggregation. */
@Repository
@ConditionalOnProperty(name="qiyu.auth.persistence",havingValue="true")
public class JdbcManagementReadRepository implements ManagementReadRepository {
    private final NamedParameterJdbcTemplate jdbc;
    public JdbcManagementReadRepository(NamedParameterJdbcTemplate jdbc){this.jdbc=jdbc;}
    @Override public long unfinished(String resource,String code){
        String join=switch(resource){
            case "stores" -> "JOIN store r ON r.id=b.store_id WHERE r.store_code=:code";
            case "therapists" -> "JOIN therapist r ON r.id=b.therapist_id WHERE r.therapist_code=:code";
            case "rooms" -> "JOIN room r ON r.id=b.room_id JOIN store rs ON rs.id=r.store_id WHERE CONCAT('room-',LOWER(REPLACE(rs.store_code,'_','-')),'-',CASE WHEN r.room_code REGEXP '^R[0-9]+$' THEN LPAD(SUBSTRING(r.room_code,2),2,'0') ELSE LOWER(REPLACE(r.room_code,'_','-')) END)=:code";
            case "services" -> "JOIN service_item r ON r.id=b.service_item_id WHERE r.service_code=:code";
            default -> throw new IllegalArgumentException("不支持的资源");
        };
        return jdbc.queryForObject("SELECT COUNT(*) FROM booking b "+join+
            " AND b.deleted=0 AND b.status NOT IN ('COMPLETED','CANCELLED')",Map.of("code",code),Long.class);
    }
    private static final String STORE_ID="CONCAT('store-',LOWER(REPLACE(s.store_code,'_','-')))";
    private static final String CUSTOMER_SCOPE="""
        (:allStores=TRUE OR EXISTS (SELECT 1 FROM booking ab JOIN store s ON s.id=ab.store_id AND s.deleted=0
        LEFT JOIN therapist t ON t.id=ab.therapist_id
        WHERE ab.customer_id=c.id AND ab.deleted=0 AND (
        CONCAT('store-',LOWER(REPLACE(s.store_code,'_','-'))) IN (:storeIds)
        OR (:therapistId IS NOT NULL AND CONCAT('therapist-',CASE t.therapist_code
          WHEN 'TH_JA_ANRAN' THEN 'anran' WHEN 'TH_XH_YUANYUAN' THEN 'yuanyuan'
          WHEN 'TH_LJZ_LIN' THEN 'lin' ELSE LOWER(REPLACE(t.therapist_code,'_','-')) END)=:therapistId))))
        """;
    private static Map<String,Object> parameters(AdminOperationsReadRepository.StoreAccess access,Query q){
        var p=new HashMap<String,Object>();p.put("allStores",access.allStores());p.put("storeIds",access.storeIds());
        p.put("therapistId",access.therapistId());p.put("offset",(q.page()-1)*q.size());p.put("size",q.size());
        p.put("keyword",q.keyword()==null?"":q.keyword().trim());p.put("level",q.level());
        p.put("start",q.startDate());p.put("end",q.endDate()==null?null:java.time.LocalDate.parse(q.endDate()).plusDays(1).toString());p.put("customerId",q.customerId());return p;
    }
    @Override public Page<Customer> customers(AdminOperationsReadRepository.StoreAccess access,Query q,boolean members){
        var p=parameters(access,q);
        String from="""
          FROM customer c LEFT JOIN member_account ma ON ma.customer_id=c.id AND ma.deleted=0
          WHERE c.deleted=0 AND
          """+CUSTOMER_SCOPE+"""
          AND (:keyword='' OR LOCATE(:keyword,COALESCE(c.nickname,''))>0 OR LOCATE(:keyword,c.mobile)>0)
          AND (:level IS NULL OR :level='' OR c.member_level=:level)
          AND (:customerId IS NULL OR CONCAT('',c.id)=:customerId)
          """+(members?" AND ma.id IS NOT NULL ":"")+"""
          AND (:start IS NULL OR (SELECT MAX(v.scheduled_start_at) FROM booking v WHERE v.customer_id=c.id AND v.deleted=0
            AND v.status IN ('CHECKED_IN','WAITING_SERVICE','IN_SERVICE','PENDING_SETTLEMENT','COMPLETED'))>=:start)
          AND (:end IS NULL OR (SELECT MAX(v.scheduled_start_at) FROM booking v WHERE v.customer_id=c.id AND v.deleted=0
            AND v.status IN ('CHECKED_IN','WAITING_SERVICE','IN_SERVICE','PENDING_SETTLEMENT','COMPLETED'))<:end)
          """;
        long total=jdbc.queryForObject("SELECT COUNT(*) "+from,p,Long.class);
        String select="""
          SELECT CONCAT('',c.id) id, CASE WHEN ma.id IS NULL THEN NULL ELSE CONCAT('member-',ma.id) END member_id,
          COALESCE(NULLIF(c.nickname,''),c.mobile) name,c.mobile phone,c.member_level,
          (SELECT MAX(b.scheduled_start_at) FROM booking b WHERE b.customer_id=c.id AND b.deleted=0
            AND b.status IN ('CHECKED_IN','WAITING_SERVICE','IN_SERVICE','PENDING_SETTLEMENT','COMPLETED')) last_visit,
          (SELECT COUNT(*) FROM booking b WHERE b.customer_id=c.id AND b.deleted=0) booking_count,
          (SELECT COALESCE(SUM(b.item_amount+b.therapist_fee_amount-b.discount_amount-b.balance_deduction_amount),0)
            FROM booking b WHERE b.customer_id=c.id AND b.deleted=0 AND b.status='COMPLETED') spend,
          COALESCE(ma.balance_amount,0) balance,
          (SELECT COALESCE(SUM(pc.remaining_times),0) FROM member_package_card pc WHERE pc.customer_id=c.id AND pc.deleted=0 AND pc.status='ACTIVE') packages,
          (SELECT COUNT(*) FROM customer_coupon cc WHERE cc.customer_id=c.id AND cc.deleted=0 AND cc.status='UNUSED'
            AND cc.valid_start_at<=CURRENT_TIMESTAMP AND cc.valid_end_at>CURRENT_TIMESTAMP) coupons
          """;
        var list=jdbc.query(select+from+" ORDER BY c.id DESC LIMIT :size OFFSET :offset",p,(r,i)->
            new Customer(r.getString("id"),r.getString("member_id"),r.getString("name"),r.getString("phone"),
            r.getString("member_level"),r.getString("last_visit"),r.getLong("booking_count"),r.getBigDecimal("spend"),
            r.getBigDecimal("balance"),r.getInt("packages"),r.getInt("coupons")));
        return new Page<>(list,total,q.page(),q.size());
    }
    @Override public Page<Ledger> ledger(String memberId,Query q){
        var p=new HashMap<String,Object>();p.put("id",memberId);p.put("size",q.size());p.put("offset",(q.page()-1)*q.size());
        String from=" FROM member_balance_transaction l WHERE l.deleted=0 AND CONCAT('member-',l.account_id)=:id";
        long total=jdbc.queryForObject("SELECT COUNT(*)"+from,p,Long.class);
        var list=jdbc.query("SELECT l.*"+from+" ORDER BY l.id DESC LIMIT :size OFFSET :offset",p,(r,i)->
          new Ledger(r.getString("transaction_no"),r.getString("transaction_type"),r.getBigDecimal("amount"),r.getBigDecimal("balance_after"),
            r.getString("remark"),r.getString("created_by"),r.getString("created_at")));
        return new Page<>(list,total,q.page(),q.size());
    }
    @Override public Page<CouponRecord> coupons(AdminOperationsReadRepository.StoreAccess access,Query q,String templateId){
        var p=parameters(access,q);p.put("templateId",templateId);p.put("status",q.status());
        String from="""
          FROM customer_coupon cc JOIN customer c ON c.id=cc.customer_id AND c.deleted=0
          JOIN coupon_template ct ON ct.id=cc.coupon_template_id AND ct.deleted=0
          WHERE cc.deleted=0 AND
          """+CUSTOMER_SCOPE+"""
          AND (:customerId IS NULL OR CONCAT('',c.id)=:customerId)
          AND (:templateId IS NULL OR CONCAT('coupon-',LOWER(REPLACE(ct.coupon_code,'_','-')))=:templateId)
          AND (:status IS NULL OR :status='' OR cc.status=:status)
          """;
        long total=jdbc.queryForObject("SELECT COUNT(*) "+from,p,Long.class);
        var list=jdbc.query("SELECT cc.*,ct.coupon_name,CONCAT('',c.id) customer_key "+from+
          " ORDER BY cc.id DESC LIMIT :size OFFSET :offset",p,(r,i)->new CouponRecord(r.getString("coupon_no"),
            r.getString("customer_key"),r.getString("coupon_name"),r.getString("status"),r.getString("valid_start_at"),
            r.getString("valid_end_at"),r.getString("used_at"),null));
        return new Page<>(list,total,q.page(),q.size());
    }
    @Override public List<Metric> metrics(AdminOperationsReadRepository.StoreAccess access,Query q,boolean byDate){
        var p=parameters(access,q);
        String id=byDate?"CAST(b.scheduled_start_at AS DATE)":STORE_ID;
        String name=byDate?id:"s.store_name";
        return jdbc.query("SELECT "+id+" id,"+name+" name,COUNT(*) bookings,"+
          "SUM(CASE WHEN b.status='COMPLETED' THEN 1 ELSE 0 END) completed,"+
          "COALESCE(SUM(CASE WHEN b.status='COMPLETED' THEN b.item_amount+b.therapist_fee_amount-b.discount_amount-b.balance_deduction_amount ELSE 0 END),0) revenue"+
          " FROM booking b JOIN store s ON s.id=b.store_id AND s.deleted=0 WHERE b.deleted=0"+
          " AND b.scheduled_start_at>=:start AND b.scheduled_start_at<:end"+
          " AND (:allStores=TRUE OR "+STORE_ID+" IN (:storeIds)) GROUP BY "+id+","+name+" ORDER BY id",p,
          (r,i)->ManagementQueryService.metric(r.getString("id"),r.getString("name"),r.getLong("bookings"),r.getLong("completed"),r.getBigDecimal("revenue")));
    }
}
