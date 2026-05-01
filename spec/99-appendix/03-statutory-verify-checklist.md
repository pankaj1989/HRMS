# 03 — Statutory Verify Checklist

## Purpose

Every `[VERIFY]` flag in the spec consolidated. These are statutory / regulatory items that need official source verification (gazette notification, CBDT circular, court ruling, EPFO/ESIC notification) before implementation.

Distinguishes from `[CA-REVIEW]` which needs CA opinion. `[VERIFY]` needs document confirmation.

## Income Tax (IT Act 2025)

### V1 — Tax slab rates FY 2026-27

**Item**: Slab rates under IT Act 2025 (effective Apr 1, 2026).

**Spec assumption**: 0/4L/8L/12L/16L/20L/24L+ at 0/5/10/15/20/25/30%.

**Verification needed**: Finance Act 2025; CBDT notification.

**Source**: incometaxindia.gov.in / Gazette of India.

**Owner**: CA + Tax Partner.

**Files affected**: `/04-compliance/03-tds-and-income-tax.md`, `/03-payroll/05-payroll-engine.md`.

### V2 — Standard deduction (new regime)

**Item**: Standard deduction amount under new regime FY 26-27.

**Spec assumption**: ₹75,000 (Finance Act 2024 amendment carried forward).

**Verification**: Finance Act 2025 / CBDT notification.

### V3 — Section 87A rebate

**Item**: Rebate threshold and amount.

**Spec assumption**: ₹25,000 rebate for income ≤ ₹12L (new regime). Old regime: ₹12,500 ≤ ₹5L.

**Verification**: Finance Act 2025.

### V4 — Section 80 deductions (old regime)

**Item**: Confirm 80C, 80D, 80E, 80G, 80EEA, 80TTA limits FY 26-27.

**Spec assumption**: 80C ₹1.5L, 80D ₹25K + ₹50K (parents senior), 80E unlimited (interest), 80EEA ₹1.5L additional first-home loan.

**Verification**: Finance Act 2025; CBDT.

### V5 — HRA exemption formula (10(13A))

**Item**: HRA exemption = min(actual HRA, rent paid - 10% basic, 50% basic metro / 40% non-metro).

**Spec assumption**: Standard formula unchanged.

**Verification**: IT Act 2025 sections referenced; CBDT.

### V6 — Form 16 / 12BA / 24Q schema FY 26-27

**Item**: Any structural changes under IT Act 2025?

**Verification**: TRACES updates; CBDT circulars.

### V7 — TCS on perquisites

**Item**: Notable perquisite valuations (rent-free accommodation, ESOP, etc.) under IT Act 2025.

**Spec assumption**: As per existing rules.

**Verification**: CBDT.

### V8 — Surcharge & cess

**Item**: Surcharge slabs and 4% Health & Education Cess.

**Spec assumption**: Surcharge 10% > 50L; 15% > 1Cr; 25% > 2Cr; 37% > 5Cr (capped at 25% under new regime). 4% cess.

**Verification**: Finance Act 2025.

### V9 — Form 10E (relief u/s 89)

**Item**: Form 10E applicability for arrears.

**Verification**: CBDT / TRACES.

### V10 — Section 192 TDS rate / averaging

**Item**: TDS deducted at average rate on annual projected income.

**Spec assumption**: Standard methodology.

**Verification**: Section 192 read with IT Act 2025.

## Provident Fund (EPF)

### V11 — Wage ceiling for PF mandatory coverage

**Item**: ₹15,000 wage ceiling for mandatory PF coverage.

**Spec assumption**: Continues at ₹15,000.

**Verification**: EPFO notifications. There has been talk of raising to ₹21,000 (similar to ESI).

**Source**: epfindia.gov.in.

### V12 — PF wage basis (Wage Code interaction)

**Item**: Code on Wages 2019 mandates "wages" definition. Impact on PF contribution base.

**Spec assumption**: Tenant config; default `basic-da-only` for FY 26-27.

**Verification**: State Code on Wages Rules notifications. Some states notified, some not.

**Note**: `[CA-REVIEW]` per state.

### V13 — Pension contribution capping

**Item**: 8.33% to EPS capped at ₹15,000 (₹1,250).

