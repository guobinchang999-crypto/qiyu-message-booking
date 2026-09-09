import { adminRequest } from './http';

export type ScheduleStatus = 'WORK' | 'REST' | 'LEAVE';

export interface ScheduleResource {
  id: string;
  therapistId: string;
  therapistName: string;
  storeId: string;
  workDate: string;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  remark?: string;
}

export interface ScheduleCommand {
  therapistId: string;
  workDate: string;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  remark?: string;
}

/** Typed client for schedule mutations and bounded date-range reads. */
export const scheduleResourceApi = {
  list: (startDate: string, endDate: string) => adminRequest<ScheduleResource[]>(
    `/admin/schedules?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
  ),
  create: (command: ScheduleCommand) => adminRequest<ScheduleResource>('/admin/schedules', {
    method: 'POST', data: command
  }),
  update: (id: string, command: ScheduleCommand) => adminRequest<ScheduleResource>(
    `/admin/schedules/${encodeURIComponent(id)}`, { method: 'PUT', data: command }
  ),
  remove: (id: string) => adminRequest<void>(`/admin/schedules/${encodeURIComponent(id)}`, { method: 'DELETE' })
};
