package com.qiyu.domain.media;

import java.io.InputStream;

public interface ObjectStorageGateway {
    String put(String objectName, String contentType, InputStream inputStream, long size);
}
