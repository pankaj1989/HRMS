# 07 — Gratuity Act (Compliance)

## Purpose

Statutory references, forms, and compliance details for Payment of Gratuity Act 1972 / Code on Social Security 2020 § 53-58. Computation logic in [/03-payroll/08-gratuity-calculation.md](../03-payroll/08-gratuity-calculation.md); this file focuses on forms, registers, nomination, registration.

## Statutory citations

| Section | Provision |
|---|---|
| § 1(3) | Applicability (factory/mine + 10+ employees in shop) |
| § 2A | Continuous service definition |
| § 4 | Payment of gratuity |
| § 4(2) | Formula (15 days × years × wages/26) |
| § 4(3) | Cap on gratuity (statutory ₹20L now) |
| § 4(6) | Forfeiture grounds |
| § 6 | Nomination |
| § 7 | Determination, payment within 30 days |
| § 7(3A) | Interest on delayed payment (10%) |
| § 8 | Recovery of gratuity |
| § 9 | Penalties |

## Forms (Payment of Gratuity Rules 1972)

| Form | Purpose | Filed by |
|---|---|---|
| Form A | Notice of opening (employer registration) | Employer (within 30 days of Act becoming applicable) |
| Form B | Notice of change (in particulars) | Employer |
| Form C | Notice of closure | Employer |
| Form D | Notice for excluding husband from family | Employee (rare) |
| Form E | Notice withdrawing exclusion | Employee |
| Form F | Nomination | Employee |
| Form G | Fresh nomination | Employee (when previous becomes invalid) |
| Form H | Modification of nomination | Employee |
| Form I | Application for gratuity by employee | Employee |
| Form J | Application for gratuity by nominee | Nominee (death cases) |
| Form K | Application for gratuity by legal heir | Legal heir |
| Form L | Notice for payment of gratuity | Employer |
| Form M | Notice rejecting claim for payment | Employer |
| Form N | Application by employee/nominee for direction | Controlling authority |
| Form O | Notice for appearance before controlling authority | |
| Form P | Summons | Authority |
| Form Q | Particulars of application | |
| Form R | Notice for payment of gratuity | Authority |
| Form S | Notice for payment of gratuity (after appeal) | Authority |
| Form T | Application for recovery | |
| Form U | Abstract of Act and Rules (display in establishment) | Employer |

The HRMS provides templates for all forms; auto-fills from data.

## Form F — Nomination (most important)

Every employee files Form F at joining. Allows employee to nominate dependents who'll receive gratuity if employee dies.

Required:
- Employee details (name, address, designation)
- Nominees: name, relationship, age, share %
- Sum of shares = 100%
- Witnesses

Validity:
- Submitted in duplicate at joining
- Employer keeps original; employee keeps copy with employer's stamp
- Modifications via Form H

The HRMS:
- ESS form for Form F
- Updates allowed via Form H workflow
- Audit trail of all nomination changes

```typescript
interface GratuityNomination extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  employeeId: ObjectId;
  
  formType: 'F' | 'G' | 'H';               // initial / fresh / modification
  versionNumber: number;
  
  nominees: Array<{
    name: string;
    relationship: 'spouse' | 'son' | 'daughter' | 'father' | 'mother' | 'brother' | 'sister' | 'other';
    relationshipDescription?: string;
    age: number;
    addressId?: ObjectId;
    sharePercentage: number;
    isMinor: boolean;
    guardianName?: string;                 // if minor
    guardianRelationship?: string;
  }>;
  
  totalSharePct: number;                   // must = 100
  
  // witnesses
  witness1Name: string;
  witness1Address: string;
  witness2Name: string;
  witness2Address: string;
  
  signedAt: Date;
  signedBy: ObjectId;                      // employee
  
  // employer side
  receivedByEmployer: boolean;
  receivedAt?: Date;
  receivedBy?: ObjectId;
  acknowledgedToEmployee: boolean;
  
  // status
  isCurrent: boolean;
  supersededByNominationId?: ObjectId;
  
  // documents
  signedFormDocumentId?: ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}
```

`[BLUE-COLLAR]` Nomination is critical for blue-collar workers — many die with unwritten succession plans, leaving family in disputes.

## Form L — Notice of Payment

Issued by employer when gratuity payment is determined.

Contents:
- Employee/nominee details
- Period of service
- Last drawn wages
- Computed gratuity amount
- Date of payment
- Mode of payment

