import { adminRequest } from './http';
import type { MemberAccount } from '@/types';

export type BalanceAdjustmentDirection = 'CREDIT' | 'DEBIT';

export interface MemberBalanceAdjustmentCommand {
  direction: BalanceAdjustmentDirection;
  amount: number;
  remark: string;
  requestId: string;
}

export interface MemberBalanceAdjustmentResult {
  memberId: string;
  customerName: string;
  transactionNo: string;
  requestId: string;
  transactionType: 'ADJUSTMENT_CREDIT' | 'ADJUSTMENT_DEBIT';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  idempotentReplay: boolean;
}

export const memberManagementApi = {
  list(): Promise<MemberAccount[]> {
    return adminRequest<MemberAccount[]>('/admin/members');
  },

  adjustBalance(
    memberId: string,
    command: MemberBalanceAdjustmentCommand,
  ): Promise<MemberBalanceAdjustmentResult> {
    return adminRequest<MemberBalanceAdjustmentResult>(
      `/admin/members/${encodeURIComponent(memberId)}/balance-adjustments`,
      { method: 'POST', data: command },
    );
  },
};
