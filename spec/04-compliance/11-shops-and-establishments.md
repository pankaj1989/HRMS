# 11 — Shops & Establishments Acts

## Purpose

Each state has its own Shops & Establishments Act. Governs working conditions for employees in shops and commercial establishments (non-factory). Most white-collar offices fall under Shops Act, not Factories Act.

This file provides overview; per-state specifics are extensive and stored as state-specific rules in the rules engine.

## Concept

Shops & Establishments Acts regulate:

- Hours of work
- Weekly off / holidays
- Leave
- Wages payment
- Employment of women, children, young persons
- Conditions of employment
- Registration
- Inspection

Each state has its own Act and Rules. They share common themes but differ significantly in specifics.

## Coverage

A "shop" or "commercial establishment" includes:
- Offices (corporate, professional)
- Restaurants, hotels
- Retail outlets
- Cinema theatres
- Storage / warehouses
- Service centres

Not covered: factories (under Factories Act), railways, mines, etc.

Threshold for applicability varies by state — typically 1+ employees (essentially all commercial establishments).

## Registration

Under each state's Act, tenant must register each commercial establishment (per location) with the Labour Department.

```typescript
interface ShopsEstablishmentRegistration extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  
  state: StateCode;
  city?: string;
  district?: string;
  
  shopActApplicable: boolean;
  registrationNumber: string;
  registrationDate: Date;
  
  // license validity
  licenseValidFrom: string;
  licenseValidTo: string;                  // typically 1-5 years; renewable
  renewalReminderDate?: string;
  
  // establishment details
  establishmentType: 'office' | 'shop' | 'restaurant' | 'hotel' | 'cinema' | 'warehouse' | 'service' | 'other';
  natureOfBusiness: string;
  
  // numbers
  registeredEmployeeCount: number;
  
  // statutory IDs
  formIIIRefenence?: string;               // Maharashtra
  
  // documents
  registrationCertificateDocumentId: ObjectId;
  
  // status
  status: 'active' | 'expired' | 'pending-renewal' | 'cancelled';
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
  isDeleted: boolean;
}
```

## Per-state specifics (overview)

### Maharashtra Shops & Estab Act 2017 (replaced 1948 Act)

- Online registration: Mahashramm portal
- Working hours: 9 hrs/day, 48 hrs/week (similar to Factories Act)
- Weekly off: 1 day per week
- EL: 18 days/year (Mumbai) `[VERIFY current]`
- CL: included in EL (some interpretations) — actually Maharashtra clubs them
- Maternity benefits: per MB Act
- Notice period: as per appointment letter

### Karnataka Shops & Estab Act 1961

- Working hours: 9/day, 48/week
- Weekly off: 1 day
- EL: 18 days/year
- CL: 12 days/year
- SL: 12 days/year `[VERIFY]`

### Tamil Nadu Shops & Estab Act 1947

- Working hours: 8/day for shops, 9/day for commercial estabs
- Weekly off: 1 day
- EL: 12 days/year for shops; 12 days/year for commercial estabs `[VERIFY]`
- Notice for closure: 60 days

### Delhi Shops & Estab Act 1954

- Working hours: 9/day, 48/week
- Spread-over: 12 hrs
- Weekly off: 1 day
- EL: 15 days/year
- CL: 12 days/year `[VERIFY]`

### Other states: similar variations

`[VERIFY]` All state Acts have been amended over time. Some states have new Acts (Karnataka 2014 amendment, Maharashtra 2017 Act).

## Forms

Each state has its own forms. Common categories:

| Category | Form (varies by state) |
|---|---|
| Registration application | Form A / I / Form II |
| Registration certificate | Form B / III / IV |
| Renewal | Form D / V |
| Notice of change | Form C / VI |
| Wage register | Per state |
| Leave register | Per state |
| Annual return | Per state |
| Closure | Per state |

Maharashtra examples: Form A (registration), Form III (wage register), Form J (annual return).

## Hours of work

State-specific limits, often:
- Daily: 9 hours
- Weekly: 48 hours
- Spread-over: 12 hours (some states)
- Rest after 5 hours continuous work: 30 mins
- OT: rare in Shops Act context (most are exempt or self-managed); when applicable, similar rate as Factories Act

`[WHITE-COLLAR]` Most office workers' hours not strictly enforced; informal flexibility.

## Leave

State-specific. The HRMS leave engine resolves applicable state per employee.

## Maternity / paternity

Maternity per MB Act (overrides). Paternity: not in shops act; tenant policy.

## Annual return

Each state requires annual return to Labour Commissioner with:
- Number of employees (max in year, average)
- Leave summary
- Wage bill

The HRMS auto-generates state-specific format from PayrollLines.

## Closure / change

Per state Act, must notify labour authority of:
- Change of address
- Change of nature of business
- Closure (with timeline; typically 30-60 days notice)

## Compliance approach in HRMS

The HRMS:

- Tracks Shops Act registration per entity-location
- Renewal calendar
- Per-state rules engine resolution for leave / hours
- Annual return generation
- Inspector mode access

For multi-state tenant: per-state separate registration + filings.

## Maharashtra: Online compliance via Mahashramm

Maharashtra is most digitized. Mahashramm portal:
- Online registration
- Online return filing
- Online inspector visit scheduling
- Digital records

The HRMS `[v2]` integration with Mahashramm API (when available).

## Open questions

`[OPEN]` Maintaining per-state rules accuracy: significant operational burden. Recommend: dedicated state-rule update process; quarterly review per major state.

`[OPEN]` Auto-renewal of registrations: HRMS reminds, tenant files. v2: API integration for top 3 states.

`[OPEN]` Multi-location single-state tenant: each location separate registration or umbrella? Per state — most: separate per location. Recommend: HRMS supports per-location.

`[OPEN]` Shops Act vs Factories Act for hybrid establishments (e.g., factory office + factory floor): factory floor under Factories Act; office under Shops Act. Tenant declares which Act applies per worker. Recommend: tenant config per employee group.

## Cross-references

- [/00-foundations/02-multi-entity.md](../00-foundations/02-multi-entity.md) — entity context
- [/01-employee/](../01-employee/) — employee context for Shops Act applicability
- [/02-attendance/03-leave-types-and-policies.md](../02-attendance/03-leave-types-and-policies.md) — leave per state
- [10-factories-act.md](./10-factories-act.md) — Factories Act distinction
- [12-statutory-registers.md](./12-statutory-registers.md) — register catalog
- [15-statutory-deadlines-calendar.md](./15-statutory-deadlines-calendar.md) — annual return deadlines
