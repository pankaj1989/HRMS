# 08 — White-Collar vs Blue-Collar Differences

## Purpose

The spec scopes both white-collar and blue-collar employees as first-class. They share the same core schemas (Employee, EmploymentRecord, CompensationRecord) but differ in fields, defaults, workflows, and statutory applicability. This file enumerates those differences so downstream module specs can reference a single source.

## Definition

`Employee.category` is one of:
- `white-collar` — office, IT, services, knowledge work
- `blue-collar` — factory, manufacturing, production line, retail floor, field staff, drivers, security
- `mixed` — tenant has both; per-employee category used

## High-level differences

| Dimension | White-collar | Blue-collar |
|---|---|---|
| Pay frequency | Monthly | Daily / Weekly / Fortnightly common; Monthly also exists |
| Pay structure | CTC with multiple components (Basic, HRA, Special, etc.) | Often Basic + DA + statutory adders; sometimes just "wage rate" |
| Statutory acts most relevant | Income Tax, EPF, ESI, Bonus | Factories Act, Minimum Wages Act, ID Act, EPF, ESI, Bonus, Wage Code |
| Establishment registration | Shops & Establishments | Factories Act + Shops & Establishments |
| Working hours | 9 hours typical, salaried | 8 hours statutory, hourly basis |
| Overtime | Often ineligible (managerial exemption) | Eligible at 2× wage rate (Factories Act § 59) |
| Leave types | EL, CL, SL, ML, PL | EL based on worked days (Factories Act § 79: 1 day per 20 worked), CL/SL state-specific |
| Attendance | Self-declaration / web-based | Biometric / RFID / manual register; physical presence on premises |
| Shifts | Mostly day shift, some flexibility | Fixed shifts (3-shift / 2-shift); roster-based |
| Holidays | National + state gazetted | National + state gazetted + festival holidays often more |
| Notice period | 30-90 days typical | 30 days or as per Standing Orders |
| Probation | 3-6 months | Often shorter; sometimes none |
| Termination | Performance-based mostly; mutual separation | Misconduct + Standing Orders procedure; retrenchment compensation |
| Standing Orders | Generally not applicable | **Industrial Employment (Standing Orders) Act 1946 / IR Code 2020 § 28-29** applies if 100+ employees ([VERIFY threshold]) |
| Disciplinary process | Internal HR-driven | Domestic inquiry per Standing Orders |
| Bonus | Not statutorily required for "supervisory" / "managerial" | Statutory under Bonus Act (8.33% min, 20% max) for those drawing ≤ ₹21,000 [VERIFY current threshold] |
| Gratuity | Same rules | Same rules; piece-rated employees use 7-day average wage `[CA-REVIEW]` |
| ESS access | Universal | Often restricted (no email, no smartphone); kiosk + WhatsApp + SMS |
| Communication | Email primary | WhatsApp / SMS / IVR / supervisor relay |
| Multi-language | Often English | Regional language essential (Hindi, Tamil, Marathi, Bengali, Kannada, Telugu, etc.) |

## Field-by-field differences in Employee record

### `Employee.category` set as marker

```typescript
category: 'white-collar' | 'blue-collar' | 'mixed'
```

This drives feature flags throughout. Not all blue-collar employees are full-time factory workers — could include security guards, drivers, housekeeping, contracted retail staff.

### `Employee.isExemptFromOvertime`

```typescript
isExemptFromOvertime: boolean   // typically true for white-collar, false for blue-collar
```

White-collar managerial / supervisory employees are typically exempt from OT eligibility (per Factories Act). The spec treats this as employee-level flag, set on Employee creation per role.

### `Employee.contact.workEmail`

White-collar: mandatory.

Blue-collar: usually not provided. Many factory workers don't have personal email. ESS access via:
- WhatsApp number
- SMS-based OTP login
- Kiosk (touchscreen on shop floor)

`[ASSUMPTION]` `workEmail` is optional (already in schema). For login: `User.email` is required, but tenant config can allow phone-based login.

### `Employee.bank.accounts`

White-collar: typically 1 account; bank verification via penny-drop.

Blue-collar:
- Many don't have bank accounts at hire → tenant facilitates account opening (PMJDY / regular)
- Some on cash payments (rare and discouraged; Wage Code 2019 mandates bank/digital for ≥ ₹16k threshold `[VERIFY]`)
- Multiple accounts rare

### `Employee.education`

White-collar: detailed, all degrees and certifications.

