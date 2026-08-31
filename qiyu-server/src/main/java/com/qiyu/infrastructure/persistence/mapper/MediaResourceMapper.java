package com.qiyu.infrastructure.persistence.mapper;

import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

public interface MediaResourceMapper {
    @Update("UPDATE store SET cover_url=#{url} WHERE store_code=#{code} AND deleted=0") int updateStore(@Param("code") String code, @Param("url") String url);
    @Update("UPDATE store_gallery g JOIN store s ON s.id=g.store_id SET g.image_url=#{url} WHERE s.store_code=#{code} AND g.deleted=0")
    int updateStoreGallery(@Param("code") String code, @Param("url") String url);
    @Update("UPDATE service_item SET cover_url=#{url} WHERE service_code=#{code} AND deleted=0") int updateService(@Param("code") String code, @Param("url") String url);
    @Update("UPDATE therapist SET avatar_url=#{url} WHERE therapist_code=#{code} AND deleted=0") int updateTherapist(@Param("code") String code, @Param("url") String url);
}
