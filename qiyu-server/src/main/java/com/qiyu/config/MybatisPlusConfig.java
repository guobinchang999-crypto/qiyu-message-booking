package com.qiyu.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

/** Registers persistence mappers while keeping ORM types inside the infrastructure layer. */
@Configuration
@MapperScan("com.qiyu.infrastructure.persistence.mapper")
public class MybatisPlusConfig {
}
