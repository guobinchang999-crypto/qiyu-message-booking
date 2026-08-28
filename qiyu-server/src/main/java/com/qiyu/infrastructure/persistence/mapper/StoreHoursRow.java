package com.qiyu.infrastructure.persistence.mapper;

import java.time.LocalTime;

/** Typed persistence projection for store opening hours and exceptional days. */
public record StoreHoursRow(LocalTime openTime, LocalTime closeTime, String businessStatus, String dayStatus) {}
