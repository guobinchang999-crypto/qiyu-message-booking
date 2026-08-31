package com.qiyu.infrastructure.persistence.mapper;

/** Typed row holding one JSON document managed as client-facing catalog content. */
public record ClientCatalogConfigRow(String configCode, String configJson) {}
