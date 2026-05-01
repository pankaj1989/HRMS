# 02 — Payslips & Tax Statements

## Purpose

Employees access their payslips, Form 16, tax statements, and salary breakdowns through ESS. This file specifies UX, data access, security, and download mechanisms.

## Payslip access

### List view

Employee opens "Payslips" → sees list:

| Period | Net Pay | Status | Actions |
|---|---|---|---|
| April 2026 | ₹1,10,482 | Generated | View / Download |
| March 2026 | ₹1,06,521 | Generated | View / Download |
| ...12 months | ... | ... | ... |
| Earlier | (load more) | | |

### Detail view

Tapping a payslip opens:

```
+----------------------------------+
| April 2026                       |
| Period: 01-Apr to 30-Apr-2026    |
+----------------------------------+
| EARNINGS                         |
|   Basic Salary       ₹50,000     |
|   HRA                ₹25,000     |
|   Special Allowance  ₹41,262     |
|   ─────────────────────────       |
|   GROSS              ₹119,795     |
+----------------------------------+
| DEDUCTIONS                       |
|   PF Employee        ₹1,800       |
|   Professional Tax   ₹200         |
|   TDS                ₹7,313       |
|   ─────────────────────────       |
|   TOTAL DEDUCTIONS   ₹9,313       |
+----------------------------------+
| NET PAY              ₹110,482     |
| (Credited to A/c xxxxxxxxxx 5678) |
+----------------------------------+
| [VIEW DETAIL]   [DOWNLOAD PDF]    |
+----------------------------------+
```

### Detail expanded

On expanded view:
- Component-by-component breakdown
- LOP days tracking
- Statutory contributions (employee + employer)
- Year-to-date figures
- Tax projection summary
- Notes from HR (if any)

## PDF download

Standardized PDF (per `/03-payroll/10-payslip-format.md`):
- Letterhead
- Period
- Earnings + Deductions
- Net pay
- Bank details (last 4 digits only)
- Generated digitally — no signature required
- QR code (links to verification URL)

PDF is password-protected:
- Default password: PAN (without special chars) + last 4 digits of DOB year
- Tenant config (alternative: birthday DDMMYYYY format)
- Communicated via email separately

## Form 16 (annual TDS certificate)

Issued post-FY end (May-June for prior FY):

```
+----------------------------------+
| Form 16 - FY 2025-26             |
+----------------------------------+
| Issued: 15-May-2026              |
| Status: Generated                |
| TDS: ₹84,000                     |
| Salary: ₹14,40,000               |
+----------------------------------+
| [VIEW]   [DOWNLOAD PDF]          |
+----------------------------------+
| Form 12BA (Perquisites)          |
| Form 24Q (TDS Quarterly)         |
+----------------------------------+
```

`[CA-REVIEW]` Form 16 generation post Finance Act FY26-27 may have new fields under IT Act 2025. Verify form schema.

## Tax projection statement

Real-time (current FY):

```
+----------------------------------+
| Tax Projection FY 2026-27        |
+----------------------------------+
| Annual income (projected) ₹15L   |
| Deductions claimed       ₹50K    |
| Taxable income           ₹14.5L  |
+----------------------------------+
| Tax liability (new regime)       |
|   ₹0-4L     - 0%       ₹0        |
|   ₹4-8L     - 5%       ₹20,000   |
|   ₹8-12L    - 10%      ₹40,000   |
|   ₹12-14.5L - 15%      ₹37,500   |
|   ─────────────────────────       |
|   Subtotal             ₹97,500   |
|   Cess 4%              ₹3,900    |
|   ─────────────────────────       |
|   TOTAL                ₹101,400  |
+----------------------------------+
| TDS deducted YTD       ₹85,500   |
| TDS remaining          ₹15,900   |
| Avg TDS / month        ₹4,540    |
+----------------------------------+
```

Helps employees plan tax savings.

## Tax declaration / proof submission

Form 12BB (annual employee declaration):

```
+----------------------------------+
| Tax Declaration FY 2026-27       |
+----------------------------------+
| HRA Exemption                    |
|   Rent paid per month: ₹25,000   |
|   Landlord PAN: ABCDE1234F       |
|   [CONFIRM]                      |
+----------------------------------+
| 80C - Investments (max ₹1.5L)    |
|   PF (auto)            ₹21,600   |
|   ELSS                 ₹0        |
|   Insurance            ₹50,000   |
|   PPF                  ₹0        |
|   [+ ADD ANOTHER]                |
+----------------------------------+
| 80D - Health Insurance           |
|   Self/family          ₹25,000   |
|   Parents (senior)     ₹50,000   |
+----------------------------------+
| Other Deductions                 |
|   ...                            |
+----------------------------------+
| [SAVE DECLARATION]               |
+----------------------------------+
```

Auto-saved as Form 12BB. Used in TDS computation.

