package com.qiyu.infrastructure.persistence.mapper;

/** Typed persistence projection for one system menu list row. */
public record SystemMenuProjection(long id, Long parentId, String menuName, String routePath,
                                   String permissionCode, String menuType, int sortOrder, String status, boolean visible, long version) {
}
