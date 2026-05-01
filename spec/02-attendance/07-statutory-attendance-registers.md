# 07 — Statutory Attendance Registers

## Purpose

Indian labour law mandates that establishments maintain specific attendance registers in prescribed formats. These registers must be available for inspection at the workplace by labour inspectors, EPFO, ESIC, and Income Tax officials.

This file specifies the registers the HRMS auto-generates, the data they contain, the formats, and how they integrate with the inspection-pack feature.

## Registers covered

| Register | Statute | Frequency | Format |
|---|---|---|---|
| Form A — Wage Register | Wages Code 2019 / pre-Code: Payment of Wages Act 1936 § 13A | Monthly | PDF + Excel + CSV |
| Form B — Muster Roll-cum-Wage Register | Wages Code 2019 | Monthly | PDF + Excel |
| Form C — Annual Return | Wages Code 2019 | Annual | PDF |
| Form 25 — Adult Worker Register | Factories Act 1948 § 62 | Continuous | PDF |
| Form 26 — Child Worker Register | Factories Act 1948 § 73 | Continuous (rare; child labour mostly banned) | PDF |
| Form 9 — Notice of Periods of Work | Factories Act 1948 | Posted | PDF |
| Form 11 — Register of Leave with Wages | Factories Act 1948 § 79(8) | Continuous | PDF |
| Form 12 — Leave Book / Card | Factories Act 1948 § 79(8) | Per employee | PDF (printable card) |
| Form D — Annual Return | Factories Act 1948 | Annual | PDF |
| Form A (CLRA) — Register of Establishments | CLRA 1970 | Continuous | PDF |
| Form XII (CLRA) — Register of Workmen | CLRA 1970 | Continuous (per contractor) | PDF |
| Form XIII (CLRA) — Wage Register for Contract Labour | CLRA 1970 | Monthly | PDF |
| Form XX (CLRA) — Muster Roll | CLRA 1970 | Continuous | PDF |
| Bonus Form A | Bonus Act 1965 | Annual | PDF |
| Bonus Form C | Bonus Act 1965 | Annual | PDF |
| Bonus Form D | Bonus Act 1965 | Annual | PDF |
| State-specific registers | per state Shops & Estab Acts | Per notification | PDF |

`[VERIFY]` Form numbers under Wages Code 2019 supersede Payment of Wages Act forms. The Code mandates uniform formats.

## Form A — Wage Register

### Statutory citation

> Section 13-A of the Payment of Wages Act, 1936 — every employer to maintain register / records giving particulars of persons employed, work performed, wages paid, deductions made, receipts given.
>
> Code on Wages 2019 § 50 — uniform Wage Register.

### Required fields per employee per pay period

| Field | Source |
|---|---|
| Employee code | Employee.employeeCode |
| Name | Employee.personal.fullLegalName |
| Designation | EmploymentRecord.designation |
| Worker category (skilled / semi-skilled / unskilled / clerical) | EmploymentRecord.skillLevel `[BLUE-COLLAR]` |
| Father's / Husband's name | Employee.family.father.name OR family.spouse.name |
| Date of joining | EmploymentRecord.joinedOn |
| Wage period | PayrollPeriod (e.g., '2026-04') |
| Days worked | DailyAttendance count where contributesToWorkedDays=true |
| Days on paid leave | LeaveApplications consumed in period (paid only) |
| Days on LOP | DailyAttendance count where status='lop' |
| Holidays observed | Count |
| Weekly offs | Count |
| Total days in period | Days in pay period |
| Hourly rate / Daily rate | CompensationRecord (if applicable) |
| Basic wages | PayrollLine.basic |
| Dearness Allowance | PayrollLine.da |
| HRA | PayrollLine.hra |
| Other allowances | sum of misc earnings |
| Overtime wages | PayrollLine.otAmount |
| Bonus | PayrollLine.bonus |
| Gross wages | PayrollLine.grossEarnings |
| Deductions: PF | PayrollLine.employeePf |
| Deductions: ESI | PayrollLine.employeeEsi |
| Deductions: TDS | PayrollLine.tds |
| Deductions: PT | PayrollLine.pt |
| Deductions: LWF | PayrollLine.lwf |
| Other deductions | sum of misc deductions |
| Net wages | PayrollLine.netPay |
| Date of payment | PayrollRun.disbursedAt |
| Signature / acknowledgment | Employee acknowledgment timestamp |

### Generation

Triggered:
- Automatically when payroll for a period is **locked** (status: 'locked')
- On-demand from compliance dashboard
- As part of inspection pack

