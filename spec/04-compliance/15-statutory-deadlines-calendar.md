# 15 — Statutory Deadlines Calendar

## Purpose

Master calendar of every statutory deadline a tenant must observe. The HRMS uses this for automated reminders, compliance dashboards, and SLA tracking.

## Annual calendar (FY April–March, India)

### Monthly (every month)

| Date | Deadline | Authority | Source |
|---|---|---|---|
| 7th | TDS deposit (for previous month deductions) | NSDL/CPC-TDS | IT Act § 192 + Rule 30 |
| 15th | EPF ECR + payment | EPFO | EPF Act |
| 15th | ESI Challan + payment | ESIC | ESI Act |
| 21st (varies) | PT deposit + return (Maharashtra; varies per state) | State PT Authority | State PT Act |
| Varies | LWF deposit (per state cycle) | State LWB | State LWF Act |
| 7th of next month | Salary disbursement (if monthly cycle) | (internal) | Wages Code § 17 |

### Quarterly

| Date | Quarter | Deadline | Authority |
|---|---|---|---|
| 31 July | Q1 (Apr-Jun) | Form 24Q | NSDL |
| 31 October | Q2 (Jul-Sep) | Form 24Q | NSDL |
| 31 January | Q3 (Oct-Dec) | Form 24Q | NSDL |
| 31 May | Q4 (Jan-Mar) | Form 24Q (incl. Annexure II) | NSDL |

### Half-yearly

| Date | Period | Deadline | Authority |
|---|---|---|---|
| 11 May | ESI contribution period 2 (Oct-Mar) | Half-yearly return | ESIC |
| 11 November | ESI contribution period 1 (Apr-Sep) | Half-yearly return | ESIC |
| State-specific | LWF half-yearly (states like MH, KL, WB) | Per state | State LWB |
| October / April | TN PT half-yearly | Per cycle | TN PT |

`[VERIFY]` ESIC due dates may have updated post-2019 amendments.

### Annual

| Date | Filing | Authority | Source |
|---|---|---|---|
| 30 April | Form 3A / 6A (PF Annual Return) | EPFO | EPF Scheme |
| 31 May | Form 24Q Q4 + Form 16 generation begins | NSDL | IT Act |
| 15 June | Form 16 + Form 12BA to employees | (Internal) | IT Act + Rule 31 |
| 15 February | CLRA Form XXV (Annual Return by PE) | Labour Commissioner | CLRA |
| 31 January | Factories Act Form D / Form 30 (Annual Return) | Chief Inspector of Factories | Factories Act |
| 31 January | State PT annual return (some states) | State | State |
| Within 30 days of bonus payment | Bonus Form D | Inspector under Bonus Act | Bonus Act |
| Within 8 months of FY end | Statutory bonus payment | (Internal — to employees) | Bonus Act § 19 |
| Within 30 days of separation | Gratuity payment (Form L) | (Internal) | Gratuity Act § 7 |
| Per state | State Shops & Establishments annual return | State Labour | State S&E |

`[VERIFY]` All dates per current notifications. Some change; check authority.

### One-time / triggered

| Trigger | Deadline | Filing |
|---|---|---|
| New PF establishment | Within 1 month of applicability | EPF Form 5A (employer registration) |
| New ESI establishment | Within 15 days | ESIC employer registration |
| New employee | Within 1 month | Form 11 (PF) + Form 1 (ESIC) |
| Employee separation | Monthly (with ECR) | Form 10 (PF) |
| Accident at factory | 4 hours fatal; 12 hours others | Form 18 (Factories Act) |
| New CLRA engagement | Before commencement | Form VIB (notice) |
| Standing Orders new establishment | Within 6 months of Act applicability | Industrial Employment (SO) Act |
| Maternity benefit notice | 6 weeks before EDD | Form A (MB Act) |
| Pregnancy related illness | As soon as known | Form (MB Act) |

## Detailed deadline schema

```typescript
interface StatutoryDeadlineDefinition {
  deadlineCode: string;                    // 'PF-ECR-MONTHLY'
  
  category: 'monthly' | 'quarterly' | 'half-yearly' | 'annual' | 'triggered';
  filingType: StatutoryFilingType;
  
  // for periodic
  cycleType?: 'calendar-month' | 'fy-quarter' | 'cy-month' | 'esi-period' | 'fy-annual' | 'cy-annual';
  dueDateInCycle?: string;                 // '15' = 15th, '7' = 7th
  
  // for triggered
  triggerEventType?: string;
  triggerEventDeadlineDays?: number;       // e.g., 30 days from event
  
  // applicability
  applicableTo: {
    employerType?: ('factory' | 'shop' | 'commercial' | 'all')[];
    states?: StateCode[];
    minEmployeeCount?: number;
  };
  
  // authority
  authorityName: string;
  authorityCode: string;
  
  // filing requirements
  formCode?: string;
  paymentRequired?: boolean;
  
  // late penalties
  latePenalty?: {
    perDay?: Decimal128;
    perMonth?: Decimal128;
    interestRate?: number;
    cap?: Decimal128;
  };
  
  // reminders
  reminderDaysBefore: number[];            // [7, 3, 1] = remind 7, 3, 1 days before
  escalationDaysAfter: number[];           // [1, 7, 30] = escalate 1, 7, 30 days after due
}
```

