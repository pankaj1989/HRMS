# 09 — Contract Labour (Regulation & Abolition) Act

## Purpose

Contract Labour (Regulation & Abolition) Act 1970 + state Rules regulate engagement of contract workers via licensed contractors. Now subsumed under OSH Code 2020 § 51-66.

The HRMS supports principal employers (PE) tracking contract labour engaged through contractors. Many large factories, construction sites, hospitals, IT-BPO security/housekeeping etc. use contract labour extensively.

## Applicability

CLRA applies to:
- Establishments with 20+ contract workers on any day in 12 months preceding `[VERIFY]`
- Contractors engaging 20+ workers

Both PE and contractor have separate registration / license obligations.

## PE responsibilities

- Register establishment with state Labour Commissioner (Form I)
- Maintain register of contractors (Form XII)
- Ensure contractor pays statutory wages
- Provide canteen, restroom, drinking water (if 100+ workers)
- Joint liability for contractor's defaults (employer of last resort)

## Contractor responsibilities

- Hold valid license under CLRA
- Maintain register of workmen (Form XIII)
- Maintain wage register (Form XVII)
- Maintain muster roll (Form XX)
- Pay statutory wages including bonus, leave, gratuity
- File half-yearly returns to PE

## Schema

```typescript
interface ContractorEngagement extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  
  // contractor details
  contractorName: string;
  contractorAddress: string;
  contractorPan: string;
  contractorGstin?: string;
  
  // CLRA license
  cluaLicenseNumber: string;
  licenseValidFrom: string;
  licenseValidTo: string;
  licenseDocumentId: ObjectId;
  
  // engagement
  engagementStartDate: string;
  engagementEndDate?: string;
  workNature: string;                      // 'security' | 'housekeeping' | 'production-support' | etc.
  workDescription: string;
  
  // workers
  maxWorkersAllowed: number;               // per license
  currentActiveWorkers: number;
  
  // financial
  contractValue: Decimal128;
  paymentTerms: string;
  
  // statutory compliance tracking
  pfRegistrationNumber?: string;           // contractor's PF establishment code
  esiRegistrationNumber?: string;
  
  // performance
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
  isDeleted: boolean;
}

interface ContractWorker extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  contractorEngagementId: ObjectId;
  
  // identity
  workerCode: string;                      // contractor's code or generated
  fullName: string;
  fatherOrSpouseName: string;
  dob?: string;
  gender: 'male' | 'female' | 'other';
  
  // work
  designation: string;
  joinedOn: string;
  separatedOn?: string;
  
  // wages (per CLRA: minimum wages applicable)
  monthlyWageDeclared: Decimal128;
  
  // statutory
  pfMemberNumber?: string;
  esiInsuranceNumber?: string;
  uan?: string;
  
  // attendance integration (if HRMS-tracked)
  isAttendanceTrackedInHrms: boolean;
  
  // documents
  idProofDocumentId?: ObjectId;
  
  // status
  status: 'active' | 'separated';
  
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}
```

## CLRA Forms

| Form | Purpose | Filed by |
|---|---|---|
| Form I | PE registration application | PE |
| Form II | License application | Contractor |
| Form III | Surety form | Contractor |
| Form IV | License | issued |
| Form V | Renewal of license | Contractor |
| Form VI | Information about progress | Contractor |
| Form VIA | Half-yearly return | Contractor |
| Form VIB | Notice of commencement / termination of contract | Contractor → PE → Labour Commissioner |
| Form XII | Register of contractors | PE |
| Form XIII | Register of workmen by each contractor | Contractor |
| Form XIV | Service certificate | Contractor (to worker on separation) |
| Form XV | Hours of work and rest interval notice | Contractor |
| Form XVI | Display of working hours | Contractor |
| Form XVII | Wage register | Contractor |
| Form XVIII | Wage slip (per worker per pay) | Contractor |
| Form XIX | Receipt of wage payment | Contractor (signed by worker) |
| Form XX | Muster roll | Contractor |
| Form XXI | Register of advances | Contractor |
| Form XXII | Register of deductions for damage | Contractor |
| Form XXIII | Register of fines | Contractor |
| Form XXIV | Register of overtime | Contractor |
| Form XXV | Annual return by PE | PE |

