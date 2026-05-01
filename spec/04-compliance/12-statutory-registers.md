# 12 — Statutory Registers Master Index

## Purpose

Master catalog of every statutory register the HRMS auto-maintains and produces. Cross-references each register to its statutory authority, frequency, format, and the module that produces it.

This is the single reference for "What does the HRMS produce for compliance?"

## Categories

1. **Wage / Pay Registers** — under Wages Code 2019 / Payment of Wages Act 1936 / state Shops Acts
2. **Attendance Registers** — under Factories Act 1948 / state Shops Acts
3. **Leave Registers** — under Factories Act 1948 / state Shops Acts
4. **Statutory Contribution Registers** — PF, ESI, PT, LWF, TDS
5. **Bonus Registers** — Bonus Act 1965
6. **Gratuity Registers** — Gratuity Act 1972
7. **Maternity Benefit Registers** — MB Act 1961 / 2017
8. **Contract Labour Registers** — CLRA 1970 / OSH Code 2020
9. **Factories Act Registers** — Factories Act 1948 / OSH Code 2020
10. **Shops & Establishments Registers** — Per state Acts
11. **Other** — Industrial Disputes, Standing Orders, etc.

## Master register catalog

### 1. Wage / Pay Registers

| Register | Statute | Frequency | Module |
|---|---|---|---|
| Form A — Wage Register (now Form C under Wages Code) | Wage Code 2019 § 50 | Monthly | `/03-payroll/` |
| Form B — Muster Roll-cum-Wage Register | Wage Code 2019 | Monthly | `/03-payroll/` |
| Form C — Annual Wage Return | Wage Code 2019 | Annual | `/03-payroll/` |
| Wage Slip / Payslip | Wage Code 2019 § 52 | Per pay | `/03-payroll/10-payslip-format.md` |

`[VERIFY]` Wage Code form numbers under specific state notifications.

### 2. Attendance Registers

| Register | Statute | Frequency | Module |
|---|---|---|---|
| Form 9 — Notice of Periods of Work for Adults | Factories Act § 61 | Posted | `/02-attendance/` |
| Form 10 — Notice for Adolescents | Factories Act | Posted | `/02-attendance/` |
| Form 25 — Register of Adult Workers | Factories Act § 62 | Continuous | `/02-attendance/07` |
| Form 26 — Register of Child Workers | Factories Act § 73 | (rare) | `/02-attendance/07` |
| Form 4 — Notice of Period of Work (state Shops Acts) | State S&E Acts | Posted | `/02-attendance/` |
| Muster Roll | State S&E Acts / CLRA | Daily | `/02-attendance/` |

### 3. Leave Registers

| Register | Statute | Frequency | Module |
|---|---|---|---|
| Form 11 — Register of Leave with Wages (Adults) | Factories Act § 79(8) | Continuous | `/02-attendance/` |
| Form 12 — Register of Leave with Wages (Adolescents) | Factories Act | Continuous | `/02-attendance/` |
| Leave Card / Form 12A | Factories Act | Per worker | `/02-attendance/` |
| State Shops Act Leave Register | State S&E Acts | Continuous | `/02-attendance/` |

### 4. Statutory Contribution Registers

| Register | Statute | Frequency | Module |
|---|---|---|---|
| ECR (Electronic Challan-cum-Return) | EPF Act § 6, EPFO ECR Rules | Monthly | `/04-compliance/01` |
| Form 5 — New PF Members | EPF Scheme Rule 36 | Monthly | `/04-compliance/01` |
| Form 10 — Members Who Left | EPF Scheme | Monthly | `/04-compliance/01` |
| Form 3A — Annual PF Return per Member | EPF Scheme | Annual | `/04-compliance/01` |
| Form 6A — Consolidated Annual PF | EPF Scheme | Annual | `/04-compliance/01` |
| ESIC Half-yearly Return | ESI Act § 44 | Half-yearly | `/04-compliance/02` |
| Form 24Q — TDS Quarterly | IT Act § 192 + Rule 31A | Quarterly | `/04-compliance/03` |
| Form 16 — Annual TDS Certificate | IT Act + Rule 31 | Annual | `/04-compliance/03` |
| Form 12BA — Perquisites Statement | IT Rule 26A | Annual | `/04-compliance/03` |
| Form 12B — Prior Salary Declaration | IT Rule 26A | On hire | `/03-payroll/04` |
| Form 12BB — Employee Declaration | IT Rule 26C | Annual / on changes | `/03-payroll/04` |
| Professional Tax Return per state | State PT Acts | Per state cycle | `/04-compliance/04` |
| LWF Return per state | State LWF Acts | Per state cycle | `/04-compliance/05` |

### 5. Bonus Registers