## Compliance task tracking

Each tenant has tasks generated from deadline definitions:

```typescript
interface StatutoryFilingTask extends BaseDocument {
  // (defined in 00-overview.md)
}
```

Task lifecycle:
1. **Created**: cycle starts (e.g., April starts → April PF ECR task created)
2. **Pending**: due date approaches; reminders sent
3. **In progress**: HR working on it
4. **Submitted**: filed with authority
5. **Acknowledged**: receipt received
6. **Late**: deadline passed without filing
7. **Penalty incurred**: late filing penalty + interest

## Reminder schedule

Default `[ASSUMPTION]`:
- 7 days before due: email + in-app
- 3 days before due: email + in-app + WhatsApp
- 1 day before due: email + in-app + WhatsApp + SMS
- Day of: urgent reminder
- 1 day after if not filed: alert HR Manager + Compliance Officer
- 7 days after: escalate to Tenant Admin
- 30 days after: senior management alert

Tenant can customize.

## Compliance dashboard

Master view per tenant:
- This month's deadlines (top widget)
- Next 30 days
- Overdue (red)
- Last 12 months compliance rate (% on time)
- Late fees / interest paid (cost)
- Filings by category (bar chart)

Per-entity drill-down.

## Examples worked

### Pankaj's tenant (Acme Industries, BLR), FY 2026-27

#### April 2026 deadlines

| Date | Deadline |
|---|---|
| 7 May | TDS deposit for April |
| 15 May | EPF ECR + payment for April |
| 15 May | ESI challan + payment for April |
| 20 May | Karnataka PT challan for April (gross > ₹15K employees) |

#### June 2026 deadlines (FY annual)

| Date | Deadline |
|---|---|
| 15 June | Form 16 distributed to employees |
| 30 June | Form 12BA distributed |

#### Quarterly deadlines

| Quarter | Form 24Q Due |
|---|---|
| Q1 (Apr-Jun) | 31 July 2026 |
| Q2 (Jul-Sep) | 31 October 2026 |
| Q3 (Oct-Dec) | 31 January 2027 |
| Q4 (Jan-Mar) | 31 May 2027 |

#### Annual

| Filing | Due |
|---|---|
| Form 3A / 6A | 30 April 2027 (FY 2026-27) |
| Bonus payment | 30 November 2026 (8 months after FY 2025-26 end) |
| Bonus Form D | 30 December 2026 |
| CLRA Form XXV (if applicable) | 15 February 2027 |
| Factories Act Form D (if applicable) | 31 January 2027 |
| Karnataka LWF | 15 January 2027 |

## Multi-entity / multi-state

For tenant Acme with entities in:
- BLR (Karnataka)
- MUM (Maharashtra)

PT and LWF deadlines differ. The HRMS:
- Generates separate task per state per cycle
- Single calendar view shows all
- Drill-down per entity

## Late filing impact

When deadline missed:
- Task auto-marked late
- Penalty computed per definition
- HR-facing alert
- Senior management escalation
- Recorded in compliance metrics
- Inspector mode shows pattern (concern if frequent)

## Filing acknowledgment storage

Every successful filing produces:
- Authority's acknowledgment receipt (PDF / email)
- Challan reference number
- Payment proof (UTR if bank)

All stored as Documents:
- Tagged by filing task ID
- Hash for tamper detection
- 7+ year retention

## Inspector view

Inspector queries:
- "Show last year's filings"
- HRMS produces filtered view: dates, forms, acknowledgments
- Inspector downloads, reviews

## Open questions

`[OPEN]` Auto-deposit (HRMS pays directly to authority via API)? Tempting but very high-stakes. Recommend: HR-triggered always; HRMS prepares challan but doesn't auto-pay.

`[OPEN]` Calendar export (iCal/Google Calendar) for HR? Recommend: yes; useful UX.

`[OPEN]` Buddy review for filings (4-eyes principle)? Some tenants want second person to review. Recommend: tenant config; default single approver.

`[OPEN]` Reminder fatigue: too many reminders ignored. Recommend: tenant tunable; default conservative.

`[OPEN]` AI-suggested actions: "Looking at your filing pattern, you might want to schedule X earlier this month." Recommend: v2 feature.

## Cross-references

- All other files in `/04-compliance/` produce filings tracked here
- [00-overview.md](./00-overview.md) — compliance overview
- [/00-foundations/04-audit-and-compliance-hooks.md](../00-foundations/04-audit-and-compliance-hooks.md) — Statutory Timeline