The HRMS supports tenants who are PEs:
- Form I (registration) on file
- Form XII (register of contractors) auto-maintained
- Form XXV (annual return) generated from data
- Tracks contractor's submissions

## Form XXV — PE Annual Return

Filed within 15 February each year for prior calendar year.

Contents:
- PE details
- Each contractor: name, license, period engaged
- Number of contract workers per contractor per month
- Wages disbursed (aggregate)
- Welfare amenities provided
- Compliance status

Auto-generated from `ContractorEngagement` + `ContractWorker` records.

## Wage compliance

Critical: PE is liable if contractor fails to pay minimum wages. Per § 21(4) of CLRA:

> If the contractor fails to make payment of wages within the prescribed period or makes short payment, then the principal employer shall be liable to make payment of wages in full or unpaid balance due to the contract labour.

The HRMS:
- Tracks contractor's wage register (Form XVII)
- Compares contractor wages to statutory minimum wage for state + industry
- Alerts PE if contractor under-paid
- Audit trail for compliance

## ESI / PF for contract workers

Per CLRA Rules:
- If contractor doesn't have own PF/ESI registration: PE registers as principal employer for them
- Otherwise: contractor handles own statutory deposits
- PE responsible if contractor defaults

The HRMS tracks contractor's PF/ESI codes; flags missing.

## Welfare amenities (§ 16-19)

For establishments with contract workers:

| Facility | Threshold |
|---|---|
| Canteen | 100+ contract workers |
| Restrooms / urinals | All |
| Drinking water | All |
| Latrines / urinals | All |
| First aid box | All |
| Crèche (for women workers' children < 6) | All women contract workers' children |

The HRMS:
- Tracks facility provision per location
- Audit log for compliance
- Inspection pack includes

## Code on OSH transition

OSH Code 2020 § 51-66 supersedes CLRA. Key changes:

- Threshold for PE registration may change `[VERIFY]`
- Contractor license: simpler online process
- Penalties revised
- Form numbers may differ

`[VERIFY]` State-level rules under OSH Code being notified through 2026.

## Reports

- **Contractor Engagement Summary**: active engagements, expiry alerts
- **Contract Worker Headcount**: per contractor per month
- **Wage Compliance**: contractor wages vs statutory minimum
- **Form XXV Drafts**: ready for filing
- **Welfare Facility Audit**: per location

## Inspector mode

Labour inspector for CLRA / OSH typically requests:
- PE registration certificate
- All contractor licenses (current)
- Form XII register
- Form XVII wage registers (contractor-by-contractor)
- Form XX muster rolls
- Form XXV annual returns
- Welfare facility evidence (canteen pictures, water analysis)

## Open questions

`[OPEN]` Direct integration with contractor's HRMS (rare; most contractors have basic / no systems). Recommend: CSV import from contractor; standardized template.

`[OPEN]` PE liability extent: how far should HRMS automate compliance tracking? Recommend: track + alert; not enforce contractor (out of HRMS scope).

`[OPEN]` Migrating existing PE-contractor relationships at HRMS onboarding. Bulk import. Recommend: dedicated wizard.

`[OPEN]` OSH Code transition: parallel maintenance of CLRA + OSH formats during 2026 transition. Recommend: rule engine versions.

## Cross-references

- [/00-foundations/02-multi-entity.md](../00-foundations/02-multi-entity.md) — entity context for PE
- [/01-employee/08-white-vs-blue-collar-differences.md](../01-employee/08-white-vs-blue-collar-differences.md) — contract labour category
- [10-factories-act.md](./10-factories-act.md) — Factories Act overlap
- [14-2026-labour-codes.md](./14-2026-labour-codes.md) — OSH Code transition
- [12-statutory-registers.md](./12-statutory-registers.md) — register catalog
