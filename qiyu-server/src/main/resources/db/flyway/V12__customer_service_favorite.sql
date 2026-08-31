CREATE TABLE customer_favorite_service (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT '客户编号',
  service_item_id BIGINT UNSIGNED NOT NULL COMMENT '服务项目编号',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '收藏排序序号',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_customer_favorite_service (customer_id, service_item_id),
  KEY idx_customer_favorite_service_order (customer_id, sort_order, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='客户收藏服务项目';