`[CA-REVIEW]` Most deductions removed under IT Act 2025 new regime. Old regime (if still allowed) keeps full deductions. Tenant communicates regime choice.

## Proof upload (for Form 12BB)

Q4 (Jan-Mar) of FY: investment proofs required:

```
+----------------------------------+
| Submit Investment Proofs         |
| Deadline: 15 February 2027       |
+----------------------------------+
| 80C - PPF                        |
|   Declared: ₹50,000              |
|   Status: NOT SUBMITTED          |
|   [📤 UPLOAD PROOF]              |
+----------------------------------+
| 80C - Life Insurance Premium     |
|   Declared: ₹50,000              |
|   Status: SUBMITTED ✓             |
|   [VIEW PROOF]                   |
+----------------------------------+
```

Process:
- Photo / PDF upload from camera or gallery
- File size limit: 5MB per
- Multiple files per claim allowed
- Reviewer (HR or finance) verifies
- Approved → applied to TDS computation
- Rejected → explanation + re-upload

## Salary structure breakdown

Educational view for employee to understand CTC composition:

```
+----------------------------------+
| Your Compensation: ₹15,00,000    |
+----------------------------------+
| Monthly take-home (avg)          |
|   ₹1,10,482                      |
+----------------------------------+
| FIXED                ₹14,38,000  |
|   Basic 33%                      |
|   HRA 17%                        |
|   Special 27%                    |
|   PF (Employer) 4%                |
|   Gratuity 4%                    |
|   Health Insurance               |
+----------------------------------+
| VARIABLE             ₹62,000     |
|   Performance bonus              |
+----------------------------------+
```

Visual: pie chart of components.

`[v2]` What-if calculator: "What if HRA increased to 20%?"

## Quarterly TDS statement

After each quarter's Form 24Q filed:

```
+----------------------------------+
| Q1 FY 2026-27 (Apr-Jun)          |
+----------------------------------+
| Income           ₹3,75,000        |
| TDS Deducted     ₹21,000          |
| Form 24Q Filed   31 Jul 2026     |
| Status: Acknowledged             |
+----------------------------------+
```

Employees can verify their TDS visible in 26AS / AIS on income tax portal.

## Bank account info

Employees see their salary credit account:

```
+----------------------------------+
| Salary Credit Account            |
+----------------------------------+
| Account: HDFC ****5678           |
| IFSC:    HDFC0000234              |
| Branch:  Bangalore - HSR Layout  |
+----------------------------------+
| [REQUEST CHANGE]                 |
+----------------------------------+
```

Account change → request → HR verifies cancelled cheque/passbook → approves → effective from next payroll.

## Compensation history

Multi-year view:

```
+----------------------------------+
| Compensation History             |
+----------------------------------+
| FY 2026-27 - ₹15,00,000          |
|   Effective: 1-Apr-2026          |
|   Hike: 25%                      |
|   Reason: Promotion + Annual     |
+----------------------------------+
| FY 2025-26 - ₹12,00,000          |
|   Effective: 1-Apr-2025          |
|   Hike: 9%                       |
|   Reason: Annual increment        |
+----------------------------------+
| ...                              |
+----------------------------------+
```

## YTD earnings

Year-to-date summary:

| Component | YTD Amount |
|---|---|
| Basic | 50,000 × 1 = 50,000 |
| HRA | 25,000 × 1 = 25,000 |
| Special Allowance | 41,262 × 1 = 41,262 |
| **YTD Gross** | **₹1,16,262** |
| YTD TDS | ₹7,313 |
| YTD Net | ₹1,06,949 |

(Updated monthly post payroll close.)

## Security

- Two-factor authentication for download
- Audit log per access
- Password-protected PDFs
- No screenshots / forwarding markers (some tenants want; OS-dependent)
- Separate login for tax-related access (some companies require additional auth for sensitive data)

## Open questions

`[OPEN]` Print bypass: should employee be able to print directly from app? Yes; standard.

`[OPEN]` Email payslip option: HR sends to personal email. Recommend: yes; password-protected; opt-in.

`[OPEN]` Cross-tenant aggregation (employee at multiple Indian employers in same FY). Need cross-employer Form 16 view. Out of v1; manual.

`[OPEN]` AIS / 26AS pulled from IT portal: useful but requires employee's IT portal credentials. Recommend: NOT in v1; security risk.

## Cross-references

- [/03-payroll/10-payslip-format.md](../03-payroll/10-payslip-format.md) — payslip format
- [/04-compliance/03-tds-and-income-tax.md](../04-compliance/03-tds-and-income-tax.md) — Form 16, 12BB
- [04-tax-declarations-and-investment-proofs.md](./04-tax-declarations-and-investment-proofs.md) — declaration workflow
- [/03-payroll/04-pre-payroll-inputs.md](../03-payroll/04-pre-payroll-inputs.md) — declarations input
