package com.qiyu.infrastructure.media;

import com.qiyu.domain.media.ObjectStorageGateway;
import com.qiyu.infrastructure.persistence.mapper.MediaResourceMapper;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@ConditionalOnProperty(prefix = "qiyu.storage.minio", name = "seed-enabled", havingValue = "true")
public class MediaSeedRunner implements ApplicationRunner {
    private final ObjectStorageGateway storageGateway;
    private final MediaResourceMapper mediaResourceMapper;

    public MediaSeedRunner(ObjectStorageGateway storageGateway, MediaResourceMapper mediaResourceMapper) {
        this.storageGateway = storageGateway;
        this.mediaResourceMapper = mediaResourceMapper;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        List<SeedAsset> assets = List.of(
                new SeedAsset("media-seed/stores/jingan.png", "stores/jingan.png", "store", "STORE_JINGAN"),
                new SeedAsset("media-seed/stores/xujiahui.png", "stores/xujiahui.png", "store", "STORE_XUJIAHUI"),
                new SeedAsset("media-seed/stores/lujiazui.png", "stores/lujiazui.png", "store", "STORE_LUJIAZUI"),
                new SeedAsset("media-seed/services/neck.png", "services/neck.png", "service", "SERVICE_NECK"),
                new SeedAsset("media-seed/services/tuina.png", "services/tuina.png", "service", "SERVICE_TUINA"),
                new SeedAsset("media-seed/services/aroma.png", "services/aroma.png", "service", "SERVICE_AROMA"),
                new SeedAsset("media-seed/therapists/lin.png", "therapists/lin.png", "therapist", "THERAPIST_LIN")
        );
        for (SeedAsset asset : assets) uploadAndPersist(asset);
    }

    private void uploadAndPersist(SeedAsset asset) throws Exception {
        ClassPathResource resource = new ClassPathResource(asset.classpath());
        String url;
        try (var inputStream = resource.getInputStream()) {
            url = storageGateway.put(asset.objectName(), "image/png", inputStream, resource.contentLength());
        }
        switch (asset.type()) {
            case "store" -> mediaResourceMapper.updateStore(asset.code(), url);
            case "service" -> mediaResourceMapper.updateService(asset.code(), url);
            case "therapist" -> mediaResourceMapper.updateTherapist(asset.code(), url);
            default -> throw new IllegalArgumentException("未知资源类型: " + asset.type());
        }
    }

    private record SeedAsset(String classpath, String objectName, String type, String code) {}
}
