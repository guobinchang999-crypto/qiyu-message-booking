package com.qiyu.config;

import cn.dev33.satoken.interceptor.SaInterceptor;
import cn.dev33.satoken.stp.StpUtil;
import com.qiyu.application.auth.AuthAppService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SaTokenConfig implements WebMvcConfigurer {
    private final AuthAppService authAppService;

    public SaTokenConfig(AuthAppService authAppService) {
        this.authAppService = authAppService;
    }

    @Bean
    public SaInterceptor saInterceptor() {
        return new SaInterceptor(handle -> {
            if (StpUtil.isLogin()) authAppService.refreshCurrentAccessContext();
        });
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Annotation-based authentication must cover every API after removing the versioned URL prefix.
        registry.addInterceptor(saInterceptor()).addPathPatterns("/**")
                .excludePathPatterns("/swagger-ui/**", "/v3/api-docs/**", "/error");
    }
}