Issued in duplicate; one to employee/nominee, one retained.

The HRMS auto-generates Form L on F&F gratuity payment.

## Form M — Notice of Rejection

If employer believes claim isn't payable (e.g., < 5 years service, forfeiture for misconduct), Form M issued with reasons.

Employee can appeal to Controlling Authority (Labour Commissioner).

## Form U — Abstract Display

Mandatory display in workplace:
- Notice in English + local language
- Highlights of Act + Rules
- Posted at conspicuous places (gate, notice boards)

The HRMS provides standard Form U PDF; tenant prints + displays. Posting evidence required during inspection.

## Establishment registration

### Form A — Notice of opening

Filed within 30 days of Act becoming applicable to establishment. With Controlling Authority of state.

Required:
- Employer details
- Establishment details
- Number of employees (5+, 10+, 15+ buckets)
- Date of operation

### Form B — Notice of change

Filed within 30 days of any change:
- Address
- Owner / occupier
- Significant facts

### Form C — Notice of closure

If establishment closes, file within 60 days. Settle gratuity for all employees.

## Controlling Authority

Each state designates a Controlling Authority (typically Labour Commissioner / Labour Welfare Commissioner). Disputes go here.

The HRMS:
- Stores tenant's controlling authority per entity location
- Surfaces appeal mechanism if dispute

## Group gratuity insurance

Per § 4A (inserted 1987), employer can opt for group insurance scheme:

- LIC's Group Gratuity Plan
- Other insurers (HDFC Life, ICICI Pru, Bajaj Allianz, etc.)
- Premium based on actuarial valuation
- On employee separation: insurer pays gratuity directly

If insurance: employer's books reflect insurance premium; not direct provisioning.

The HRMS:
- Stores insurance scheme details
- Per-period actuarial premium recorded
- F&F triggers insurer notification (manual or API)

## Compulsory insurance (§ 4A)

Some states have notified mandatory group gratuity insurance for establishments above certain employee count `[VERIFY current notifications]`.

Tenants must have either:
- Direct provisioning (with adequate corpus)
- Insurance scheme
- Approved gratuity fund

The HRMS prompts tenant to declare arrangement.

## Penalties (§ 9)

- False statement / failure to comply: imprisonment up to 6 months OR fine ₹10,000-20,000 OR both
- Continuing offence: per-day fine

`[VERIFY]` Code on SS 2020 may have revised penalties.

## Worker classification

Different categories under Act:
- **Adult employees**: standard 5-year rule
- **Minor employees**: similar treatment (though hiring of minors under 14 is generally prohibited)

`[BLUE-COLLAR]` Most blue-collar gratuity disputes involve fixed-term contract workers; SS Code 2020 § 53(2) extends gratuity to fixed-term employees pro-rata.

## Gig workers under SS Code

Code on Social Security 2020 introduces gratuity-like benefits for gig and platform workers via separate fund mechanism. `[VERIFY]` Implementation status.

## Inspector mode

Gratuity inspector / Controlling Authority typically requests:
- Notice of opening (Form A)
- Form U display proof
- Employee master with service durations
- Form F nominations file
- Forms L / M for past payments
- Audit of timeliness (30-day rule)

Inspection pack assembles.

## Open questions

`[OPEN]` SS Code 2020 implementation: § 53-58 supersedes Gratuity Act. Most provisions retained. Form formats may differ; verify state notifications.

`[OPEN]` Group insurance vs direct provisioning: tenant choice. Recommend: HRMS supports both; tenant declares.

`[OPEN]` Fixed-term contract gratuity (pro-rata under SS Code): exact computation per state notifications. CA review.

`[OPEN]` Inter-entity transfers: continuity of service for gratuity. Default: no (separate establishments). Tenant config.

## Cross-references

- [/03-payroll/08-gratuity-calculation.md](../03-payroll/08-gratuity-calculation.md) — gratuity formula
- [/03-payroll/09-fnf-settlement.md](../03-payroll/09-fnf-settlement.md) — F&F includes gratuity
- [/01-employee/01-employee-master-schema.md](../01-employee/01-employee-master-schema.md) — family for nomination
- [12-statutory-registers.md](./12-statutory-registers.md) — register catalog
- [14-2026-labour-codes.md](./14-2026-labour-codes.md) — SS Code transition
