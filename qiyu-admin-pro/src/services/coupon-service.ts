import { adminRequest } from './http';

export type CouponDiscountType = 'FIXED' | 'PERCENT';
export type CouponStatus = 'DRAFT' | 'ACTIVE' | 'ENDED';

export interface CouponTemplateResource {
  id: string; code: string; name: string; discountType: CouponDiscountType;
  discountAmount?: number; discountPercent?: number; thresholdAmount: number;
  validStartAt: string; validEndAt: string; issuedCount: number; usedCount: number;
  status: CouponStatus; scope: 'ALL_STORES';
}
export interface CouponTemplateCommand {
  code: string; name: string; discountType: CouponDiscountType;
  discountAmount?: number; discountPercent?: number; thresholdAmount: number;
  validStartAt: string; validEndAt: string; status: CouponStatus;
}

/** Typed client for persistent coupon-template administration. */
export const couponTemplateApi = {
  list: () => adminRequest<CouponTemplateResource[]>('/admin/coupon-templates'),
  create: (command: CouponTemplateCommand) => adminRequest<CouponTemplateResource>('/admin/coupon-templates', { method: 'POST', data: command }),
  update: (id: string, command: CouponTemplateCommand) => adminRequest<CouponTemplateResource>(`/admin/coupon-templates/${encodeURIComponent(id)}`, { method: 'PUT', data: command }),
  remove: (id: string) => adminRequest<void>(`/admin/coupon-templates/${encodeURIComponent(id)}`, { method: 'DELETE' })
};
