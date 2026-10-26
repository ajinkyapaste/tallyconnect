import assert from 'node:assert/strict';
import {
  isIsoDate,
  daysFrom,
  isGstin,
  isRegisteredParty,
  statusOf,
  alertsOf,
  rowOut,
  summarize,
  cleanRow,
  listRange,
  REPORT_DAYS,
  STATUSES
} from '../utils/einvoiceCore.js';

console.log('--- RUNNING E-INVOICE CORE UNIT TESTS ---');

// 1. isIsoDate
assert.equal(isIsoDate('2026-10-26'), true, 'Valid ISO date');
assert.equal(isIsoDate('2026-02-29'), false, '2026 is not a leap year');
assert.equal(isIsoDate('2024-02-29'), true, '2024 is a leap year');
assert.equal(isIsoDate('invalid-date'), false);
assert.equal(isIsoDate(null), false);
console.log('✓ isIsoDate tests passed');

// 2. daysFrom
assert.equal(daysFrom('2026-10-01', '2026-10-26'), 25);
assert.equal(daysFrom('2026-10-26', '2026-10-26'), 0);
assert.equal(daysFrom('2026-10-26', '2026-10-20'), -6);
console.log('✓ daysFrom tests passed');

// 3. isGstin & isRegisteredParty
assert.equal(isGstin('27AAACT2727Q1ZW'), true);
assert.equal(isGstin('27AAACT2727Q1Z'), false, '14 chars should fail');
assert.equal(isGstin(''), false);
assert.equal(isRegisteredParty({ party_gstin: '27AAACT2727Q1ZW', registration_type: 'Regular' }), true);
assert.equal(isRegisteredParty({ party_gstin: '27AAACT2727Q1ZW', registration_type: 'Consumer' }), false);
assert.equal(isRegisteredParty({ party_gstin: null, registration_type: 'Regular' }), false);
console.log('✓ isGstin & isRegisteredParty tests passed');

// 4. statusOf
// Done with IRN
assert.equal(statusOf({ irn: 'abc-irn-123', irn_cancelled: false }), 'done');
// Cancelled with IRN
assert.equal(statusOf({ irn: 'abc-irn-123', irn_cancelled: true }), 'cancelled');
// Sale to registered party -> pending
assert.equal(
  statusOf({
    is_sale: true,
    is_optional: false,
    is_cancelled: false,
    gst_applicable: true,
    party_gstin: '27AAACT2727Q1ZW',
    registration_type: 'Regular'
  }),
  'pending'
);
// Optional sale -> not_needed
assert.equal(
  statusOf({
    is_sale: true,
    is_optional: true,
    party_gstin: '27AAACT2727Q1ZW',
    registration_type: 'Regular'
  }),
  'not_needed'
);
// Purchase -> not_needed
assert.equal(
  statusOf({
    is_sale: false,
    party_gstin: '27AAACT2727Q1ZW',
    registration_type: 'Regular'
  }),
  'not_needed'
);
console.log('✓ statusOf tests passed');

// 5. alertsOf
const today = '2026-10-26';
// Overdue pending: voucher date older than 30 days
const overdueRow = {
  is_sale: true,
  party_gstin: '27AAACT2727Q1ZW',
  registration_type: 'Regular',
  voucher_date: '2026-09-15'
};
assert.deepEqual(alertsOf(overdueRow, today), ['overdue']);

// Due soon pending: voucher date 25 days ago (5 days left)
const dueSoonRow = {
  is_sale: true,
  party_gstin: '27AAACT2727Q1ZW',
  registration_type: 'Regular',
  voucher_date: '2026-10-01'
};
assert.deepEqual(alertsOf(dueSoonRow, today), ['due_soon']);

// Fresh pending: 2 days ago
const freshPendingRow = {
  is_sale: true,
  party_gstin: '27AAACT2727Q1ZW',
  registration_type: 'Regular',
  voucher_date: '2026-10-24'
};
assert.deepEqual(alertsOf(freshPendingRow, today), []);

// Late report: IRN generated > 30 days after invoice
const lateReportRow = {
  irn: 'irn-123',
  voucher_date: '2026-08-01',
  ack_date: '2026-09-15'
};
assert.deepEqual(alertsOf(lateReportRow, today), ['late_report']);

// Ack before invoice: ack_date before voucher_date
const ackBeforeRow = {
  irn: 'irn-123',
  voucher_date: '2026-10-15',
  ack_date: '2026-10-10'
};
assert.deepEqual(alertsOf(ackBeforeRow, today), ['ack_before_invoice']);
console.log('✓ alertsOf tests passed');

