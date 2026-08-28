package com.qiyu.infrastructure.persistence.entity;

/** Persistence command model used to obtain the generated organization id. */
public class SystemOrganizationEntity {
    private Long id;
    private long parentId;
    private String code;
    private String name;
    private Long leaderUserId;
    private int sortOrder;
    private String status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public long getParentId() { return parentId; }
    public void setParentId(long parentId) { this.parentId = parentId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getLeaderUserId() { return leaderUserId; }
    public void setLeaderUserId(Long leaderUserId) { this.leaderUserId = leaderUserId; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
