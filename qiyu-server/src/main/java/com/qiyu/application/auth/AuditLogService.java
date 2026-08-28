package com.qiyu.application.auth;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qiyu.infrastructure.persistence.mapper.AuditLogMapper;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.util.Map;

/** Persists only security-relevant summaries; credentials and unmasked personal data are never logged. */
@Service
public class AuditLogService {
    private final ObjectProvider<MybatisAuditLogWriter> auditWriter;

    public AuditLogService(ObjectProvider<MybatisAuditLogWriter> auditWriter) {
        this.auditWriter = auditWriter;
    }

    public void record(String actionCode, String resourceType, String resourceId, String storeId,
                       Map<String, Object> beforeData, Map<String, Object> afterData) {
        AuthPrincipal principal = AuthContext.current();
        MybatisAuditLogWriter writer = auditWriter.getIfAvailable();
        // Mock mode remains side-effect free; persistence mode records the same use-case event.
        if (writer != null) {
            writer.write(principal.userId(), actionCode, resourceType, resourceId, storeId, beforeData, afterData);
        }
    }

    @Component
    @ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "true")
    static class MybatisAuditLogWriter {
        private final AuditLogMapper auditLogMapper;
        private final ObjectMapper objectMapper;

        MybatisAuditLogWriter(AuditLogMapper auditLogMapper, ObjectMapper objectMapper) {
            this.auditLogMapper = auditLogMapper;
            this.objectMapper = objectMapper;
        }

        void write(long userId, String actionCode, String resourceType, String resourceId, String storeId,
                   Map<String, Object> beforeData, Map<String, Object> afterData) {
            // Persist structured snapshots so security investigations can compare changes reliably.
            auditLogMapper.insertSummary(userId, actionCode, resourceType, resourceId, json(beforeData), json(afterData));
        }

        private String json(Map<String, Object> value) {
            try {
                return objectMapper.writeValueAsString(value);
            } catch (JsonProcessingException exception) {
                throw new IllegalStateException("审计日志序列化失败", exception);
            }
        }
    }
}
