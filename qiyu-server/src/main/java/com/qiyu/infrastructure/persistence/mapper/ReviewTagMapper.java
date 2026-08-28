package com.qiyu.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qiyu.infrastructure.persistence.entity.ReviewTagEntity;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface ReviewTagMapper extends BaseMapper<ReviewTagEntity> {
    @Select("SELECT tag_name FROM review_tag WHERE review_id = #{reviewId} ORDER BY id")
    List<String> names(long reviewId);
}
