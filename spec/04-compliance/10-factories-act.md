# 10 — Factories Act

## Purpose

Factories Act 1948 + state Factories Rules govern occupational safety, health, and welfare in manufacturing establishments. Subsumed under OSH Code 2020 § 1-13 + Chapter II onwards.

The HRMS supports factories' compliance — registers, returns, inspector mode. Computational concerns (working hours, OT, leave) covered in attendance and payroll modules; this file focuses on Factories Act-specific outputs.

## Applicability

A "factory" is any premises:
- Where 10+ workers (with power) OR 20+ workers (without power) are employed on any day in 12 months preceding `[VERIFY]`
- Where manufacturing process is carried on

Excluded: mines (Mines Act), shops/establishments (Shops Act), railways, etc.

## Registration

### Form 1 — Application for registration / license

PE files with state Chief Inspector of Factories. Includes:
- Factory location
- Manufacturing process
- Power, machinery
- Number of workers (planned)

License issued; renewable annually or 5-yearly.

### Form 2 — Notice of occupation / change

Filed by occupier (the person responsible for management) on:
- Commencement
- Change of occupier
- Closure

The HRMS stores tenant's factory registration; tracks renewal calendar.

## Key statutory limits

| Aspect | Limit | Section |
|---|---|---|
| Daily working hours | 9 | § 54 |
| Weekly working hours | 48 | § 51 |
| Spread-over | 10.5 hours | § 56 |
| Rest interval | 30 min after 5 hrs continuous work | § 55 |
| Weekly off | 1 day per week | § 52 |
| OT pay | 2× ordinary rate | § 59 |
| OT cap quarterly | 50 hours | § 64 |
| Annual leave | 1 day per 20 worked | § 79 |
| Female workers night shift | Restricted | § 66 |
| Child labour | Prohibited (post-2017 amendment of Child Labour Act) | |
| Adolescent labour (15-18) | Restricted hours | § 71 |

These flow into attendance, OT, leave engines (already covered).

## Statutory registers under Factories Act

| Form | Title | Purpose |
|---|---|---|
| Form 1 | License application | Registration |
| Form 2 | Notice of occupation | Occupier change |
| Form 3 | Display of factory plan | Layout |
| Form 4 | Notice of period of work | Posted; weekly schedule |
| Form 5 | Register of compensatory holidays | Comp-off tracking |
| Form 6 | Permission for OT exceeding | State approval |
| Form 7 | Notice of starting work in adolescent department | If applicable |
| Form 8 | Certificate of fitness for adolescent | Medical |
| Form 9 | Notice of periods of work for adults | Posted |
| Form 10 | Notice of periods of work for adolescents | Posted |
| Form 11 | Register of leave with wages for adults | Continuous |
| Form 12 | Register of leave with wages for adolescents | Continuous |
| Form 13 | Health register | Per worker |
| Form 14 | Adolescents register | If applicable |
| Form 15 | Half-yearly return | Filed |
| Form 16 | Notice of dangerous occurrence | Safety |
| Form 17 | Special return | If notified |
| Form 18 | Report of accident | Within 4 hours of fatal; 12 hours of others |
| Form 19 | Report of disease | If notified disease |
| Form 20 | Combined register-cum-card for adults | |
| Form 21 | Register of tools and equipment | |
| Form 22 | Register of inspections | |
| Form 23 | Register of leave records (consolidated) | |
| Form 25 | Register of adult workers | Continuous (key) |
| Form 26 | Register of child workers | Continuous (rare; post-CL prohibition) |
| Form 27 | Register of leave with wages | Form 11 v2 |
| Form 28 | Notice of departure | Worker leaving |
| Form 29 | Combined attendance register | All-in-one |
| Form 30 | Annual return | Filed |
| Form D | Annual factory return | Filed |
| Form E | Half-yearly return | Filed |

`[VERIFY]` State Factories Rules have specific form numbers; may differ slightly from central. Check state.

## Form D — Annual Factory Return

The "main" annual return. Filed by January 31 each year for prior calendar year `[VERIFY]`.

Contents:
- Factory details (license, location)
- Workforce: max in any month, average daily
- Man-days worked
- Accident statistics
- Health statistics
- Welfare amenities
- Production / capacity (depends on industry)

The HRMS auto-generates from PayrollLines + DailyAttendance + accident data.

## Form 25 — Adult Worker Register

Continuous register; each adult worker entry includes:
- Name, age
- Gender
- Father / spouse name
- Date of joining
- Department / category
- Address
- Group classification under § 61 (relays / shifts)

The HRMS maintains live state; produces printable Form 25 on demand.

## Accident reporting

### Form 18 — Notice of accident

Per § 88: occurrence to be reported to Inspector within:
- 4 hours of any fatal accident
- 12 hours of any accident causing more than 48 hours absence

Categories:
- Death
- Disability (temporary / permanent)
- Disease (occupational)
- Dangerous occurrence (no injury but could have)