**Spec assumption**: Continues.

**Verification**: EPFO; recent SC ruling on higher pension.

### V14 — EDLI ceiling

**Item**: 0.5% of wages capped at ₹15,000 (= ₹75 per employee per month).

**Verification**: EPFO.

### V15 — Employer PF admin charges

**Item**: 0.5% (was 0.65%, then 0.5% post-2017).

**Verification**: EPFO.

### V16 — ECR 2.0 file format

**Item**: Latest ECR format and field requirements.

**Verification**: EPFO unified portal.

### V17 — UAN linking with Aadhaar

**Item**: Mandatory linking; KYC requirements.

**Verification**: EPFO.

## ESI

### V18 — ESI wage ceiling

**Item**: ₹21,000 wage ceiling.

**Spec assumption**: ₹21,000 continues.

**Verification**: ESIC notifications.

### V19 — ESI contribution rates

**Item**: Employee 0.75%, Employer 3.25%.

**Spec assumption**: Continues post-2019 reduction.

**Verification**: ESIC.

### V20 — ESI applicability district notifications

**Item**: ESI applicable districts.

**Verification**: ESIC district notifications. Per-district / per-area applicability.

## Professional Tax (state-specific)

### V21 — State PT slabs

**Item**: PT slabs and rates per state.

**Spec assumption**: Hardcoded for major states (MH, KA, WB, TN, AP, TG, GJ, KL, OR).

**Verification**: State commercial tax department notifications.

**States with annual PT**:
- Maharashtra: monthly slabs
- Karnataka: monthly slabs
- West Bengal: monthly slabs
- Tamil Nadu: half-yearly
- Andhra Pradesh: monthly
- Telangana: monthly
- Gujarat: monthly
- Kerala: half-yearly
- Odisha: monthly

States without PT: Delhi, Haryana, UP, MP, Rajasthan, Punjab, etc.

### V22 — Senior citizen / disabled exemptions

**Item**: PT exemptions for senior citizens / persons with disability.

**Verification**: Per-state.

## Labour Welfare Fund (state-specific)

### V23 — State LWF rates and frequency

**Item**: LWF deduction amount and remittance frequency per state.

**Verification**: State labour department notifications.

**LWF states** (subset):
- Maharashtra: ₹6 employee, ₹18 employer (₹24 total) half-yearly
- Karnataka: ₹20 employee, ₹40 employer annually
- West Bengal: ₹3 employee, ₹6 employer monthly
- Tamil Nadu: ₹10 employee, ₹20 employer annually
- Gujarat: ₹6 employee, ₹12 employer half-yearly
- Kerala: ₹20 employee, ₹40 employer monthly

`[VERIFY]` Each state's current rate.

## Bonus Act

### V24 — Bonus Act wage ceiling

**Item**: ₹21,000 wage ceiling for bonus eligibility (as per 2015 amendment).

**Spec assumption**: Continues.

**Verification**: Labour Ministry.

### V25 — Bonus calculation cap

**Item**: Bonus calculated on lesser of actual wages OR ₹7,000 / minimum wage (whichever higher).

**Verification**: Bonus Act 1965 amendments.

### V26 — Bonus rates

**Item**: 8.33% minimum, 20% maximum.

**Verification**: Bonus Act.

## Gratuity

### V27 — Gratuity ceiling

**Item**: ₹20 lakh tax-exempt limit (private sector).

**Spec assumption**: Continues.

**Verification**: Gratuity Act 1972 amendments; CBDT.

### V28 — Continuous service rule

**Item**: 5 years OR 4 years 240 days (Madras HC).

**Spec assumption**: 4 years 240 days liberal.

**Verification**: Court rulings; Gratuity Act.

### V29 — Gratuity calculation formula

**Item**: (Last drawn basic + DA) × 15/26 × years of service.

**Verification**: Standard formula.

### V30 — SS Code 2020 gig worker / fixed-term

**Item**: SS Code § 53(2) — pro-rata gratuity for fixed-term contract workers.

**Verification**: SS Code 2020 + state notifications.

## Maternity Benefit Act

### V31 — Maternity leave duration

