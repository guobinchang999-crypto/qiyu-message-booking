package com.qiyu.domain.catalog.gateway;

import java.util.List;
import com.qiyu.domain.catalog.Room;
import com.qiyu.domain.catalog.ServiceItem;
import com.qiyu.domain.catalog.Store;
import com.qiyu.domain.catalog.Therapist;

/**
 * Outbound catalog port shared by booking and read-only resource use cases.
 * API-facing stable IDs are part of this contract; persistence IDs stay inside infrastructure.
 */
public interface CatalogGateway {
    List<Store> stores();

    List<ServiceItem> services();

    List<Therapist> therapists();

    List<Room> rooms();

    Store findStore(String id);

    ServiceItem findService(String id);

    Therapist findTherapist(String id);

    Room findRoom(String id);

    List<Therapist> therapists(String storeId, String serviceId);

    List<Room> rooms(String storeId, String status);
}
