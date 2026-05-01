# 13 — Statutory File Formats

## Purpose

Specifications for the file formats required by various statutory authorities — EPFO ECR, NSDL FVU (Form 24Q), ESIC RC, State PT/LWF formats, and others. These are the actual machine-readable files uploaded to authority portals.

## EPFO ECR 2.0 format

### File specifications

- Format: Plain TXT
- Delimiter: Pipe `|`
- Encoding: UTF-8
- No header line (some versions have header)
- One row per employee
- Filename: `<EstablishmentID>_<MonthYear>.txt` e.g., `KNBG12345000_042026.txt`

### Field layout (ECR 2.0; verify current)

| Column | Field | Type | Width | Example |
|---|---|---|---|---|
| 1 | UAN | Number | 12 | 100123456789 |
| 2 | Member ID | Text | up to 22 | KNBG12345000000123 |
| 3 | Member Name | Text | up to 85 | PANKAJ KUMAR SHARMA |
| 4 | Gross Wages | Number | up to 11 | 119795 |
| 5 | EPF Wages | Number | up to 11 | 50000 |
| 6 | EPS Wages | Number | up to 11 | 15000 |
| 7 | EDLI Wages | Number | up to 11 | 15000 |
| 8 | EPF Contribution | Number | up to 11 | 6000 |
| 9 | EPS Contribution | Number | up to 11 | 1250 |
| 10 | EPF + EPS Difference Remitted | Number | up to 11 | 4750 |
| 11 | NCP Days | Number | up to 2 | 0 |
| 12 | Refund of Advances | Number | up to 11 | 0 |

`[VERIFY]` Column count and order; refer to EPFO ECR Format Specification document. Format updated periodically (ECR 1.0 → 1.5 → 2.0).

### Example row

```
100123456789|KNBG12345000000123|PANKAJ KUMAR SHARMA|119795|50000|15000|15000|6000|1250|4750|0|0
```

### Validation at EPFO portal

- UAN format: 12 digits
- Wages > 0
- Contribution arithmetic: EPF Contribution = EPF Wages × 12%
- EPS Contribution = EPS Wages × 8.33% (max ₹1,250 if EPS Wages = ₹15,000)
- NCP Days ≤ days in month
- Member ID matches existing record

Validation errors block challan generation.

## NSDL FVU format (Form 24Q)

### Generation tools

- **RPU (Return Preparation Utility)**: Java application from NSDL/Protean
- **FVU (File Validation Utility)**: validates RPU output before upload

The HRMS produces RPU-compatible Excel/Text input; user runs RPU+FVU; uploads to e-filing portal.

### File specs

- Plain TXT
- Tab-delimited
- ASCII encoding
- Multiple section files combined
- Filename: per quarter / FY

### Sections

1. **File Header** — TAN, FY, quarter, Form name
2. **Batch Header** — single batch number per file
3. **Challan Detail** — TDS deposit challans referenced
4. **Deductee Detail (Annexure I)** — per-employee TDS for the quarter
5. **Salary Detail (Annexure II)** — Q4 only; per-employee annual statement
6. **Verification** — Auth code, signatory

Each section has fixed columns. Refer to NSDL specification doc.

### Example deductee row (Annexure I)

```
1	1	ABCDE1234F	Pankaj Kumar Sharma	30/04/2026	119795	7313	0	0	30	04	2026
```

Fields: serial, deductee type (1=salary), PAN, name, payment date, amount paid, TDS, surcharge, cess, deduction date, ...

`[VERIFY]` Specific field positions per current FVU.

## ESIC return format

### ESIC online return

ESIC has an online portal where:
- Employer logs in
- Uploads contribution data per period (or enters directly)
- Generates challan
- Pays online

Bulk upload format:

- Excel template
- Per-employee row: IP number, name, days worked, wages, contribution
- Validation at portal

### Half-yearly return

After 6-month contribution period:
- Online: enter aggregate per IP
- Submit
- Acknowledge

The HRMS generates aggregate from PayrollLines; HR uploads.

`[v2]` Direct API integration (limited availability).

## State Professional Tax formats

Each state has its own format. Examples:

### Maharashtra PTRC

- Online via Mahashramm portal
- Form III-B return
- Excel upload allowed for bulk: employee name, PT amount, period
- Challan generation
- Online payment

### Karnataka