| Register | Statute | Frequency | Module |
|---|---|---|---|
| Form A — Bonus Computation (Allocable Surplus) | Bonus Act § 26 + Rule 4 | Annual (if computed) | `/04-compliance/06` |
| Form B — Set-on Set-off | Bonus Act § 26 + Rule 4 | Annual | `/04-compliance/06` |
| Form C — Bonus Paid per Employee | Bonus Act § 26 + Rule 4 | Annual | `/04-compliance/06` |
| Form D — Annual Return to Inspector | Bonus Act + Rule 5 | Within 30 days of payment | `/04-compliance/06` |

### 6. Gratuity Registers

| Register | Statute | Frequency | Module |
|---|---|---|---|
| Form A — Notice of Opening | Gratuity Act + Rule 3 | On registration | `/04-compliance/07` |
| Form F — Nomination | Gratuity Act + Rule 6 | On hire / changes | `/04-compliance/07` |
| Form G — Fresh Nomination | Gratuity Rule 6 | When invalidated | `/04-compliance/07` |
| Form H — Modification | Gratuity Rule 6 | On changes | `/04-compliance/07` |
| Form I — Application by Employee | Gratuity Rule 7 | On separation | `/04-compliance/07` |
| Form J — Application by Nominee (death) | Gratuity Rule 7 | On death | `/04-compliance/07` |
| Form K — Application by Heir | Gratuity Rule 7 | On death no nominee | `/04-compliance/07` |
| Form L — Notice of Payment | Gratuity Rule 8 | On payment | `/04-compliance/07` |
| Form M — Notice of Rejection | Gratuity Rule 8 | If rejected | `/04-compliance/07` |
| Form U — Abstract for Display | Gratuity Rule 20 | Posted continuously | `/04-compliance/07` |

### 7. Maternity Benefit Registers

| Register | Statute | Frequency | Module |
|---|---|---|---|
| Form A — Notice (employee) | MB Act + Rules | On pregnancy notification | `/04-compliance/08` |
| Form B — Application for Benefit | MB Act + Rules | On claim | `/04-compliance/08` |
| Form D — Notice of Payment by Employer | MB Rules | On payment | `/04-compliance/08` |
| Maternity Register (Form J in some states) | MB Rules / state | Continuous | `/04-compliance/08` |

### 8. Contract Labour Registers (CLRA / OSH Code)

| Register | Statute | Frequency | Module |
|---|---|---|---|
| Form XII — Register of Contractors | CLRA Rule 74 | Continuous | `/04-compliance/09` |
| Form XIII — Register of Workmen by Contractor | CLRA Rule 75 | Continuous | `/04-compliance/09` |
| Form XV — Notice of Hours of Work | CLRA Rule 78 | Posted | `/04-compliance/09` |
| Form XVII — Wage Register | CLRA Rule 78 | Monthly | `/04-compliance/09` |
| Form XVIII — Wage Slip | CLRA Rule 78 | Per pay | `/04-compliance/09` |
| Form XIX — Wage Receipt | CLRA Rule 78 | Per pay | `/04-compliance/09` |
| Form XX — Muster Roll | CLRA Rule 78 | Daily | `/04-compliance/09` |
| Form XXI — Register of Advances | CLRA Rule 78 | As needed | `/04-compliance/09` |
| Form XXII — Register of Damage Deductions | CLRA Rule 78 | As needed | `/04-compliance/09` |
| Form XXIII — Register of Fines | CLRA Rule 78 | As needed | `/04-compliance/09` |
| Form XXIV — Register of Overtime | CLRA Rule 78 | Continuous | `/04-compliance/09` |
| Form XXV — Annual Return by PE | CLRA Rule 82 | Annual (Feb 15) | `/04-compliance/09` |
| Form VIA — Half-yearly Return by Contractor | CLRA Rule 82 | Half-yearly | `/04-compliance/09` |

### 9. Factories Act Registers

| Register | Statute | Frequency | Module |
|---|---|---|---|
| Form 1 — License | FA + state Rules | On registration | `/04-compliance/10` |
| Form 2 — Notice of Occupation | FA § 7 | On change | `/04-compliance/10` |
| Form 4 — Notice of Period of Work | FA § 61 | Posted | `/04-compliance/10` |
| Form 13 — Health Register | FA § 41 | Continuous (hazardous) | `/04-compliance/10` |
| Form 18 — Notice of Accident | FA § 88 | On occurrence | `/04-compliance/10` |
| Form D — Annual Return | FA § 110 | Annual | `/04-compliance/10` |
| Form 30 — Annual Return (state) | FA + state Rules | Annual | `/04-compliance/10` |

### 10. Shops & Establishments Registers (state-specific)

| Register | Source | Frequency | Module |
|---|---|---|---|
| Maharashtra Form III (Wage Register) | MH S&E Act 2017 | Monthly | `/04-compliance/11` |
| Maharashtra Form IV (Muster) | MH S&E Act | Daily | `/04-compliance/11` |
| Karnataka Form T (Attendance) | KA S&E Act | Daily | `/04-compliance/11` |
| Karnataka Form C (Leave) | KA S&E Act | Continuous | `/04-compliance/11` |
| Delhi Form J (Wage Register) | DL S&E Act | Monthly | `/04-compliance/11` |
| Annual returns per state | State S&E | Annual | `/04-compliance/11` |