Blue-collar: often "10th standard fail" / "8th standard pass"; may be "informal training". Schema allows minimal entry.

### `Employee.priorExperience`

White-collar: documented with letters.

Blue-collar: often self-declared, hard to verify. Schema allows entries without documents.

### `Employee.skills`

Blue-collar may include trade skills (welding, machining, electrical) and certifications under Apprentices Act / National Skill Qualification Framework (NSQF).

### `Employee.identity.aadhaar`

Both mandatory in practice; especially for blue-collar where Aadhaar is the only reliable ID.

### `Employee.statutory.uan`, `pfMemberIds`

Blue-collar: high churn means many UAN / Member ID records over career.

Schema same; behavior differs (more frequent transfers).

## Field-by-field differences in EmploymentRecord

### `EmploymentRecord.employmentType`

White-collar: predominantly `permanent-full-time`, `consultant`, `intern`.

Blue-collar: mix of `permanent-full-time`, `fixed-term-full-time`, `apprentice`, `contract-labour`, `piece-rated`, `gig-worker`, `daily-wage`.

### `EmploymentRecord.isFixedTerm`

Blue-collar more often. Fixed-term legal under IR Code 2020 § 2(o) — explicit recognition. Important: cannot use fixed-term contracts as a way to deny statutory benefits if the work is permanent in nature `[CA-REVIEW]`.

### `EmploymentRecord.isApprentice`

Blue-collar context. Apprentices Act 1961:
- Stipend rates set by NCVT / SCVT
- Duration: typically 6 months to 4 years
- Apprentices have specific rights / restrictions

Schema:
```typescript
isApprentice: boolean
apprenticeshipDurationMonths: number
apprenticeshipTradeCode: string         // NSQF / NCVT trade code, e.g., 'ELECT-MECH-2'
apprenticeshipBatchNumber?: string
apprenticeshipStipendOnly: boolean      // pure stipend, no salary
```

### `EmploymentRecord.isContractLabour` and `clraDetails`

Specific to engaging contract labour. CLRA applies if 50+ contract workers in establishment `[VERIFY]`.

Schema already includes `clraDetails`. Detailed processing in `/04-compliance/09-clra-contract-labour.md` (Phase 3).

### `EmploymentRecord.defaultShiftId`, `rosterPolicyId`

Critical for blue-collar; usually null for white-collar.

```typescript
// Blue-collar example
{
  defaultShiftId: ObjectId('shift_first_shift_morning'),
  rosterPolicyId: ObjectId('roster_3_shift_rotating'),
  weeklyOffPattern: { type: 'fixed', dayOfWeek: 0 }  // Sunday off
}

// White-collar
{
  defaultShiftId: null,
  rosterPolicyId: null,
  weeklyOffPattern: { type: 'fixed', dayOfWeek: 0 }
}
```

### `EmploymentRecord.locationId` + branch

Blue-collar: tied to factory / store / site address; rarely changes.

White-collar: hybrid / remote common; location is administrative.

### `EmploymentRecord.noticePeriodDays`

White-collar: 30, 60, or 90 (executive: 90).

Blue-collar: 30 days typical; per Standing Orders if applicable.

## Field-by-field differences in CompensationRecord

### `CompensationRecord.payCycle`

White-collar: monthly almost always.

Blue-collar: monthly / fortnightly / weekly / daily-piece-rated.

For weekly: pay period is typically Mon–Sun, paid following Wed/Thu.

### Schema additions for blue-collar pay structures

```typescript
// In CompensationRecord
pieceRateConfig?: {
  unitDescription: string;              // 'shirt', 'piece-soldered'
  ratePerUnit: Decimal128;
  guaranteedMinimumPerDay?: Decimal128; // floor: minimum wage applies regardless
  qualityRejectionPolicy: 'pay-full' | 'pay-partial' | 'no-pay';
  unitsRecordingMethod: 'self' | 'supervisor' | 'qa-system';
};

dailyWageConfig?: {
  daySkill: 'unskilled' | 'semi-skilled' | 'skilled' | 'highly-skilled';
  ratePerDay: Decimal128;
  guaranteedDays?: number;              // tenant config: 6 days/week guarantee
};

minimumWageReferences?: {
  state: StateCode;
  industry: string;                     // 'Cotton Textiles', 'Construction'
  skillLevel: string;
  notificationDate: Date;
  ratePerDay: Decimal128;
};
```

### `CompensationRecord.componentBreakdown` differences

