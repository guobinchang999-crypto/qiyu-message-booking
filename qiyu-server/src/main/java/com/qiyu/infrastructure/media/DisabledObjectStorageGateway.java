package com.qiyu.infrastructure.media;

import com.qiyu.domain.media.ObjectStorageGateway;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.InputStream;

@Component
@ConditionalOnProperty(prefix = "qiyu.storage.minio", name = "enabled", havingValue = "false", matchIfMissing = true)
public class DisabledObjectStorageGateway implements ObjectStorageGateway {
    @Override
    public String put(String objectName, String contentType, InputStream inputStream, long size) {
        throw new IllegalStateException("对象存储未启用，请配置 MinIO 连接信息");
    }
}
