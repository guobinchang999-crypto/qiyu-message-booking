package com.qiyu.infrastructure.media;

import com.qiyu.domain.media.ObjectStorageGateway;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.InputStream;

@Component
@ConditionalOnProperty(prefix = "qiyu.storage.minio", name = "enabled", havingValue = "true")
public class MinioObjectStorageGateway implements ObjectStorageGateway {
    private final MinioClient client;
    private final String bucket;
    private final String publicBaseUrl;

    public MinioObjectStorageGateway(@Value("${qiyu.storage.minio.endpoint}") String endpoint,
                                     @Value("${qiyu.storage.minio.access-key}") String accessKey,
                                     @Value("${qiyu.storage.minio.secret-key}") String secretKey,
                                     @Value("${qiyu.storage.minio.bucket}") String bucket,
                                     @Value("${qiyu.storage.minio.public-base-url:${qiyu.storage.minio.endpoint}}") String publicBaseUrl) {
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("启用 MinIO 时必须配置 QIYU_LOCAL_MINIO_SECRET_KEY");
        }
        this.client = MinioClient.builder().endpoint(endpoint).credentials(accessKey, secretKey).build();
        this.bucket = bucket;
        this.publicBaseUrl = publicBaseUrl.replaceAll("/$", "");
    }

    @Override
    public String put(String objectName, String contentType, InputStream inputStream, long size) {
        try {
            if (!client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build())) {
                client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }
            client.putObject(PutObjectArgs.builder().bucket(bucket).object(objectName)
                    .contentType(contentType).stream(inputStream, size, -1).build());
            return publicBaseUrl + "/" + bucket + "/" + objectName;
        } catch (Exception exception) {
            throw new IllegalStateException("资源上传 MinIO 失败", exception);
        }
    }
}