Output formats:
- PDF (printable, signed by HR + occupier under Factories Act)
- Excel (for inspector who wants to filter / sort)
- CSV (machine-readable)

```typescript
interface WageRegisterGeneration {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  
  payrollPeriodId: ObjectId;
  payrollPeriodCode: string;               // '2026-04'
  
  format: 'pdf' | 'excel' | 'csv';
  templateId: ObjectId;                    // ref RegisterTemplate (which form variant)
  
  generatedAt: Date;
  generatedBy: ObjectId;
  documentId: ObjectId;                    // ref Document
  
  // metadata
  totalEmployees: number;
  totalWageBill: Decimal128;
  totalDeductions: Decimal128;
  
  // signatures (if printed and signed)
  signedByOccupier?: { name: string; designation: string; signedAt: Date };
  signedByManager?: { name: string; designation: string; signedAt: Date };
  
  // hash for tamper detection
  contentHash: string;
  
  isDeleted: boolean;
}
```

## Form B — Muster Roll-cum-Wage Register

Combines daily attendance and wage payment in one document. For factories, this is the inspector's primary reference.

### Per-day per-employee fields

| Day of month | 1 | 2 | 3 | ... | 30 | 31 |
|---|---|---|---|---|---|---|
| Status code | P | P | A | ... | WO | H |

Status codes (standardized):
- `P` — Present
- `A` — Absent (LOP)
- `L` — Approved leave (specific leave type may be appended: `LP` paid, `LU` unpaid)
- `H` — Holiday
- `WO` — Weekly off
- `OD` — On duty
- `LP` — Leave paid
- `LU` — Leave unpaid (LOP)
- `OT` — Worked OT
- `1/2P` — Half day present
- `M` — On maternity
- `S` — On sick leave

Plus monthly totals per employee at the bottom.

## Form 25 — Adult Worker Register (Factories Act)

> Section 62, Factories Act 1948: every occupier shall maintain a register of adult workers in the prescribed form.

Required:
- Name
- Father's name
- Age, sex
- Nature of work
- Group classification under § 61 (relays / shifts)
- Date of entry into service
- Number of identification token if any
- Permanent address

### Generation

This is a **continuous** register (not periodic). The system maintains the live state and produces a printable snapshot on demand.

`[BLUE-COLLAR]` Mandatory for factories. Updated whenever an adult worker is hired, transferred, or separated. Must be available for inspector at any time.

## Form 11 — Register of Leave with Wages (Factories Act)

> Section 79(8), Factories Act: every occupier shall maintain a register showing the leave with wages allowed and availed by every adult worker.

Required:
- Name, age, designation
- Date of entry into service
- Year (calendar year basis)
- Number of working days (the Factories Act formula → 1 leave per 20 worked)
- Leave earned
- Leave availed
- Balance leave at year end
- Leave with wages encashed at exit

The HRMS maintains this as a live ledger and outputs formal Form 11 on demand.

`[CA-REVIEW]` Factories Act § 79 leave rules differ from state Shops & Estab Acts. The HRMS computes per applicable statute (factory uses § 79; shop uses state Shops Act).

## Form D — Factories Act Annual Return

Filed annually with state factory inspector. Contains:
- Number of workers (max in any month)
- Total man-days worked
- Accident statistics (under Factories Act § 88)
- Health statistics
- Employment by department
- Average wages

The HRMS aggregates from DailyAttendance + PayrollRuns + accident records (covered in `/04-compliance/10-factories-act.md`, Phase 3).

## CLRA registers (contract labour)

### Form V — License (held by principal employer)

Not generated by HRMS; this is the license obtained from labour department. HRMS stores reference and reminds for renewal.

### Form XII — Half-yearly Return (CLRA)

Principal employer files. Aggregates contract labour:
- Number of contract workers per contractor
- Total man-days
- Wages paid
- Welfare amenities provided

### Form XIII — Wage Register for Contract Labour

Per contractor. Per worker. Per pay period. Same format as Form A but only contract workers and including contractor name.

`[CLRA]` Principal employer is responsible if contractor doesn't pay statutory wages. HRMS tracks via principal-employer linkage.

## State-specific registers

Each state's Shops & Establishments Act has prescribed forms:

| State | Register | Purpose |
|---|---|---|
| Maharashtra | Form III | Wage register |
| Maharashtra | Form IV | Muster roll |
| Karnataka | Form T | Register of attendance |
| Tamil Nadu | Form C | Register of leave |
| Delhi | Form J | Wage register |

