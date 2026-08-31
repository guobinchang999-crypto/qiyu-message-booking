package com.qiyu.application.catalog.dto;

import java.util.List;

/** Fixed dictionary response; named fields prevent callers from depending on an untyped map. */
public record DictionaryCollectionVO(
        List<DictionaryItemVO> bookingStatus,
        List<DictionaryItemVO> paymentStatus,
        List<DictionaryItemVO> roomStatus,
        List<DictionaryItemVO> therapistStatus,
        List<DictionaryItemVO> timeSlotStatus
) {}
