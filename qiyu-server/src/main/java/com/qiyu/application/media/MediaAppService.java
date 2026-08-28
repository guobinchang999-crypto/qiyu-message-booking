package com.qiyu.application.media;

import com.qiyu.domain.media.ObjectStorageGateway;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class MediaAppService {
    private static final Set<String> IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private final ObjectStorageGateway storageGateway;

    public MediaAppService(ObjectStorageGateway storageGateway) {
        this.storageGateway = storageGateway;
    }

    public String uploadImage(String directory, String originalName, String contentType, InputStream stream, long size) {
        if (!IMAGE_TYPES.contains(contentType) || size <= 0 || size > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("仅支持 10MB 以内的 JPG、PNG 或 WebP 图片");
        }
        String extension = extension(originalName, contentType);
        String objectName = directory + "/" + UUID.randomUUID() + extension;
        return storageGateway.put(objectName, contentType, stream, size);
    }

    private static String extension(String originalName, String contentType) {
        if (originalName != null) {
            int dot = originalName.lastIndexOf('.');
            if (dot >= 0) return originalName.substring(dot).toLowerCase(Locale.ROOT);
        }
        return "image/png".equals(contentType) ? ".png" : "image/webp".equals(contentType) ? ".webp" : ".jpg";
    }
}
