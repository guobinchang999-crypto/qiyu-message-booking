import { adminRequest } from './http';

export type StoreOperatingStatus = '营业中' | '休息中';
export type ServicePublishingStatus = '上架' | '下架';
export type TherapistWorkingStatus = '可预约' | '服务中' | '休假';
export type RoomWorkingStatus = 'AVAILABLE' | 'BOOKED' | 'IN_USE' | 'CLEANING' | 'MAINTENANCE';

export interface StoreResource {
  id: string;
  code?: string;
  regionId?: number;
  name: string;
  phone: string;
  province?: string;
  city?: string;
  district?: string;
  address: string;
  longitude?: number;
  latitude?: number;
  businessHours: string;
  manager: string | null;
  roomCount: number;
  therapistCount: number;
  status: StoreOperatingStatus;
  rating?: number;
  sortOrder?: number;
  enabled?: boolean;
}

export interface StoreCommand {
  code: string;
  regionId?: number;
  name: string;
  phone?: string;
  province?: string;
  city?: string;
  district?: string;
  address: string;
  longitude?: number;
  latitude?: number;
  businessHours: string;
  status: StoreOperatingStatus;
  rating?: number;
  sortOrder?: number;
  enabled: boolean;
}

export interface ServiceResource {
  id: string;
  code?: string;
  name: string;
  category: string;
  durationMinutes: number;
  preparationMinutes?: number;
  cleanupMinutes?: number;
  price: number;
  memberPrice: number;
  description?: string;
  status: ServicePublishingStatus;
  bookingCount: number;
  enabled?: boolean;
}

export interface ServiceCommand {
  code: string;
  name: string;
  category: string;
  durationMinutes: number;
  preparationMinutes: number;
  cleanupMinutes: number;
  price: number;
  memberPrice: number;
  description?: string;
  status: ServicePublishingStatus;
  enabled: boolean;
}

export interface TherapistResource {
  id: string;
  code?: string;
  storeId?: string;
  store: string;
  name: string;
  mobile?: string;
  level: string;
  skills: string[];
  status: TherapistWorkingStatus;
  rating: number;
  todayBookings: number;
  specifyFee?: number;
  enabled?: boolean;
}

export interface TherapistCommand {
  code: string;
  storeId: string;
  name: string;
  level: string;
  skills: string[];
  status: TherapistWorkingStatus;
  rating?: number;
  specifyFee?: number;
  enabled: boolean;
}

export interface RoomResource {
  id: string;
  code?: string;
  storeId?: string;
  store?: string;
  name: string;
  type: string;
  status: RoomWorkingStatus;
  capacity?: number;
  note?: string;
  enabled?: boolean;
}

export interface RoomCommand {
  code: string;
  storeId: string;
  name: string;
  type: string;
  status: RoomWorkingStatus;
  capacity: number;
  note?: string;
  enabled: boolean;
}

interface RoomServerResource {
  id: string;
  code: string;
  storeId: string;
  storeName: string;
  name: string;
  kind: string;
  status: RoomWorkingStatus;
  statusLabel: string;
  capacity: number;
  note?: string;
  sortOrder: number;
  enabled: boolean;
}

interface RoomServerCommand {
  code: string;
  storeId: string;
  name: string;
  kind: string;
  status: RoomWorkingStatus;
  capacity: number;
  note?: string;
  sortOrder?: number;
  enabled: boolean;
}

interface ResourceClient<TResource, TCommand> {
  list(): Promise<TResource[]>;
  create(command: TCommand): Promise<TResource>;
  update(id: string, command: TCommand): Promise<TResource>;
  remove(id: string): Promise<void>;
}

const createResourceClient = <TResource, TCommand>(path: string): ResourceClient<TResource, TCommand> => ({
  list: () => adminRequest<TResource[]>(path),
  create: (command) => adminRequest<TResource>(path, { method: 'POST', data: command }),
  update: (id, command) => adminRequest<TResource>(`${path}/${encodeURIComponent(id)}`, { method: 'PUT', data: command }),
  remove: (id) => adminRequest<void>(`${path}/${encodeURIComponent(id)}`, { method: 'DELETE' })
});

export const storeResourceApi = createResourceClient<StoreResource, StoreCommand>('/admin/stores');
export const serviceResourceApi = createResourceClient<ServiceResource, ServiceCommand>('/admin/services');
export const therapistResourceApi = createResourceClient<TherapistResource, TherapistCommand>('/admin/therapists');

/** Maps the server's room-domain naming to the administration page contract explicitly. */
const roomResource = (value: RoomServerResource): RoomResource => ({
  id: value.id,
  code: value.code,
  storeId: value.storeId,
  store: value.storeName,
  name: value.name,
  type: value.kind,
  status: value.status,
  capacity: value.capacity,
  note: value.note,
  enabled: value.enabled
});

/** Keeps transport naming out of page components while preserving the persistent room note. */
const roomCommand = (value: RoomCommand): RoomServerCommand => ({
  code: value.code,
  storeId: value.storeId,
  name: value.name,
  kind: value.type,
  status: value.status,
  capacity: value.capacity,
  note: value.note,
  enabled: value.enabled
});

export const roomResourceApi: ResourceClient<RoomResource, RoomCommand> = {
  list: async () => (await adminRequest<RoomServerResource[]>('/admin/rooms')).map(roomResource),
  create: async (command) => roomResource(await adminRequest<RoomServerResource>('/admin/rooms', {
    method: 'POST', data: roomCommand(command)
  })),
  update: async (id, command) => roomResource(await adminRequest<RoomServerResource>(
    `/admin/rooms/${encodeURIComponent(id)}`, { method: 'PUT', data: roomCommand(command) }
  )),
  remove: (id) => adminRequest<void>(`/admin/rooms/${encodeURIComponent(id)}`, { method: 'DELETE' })
};