**Item**: 26 weeks (first 2 children); 12 weeks (3rd onwards); 12 weeks adoption (under 3 months age).

**Spec assumption**: Standard.

**Verification**: MB Act 1961 (amended 2017).

### V32 — Crèche facility

**Item**: 50+ employee tenants must have crèche.

**Verification**: MB Act + state rules.

### V33 — Work from home

**Item**: Mandatory for nursing mothers if nature of work permits.

**Verification**: MB Act.

## Factories Act / Shops Act

### V34 — Daily and weekly hour limits

**Item**: 9 hours/day, 48 hours/week (Factories Act); state Shops Act varies.

**Verification**: Factories Act 1948; state Shops Act.

### V35 — Weekly off

**Item**: 1 day weekly off (Factories Act).

**Verification**: Standard.

### V36 — Overtime rates

**Item**: 2× wages for OT (Factories Act).

**Verification**: Factories Act § 59.

### V37 — Annual leave with wages

**Item**: 1 day per 20 days worked (Factories Act); 1 day per 20 days worked (most state Shops Acts).

**Verification**: Factories Act § 79; state Shops Acts.

### V38 — Women working hours

**Item**: Women in factories restricted between 7pm-6am unless special permission. State Shops Acts vary.

**Verification**: Factories Act § 66; state notifications.

### V39 — Public holidays

**Item**: National / state public holidays mandatory.

**Verification**: State labour department.

## CLRA (Contract Labour Act)

### V40 — Coverage threshold

**Item**: Establishments employing 20+ contract workers (some states 50+).

**Verification**: CLRA Act + state amendments.

### V41 — Principal employer obligations

**Item**: Wage records, PF/ESI verification, register maintenance.

**Verification**: CLRA + state rules.

### V42 — Contractor licensing

**Item**: Contractors with 20+ workers need license (per work order).

**Verification**: CLRA.

## Industrial Disputes Act

### V43 — Layoff compensation

**Item**: 50% of wages for laid-off workers (50+ workers establishments).

**Verification**: ID Act § 25C.

### V44 — Retrenchment compensation

**Item**: 15 days wages per year of service.

**Verification**: ID Act § 25F.

### V45 — Government permission for closure

**Item**: 100+ workers establishments need state permission for closure.

**Verification**: ID Act § 25-O.

## Wage Code 2019 (where notified)

### V46 — "Wages" definition

**Item**: 50% of total remuneration must be "wages" (post Wage Code).

**Verification**: Code on Wages 2019 + state rules.

### V47 — Minimum wage notification

**Item**: State minimum wages quarterly / annually updated.

**Verification**: State labour department.

### V48 — Equal remuneration

**Item**: Equal pay for equal work (gender-neutral).

**Verification**: Wage Code 2019 § 3.

## SS Code 2020

### V49 — Universal social security

**Item**: PF/ESI/Gratuity unified under SS Code (where notified).

**Verification**: SS Code 2020 + state notifications.

### V50 — Gig / platform worker contribution

**Item**: 1-2% from aggregators for gig worker fund.

**Verification**: SS Code § 113-116.

## DPDPA 2023

### V51 — Consent management

**Item**: Explicit consent for personal data processing.

**Verification**: DPDPA 2023.

### V52 — Data fiduciary obligations

**Item**: Data fiduciary (employer) registration if Significant Data Fiduciary.

**Verification**: DPDPA + Rules.

### V53 — Children's data

**Item**: Verifiable parental consent for minors.

**Verification**: DPDPA § 9.

### V54 — Right to erasure

**Item**: Data principal (employee) can request erasure post-purpose.

**Verification**: DPDPA.

## How to verify

For each item:
1. Read the source notification / Act / circular
2. Document the verification (link, date, version)
3. Update spec to remove `[VERIFY]` and add `[VERIFIED on YYYY-MM-DD]` annotation
4. If source contradicts assumption, update spec and notify CA / Legal

## Cross-references

- [04-ca-review-checklist.md](./04-ca-review-checklist.md) — CA opinion items
- [/04-compliance/](../04-compliance/) — compliance specs
- [/04-compliance/13-2026-labour-codes-transition.md](../04-compliance/13-2026-labour-codes-transition.md) — Code transition
