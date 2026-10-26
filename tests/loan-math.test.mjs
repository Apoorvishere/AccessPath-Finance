import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLoan, restoreLoanDraft, initialDraft } from '../apps/web/src/lib/loan-demo.ts';

test('sample loan payments reconcile to the displayed total', () => {
  for (const months of [6, 12, 24]) {
    const result = calculateLoan(30000, months);
    assert.equal(result.totalRepayment, Math.round(result.emi * months * 100) / 100);
    assert.equal(result.totalCost, Math.round((result.totalRepayment + result.processingFee) * 100) / 100);
  }
  assert.deepEqual(calculateLoan(30000, 12), {
    emi: 2750.4,
    totalRepayment: 33004.8,
    processingFee: 600,
    totalCost: 33604.8,
  });
});

test('invalid browser drafts do not enter the saved journey', () => {
  assert.deepEqual(restoreLoanDraft(initialDraft), initialDraft);
  assert.equal(restoreLoanDraft({ ...initialDraft, termMonths: 0 }), null);
  assert.equal(restoreLoanDraft({ ...initialDraft, monthlyIncome: '42000' }), null);
  assert.equal(restoreLoanDraft({ ...initialDraft, amount: Infinity }), null);
});