Blue-collar typical components:
- BASIC
- DA (often higher proportion than white-collar; varies by state notification)
- SPECIAL_ALLOWANCE
- WASH_ALLOWANCE (uniform washing)
- TIFFIN_ALLOWANCE (food)
- HOUSING_ALLOWANCE (in factory townships)
- HARDSHIP_ALLOWANCE (heat / hazardous work)
- ATTENDANCE_BONUS (incentive for full attendance)
- PRODUCTION_INCENTIVE (output-linked)
- OT (statutory: 2× of (basic + DA + retaining allowance))
- NIGHT_SHIFT_ALLOWANCE
- WEEKLY_OFF_WORKING_ALLOWANCE

White-collar typical components:
- BASIC
- HRA
- SPECIAL_ALLOWANCE
- LTA
- MEDICAL_ALLOWANCE (rare post-2018)
- FBP_POOL (with sub-components)
- PERFORMANCE_BONUS
- RETENTION_BONUS

### `CompensationRecord.taxRegime`

White-collar: choice of old vs new; many white-collar employees have investments → old regime more attractive.

Blue-collar: most below taxable threshold; new regime typical (simpler).

### `CompensationRecord.taxDeclarations`

White-collar: detailed declarations (HRA, home loan, 80C investments).

Blue-collar: often empty (income below threshold).

## Attendance differences (preview for /02-attendance/)

### Capture method

White-collar:
- Web check-in via mobile/desktop app
- Geo-fenced attendance for hybrid
- Often time-trust (declare working hours) rather than punch-by-punch

Blue-collar:
- Biometric (fingerprint / face / iris) at gate
- RFID card swipe
- Mobile (geo-tagged for field staff)
- Sometimes manual: supervisor-marked muster
- Multiple punches per shift (in / break-out / break-in / out)

### Compliance registers

Blue-collar establishments require:
- **Form A** under Wages Code 2019 (or pre-Code: Form A under Payment of Wages Act): Wage Register
- **Form B** under Wages Code: Muster Roll-cum-Wage Register
- Form 25 (Factories Act): adult worker register
- Form 26 (Factories Act): childworker register (for legitimate child labour, if any historically; rare now)

These are auto-generated by the system (specced in /04-compliance/12-statutory-registers.md, Phase 3).

White-collar attendance: less stringent registers; basic attendance log.

## Leave differences (preview for /02-attendance/)

### Statutory minimums

Blue-collar (Factories Act):
- Annual Leave with Wages: 1 day per 20 worked days → ~12-15 days/year
- Encashment at 50% if not availed `[VERIFY]`
- Casual leave / Sick leave: per state Factories Rules

White-collar (Shops & Establishments per state):
- Mostly higher: 21-30 days EL
- CL: 7-12 days
- SL: 7-12 days
- Ranges per state

### Maternity (universal)

Maternity Benefit Act 1961 (amended 2017): 26 weeks paid for women across both categories. 100+ employee establishments must provide creche `[VERIFY threshold]`.

### Privilege leave / Earned leave

White-collar: typical 21 days/year, accrual rate 1.75/month (or front-loaded annual).

Blue-collar: Factories Act formula (1 day per 20 worked) for adults; 1 per 15 worked for child workers (if any).

## Statutory filing differences

### Bonus Act

Both categories below ₹21,000 monthly wage are eligible. Bonus = 8.33% to 20% of (annual basic + DA), subject to ₹7,000 ceiling for calculation `[VERIFY current notification]`.

White-collar above ₹21k: not eligible by statute, but many companies pay anyway as policy.

### Gratuity

Both eligible after 5 years (death/disablement waives 5-year rule).

Formula slightly different for piece-rated:
- Standard: (15 days × last drawn (Basic+DA) ÷ 26) × completed years
- Piece-rated: average of 3 months' wages used

### Factories Act compliance (only for factories)

Specific to factories:
- Form 1: Notice for occupation
- Form 11: Health register
- Form 21: Annual return
- Form 22: Half-yearly return
- Form 25-26: Worker register
- Accident notification (Form 18)

Detailed in /04-compliance/10-factories-act.md (Phase 3).

### CLRA compliance (only for principal employer with contract labour)

- Form V (license)
- Form XII (half-yearly return)
- Form XIII (wage register for contract labour)

Detailed in /04-compliance/09-clra-contract-labour.md (Phase 3).

## ESS differences (preview for /07-ess-mobile/)

### Login

White-collar: email + password + MFA.

