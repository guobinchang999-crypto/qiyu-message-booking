package com.qiyu.config;

import cn.dev33.satoken.interceptor.SaInterceptor;
import cn.dev33.satoken.stp.StpUtil;
import com.qiyu.application.auth.AuthAppService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.CorsRegistry;

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

    /** Allows the local admin dev server to call the API from its separate origin. */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:8000", "http://127.0.0.1:8000", "http://192.168.31.178:8000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
