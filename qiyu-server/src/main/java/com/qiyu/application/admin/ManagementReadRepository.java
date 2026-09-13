package com.qiyu.application.admin;

import com.qiyu.application.admin.dto.ManagementModels.*;
import java.util.List;

/** Scoped administration read port; SQL and table identities stay in infrastructure. */
public interface ManagementReadRepository {
    Page<Customer> customers(AdminOperationsReadRepository.StoreAccess access, Query query, boolean members);
    Page<Ledger> ledger(String memberId, Query query);
    Page<CouponRecord> coupons(AdminOperationsReadRepository.StoreAccess access, Query query, String templateId);
    List<Metric> metrics(AdminOperationsReadRepository.StoreAccess access, Query query, boolean byDate);
    long unfinished(String resource, String code);
}
