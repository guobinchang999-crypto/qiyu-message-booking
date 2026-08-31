package com.qiyu.infrastructure.persistence.mapper;

import java.math.BigDecimal;

/** Typed aggregate for a dated revenue point or one store ranking row. */
public record AdminMetricRow(String name, BigDecimal value, String comparison) {
}
