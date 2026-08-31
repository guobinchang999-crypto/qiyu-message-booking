package com.qiyu.infrastructure.persistence.mapper;

/** Typed persistence projection for one dictionary item joined with its dictionary type. */
public record SystemDictionaryProjection(long id, String typeCode, String typeName, String itemLabel,
                                         String itemValue, int sortOrder, int enabled, String description) {
}