// 6. rowOut
const sampleRow = {
  voucher_guid: 'guid-123',
  voucher_date: '2026-10-20',
  voucher_type: 'Sales',
  voucher_no: 'INV-001',
  party_name: 'Alpha Ltd',
  party_gstin: '27AAACT2727Q1ZW',
  registration_type: 'Regular',
  company_gstin: '27AAACT2727Q1ZW',
  place_of_supply: 'Maharashtra',
  amount: '12345.67',
  is_sale: true,
  irn: 'irn-sample-123',
  ack_no: 'ack-999',
  ack_date: '2026-10-20',
  signed_qr: 'data:image/svg+xml;utf8,<svg></svg>'
};
const outNoQr = rowOut(sampleRow, today, false);
assert.equal(outNoQr.signed_qr, undefined);
assert.equal(outNoQr.amount, 12345.67);
assert.equal(outNoQr.status, 'done');

const outWithQr = rowOut(sampleRow, today, true);
assert.equal(outWithQr.signed_qr, 'data:image/svg+xml;utf8,<svg></svg>');
console.log('✓ rowOut tests passed');

// 7. summarize
const rowsToSummarize = [
  { irn: 'done-1', voucher_date: '2026-10-20', ack_date: '2026-10-20' },
  { irn: 'done-2', voucher_date: '2026-08-01', ack_date: '2026-09-15' }, // late_report
  { is_sale: true, party_gstin: '27AAACT2727Q1ZW', registration_type: 'Regular', voucher_date: '2026-09-01' }, // overdue
  { is_sale: false, voucher_date: '2026-10-01' } // not_needed
];
const summary = summarize(rowsToSummarize, today);
assert.equal(summary.total, 4);
assert.equal(summary.done, 2);
assert.equal(summary.pending, 1);
assert.equal(summary.not_needed, 1);
assert.equal(summary.overdue, 1);
assert.equal(summary.late_report, 1);
console.log('✓ summarize tests passed');

// 8. cleanRow
const rawValid = {
  voucher_guid: '   guid-valid-1  ',
  voucher_date: '2026-10-26',
  voucher_type: 'Sales\u0000',
  voucher_no: 'INV-101',
  party_name: 'Tata Steel',
  party_gstin: '27aaact2727q1zw',
  registration_type: 'Regular',
  company_gstin: '27aaact2727q1zw',
  place_of_supply: 'Maharashtra',
  amount: '-45000.509',
  is_sale: 'Yes',
  is_optional: 'No',
  is_cancelled: false,
  gst_applicable: 'true',
  irn: 'irn-clean-1',
  ack_no: 'ack-101',
  ack_date: '2026-10-26',
  signed_qr: 'qr-content',
  irn_cancelled: false,
  eway: { eway_bill_no: '123456789' }
};
const cleaned = cleanRow(rawValid);
assert.equal(cleaned.voucher_guid, 'guid-valid-1');
assert.equal(cleaned.voucher_type, 'Sales');
assert.equal(cleaned.party_gstin, '27AAACT2727Q1ZW', 'Should uppercase GSTIN');
assert.equal(cleaned.company_gstin, '27AAACT2727Q1ZW', 'Should uppercase company GSTIN');
assert.equal(cleaned.amount, 45000.51, 'Absolute rounded 2 decimals');
assert.equal(cleaned.is_sale, true);
assert.equal(cleaned.is_optional, false);
assert.equal(cleaned.gst_applicable, true);
assert.deepEqual(cleaned.eway, { eway_bill_no: '123456789' });

// Bad row without guid or invalid date
assert.equal(cleanRow({ voucher_guid: '', voucher_date: '2026-10-26' }), null);
assert.equal(cleanRow({ voucher_guid: 'guid', voucher_date: 'bad-date' }), null);
assert.equal(cleanRow(null), null);
console.log('✓ cleanRow tests passed');

// 9. listRange
const fyDefault = listRange({}, today);
assert.equal(fyDefault.ok, true);
assert.equal(fyDefault.from, '2026-04-01');
assert.equal(fyDefault.to, '2026-10-26');

const customRange = listRange({ from: '2026-08-01', to: '2026-09-01' }, today);
assert.equal(customRange.ok, true);
assert.equal(customRange.from, '2026-08-01');
assert.equal(customRange.to, '2026-09-01');

const invertedRange = listRange({ from: '2026-10-01', to: '2026-09-01' }, today);
assert.equal(invertedRange.ok, false);
assert.match(invertedRange.message, /From must be on or before To/i);

const invalidDateFormat = listRange({ from: '01-10-2026', to: '2026-10-26' }, today);
assert.equal(invalidDateFormat.ok, false);
console.log('✓ listRange tests passed');

console.log('\n========================================');
console.log('ALL E-INVOICE CORE UNIT TESTS PASSED 100%!');
console.log('========================================\n');
