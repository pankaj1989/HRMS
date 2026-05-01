# 14 — 2026 Labour Codes Transition

## Purpose

The four central labour codes were enacted 2019-2020 and notified for implementation in November 2025. Most state-level rules are being notified through 2026. This is the most significant labour law overhaul in 70+ years. The HRMS must support both old (subsumed acts) and new (codes) for tenants in transition.

## The four codes

### Code on Wages 2019

**Subsumes**:
- Payment of Wages Act 1936
- Minimum Wages Act 1948
- Payment of Bonus Act 1965
- Equal Remuneration Act 1976

**Key provisions**:
- Universal definition of "wages" (§ 2(y))
- Minimum wage applicable to all workers (no industry-specific scheduling)
- 50% rule for excluded items
- Floor wage notified by Central Government
- Time-bound payment (per § 17): wages paid before 7th of next month for monthly wage period, before 2nd day for weekly period
- Bonus: 8.33-20% of wages, with calculation cap revised
- Equal remuneration without gender discrimination

### Industrial Relations Code 2020

**Subsumes**:
- Trade Unions Act 1926
- Industrial Employment (Standing Orders) Act 1946
- Industrial Disputes Act 1947

**Key provisions**:
- Standing Orders mandatory for establishments with 300+ workers (was 100 under old IE(SO) Act) — workers' easier termination
- Recognition of trade unions: 51% threshold for sole bargaining
- Strike notice: 60 days
- Negotiating union, negotiating council
- Grievance Redressal Committee
- Re-skilling fund

### Code on Social Security 2020

**Subsumes**:
- EPF & Misc. Provisions Act 1952
- ESI Act 1948
- Employees' Compensation Act 1923 (formerly Workmen's)
- Maternity Benefit Act 1961
- Payment of Gratuity Act 1972
- BOCW Welfare Cess Act 1996
- Unorganised Workers' Social Security Act 2008
- Cine Workers Welfare Fund Act 1981

**Key provisions**:
- Universal social security framework
- Gig and platform workers explicitly covered
- Unorganised workers' welfare
- Aadhaar-linked benefits
- Single registration
- Career and Skill Development Fund (1% of CSR for unorganised workers)

### Occupational Safety, Health & Working Conditions Code 2020

**Subsumes (13 acts)**:
- Factories Act 1948
- Mines Act 1952
- Dock Workers Act 1986
- BOCW Act 1996
- Plantation Labour Act 1951
- Contract Labour (R&A) Act 1970
- Inter-State Migrant Workmen Act 1979
- Working Journalists Act 1955
- Sales Promotion Employees Act 1976
- Cine Workers Act 1981
- Beedi & Cigar Workers Act 1966
- Motor Transport Workers Act 1961
- Building & Other Construction Workers (RoE&CoS) Act 1996

**Key provisions**:
- Single registration for inter-state operations
- Universal worker (under one umbrella)
- Audio-visual industry covered
- Migrant worker benefits enhanced (subsidized travel home, ration portability)
- 10+ workers in establishment for application (was 20 under Factories Act for non-power)
- Safety committee mandatory at 250+ workers (was 500+ under Factories Act)

## Implementation timeline

`[VERIFY]` Status as of FY 2026-27:

| Code | Central Govt Status | State Notifications |
|---|---|---|
| Code on Wages | Notified 2025 | Variable per state |
| IR Code | Notified 2025 | Variable |
| SS Code | Notified 2025 | Variable |
| OSH Code | Notified 2025 | Variable |

Each state must notify its own Rules under each Code. Many states have done so partially. The HRMS must support tenants in different states at different stages.

## What changes for HRMS

### Wages definition

Old (per various acts): different definitions per act. PF used § 2(b). Bonus used § 2(21). Etc.

New (Code on Wages § 2(y)):
- Wages = Basic + DA + Retaining Allowance
- Excluded: HRA, OT, conveyance, bonus, gratuity, etc.
- 50% rule

Impact: PF wage may increase for many employees → higher employer + employee contributions. The HRMS rule engine handles via versioned `pfWageBasis`.

### Minimum wage

Old: state-notified minimum wages per industry, schedule
New: floor wage by Central Govt + state-specific wage above floor

Impact: HRMS needs central floor wage as a baseline; state minimums layer on top.

### Working hours

Old: Factories Act 9/day, 48/week
New (OSH Code): 8/day, 48/week potentially (some interpretations)

`[VERIFY]` OSH Code working hour cap.

### OT

Old: Factories Act § 59 — 2× ordinary rate
New (Code on Wages § 14): ≥ 2× rate (states can prescribe higher)

### Standing Orders

Old: 100+ workers → Standing Orders required
New (IR Code): 300+ workers

Impact: many medium employers (100-299 workers) no longer need formal Standing Orders. Tenant config determines.

### Threshold for various

Many thresholds change. Examples:

| Provision | Old | New |
|---|---|---|
| Standing Orders | 100+ | 300+ |
| Safety Committee | 500+ (FA) | 250+ (OSH) |
| Welfare officer | 500+ | 250+ |
| Crèche (women) | 30+ women | 50+ employees (any gender; existing under MB Act) |
| Layoff / closure permission | 100+ | 300+ |