```typescript
interface FactoriesActAccident extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  
  accidentCode: string;                    // 'ACC-2026-04-001'
  
  // type
  category: 'fatal' | 'serious' | 'minor' | 'occupational-disease' | 'dangerous-occurrence';
  
  // event
  occurredAt: Date;
  occurredAtLocationDescription: string;
  
  // affected workers
  affectedWorkers: Array<{
    employeeId: ObjectId;
    injuryType: string;
    injurySeverity: 'minor' | 'temporary-disability' | 'permanent-disability' | 'death';
    daysOfAbsence?: number;
    medicalAttention: boolean;
    hospitalization: boolean;
  }>;
  
  // cause
  apparentCause: string;
  contributingFactors: string[];
  
  // reporting
  reportedToInspectorAt?: Date;
  inspectorReportNumber?: string;
  form18FiledAt?: Date;
  form18DocumentId?: ObjectId;
  
  // investigation
  internalInvestigationConducted: boolean;
  rootCauseAnalysisDocumentId?: ObjectId;
  correctiveActions: string[];
  
  // ESI claim (if applicable)
  esicClaimFiled: boolean;
  esicClaimReference?: string;
  
  // workmen's compensation (if applicable)
  workmensCompensationApplicable: boolean;
  compensationAmount?: Decimal128;
  compensationPaidAt?: Date;
  
  // status
  status: 'reported' | 'under-investigation' | 'closed' | 'dispute';
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
  isDeleted: boolean;
}
```

Late reporting: penalty under § 92.

## Workmen's Compensation

Per Workmen's Compensation Act 1923 (now Employees' Compensation Act, post-2010 amendment):

- Employer liable for compensation on:
  - Injury / disability arising out of employment
  - Occupational disease
  - Death

Compensation amounts per Schedule IV of Act.

`[BLUE-COLLAR]` Critical for factory operations. Insurance (Workmen's Compensation Policy) typically covers.

The HRMS:
- Tracks insurance policy
- Computes statutory compensation
- Files claim with insurer

## Female workers (§ 66, § 87)

§ 66: women not employed in night shift (between 10pm-5am traditionally).

Post-2017 amendment + state notifications: female night shift permitted with safety conditions:
- Transportation
- Adequate security
- Washroom facilities
- Voluntary (not coerced)
- Group of 4+ at any night-shift batch

The HRMS:
- Roster engine respects state-specific rules
- Block / warn for female roster in night shift
- Tenant must declare safety arrangement to override

## Health, Safety, Welfare

### Health (§ 11-20)
- Cleanliness, ventilation, temperature, lighting
- Drinking water
- Latrines
- Spittoons

### Safety (§ 21-41)
- Fencing of machinery
- Hoists, lifts safety
- Pressure plant safety
- Fire safety
- Personal protective equipment (PPE)

### Welfare (§ 42-50)
- Washing facilities
- Storing / drying clothes
- Sitting facilities for sedentary work
- First aid (1 box per 150 workers)
- Canteen (250+ workers)
- Shelters / restrooms / lunch rooms (150+ workers)
- Crèche (30+ women workers)
- Welfare officer (500+ workers)

The HRMS:
- Per-location compliance checklist
- Annual self-audit
- Inspector mode access

## Hazardous processes (Chapter IVA)

For factories with hazardous processes:
- Notification of hazard to Inspector
- Site appraisal committee
- Safety report / safety audit
- On-site emergency plan
- Safety committee

Out of HRMS core scope; tenant maintains externally; HRMS stores documents.

## Dangerous occurrences (§ 88A)

Per Schedule II of Factories Act, "dangerous occurrences" must be reported even if no injury:
- Bursting of pressure vessel
- Collapse of crane / lifting equipment
- Electrical short circuit
- Explosion
- Release of hazardous chemicals
- Etc.

Form 16 reporting.

## Health register (Form 13)

For hazardous-process factories, maintain Form 13 with workers' health examination records.

## Inspector mode

Factories Act inspector typically requests:
- Form D / Form 30 (annual return) — last 3 years
- Form 18 reports (last year)
- Form 25 register
- Form 11 (leave register)
- Form 9 (notice of work hours, posted)
- Wage registers (cross-check with attendance)
- Welfare facility evidence
- Safety committee minutes
- License (Form 4) current

Inspection pack assembles.

## Code on OSH transition

OSH Code 2020 § 1-13 + Chapter II covers occupational safety. Many provisions retained from Factories Act with simplifications.

`[VERIFY]` Form numbers under OSH Code state rules.

## Open questions

`[OPEN]` Continuous-process factories with state notification permitting 12-hour shifts: extensive state-specific. Recommend: tenant declares state notification on file.

`[OPEN]` Hazardous process compliance: deep technical area. Recommend: HRMS provides document storage + reminder calendar; not full automation.

`[OPEN]` Auto-detect dangerous occurrences from operational data (e.g., HR notes "near miss" → trigger Form 16)? Recommend: HR-initiated; system tracks.

`[OPEN]` Multi-factory under same tenant: separate license per factory. HRMS supports.

## Cross-references

- [/02-attendance/](../02-attendance/) — working hours, OT, leave
- [/02-attendance/05-overtime-engine.md](../02-attendance/05-overtime-engine.md) — Factories Act § 59 OT
- [/02-attendance/07-statutory-attendance-registers.md](../02-attendance/07-statutory-attendance-registers.md) — Form 25, Form 11
- [09-clra-contract-labour.md](./09-clra-contract-labour.md) — CLRA overlap
- [14-2026-labour-codes.md](./14-2026-labour-codes.md) — OSH Code transition
- [12-statutory-registers.md](./12-statutory-registers.md) — register catalog
