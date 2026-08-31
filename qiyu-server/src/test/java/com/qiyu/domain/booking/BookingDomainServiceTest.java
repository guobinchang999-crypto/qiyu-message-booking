package com.qiyu.domain.booking;

import com.qiyu.domain.catalog.Room;
import com.qiyu.domain.catalog.Therapist;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Placement rules are pure domain logic and must behave identically regardless of callers. */
class BookingDomainServiceTest {
    private final BookingDomainService service = new BookingDomainService();

    private Therapist therapist(String id, String storeId, String status) {
        return new Therapist(id, "技师", storeId, "专业技师", 4.9, 3, 100, List.of(), 30,
                "10:00", status, "可预约", "", "", "");
    }

    @Test
    void autoAssignPicksTheFirstAvailableTherapist() {
        assertThat(service.autoAssignTherapist(List.of(
                therapist("t-busy", "store-jingan", "BUSY"),
                therapist("t-available", "store-jingan", "AVAILABLE"))).id())
                .isEqualTo("t-available");
    }

    @Test
    void autoAssignFailsWhenNobodyIsAvailable() {
        assertThatThrownBy(() -> service.autoAssignTherapist(List.of(therapist("t-busy", "store-jingan", "BUSY"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("暂无可用技师");
    }

    @Test
    void therapistMustBelongToTheBookingStore() {
        assertThatCode(() -> service.ensureTherapistBelongsToStore("store-jingan",
                therapist("t-1", "store-jingan", "AVAILABLE"))).doesNotThrowAnyException();
        assertThatThrownBy(() -> service.ensureTherapistBelongsToStore("store-jingan",
                therapist("t-2", "store-xujiahui", "AVAILABLE")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("不属于当前门店");
    }

    @Test
    void roomMustBelongToTheBookingStore() {
        Room room = new Room("room-jingan-01", "房间", "store-jingan", "AVAILABLE", "可用", "推拿房", "", 1, "推拿房");
        assertThatCode(() -> service.ensureRoomBelongsToStore("store-jingan", room)).doesNotThrowAnyException();
        assertThatThrownBy(() -> service.ensureRoomBelongsToStore("store-xujiahui", room))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("不属于当前门店");
    }

    @Test
    void depositIsCappedAtFiftyPerGuest() {
        assertThat(service.depositDue(new BigDecimal("480"), 1)).isEqualByComparingTo("50");
        assertThat(service.depositDue(new BigDecimal("480"), 4)).isEqualByComparingTo("200");
        assertThat(service.depositDue(new BigDecimal("30"), 1)).isEqualByComparingTo("30");
    }

    @Test
    void defaultRoomFollowsTheStoreSuffix() {
        assertThat(service.defaultRoomId("store-jingan")).isEqualTo("room-jingan-01");
        assertThat(service.defaultRoomId("store-xujiahui")).isEqualTo("room-xujiahui-01");
    }
}