`[VERIFY]` Each threshold per current notification.

### Forms

Old: dozens of forms across 40+ acts
New: simplified form set per Code

`[VERIFY]` Form numbers under each Code.

## HRMS approach

### Rule engine versioning

The statutory rules engine (`/00-foundations/06`) versions every rule:

```typescript
{
  ruleKey: 'pf:central:default',
  versions: [
    { effectiveFrom: '1952-01-01', effectiveTo: '2025-11-15', payload: {/* old PF Act */} },
    { effectiveFrom: '2025-11-16', effectiveTo: null, payload: {/* SS Code provisions */} },
  ]
}
```

PayrollLines pin the version at run time. Old runs use old rules; new runs use new rules.

### Tenant choice

Some tenants will be aggressive in transitioning; others slow. The HRMS:
- Default: Use latest rules (Code-aligned)
- Override: tenant can pin to old rules until they receive specific clarity
- Per-state: rules apply per applicable state notification

### Forms transition

The HRMS:
- Maintains both old (subsumed act) and new (Code) form generators
- Tenant config determines which to produce
- Until state notifies, default to old (most cautious)

```typescript
interface FormGenerationConfig {
  tenantId: ObjectId;
  entityId: ObjectId;
  state: StateCode;
  
  formSet: 'pre-codes' | 'codes' | 'state-mixed';
  
  // override per form
  formOverrides?: { [formCode: string]: 'pre-codes' | 'codes' };
}
```

## Pre-Code → Code mapping (informational)

| Old form | Code | New equivalent |
|---|---|---|
| Form 5 / 10 (PF) | SS Code | New form `[VERIFY]` |
| Form 6A (PF) | SS Code | New form |
| ESI return | SS Code | New form |
| Form A (Bonus) | Wages Code | New form |
| Form C (Bonus) | Wages Code | New form |
| Form D (Bonus) | Wages Code | New form |
| Wage Register (POW Act) | Wages Code | Universal wage register |
| Form 25 (Factories) | OSH Code | Worker register |
| Form 11 (Factories) | OSH Code | Leave register |
| Form D (Factories) | OSH Code | Annual return |
| CLRA Forms | OSH Code | Simplified set |
| Form F (Gratuity) | SS Code | Nomination form |
| Form L (Gratuity) | SS Code | Payment notice |
| Form A (MB Act) | SS Code | Maternity claim form |

`[VERIFY]` Specific new form numbers under each Code's Rules. Many states still notifying.

## Standing Orders (IR Code)

For establishments newly required (300+ workers):

The HRMS:
- Tracks threshold (300+)
- Reminder when threshold crossed
- Standing Orders register with model SOs

Tenants below 300: optional. With 100-299 (old threshold), HRMS recommends voluntary SOs as good HR practice.

## Inter-state migrant workers (OSH Code)

Tenant operating across states with workers from one state employed in another:

- Worker registration as inter-state migrant worker
- Periodic medical, contract terms
- Travel allowance for going home (subsidized)
- Ration card portability assistance

The HRMS:
- Identify inter-state migrants from employee master (origin state vs work state)
- Track applicable benefits
- Generate compliance reports

## Gig and platform workers (SS Code)

- Aggregator employers must contribute to social security fund
- 1-2% of gig worker turnover (vary)
- Gig workers eligible for social security (after threshold contribution period)

`[VERIFY]` Implementation status. Several court cases pending.

The HRMS `[v2]`:
- Track gig workers (new category)
- Compute aggregator contribution
- Generate filing for Career & Skill Dev Fund

## Special transition concerns

### Existing employees with grandfathered terms

Employees hired under pre-Code regime: do their terms (e.g., longer notice period, higher gratuity entitlement) continue?

`[CA-REVIEW]` Generally, accrued rights protected. Going forward, Code applies. CA review per tenant's specific situation.

### Multi-state operations

Tenant in MH (Code Rules notified) and KA (still pre-Code): different rules apply.

The HRMS resolves per-state rule version per employee.

### Mid-period transitions

State notifies new rules effective Nov 1, 2026. April-Oct 2026 payrolls used old rules; Nov 2026 uses new.

The rule engine handles via `effectiveFrom` versioning. Each PayrollLine pins the rule version active at that period's date.

## Open questions

`[OPEN]` Customer messaging during transition: HRMS dashboard explains "your state has notified Code on X date; we've activated new rules. Click for details."

`[OPEN]` Specific Code-related impact analysis: HRMS could provide "what changes for you" report per tenant. Recommend: yes; high tenant value.

`[OPEN]` Pre-Code data preservation: existing wage history under old definitions retained for retrospective queries. Recommend: rule engine versioning handles.

`[OPEN]` Code interpretation ambiguities: many provisions unclear pending judicial guidance. Recommend: conservative default + tenant override for legal opinion.

`[OPEN]` Standing Orders: 300+ threshold newly applicable. HRMS provides model SOs; tenant adapts. Recommend: yes in v2.

## Cross-references

- [00-overview.md](./00-overview.md) — compliance overview
- [/00-foundations/06-statutory-rules-engine.md](../00-foundations/06-statutory-rules-engine.md) — rule versioning
- All other compliance files reference Code provisions where applicable
