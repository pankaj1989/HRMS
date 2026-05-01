# 04 — CA Review Checklist

## Purpose

Specific questions for the tenant's Chartered Accountant (CA) / Tax Partner before launching the HRMS. These are interpretation-heavy items where statutory text leaves room for opinion.

Distinguishes from `[VERIFY]` (which needs document confirmation) — `[CA-REVIEW]` needs professional opinion.

## How to use

1. Provide this document + relevant spec excerpts to CA
2. Get written opinion on each item
3. Document answer in `02-decision-log.md`
4. Lock spec accordingly

## Income Tax — Critical

### CR-CA-1 — IT Act 2025 transition

**Question**: For FY 2026-27 (Apr 1, 2026 onwards), are we computing TDS under the new IT Act 2025? What are the confirmed slabs?

**Why critical**: Drives entire TDS engine. Wrong answer = 1000s of incorrect Form 16s.

**Spec assumption**: New IT Act 2025 in force; slabs `[ASSUMED]` 0/4L/8L/12L/16L/20L/24L+ at 0/5/10/15/20/25/30%.

**Need from CA**: Confirmed slabs + standard deduction + rebate + surcharge thresholds.

### CR-CA-2 — Old regime retention

**Question**: Under IT Act 2025, is the old regime (with 80C / 80D / HRA exemptions) retained as opt-in?

**Why**: If retained, employees still need declaration form (Form 12BB). If phased out, drastically simpler.

**Spec assumption**: Old regime retained as opt-in; default to new.

**Need from CA**: Confirmation; if old regime modified, what changes?

### CR-CA-3 — Form 16 / 12BA / 24Q schema FY 26-27

**Question**: Are there structural changes to these forms under IT Act 2025?

**Why**: Generated forms must match TRACES schema or filing fails.

**Need from CA**: Latest TRACES schema specifications.

### CR-CA-4 — Surcharge cap under new regime

**Question**: Under new regime, is surcharge capped at 25% (vs 37% in old regime)?

**Spec assumption**: Cap at 25% under new regime.

**Need from CA**: Confirmed.

### CR-CA-5 — Section 87A rebate

**Question**: Rebate amount and threshold for FY 26-27.

**Spec assumption**: New regime: ₹25,000 rebate for income ≤ ₹12L. Old regime: ₹12,500 ≤ ₹5L.

**Need from CA**: Confirmed amounts.

## Income Tax — Methodology

### CA-6 — Regime selection timing

**Question**: When can employee switch tax regime? At FY start only, or mid-year allowed?

**Spec assumption**: At FY start; mid-year requires HR approval.

**Need from CA**: IT department guidance for FY 26-27.

### CA-7 — TDS averaging methodology

**Question**: For section 192, is average TDS computed on annualized projected income, or actual cumulative?

**Spec assumption**: Annualized projected; adjusted on declaration / proof submission.

**Need from CA**: Confirmation of acceptable methodology.

### CA-8 — Form 12BB declaration timing

**Question**: When must employee submit Form 12BB declaration?

**Spec assumption**: Within 30 days of FY start (April 30 typical).

**Need from CA**: Statutory deadline, if any.

### CA-9 — Investment proof submission window

**Question**: Last date for proof submission to claim exemptions in TDS?

