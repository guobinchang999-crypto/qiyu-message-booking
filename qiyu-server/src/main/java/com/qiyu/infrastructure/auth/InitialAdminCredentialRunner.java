package com.qiyu.infrastructure.auth;

import com.qiyu.infrastructure.persistence.mapper.AuthCredentialMapper;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

/** Initializes the admin password hash once without persisting plaintext credentials. */
@Component
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "true")
public class InitialAdminCredentialRunner implements ApplicationRunner {
    private final AuthCredentialMapper credentialMapper;
    private final String initialPassword;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public InitialAdminCredentialRunner(AuthCredentialMapper credentialMapper,
                                        @Value("${qiyu.auth.initial-admin-password:}") String initialPassword) {
        this.credentialMapper = credentialMapper;
        this.initialPassword = initialPassword;
    }

    /** Writes a BCrypt hash only when Flyway has created an uninitialized admin identity. */
    @Override
    public void run(ApplicationArguments args) {
        if (credentialMapper.countUninitializedAdmin() == 0) return;
        if (initialPassword == null || initialPassword.isBlank()) {
            throw new IllegalStateException("首次启动必须配置 ADMIN_INITIAL_PASSWORD");
        }
        credentialMapper.initializeAdminPassword(passwordEncoder.encode(initialPassword));
    }
}