- Online via CTD-PT portal
- Employee-wise CSV upload
- Format: employee_id, name, salary_range, pt_amount

### Tamil Nadu

- Half-yearly: physical Form 1 + Form 2 (challan)
- Or online via TN's combined Labour Portal

`[VERIFY]` State portal formats vary; update tracker per state.

## State LWF formats

Each state's LWF Board portal:

- Online return
- Excel upload
- Per-employee detail or aggregate (depends on state)

`[VERIFY]` Specifics per state.

## Bonus / Gratuity / MB Forms

These are typically PDF/Excel filled and submitted physically or scanned/uploaded.

- Bonus Form D: Word/PDF
- Gratuity Form L: Word/PDF
- MB Forms: Word/PDF

The HRMS generates filled-in PDFs; HR submits to inspector / authority (online portal where available).

## Factories Act formats

- Form D / Form 30: PDF (filled-in template)
- Form 18: PDF (per accident)
- Some states have online portals (Maharashtra, Karnataka)

## CLRA formats

- Form XXV: PDF / Excel
- Form VIA (contractor): paper/PDF
- Submitted to Labour Commissioner

## Statutory file generation pipeline

```mermaid
sequenceDiagram
    participant Engine as Compliance Engine
    participant DB
    participant Adapter as Format Adapter
    participant S3
    participant Portal as Authority Portal
    
    Engine->>DB: payroll period locked
    Engine->>Adapter: trigger file generation
    Adapter->>DB: read PayrollLines + employee + statutory data
    Adapter->>Adapter: format per spec (ECR / FVU / etc.)
    Adapter->>Adapter: validate format
    Adapter->>S3: store file (encrypted)
    S3->>DB: create Document + filing task
    
    Note over DB: HR notified
    
    HR->>S3: download file
    HR->>Portal: upload file
    Portal-->>HR: acknowledgment
    HR->>DB: record acknowledgment + challan ref
    Portal->>HR: payment due
    HR->>Portal: pay challan
    HR->>DB: mark paid; record UTR
```

## File adapter abstraction

Internal canonical model + per-authority adapters:

```typescript
interface ComplianceFileAdapter {
  authorityCode: string;                   // 'EPFO' | 'NSDL_TDS' | 'ESIC' | 'PT_MH' | etc.
  formatVersion: string;                   // 'ECR-2.0', 'FVU-8.0', etc.
  
  generate(canonicalData: CanonicalComplianceData): Buffer;
  validate(file: Buffer): ValidationResult;
  parseAcknowledgment(ack: Buffer): AcknowledgmentResult;
}
```

Adapters per authority. Update when format changes.

## Versioning

Each format spec has a version. The HRMS:
- Stores generated files with format version label
- Adapters maintain version compatibility (if EPFO releases ECR 3.0, both 2.0 and 3.0 supported during transition)

## Output retention

All generated statutory files retained 7+ years:
- Encrypted at rest
- Hash for tamper detection
- Versioned (if regenerated, original retained)
- Accessible to compliance officer + auditor + inspector

## Error handling

If format generation fails (data inconsistency):
- File not generated
- Error logged with specifics
- HR notified to fix data
- Re-attempt available

Common errors:
- Missing UAN / PAN for employees
- Wage / contribution mismatches
- IFSC validation failures
- Section mismatch in Form 24Q

## Open questions

`[OPEN]` Multi-state filing automation: each state portal differs. Recommend: file generation in all formats; HR uploads manually in v1; portal API integration in v2.

`[OPEN]` Format evolution monitoring. EPFO / NSDL release format updates frequently. Recommend: dedicated ops process; subscribe to authority notifications.

`[OPEN]` Direct portal upload via headless browser automation? Tempting but fragile (portals change UIs). Recommend: HR uploads in v1; API where available in v2.

`[OPEN]` Digital signature on filed files (DSC)? Some forms require. HRMS supports HSM integration `[v2]`.

## Cross-references

- [01-pf-act-and-formulas.md](./01-pf-act-and-formulas.md) — ECR
- [02-esi-act-and-formulas.md](./02-esi-act-and-formulas.md) — ESIC
- [03-tds-and-income-tax.md](./03-tds-and-income-tax.md) — FVU / Form 24Q
- [04-professional-tax-state-wise.md](./04-professional-tax-state-wise.md) — PT formats
- [05-lwf-state-wise.md](./05-lwf-state-wise.md) — LWF formats
