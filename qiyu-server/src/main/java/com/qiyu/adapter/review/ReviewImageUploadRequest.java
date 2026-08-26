package com.qiyu.adapter.review;

import jakarta.validation.constraints.NotBlank;

public record ReviewImageUploadRequest(
        @NotBlank(message = "文件名不能为空") String fileName,
        String tempFilePath,
        String requestId
) { }