Blue-collar:
- Phone OTP (SMS-based)
- Aadhaar-based login (with employee consent)
- Kiosk login: card + 4-digit PIN
- WhatsApp bot (basic queries: leave balance, payslip, attendance)

### UI complexity

White-collar: full-featured dashboard with all features.

Blue-collar: simplified UI, large fonts, regional language, voice prompts (v2 / v3).

### Communication

White-collar: email primary, WhatsApp secondary.

Blue-collar: WhatsApp / SMS / IVR / supervisor relay.

### Documents

White-collar: PDF download, view in app.

Blue-collar: PDF download, but many can't navigate; supervisor distributes printed copies as needed.

## Compensation review cadence

White-collar: annual cycle (April or January).

Blue-collar:
- Annual increment per company policy
- Statutory minimum wage hikes (states notify periodically) — automatic upward revision
- Skill-level promotion (e.g., apprentice → semi-skilled → skilled) → revision

The spec must support **statutory minimum wage automatic revision**: when a state's minimum wage notification updates, all blue-collar employees in that state below the new minimum get auto-flagged for revision (with HR approval before applying).

## Performance management differences (preview for /06-performance/)

White-collar: KPI / OKR / 360 review cycles, calibration, 9-box.

Blue-collar:
- Productivity metrics (units produced, quality)
- Attendance / punctuality
- Safety record
- Skill certifications progressed
- Foreman / supervisor evaluations

Different review frameworks; both supported.

## Health & safety (specific to blue-collar)

`[BLUE-COLLAR]` Specific tracking:

```typescript
// In EmploymentRecord
hsTraining?: {
  inductionCompletedOn?: Date;
  fireSafetyCertExpiry?: Date;
  hazmatCertExpiry?: Date;
  firstAidCertExpiry?: Date;
};

medicalCertificates?: {
  fitToWorkExpiry?: Date;        // periodic; mandatory for some industries
  occupationalHealthCheckExpiry?: Date;
};

incidentHistory?: {
  workplaceInjuriesCount: number;
  lostTimeInjuriesCount: number;
  lastSafetyIncidentDate?: Date;
};
```

Detailed in `/04-compliance/10-factories-act.md` (Phase 3) and OSH Code 2020.

## Summary matrix

A quick reference for downstream module specs:

| Module | White-collar | Blue-collar |
|---|---|---|
| Employee master | Same schema, `category` flag | Same schema, additional fields conditionally populated |
| Employment record | Standard | Includes shift, roster, CLRA details |
| Compensation | CTC + components | Wage rate / piece rate; statutory adders prominent |
| Attendance | Web/mobile, geo | Biometric / RFID; punch-based; registers |
| Leave | Privilege + casual + sick | Factories Act / state Shops Act minimums |
| Payroll | Monthly, complex tax | Monthly/weekly/daily, simpler tax (often below threshold) |
| PF/ESI | Standard | Standard, but more frequent inter-employer movement |
| Bonus | Often not eligible | Statutory Bonus Act |
| Gratuity | Standard | Piece-rated formula variation |
| Standing Orders | N/A typically | Required if 100+ workmen |
| ESS | Full app | Simplified, multi-channel |
| Performance | KPI/OKR/360 | Productivity, attendance, safety |
| Compliance filings | Shops & Estab | Factories + CLRA + state |

## Mixed tenants

A tenant with both types (e.g., manufacturing company with factory + corporate office):

- `Employee.category` per-employee
- Different EmploymentRecords have different defaults
- Different SalaryStructures by category
- Different attendance methods
- Different reports
- Different statutory filings (factory has both ECRs, white-collar has only EPF/ESI)

`Tenant.primarySegment` flag indicates which is primary; UI defaults adjust.

## Cross-references

- See [01-employee-master-schema.md](./01-employee-master-schema.md) for the unified Employee schema
- See [02-employment-record.md](./02-employment-record.md) for EmploymentRecord with both types
- See [03-compensation-record.md](./03-compensation-record.md) for compensation differences
- See [/02-attendance/](../02-attendance/) (Phase 2) for attendance method differences
- See [/03-payroll/](../03-payroll/) (Phase 3) for payroll cycle differences
- See [/04-compliance/09-clra-contract-labour.md](../04-compliance/09-clra-contract-labour.md) (Phase 3) for CLRA
- See [/04-compliance/10-factories-act.md](../04-compliance/10-factories-act.md) (Phase 3) for Factories Act
- See [/07-ess-mobile/](../07-ess-mobile/) (Phase 4) for ESS UX differences
