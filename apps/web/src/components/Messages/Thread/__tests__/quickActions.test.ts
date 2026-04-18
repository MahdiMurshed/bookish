import type { BorrowRequestStatus } from '@repo/api-client';
import { describe, expect, it } from 'vitest';

import { pickQuickAction } from '../QuickActions';

describe('pickQuickAction', () => {
  // Owner's turn
  it('owner on pending → approve + deny', () => {
    expect(pickQuickAction('pending', true, false)?.kind).toBe('approve-deny');
  });

  it('owner on approved → hand-over', () => {
    expect(pickQuickAction('approved', true, false)?.kind).toBe('hand-over');
    expect(pickQuickAction('approved', true, false)?.label).toBe('Quick actions:');
  });

  // Requester's turn
  it('requester on handed_over → mark-returned with "When you\'re done:" label', () => {
    const action = pickQuickAction('handed_over', false, true);
    expect(action?.kind).toBe('mark-returned');
    expect(action?.label).toBe("When you're done:");
  });

  // Not your turn
  it('requester on pending → null (owner decides)', () => {
    expect(pickQuickAction('pending', false, true)).toBeNull();
  });

  it('requester on approved → null (owner hands over next)', () => {
    expect(pickQuickAction('approved', false, true)).toBeNull();
  });

  it('owner on handed_over → null (requester marks returned)', () => {
    expect(pickQuickAction('handed_over', true, false)).toBeNull();
  });

  // Terminal states — no bar regardless of role
  it.each<BorrowRequestStatus>([
    'returned',
    'denied',
    'cancelled',
  ])('terminal status %s → null for owner', (status) => {
    expect(pickQuickAction(status, true, false)).toBeNull();
  });

  it.each<BorrowRequestStatus>([
    'returned',
    'denied',
    'cancelled',
  ])('terminal status %s → null for requester', (status) => {
    expect(pickQuickAction(status, false, true)).toBeNull();
  });

  // Self-request (someone borrowing their own book? shouldn't happen but
  // defensive) — the owner check wins in the ordering.
  it('when both owner and requester (nonsense state), prefers owner actions', () => {
    expect(pickQuickAction('pending', true, true)?.kind).toBe('approve-deny');
  });
});
