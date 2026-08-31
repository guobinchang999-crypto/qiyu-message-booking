package com.qiyu.infrastructure.persistence.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;

/** Immutable member balance ledger entry; existing rows are never updated by adjustment flows. */
@TableName("member_balance_transaction")
public class MemberBalanceTransactionEntity {
    @TableId(type=IdType.AUTO) private Long id;
    private Long accountId; private Long customerId; private Long bookingId; private Long serviceOrderId;
    private String transactionNo; private String transactionType; private BigDecimal amount;
    private BigDecimal balanceAfter; private String remark; private String requestId;
    @TableLogic private Integer deleted; private String createdBy;
    public Long getId(){return id;} public void setId(Long v){id=v;}
    public Long getAccountId(){return accountId;} public void setAccountId(Long v){accountId=v;}
    public Long getCustomerId(){return customerId;} public void setCustomerId(Long v){customerId=v;}
    public Long getBookingId(){return bookingId;} public void setBookingId(Long v){bookingId=v;}
    public Long getServiceOrderId(){return serviceOrderId;} public void setServiceOrderId(Long v){serviceOrderId=v;}
    public String getTransactionNo(){return transactionNo;} public void setTransactionNo(String v){transactionNo=v;}
    public String getTransactionType(){return transactionType;} public void setTransactionType(String v){transactionType=v;}
    public BigDecimal getAmount(){return amount;} public void setAmount(BigDecimal v){amount=v;}
    public BigDecimal getBalanceAfter(){return balanceAfter;} public void setBalanceAfter(BigDecimal v){balanceAfter=v;}
    public String getRemark(){return remark;} public void setRemark(String v){remark=v;}
    public String getRequestId(){return requestId;} public void setRequestId(String v){requestId=v;}
    public Integer getDeleted(){return deleted;} public void setDeleted(Integer v){deleted=v;}
    public String getCreatedBy(){return createdBy;} public void setCreatedBy(String v){createdBy=v;}
}
