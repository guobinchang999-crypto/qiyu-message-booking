package com.qiyu.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qiyu.infrastructure.persistence.entity.ReviewImageEntity;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface ReviewImageMapper extends BaseMapper<ReviewImageEntity> {
    @Select("SELECT image_url FROM review_image WHERE review_id = #{reviewId} ORDER BY sort_order, id")
    List<String> urls(long reviewId);
}