**Spec assumption**: February 15 of FY (in time for last 2 months' TDS adjustment).

**Need from CA**: Tenant policy validation.

### CA-10 — HRA exemption calculation

**Question**: For HRA exemption u/s 10(13A), confirm formula:

```
HRA exempt = MIN(
  actual HRA received,
  rent paid - 10% of (basic + DA),
  50% of (basic + DA) [metro] / 40% [non-metro]
)
```

**Need from CA**: Confirmed.

### CA-11 — HRA without rent receipts

**Question**: Threshold below which rent receipts not needed (typically ₹3,000/month).

**Spec assumption**: ₹3,000/month threshold per CBDT.

**Need from CA**: Confirmation.

### CA-12 — Landlord PAN requirement

**Question**: Mandatory landlord PAN if annual rent > ₹1L.

**Spec assumption**: Yes, ₹1L threshold.

**Need from CA**: Confirmed.

### CA-13 — Perquisite valuations

**Question**: Confirm perquisite valuations:

- Rent-free accommodation (RFA)
- Concessional accommodation
- Company car (own / use of)
- Driver
- Phone / mobile
- ESOP exercise
- Loan at concessional rate
- Free meals
- Club membership
- Transport allowance (replaced by standard deduction)

**Need from CA**: Per Rule 3 / specific perq.

### CA-14 — Section 89(1) relief on arrears

**Question**: How is relief computed for arrears spanning multiple years?

**Spec assumption**: Standard Form 10E methodology.

**Need from CA**: Confirmation; HRMS supports if employee files.

## PF — Critical

### CR-CA-15 — PF wage basis tenant decision

**Question**: For this tenant, what is PF wage basis?

- Option A: `basic-da-only` — only basic + DA + (if applicable) retaining allowance
- Option B: `wage-code-broad` — broader interpretation per Code on Wages "wages" definition

**Why critical**: Wrong basis = under/over contribution; legal exposure.

**Spec default**: Tenant-config; default `basic-da-only` unless state has notified Wage Code Rules.

**Need from CA**: Tenant-specific recommendation.

### CR-CA-16 — Wage ceiling for PF coverage

**Question**: Continues at ₹15,000 OR raised to ₹21,000?

**Spec assumption**: ₹15,000 unless notified otherwise.

**Need from CA**: Latest EPFO position.

### CA-17 — Higher pension option

**Question**: For employees who exercised higher pension option (post Nov 2022 SC ruling), how is HRMS handling?

**Spec note**: Configuration per employee for higher pension; impact on EPS contribution.

**Need from CA**: Tenant-specific employee list and methodology.

### CA-18 — Voluntary PF (VPF)

**Question**: Employee VPF contribution beyond statutory 12% — IT exempt up to 12% over basic-DA?

**Spec assumption**: VPF allowed; IT treatment per current rules.

**Need from CA**: Latest IT treatment (post Finance Act 2021 cap on PF contributions).

## ESI

### CA-19 — ESI contribution rates

**Question**: Confirm Employee 0.75%, Employer 3.25%.

**Need from CA**: Latest ESIC notification.

### CA-20 — Wage definition for ESI

**Question**: Same as PF basis or different?

**Spec assumption**: Gross wages excluding statutory deductions and one-time payments.

**Need from CA**: Confirmation.

## Gratuity

### CR-CA-21 — Gratuity continuous service

**Question**: 5 years OR 4 years 240 days?

**Spec default**: 4 years 240 days (Madras HC line).

**Need from CA**: Tenant-jurisdictional view (state of registration / operations).

### CA-22 — Gratuity formula for variable wage

**Question**: For employees with variable wage, "last drawn basic + DA" — is this latest month, average of last 12 months, or other?

**Spec assumption**: Latest month basic + DA.

**Need from CA**: Confirmation.

### CA-23 — Gratuity exemption ceiling

**Question**: ₹20 lakh tax-exempt — does this hold for FY 26-27?

**Spec assumption**: Yes.

**Need from CA**: Latest CBDT notification.

### CA-24 — SS Code 2020 gratuity

**Question**: For fixed-term contract workers, pro-rata gratuity per SS Code § 53(2). Tenant has any fixed-term workers?

**Need from CA**: Audit + recommendation.

### CA-25 — Group gratuity insurance

**Question**: Does tenant have LIC group gratuity policy or self-funded? Implications on HRMS modeling.

**Need from CA**: Confirmation; HRMS supports both.

## Bonus

### CA-26 — Bonus Act applicability

**Question**: Tenant has 20+ employees? Bonus Act applies.

**Spec assumption**: Yes, applies.

**Need from CA**: Confirmation; loss-making years vs profit-making.

### CA-27 — Bonus wage ceiling

**Question**: ₹21,000 wage ceiling (per 2015 amendment) — confirms.

**Need from CA**: Confirmed.

### CA-28 — Bonus calculation cap

**Question**: For employees > ₹21,000 wage, bonus calculated on min(₹7,000, minimum wage).

**Spec assumption**: Yes.

**Need from CA**: State-specific minimum wage applicability.

### CA-29 — Bonus payable percentage

**Question**: Tenant's allocable surplus calculation; bonus % between 8.33% (min) and 20% (max).

**Need from CA**: Annual recommendation per company P&L.

## Wage Code

### CR-CA-30 — State Wage Code Rules notification

**Question**: For tenant's state(s) of operation — has Code on Wages Rules been notified?

**Spec note**: Drives transition decision (subsumed acts vs Code).

**Need from CA**: Per-state status.

### CA-31 — Minimum wage applicable

**Question**: For each state of operation, current minimum wage by skill category.

**Need from CA**: Per-state rates (CA tracks).

### CA-32 — "Wages" 50% rule

**Question**: Code on Wages mandates "wages" (basic + DA + retaining + allowances qualified) ≥ 50% of total remuneration.

**Spec note**: Tenant's salary structure compliance.

**Need from CA**: Audit existing structures; recommend changes.

## Other Statutory

### CA-33 — Maternity Benefit applicability

**Question**: Tenant has 10+ female employees / 50+ total employees?

**Spec note**: 10+ female: MB Act applies. 50+ total: crèche mandatory.

**Need from CA**: Confirmation + crèche compliance status.

### CA-34 — Factories Act applicability

**Question**: Tenant operates a "factory" (10+ workers with power / 20+ without)?

**Need from CA**: Per-establishment.

### CA-35 — CLRA applicability

**Question**: Tenant has 20+ contract workers (in any single contract)?

**Need from CA**: Per-establishment.

### CA-36 — Shops Act registrations

**Question**: All commercial establishments have valid Shops Act registration?

**Need from CA**: State-by-state status.

### CA-37 — Maharashtra Labour Welfare Fund

**Question**: Tenant employees in Maharashtra? LWF deduction setup.

**Spec assumption**: ₹6 employee + ₹18 employer half-yearly.

**Need from CA**: Confirmation.

### CA-38 — Karnataka LWF

**Question**: Tenant employees in Karnataka? LWF setup.

**Spec assumption**: ₹20 + ₹40 annually.

**Need from CA**: Confirmation.

### CA-39 — Other state LWF

**Question**: Per-state LWF for tenant's state operations.

**Need from CA**: List per state.

### CA-40 — POSH (Sexual Harassment Act)

**Question**: Tenant has Internal Committee constituted (10+ employees)?

**Need from Legal/CA**: Compliance status.

## DPDPA

### CA-41 — Data Fiduciary registration

**Question**: Is tenant a "Significant Data Fiduciary" requiring registration?

**Spec note**: Threshold notifiable by Government; not yet defined publicly.

**Need from Legal**: Status when notified.

### CA-42 — Data Protection Officer

**Question**: Is tenant required to appoint DPO?

**Need from Legal**: SDF status determines.

### CA-43 — Consent management workflow

**Question**: Spec's consent capture / withdrawal flow meets DPDPA?

**Need from Legal**: Review.

## Process

### CA-44 — Annual review cycle

**Question**: CA to review HRMS configuration annually for:
- Updated tax slabs (Finance Act each year)
- Updated PF / ESI / PT / LWF rates
- New / amended labour laws
- Court rulings

**Recommendation**: Annual CA engagement at FY start.

### CA-45 — Quarterly statutory filings review

**Question**: CA to review:
- Form 24Q quarterly TDS
- Form 26Q (other than salary)
- ECR submission
- ESI return
- PT returns

**Recommendation**: Quarterly review with auto-alerts in HRMS.

### CA-46 — Annual filings review

**Question**:
- Form 16 issuance (May-June)
- Form 24G if applicable
- Bonus Act payment (within 8 months of FY close)
- Annual returns under Factories Act, Shops Act

**Recommendation**: Annual checklist in HRMS.

## CA engagement model

For HRMS deployment:

1. **Pre-launch**: 2-3 day engagement to review CR-CA items + tenant-specific configurations
2. **Annually**: 1-day review of changed rules + tenant configuration update
3. **Quarterly**: light review + sign-off on filings
4. **Ad-hoc**: when specific situations arise (litigation, audit notice, etc.)

## Cross-references

- [03-statutory-verify-checklist.md](./03-statutory-verify-checklist.md) — items needing source verification (different from CA opinion)
- [02-decision-log.md](./02-decision-log.md) — locked decisions
- [/04-compliance/](../04-compliance/) — compliance specs
