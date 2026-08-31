package com.qiyu.infrastructure.persistence.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;

/** MyBatis-Plus entity for the all-store member account. */
@TableName("member_account")
public class MemberAccountEntity {
    @TableId(type=IdType.AUTO) private Long id;
    private Long customerId;
    private String accountScope;
    private BigDecimal balanceAmount;
    private BigDecimal totalRechargeAmount;
    private BigDecimal totalConsumeAmount;
    private String status;
    @TableLogic private Integer deleted;
    public Long getId(){return id;} public void setId(Long v){id=v;}
    public Long getCustomerId(){return customerId;} public void setCustomerId(Long v){customerId=v;}
    public String getAccountScope(){return accountScope;} public void setAccountScope(String v){accountScope=v;}
    public BigDecimal getBalanceAmount(){return balanceAmount;} public void setBalanceAmount(BigDecimal v){balanceAmount=v;}
    public BigDecimal getTotalRechargeAmount(){return totalRechargeAmount;} public void setTotalRechargeAmount(BigDecimal v){totalRechargeAmount=v;}
    public BigDecimal getTotalConsumeAmount(){return totalConsumeAmount;} public void setTotalConsumeAmount(BigDecimal v){totalConsumeAmount=v;}
    public String getStatus(){return status;} public void setStatus(String v){status=v;}
    public Integer getDeleted(){return deleted;} public void setDeleted(Integer v){deleted=v;}
}
