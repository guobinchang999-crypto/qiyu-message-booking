package com.qiyu.infrastructure.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Enables scheduled triggers such as the expired-payment release job. */
@Configuration
@EnableScheduling
public class SchedulingConfiguration {
}
