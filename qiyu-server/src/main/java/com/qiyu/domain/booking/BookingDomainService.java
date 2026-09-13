package com.qiyu.domain.booking;

import com.qiyu.domain.catalog.Room;
import com.qiyu.domain.catalog.Therapist;

import java.math.BigDecimal;
import java.util.List;

/**
 * Placement rules for creating and adjusting bookings. These invariants are business rules
 * independent of transport and persistence, so they live in the domain layer instead of the
 * application orchestrator.
 */
public final class BookingDomainService {

    /** Picks the first available therapist; auto-assignment never falls back to a busy one. */
    public Therapist autoAssignTherapist(List<Therapist> candidates) {
        return candidates.stream()
                .filter(therapist -> "AVAILABLE".equals(therapist.status()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("当前门店暂无可用技师"));
    }

    public void ensureTherapistBelongsToStore(String storeId, Therapist therapist) {
        if (!storeId.equals(therapist.storeId())) {
            throw new IllegalArgumentException("所选技师不属于当前门店");
        }
    }

    public void ensureRoomBelongsToStore(String storeId, Room room) {
        if (!storeId.equals(room.storeId())) {
            throw new IllegalArgumentException("所选房间不属于当前门店");
        }
    }

    /** Deposit is capped at 50 per guest; smaller totals stay unchanged. */
    public BigDecimal depositDue(BigDecimal totalAmount, int guestCount) {
        return totalAmount.min(BigDecimal.valueOf(50L * guestCount));
    }

    /** Stable default room per store, used when the customer did not choose one. */
    public String defaultRoomId(String storeId) {
        String suffix = storeId == null ? "default" : storeId.replaceFirst("^store-", "");
        return "room-" + suffix + "-01";
    }
}
