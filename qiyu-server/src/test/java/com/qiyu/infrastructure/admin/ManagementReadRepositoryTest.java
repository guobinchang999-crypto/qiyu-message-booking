package com.qiyu.infrastructure.admin;

import com.qiyu.application.admin.AdminOperationsReadRepository.StoreAccess;
import com.qiyu.application.admin.dto.ManagementModels.Query;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

/** Executes the production query adapter against a disposable SQL fixture, never the configured store database. */
class ManagementReadRepositoryTest {
    JdbcManagementReadRepository repository;
    StoreAccess all=new StoreAccess(true,Set.of());
    @BeforeEach void setup(){
        var source=new DriverManagerDataSource("jdbc:h2:mem:management"+UUID.randomUUID()+";MODE=MySQL;DB_CLOSE_DELAY=-1","sa","");
        var jdbc=new JdbcTemplate(source);repository=new JdbcManagementReadRepository(new NamedParameterJdbcTemplate(source));
        jdbc.execute("CREATE TABLE store(id BIGINT PRIMARY KEY,store_code VARCHAR(50),store_name VARCHAR(80),deleted INT)");
        jdbc.execute("CREATE TABLE therapist(id BIGINT PRIMARY KEY,therapist_code VARCHAR(50))");
        jdbc.execute("CREATE TABLE room(id BIGINT PRIMARY KEY,store_id BIGINT,room_code VARCHAR(30))");
        jdbc.execute("CREATE TABLE customer(id BIGINT PRIMARY KEY,nickname VARCHAR(50),mobile VARCHAR(30),member_level VARCHAR(30),deleted INT)");
        jdbc.execute("CREATE TABLE member_account(id BIGINT PRIMARY KEY,customer_id BIGINT,balance_amount DECIMAL(12,2),deleted INT)");
        jdbc.execute("CREATE TABLE member_package_card(customer_id BIGINT,remaining_times INT,status VARCHAR(30),deleted INT)");
        jdbc.execute("CREATE TABLE booking(id BIGINT PRIMARY KEY,customer_id BIGINT,store_id BIGINT,therapist_id BIGINT,scheduled_start_at TIMESTAMP,status VARCHAR(40),item_amount DECIMAL(12,2),therapist_fee_amount DECIMAL(12,2),discount_amount DECIMAL(12,2),balance_deduction_amount DECIMAL(12,2),deleted INT)");
        jdbc.execute("CREATE TABLE coupon_template(id BIGINT PRIMARY KEY,coupon_code VARCHAR(50),coupon_name VARCHAR(60),deleted INT)");
        jdbc.execute("CREATE TABLE customer_coupon(id BIGINT,customer_id BIGINT,coupon_template_id BIGINT,coupon_no VARCHAR(50),status VARCHAR(30),valid_start_at TIMESTAMP,valid_end_at TIMESTAMP,used_at TIMESTAMP,deleted INT)");
        jdbc.execute("CREATE TABLE member_balance_transaction(id BIGINT,account_id BIGINT,transaction_no VARCHAR(50),transaction_type VARCHAR(50),amount DECIMAL(12,2),balance_after DECIMAL(12,2),remark VARCHAR(100),created_by VARCHAR(50),created_at TIMESTAMP,deleted INT)");
        jdbc.update("INSERT INTO store VALUES(1,'A','一店',0),(2,'B','二店',0)");
        jdbc.update("INSERT INTO therapist VALUES(1,'TH_JA_ANRAN'),(2,'OTHER')");
        jdbc.update("INSERT INTO room VALUES(1,1,'R1')");
        jdbc.update("INSERT INTO customer VALUES(1,'同名客户','13800000001','VIP',0),(2,'同名客户','13800000002','VIP',0),(3,'新客户','13800000003','REGULAR',0)");
        jdbc.update("INSERT INTO member_account VALUES(11,1,100,0),(22,2,200,0)");
        jdbc.update("INSERT INTO booking VALUES(1,1,1,1,'2026-09-10 10:00:00','COMPLETED',100,10,5,20,0),(2,2,2,2,'2026-09-10 11:00:00','COMPLETED',200,0,0,0,0),(3,2,2,2,'2026-09-10 12:00:00','CANCELLED',500,0,0,0,0),(4,2,2,2,'2026-09-11 00:00:00','COMPLETED',1000,0,0,0,0)");
        jdbc.execute("ALTER TABLE booking ADD room_id BIGINT DEFAULT 1");
        jdbc.update("INSERT INTO coupon_template VALUES(1,'TEST','测试券',0)");
        jdbc.update("INSERT INTO customer_coupon VALUES(1,1,1,'C1','USED','2026-01-01','2027-01-01','2026-09-10',0),(2,2,1,'C2','UNUSED','2026-01-01','2027-01-01',NULL,0)");
        jdbc.update("INSERT INTO member_balance_transaction VALUES(1,11,'T1','ADJUSTMENT_CREDIT',20,100,'测试','admin','2026-09-10',0)");
    }
    Query query(int page,int size,String customerId){return new Query(null,null,null,null,null,null,null,null,null,page,size,null,null,customerId);}
    @Test void scopesBeforePaginationAndKeepsCustomerIdentity(){
        var result=repository.customers(new StoreAccess(false,Set.of("store-a")),query(1,1,null),false);
        assertThat(result.total()).isEqualTo(1);assertThat(result.list().getFirst().id()).isEqualTo("1");
        assertThat(result.list().getFirst().memberId()).isEqualTo("member-11");
        assertThat(repository.customers(all,query(2,1,null),false).total()).isEqualTo(3);
        assertThat(repository.customers(all,query(1,20,"3"),false).list().getFirst().memberId()).isNull();
        assertThat(repository.customers(new StoreAccess(false,Set.of()),query(1,20,null),true).total()).isZero();
    }
    @Test void supportsSelfScopeAndMemberSearchWithoutCustomerRead(){
        var result=repository.customers(new StoreAccess(false,Set.of(),"therapist-anran"),query(1,20,null),true);
        assertThat(result.total()).isEqualTo(1);
        assertThat(result.list().getFirst().balance()).isEqualByComparingTo("100");
    }
    @Test void metricsUseExactCompletedNetAmountsAndExcludeNextDay(){
        var q=new Query(null,null,null,null,null,null,null,"2026-09-10","2026-09-10",1,20,null,null,null);
        var result=repository.metrics(all,q,false);
        assertThat(result).hasSize(2);
        assertThat(result.getFirst().revenue()).isEqualByComparingTo("85");
        assertThat(result.get(1).bookingCount()).isEqualTo(2);
        assertThat(result.get(1).completedCount()).isEqualTo(1);
        assertThat(result.get(1).completionRate()).isEqualByComparingTo("50");
        assertThat(repository.metrics(all,q,true).getFirst().revenue()).isEqualByComparingTo("285");
        assertThat(repository.metrics(new StoreAccess(false,Set.of("store-a")),q,false)).hasSize(1);
    }
    @Test void couponRecordsAndLedgerUseStableAssociations(){
        assertThat(repository.coupons(new StoreAccess(false,Set.of("store-a")),query(1,20,null),"coupon-test").total()).isEqualTo(1);
        assertThat(repository.coupons(all,query(1,20,"2"),null).list().getFirst().id()).isEqualTo("C2");
        assertThat(repository.ledger("member-11",query(1,20,"1")).list().getFirst().id()).isEqualTo("T1");
    }
    @Test void roomImpactUsesCatalogIdentityRatherThanParsingItAsANumber(){
        assertThat(repository.unfinished("rooms","room-a-01")).isZero();
    }
}