### 11. Other Registers

| Register | Statute | Frequency | Module |
|---|---|---|---|
| Standing Orders Register | IE(SO) Act 1946 | On creation/changes | (out of v1 scope) |
| Industrial Disputes Notification | ID Act 1947 | On dispute | (out of v1 scope) |
| Workmen's Compensation Register | WC Act 1923 / EC Act | On accident | `/04-compliance/10` |
| Audit Trail | DPDPA 2023 | Continuous | `/00-foundations/04` |

## Schema for register tracking

```typescript
interface StatutoryRegister extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  
  // identity
  registerCode: string;                    // 'REG-FORMA-2026-04'
  registerType: RegisterType;              // enum of all registers above
  name: string;
  statutoryReference: string;              // 'Wages Code 2019 § 50' etc.
  
  // generation
  forPeriod: string;                       // '2026-04', 'FY-2025-26', 'CY-2025'
  generatedAt: Date;
  generatedBy: ObjectId | 'system';
  
  // documents
  pdfDocumentId?: ObjectId;
  excelDocumentId?: ObjectId;
  csvDocumentId?: ObjectId;
  
  // metadata
  totalRecords: number;
  contentHash: string;
  
  // signature (if applicable)
  signedByOccupier?: { name: string; signedAt: Date };
  signedByEmployer?: { name: string; signedAt: Date };
  
  // submission tracking (for filed registers)
  filedWithAuthority?: boolean;
  authorityName?: string;
  filedAt?: Date;
  acknowledgmentReference?: string;
  
  // status
  status: 'draft' | 'final' | 'signed' | 'filed' | 'archived';
  
  // versioning
  versionNumber: number;
  supersededByRegisterId?: ObjectId;
  
  // retention
  retainUntil: Date;                       // typically 7 years from generation
  
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}
```

## Indexes

```typescript
{ tenantId: 1, entityId: 1, registerType: 1, forPeriod: 1 }
{ tenantId: 1, status: 1 }
{ tenantId: 1, registerType: 1, generatedAt: -1 }
```

## Generation pipeline

Registers are generated automatically:
- After payroll lock (for monthly registers)
- After FY close (for annual registers)
- On-demand from compliance dashboard
- As part of inspection pack generation

Storage:
- All registers stored as `Document` records in S3
- Encrypted at rest
- Hash for tamper detection
- 7-year retention default

Access:
- HR Manager / Compliance Officer: full access
- Inspector role: read-only with watermark
- Audit log per generation and per access

## Inspection pack

Master inspection pack assembles registers per inspection type:

| Inspection type | Registers included |
|---|---|
| EPFO | ECR, Form 5/10, Form 3A/6A, Wage register, Form A |
| ESIC | ESIC contributions, Half-yearly returns, Member registrations, Wage register |
| Income Tax / TDS | Form 24Q, Form 16, Form 12BA, Wage register |
| State PT | PT challan, Annual return, Wage register |
| State LWF | LWF challan, Half-yearly returns |
| Bonus Inspector | Forms A/B/C/D, Wage register, Employee master |
| Gratuity Authority | Form U, Form F file, Forms L/M, Employee master |
| Factories Inspector | Form D, Form 25, Form 11, Form 18, Wage register, Notice 9 |
| CLRA Inspector | Form XII, XXV, Contractor licenses, Form XVII, Form XX |
| State S&E Inspector | State S&E annual return, Form (state), Wage register |
| Comprehensive | All of above |

Generated as ZIP with cover index, signed URL.

## Multilingual output `[v2]`

Some states require local language. Hindi, Marathi, Tamil, Bengali, Gujarati, Punjabi etc. priority.

`[v1]` English only. v2 adds translations.

## Compliance metrics

Compliance dashboard shows:
- % registers up-to-date
- Overdue / pending registers
- Recent generations
- Inspector access frequency
- Storage health (file integrity)

## Open questions

`[OPEN]` Which registers actively filed vs maintained for inspection? Most CLRA registers are inspected-only (kept on premises); annual returns filed. PF/ESI/TDS actively filed. State Shops: annual return filed.

`[OPEN]` Wages Code form numbers post-state notifications. Many states haven't notified yet. Recommend: support both old (Payment of Wages Act) + new (Wages Code) formats; per state.

`[OPEN]` Auto-generation of physical printable forms (with signatures) vs digital-only? Recommend: both; tenant prints + signs as needed.

`[OPEN]` Register retention beyond 7 years? Some statutes (Income Tax) require 7+ years; some require longer (Factories Act 30 years for some specific registers like accident `[VERIFY]`). Recommend: per-register retention per statute.

## Cross-references

All other files in `/04-compliance/` produce specific registers covered here.