`[VERIFY]` Each state. Forms have been updated post-Code on Wages in some states; pre-Code in others. Tenant configures which set applies.

## Register storage and access

### Storage

- Generated registers are stored as `Document` records (per `/01-employee/05-documents-and-kyc.md`)
- Storage path: `s3://hrms-prod/tenants/{tenantId}/entities/{entityId}/registers/{registerType}/{periodCode}.{format}`
- Retained for 7 years (statutory retention under Income Tax Act § 230 + Factories Act 7-year register retention `[VERIFY]`)
- Cold storage after 1 year

### Access

- HR Manager / Compliance Officer can generate / download
- Auditor / Inspector role: read-only access to all registers
- Audit log entry per register generation and per download

### Inspector mode

When inspector logs in (Inspector role, time-bound):
- Sees all registers for the date range they specify
- Can download (signed, watermarked)
- Cannot modify anything
- Every download audit-logged with inspector identity, IP, timestamp

## Inspection pack

A wedge feature: one-click generate everything an inspector typically asks for.

```typescript
interface InspectionPack {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  
  packType: 'epfo' | 'esic' | 'income-tax-tds' | 'factories-act' | 'clra' | 'shops-act' | 'comprehensive';
  packCode: string;                        // 'INS-2026-04-001'
  
  periodFrom: string;                      // YYYY-MM-DD
  periodTo: string;
  
  generatedAt: Date;
  generatedBy: ObjectId;
  documentId: ObjectId;                    // zip file in S3
  
  contents: Array<{
    documentType: string;                  // 'wage-register-Form-A'
    period: string;                        // '2026-04' or '2026-04-to-2026-09'
    format: string;
    fileName: string;
  }>;
  
  // hash for evidence
  contentHash: string;
  
  // expiry
  signedUrlExpiresAt: Date;
  
  isDeleted: boolean;
}
```

The pack assembles:
- All wage registers for the period
- All challan PDFs for PF / ESI / PT / LWF / TDS
- All filing acknowledgments
- Employee master export (per format)
- Statutory audit log slice (filings, payroll runs, salary changes)
- A cover document with index

Generated as a ZIP. Signed URL with 7-day expiry. Watermarked with tenant + period + generation timestamp.

`[v2]` Pre-emptive inspection pack: HRMS notices an inspector visit is imminent (e.g., notice received) and pre-generates the pack.

## Tamper evidence

Each generated register has a SHA-256 hash. Hash is stored in the audit log with the register generation event. If a register file is tampered with on storage, hash mismatch is detected at next access.

For high-stakes filings (PF ECR, TDS Form 24Q): the hash is also reflected in the Statutory Timeline event for that filing, providing additional forensic trail.

## Performance considerations

Register generation can be slow for large tenants:
- 1,000-employee monthly Form A: ~2-3 minutes
- Annual Form C with all employees: ~10-15 minutes

Strategy:
- Generate as BullMQ async job
- Notify user when ready
- Cache outputs; regenerate only if data changed
- Pre-generate at end of payroll lock to have ready instantly

## Open questions

`[OPEN]` Multilingual register output (English + regional language)? Statutory requirement varies. Some states mandate bilingual. Recommend: English primary in v1; regional language overlay in v2.

`[OPEN]` Digital signature on registers (DSC)? Some inspectors accept digitally signed PDFs; some require wet signature. Recommend: support both; tenant chooses.

`[OPEN]` Inspection pack for employees disputing wage / attendance — they want to see their portion of the register. Recommend: yes; specific employee + their data only.

`[OPEN]` Form 11 (leave register) — Factories Act says calendar year basis but Indian FY is April-March. Reconcile? Recommend: format per statute (calendar year for Factories Act); Internal HR reports use FY.

`[OPEN]` State Shops Act registers automatically tracked? Tenant chooses applicable state at registration; system auto-includes state registers. Updates when state changes.

## Cross-references

- [01-attendance-capture.md](./01-attendance-capture.md) — source events
- [03-leave-types-and-policies.md](./03-leave-types-and-policies.md) — leave for register
- [/03-payroll/](../03-payroll/) (Phase 3) — payroll outputs in register
- [/04-compliance/12-statutory-registers.md](../04-compliance/12-statutory-registers.md) (Phase 3) — full register catalog including non-attendance ones
- [/00-foundations/04-audit-and-compliance-hooks.md](../00-foundations/04-audit-and-compliance-hooks.md) — register generation in audit
