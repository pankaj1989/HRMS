# 07 — Glossary

Every acronym, statute, and term used in this spec, defined.

## Statutory acronyms

| Term | Full form | Description |
|---|---|---|
| **PF / EPF** | (Employees') Provident Fund | Retirement savings; 12% employee + 12% employer of (Basic + DA), capped at ₹15,000 wage ceiling |
| **EPFO** | Employees' Provident Fund Organisation | Government body administering PF |
| **EPS** | Employees' Pension Scheme | Pension scheme; 8.33% of employer's PF contribution diverted here |
| **EDLI** | Employees' Deposit Linked Insurance | Life insurance scheme funded by 0.5% employer contribution |
| **UAN** | Universal Account Number | Lifelong PF account number that travels across employers |
| **ECR** | Electronic Challan-cum-Return | Monthly file uploaded to EPFO portal containing PF contributions of all employees |
| **ESI / ESIC** | Employees' State Insurance / Corporation | Medical+cash benefit scheme; 0.75% employee + 3.25% employer of gross, applies if gross ≤ ₹21,000 |
| **TDS** | Tax Deducted at Source | Income tax deducted from salary by employer monthly |
| **TAN** | Tax Deduction Account Number | 10-char ID for entities required to deduct TDS |
| **PAN** | Permanent Account Number | 10-char ID for income tax purposes (individuals + entities) |
| **PT** | Professional Tax | State-levied tax on professionals; varies by state |
| **PTEC** | Professional Tax Enrollment Certificate | For the entity itself paying PT |
| **PTRC** | Professional Tax Registration Certificate | For deducting PT from employees |
| **LWF** | Labour Welfare Fund | State-levied welfare contribution; varies by state |
| **CIN** | Corporate Identification Number | 21-char ID for companies |
| **LLPIN** | LLP Identification Number | 7-char ID for LLPs |
| **GSTIN** | Goods & Services Tax Identification Number | 15-char ID per state of operation |
| **CTC** | Cost to Company | Total annual cost incurred by employer for an employee |
| **HRA** | House Rent Allowance | Salary component, partially tax-exempt under Section 10(13A) |
| **DA** | Dearness Allowance | Cost-of-living adjustment; mostly used in PSU/government, less in private sector |
| **LTA** | Leave Travel Allowance | Travel reimbursement, tax-exempt under Section 10(5) for 2 trips per 4-year block |
| **FBP** | Flexible Benefits Plan | Pool that employee can split between LTA, fuel, meal, books, etc. for tax efficiency |
| **VPF** | Voluntary Provident Fund | Employee voluntarily contributes >12% to PF |
| **POSH** | Prevention Of Sexual Harassment | POSH Act 2013, mandatory ICC for workplaces with 10+ employees |
| **NDA** | Non-Disclosure Agreement | Standard employment doc |
| **ICC** | Internal Committee | Required under POSH Act |
| **ITR** | Income Tax Return | Annual income tax return filed by individuals |
| **F&F** | Full and Final Settlement | Final dues calculation at exit |
| **FY** | Financial Year | April 1 to March 31 in India |
| **AY** | Assessment Year | FY+1; tax for FY24-25 is filed in AY25-26 |
| **NSDL** | National Securities Depository Limited | Operates TIN/NSDL for TDS Form 24Q filing |
| **CBDT** | Central Board of Direct Taxes | Issues Income Tax notifications |
| **PIB** | Press Information Bureau | Official government publication source |
| **DPDPA** | Digital Personal Data Protection Act | India's 2023 data protection law |

## Statutory acts referenced

| Act | Year | Brief |
|---|---|---|
| Income Tax Act | 1961 | Income tax framework |
| Income Tax Act | 2025 | Revised act, effective April 1, 2026 (FY 2026-27 onwards) |
| Employees' Provident Funds & Misc. Provisions Act | 1952 | PF/EPS/EDLI |
| Employees' State Insurance Act | 1948 | ESI |
| Payment of Gratuity Act | 1972 | Gratuity rules |
| Payment of Bonus Act | 1965 | Statutory bonus |
| Payment of Wages Act | 1936 | Wage payment rules |
| Minimum Wages Act | 1948 | State-set minimum wages |
| Maternity Benefit Act | 1961 (amended 2017) | 26 weeks paid leave |
| Industrial Disputes Act | 1947 | Industrial relations (largely superseded by IR Code 2020) |
| Factories Act | 1948 | Factory establishment regulation |
| Shops & Establishments Act | per state | Commercial establishment regulation |
| Contract Labour (Regulation & Abolition) Act | 1970 | CLRA — contract labour |
| Equal Remuneration Act | 1976 | Equal pay |
| POSH Act | 2013 | Prevention of Sexual Harassment |
| Code on Wages | 2019 | Consolidates 4 wage-related acts |
| Industrial Relations Code | 2020 | Consolidates 3 IR-related acts |
| Code on Social Security | 2020 | Consolidates 9 social security acts |
| OSH Code | 2020 | Consolidates 13 OSH-related acts |
| DPDPA | 2023 | Data Protection Act |
| Apprentices Act | 1961 | Apprentice rules |

The **four Labour Codes** (Wage, IR, SS, OSH) were notified in November 2025 and are partially in force as of April 2026, replacing 29 central labour laws over time.

## Statutory forms referenced

| Form | Purpose |
|---|---|
| Form 11 | PF declaration on joining |
| Form 2 | PF nomination |
| Form 13 | PF account transfer |
| Form 19 | PF withdrawal |
| Form 31 | PF advance |
| Form 16 | Annual TDS certificate, given to employee |
| Form 12BA | Perquisites disclosure, annexed to Form 16 |
| Form 12B | Declaration to employer about previous employer's income (mid-year joiner) |
| Form 24Q | Quarterly TDS return for salary, filed with NSDL |
| Form 26AS | Tax credit statement (employee accesses on income-tax portal) |
| Form 1 | Wage Register under Code on Wages |
| Form A (Wage Code) | Wage Register |
| Form B (Wage Code) | Muster Roll-cum-Wage Register |
| Form C (Wage Code) | Annual Return |
| Form A (Bonus Act) | Computation of allocable surplus |
| Form B (Bonus Act) | Set-on / set-off |
| Form C (Bonus Act) | Bonus paid |
| Form D (Bonus Act) | Annual return to inspector |
| Form L (Gratuity Act) | Notice of gratuity payment |
| Form V (CLRA) | License for principal employer to engage contract labour |
| Form XII (CLRA) | Half-yearly return |
| Form XIII (CLRA) | Wage register for contract labour |
| Form 21 (Factories Act) | Annual return |
| Form 22 (Factories Act) | Half-yearly return |

`[VERIFY]` Form numbers under the four new Labour Codes — some have been renumbered or replaced. List above includes pre-Code names.

## State codes (28 states + 8 UTs)

| Code | State / UT |
|---|---|
| AN | Andaman & Nicobar Islands (UT) |
| AP | Andhra Pradesh |
| AR | Arunachal Pradesh |
| AS | Assam |
| BR | Bihar |
| CG | Chhattisgarh |
| CH | Chandigarh (UT) |
| DD | Daman & Diu (UT, merged with Dadra & Nagar Haveli) |
| DL | Delhi |
| DN | Dadra & Nagar Haveli (UT) |
| GA | Goa |
| GJ | Gujarat |
| HP | Himachal Pradesh |
| HR | Haryana |
| JH | Jharkhand |
| JK | Jammu & Kashmir (UT) |
| KA | Karnataka |
| KL | Kerala |
| LA | Ladakh (UT) |
| LD | Lakshadweep (UT) |
| MH | Maharashtra |
| ML | Meghalaya |
| MN | Manipur |
| MP | Madhya Pradesh |
| MZ | Mizoram |
| NL | Nagaland |
| OR | Odisha |
| PB | Punjab |
| PY | Puducherry (UT) |
| RJ | Rajasthan |
| SK | Sikkim |
| TG | Telangana |
| TN | Tamil Nadu |
| TR | Tripura |
| UK | Uttarakhand |
| UP | Uttar Pradesh |
| WB | West Bengal |

`[VERIFY]` State codes against the official India Post / Indian Government publications. Some sources use TS instead of TG for Telangana.

## HR / Product terms

| Term | Meaning |
|---|---|
| HRMS | Human Resource Management System (this product) |
| HRIS | Human Resource Information System (subset of HRMS, focused on data) |
| HCM | Human Capital Management (broader, includes strategic) |
| ESS | Employee Self-Service |
| ATS | Applicant Tracking System |
| BGV | Background Verification |
| KPI | Key Performance Indicator |
| OKR | Objectives & Key Results |
| KRA | Key Result Area |
| 360-Review | Multi-rater feedback (peer + manager + reportee + self) |
| 9-Box Grid | Talent calibration framework (performance × potential) |
| PIP | Performance Improvement Plan |
| LMS | Learning Management System |
| CL | Casual Leave |
| SL | Sick Leave |
| EL / PL | Earned Leave / Privilege Leave |
| ML | Maternity Leave |
| LOP | Loss of Pay |
| OD | On-Duty (working but offsite) |
| WFH | Work From Home |
| OT | Overtime |
| FNF | Full and Final (settlement) |
| EOR | Employer of Record |
| PEO | Professional Employer Organization |

## Tech terms (specific to this spec)

| Term | Meaning |
|---|---|
| Tenant | Top-level customer organization |
| Entity | Legal employer with its own PAN under a tenant |
| Effective-dated | Time-versioned record with `effectiveFrom` / `effectiveTo` |
| Rule payload | Data describing a statutory rule's parameters |
| Strategy | Code that applies a rule payload to inputs to produce outputs |
| Statutory timeline | Per-employee chronological log of statutory events |
| Inspection mode | Time-bound read-only access for statutory inspectors |
| Compliance Drift | When salary structure / employee state silently violates statutory rules |
| Notice Responder | AI-assisted parser of EPFO/ESIC/IT department notices |
| Inspection Pack | One-click bundle of statutory documents for an inspection |

## Common file formats

| Format | Use |
|---|---|
| PDF | Payslip, Form 16, offer letter, statutory documents |
| .txt (NSDL FVU) | TDS Form 24Q quarterly file |
| .txt (EPFO ECR) | Monthly PF challan-cum-return |
| .csv | Bulk import / export |
| .xlsx | Bulk import / export, more readable |
| .xml (Tally) | Journal voucher posting to Tally |
| .json (Zoho) | Journal voucher posting to Zoho Books |
| Bank-specific .txt | Salary disbursement file (SBI CMP, HDFC NEFT, etc.) |

## Spec-internal markers

Already documented in [README.md](../README.md):

| Tag | Meaning |
|---|---|
| `[VERIFY]` | Specific number / format I'm uncertain about |
| `[ASSUMPTION]` | Product decision I made on your behalf |
| `[DECISION]` | Two reasonable approaches; I picked one |
| `[v1]` `[v2]` `[v3]` | Scoping marker |
| `[BLUE-COLLAR]` | Specific to factory / retail / field workforce |
| `[WHITE-COLLAR]` | Specific to office / IT / services workforce |
| `[CA-REVIEW]` | Statutory interpretation; needs CA validation |
| `[OPEN]` | Open question for you |
