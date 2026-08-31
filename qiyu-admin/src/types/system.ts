export type SystemStatus = 'ENABLED' | 'DISABLED';

export interface OrganizationRecord {
  id: string;
  parentId?: string;
  name: string;
  type: 'HEADQUARTERS' | 'REGION' | 'STORE' | 'DEPARTMENT';
  leader: string;
  sort: number;
  status: SystemStatus;
}

export interface SystemUserRecord {
  id: string;
  username: string;
  displayName: string;
  phone: string;
  departmentName: string;
  roleNames: string[];
  dataScope: string;
  status: SystemStatus;
  lastLoginAt?: string;
}

export type UserDataScopeType = 'NONE' | 'SELF' | 'PRIMARY_STORE' | 'ASSIGNED_STORES' | 'REGION_STORES' | 'ALL_STORES';

export interface UserDataScope {
  userId: string;
  scopeType: UserDataScopeType;
  storeIds: string[];
  regionIds: string[];
  validFrom?: string;
  validUntil?: string;
  inherited: boolean;
}

export interface ScopeOption { id: string; name: string; }
export interface DataScopeOptions { stores: ScopeOption[]; regions: ScopeOption[]; }

export interface SystemRoleRecord {
  id: string;
  code: string;
  name: string;
  permissionCodes: string[];
  deniedPermissionCodes: string[];
  dataScope: string;
  userCount: number;
  status: SystemStatus;
}

export interface SystemMenuRecord {
  id: string;
  parentId?: string;
  name: string;
  path: string;
  permissionCode: string;
  type: 'DIRECTORY' | 'MENU' | 'BUTTON';
  sort: number;
  visible: boolean;
  status: SystemStatus;
}

export interface DictionaryRecord {
  id: string;
  typeCode: string;
  typeName: string;
  itemLabel: string;
  itemValue: string;
  sort: number;
  status: SystemStatus;
  remark?: string;
}

export interface AuditLogRecord {
  id: string;
  operatorName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  organizationName: string;
  result: 'SUCCESS' | 'FAILURE';
  ipAddress: string;
  detail: string;
  createdAt: string;
}

export interface SystemPage<T> { records: T[]; total: number; }
export interface SystemQuery { keyword?: string; page?: number; pageSize?: number; }
export type SystemEntity = OrganizationRecord | SystemUserRecord | SystemRoleRecord | SystemMenuRecord | DictionaryRecord;
