# 04 — Statutory IDs (PAN, Aadhaar, UAN, ESI)

## Purpose

This file specifies how sensitive personal identifiers are stored, encrypted, validated, and looked up. Mishandling any of these is a DPDPA violation, can lead to identity fraud, and is the single most common cause of HRMS lawsuits.

## Identifiers covered

| ID | Length | Purpose | Encryption | Lookup |
|---|---|---|---|---|
| PAN | 10 chars | Income tax | yes | hash-based |
| Aadhaar | 12 digits | Identity, UAN linking | yes (extra) | hash-based |
| UAN | 12 digits | PF universal account | yes | hash-based |
| PF Member ID | varies | PF account at specific establishment | yes | direct |
| ESI Number | 17 digits (10+'-'+ check) | ESIC IP number | yes | hash-based |
| Passport | 8 chars | Travel | yes | direct |
| Voter ID | 10 chars | Identity | yes | direct |
| Driving License | varies | Identity | yes | direct |
| PRAN | 12 digits | NPS | yes | direct |
| UDID | varies | Disability | yes | direct |

## Encryption pattern

```typescript
interface EncryptedString {
  ciphertext: string;       // base64
  iv: string;               // base64; unique per encryption
  algorithm: 'aes-256-gcm';
  keyId: string;            // KMS key identifier (e.g., 'aws-kms:alias/hrms-pii')
  authTag: string;          // GCM authentication tag
  // No plaintext stored; ever
}
```

### Key management

`[DECISION]` AES-256-GCM with envelope encryption:

- Master key in KMS (AWS KMS, GCP KMS, Azure Key Vault, or self-hosted Vault)
- Per-tenant data key derived from master key
- Per-record IV (12 bytes, random)
- Authentication tag prevents tampering

```typescript
async function encryptPII(plaintext: string, tenantId: ObjectId): Promise<EncryptedString> {
  const dataKey = await kms.deriveKeyForTenant(tenantId, 'pii');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', dataKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    algorithm: 'aes-256-gcm',
    keyId: kms.currentKeyId('pii'),
  };
}

async function decryptPII(encrypted: EncryptedString, tenantId: ObjectId): Promise<string> {
  const dataKey = await kms.deriveKeyForTenant(tenantId, 'pii', encrypted.keyId);
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    dataKey,
    Buffer.from(encrypted.iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, 'base64')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}
```

### Key rotation

- Master key rotated annually
- On rotation: new key activates; old key remains for decryption
- Background re-encryption job moves data to new key over 30 days
- Old key destroyed after all data re-encrypted

### Hash for lookup

To answer "is this PAN already registered?" without decrypting every PAN, store a deterministic HMAC-SHA-256 hash:

```typescript
function panHash(pan: string, tenantId: ObjectId): string {
  // tenant-scoped HMAC, prevents cross-tenant rainbow tables
  const key = hmacKeys.forTenant(tenantId);
  return crypto.createHmac('sha256', key).update(pan.toUpperCase()).digest('hex');
}

// Usage
const employee = await Employee.findOne({
  tenantId,
  'identity.panHash': panHash(searchPan, tenantId),
});
```

The HMAC key is per-tenant. A breach of one tenant's hashes does not enable lookup in another tenant's data. HMAC keys themselves are stored in KMS.

## PAN

### Format

10 characters: `[A-Z]{5}[0-9]{4}[A-Z]`

Example: `ABCDE1234F`

Position 4 indicates entity type:
- `P` = Individual
- `F` = Firm / LLP
- `C` = Company
- `H` = HUF
- `A` = AOP (Association of Persons)
- `T` = Trust
- `B` = BOI (Body of Individuals)
- `L` = Local Authority
- `J` = Artificial Juridical Person
- `G` = Government

For employees, expect `P`. If something else, flag for review.

### Validation

```typescript
function isValidPan(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan);
}

function panEntityType(pan: string): string {
  const codes = { P: 'individual', F: 'firm', C: 'company', H: 'huf', A: 'aop', T: 'trust', B: 'boi', L: 'local-authority', J: 'artificial-juridical', G: 'government' };
  return codes[pan[3] as keyof typeof codes] ?? 'unknown';
}

function panName(pan: string, fullLegalName: string): { matches: boolean; reason?: string } {
  // PAN's 5th character (1-indexed) is typically first letter of surname for individuals
  const expectedSurnameInitial = pan[4];
  const actualSurname = fullLegalName.split(' ').pop()?.[0]?.toUpperCase();
  if (expectedSurnameInitial !== actualSurname) {
    return { matches: false, reason: 'Surname initial does not match PAN 5th character' };
  }
  return { matches: true };
}
```

### Verification (online)

`[v2]` PAN-Aadhaar linking verification via NSDL API or Income Tax e-filing portal API. Returns:
- PAN status (valid / invalid / inoperative)
- Name on PAN
- PAN-Aadhaar linked? (yes/no)
- Date of last update

If PAN is inoperative (not linked to Aadhaar by deadline `[VERIFY: current deadline]`), TDS deduction is at higher rate per section 206AA. The HRMS must flag inoperative PANs.

## Aadhaar

`[CRITICAL]` Aadhaar handling is regulated by the Aadhaar Act 2016 + Aadhaar (Authentication & Offline Verification) Regulations 2021 + DPDPA 2023.

### Storage rules

- **Never store full Aadhaar in plaintext anywhere** (database, logs, cache, screen output, exports)
- Always encrypted; access logged
- Display: masked as `XXXX-XXXX-1234` (last 4 only)
- Full Aadhaar visible only with elevated permission and audit log entry
- Never include in payslips, statutory files (where not required), or non-compliance reports

### Format

12 digits. Verhoeff checksum (a base-10 checksum scheme). Validation:

```typescript
function isValidAadhaar(aadhaar: string): boolean {
  if (!/^\d{12}$/.test(aadhaar)) return false;
  return verhoeffCheck(aadhaar);
}

// Verhoeff implementation
const verhoeffD = [/* Dihedral group D5 multiplication table */];
const verhoeffP = [/* permutation table */];

function verhoeffCheck(num: string): boolean {
  let c = 0;
  const reversed = num.split('').reverse();
  for (let i = 0; i < reversed.length; i++) {
    c = verhoeffD[c][verhoeffP[i % 8][parseInt(reversed[i])]];
  }
  return c === 0;
}
```

`[VERIFY]` Use a tested library like `aadhaar-validator` or write Verhoeff carefully. The first 4 digits should be non-zero (some implementations check this).

### Verification

Three modes (regulated):

1. **Offline e-KYC**: Customer uploads XML+share-code from UIDAI. Verify signature.
2. **Online OTP-based authentication**: Requires UIDAI-licensed AUA (Authentication User Agency). Most HRMS use a partner like Cashfree / Zoop / IDfy.
3. **Biometric authentication**: At-source via biometric device. Rare in HRMS.

`[v2]` Integration with DigiLocker for Aadhaar XML retrieval.

### Aadhaar masking

UIDAI mandates that whenever Aadhaar is displayed, only the last 4 digits should be visible:

```typescript
function maskAadhaar(aadhaar: string): string {
  if (!aadhaar || aadhaar.length !== 12) return 'XXXX-XXXX-XXXX';
  return `XXXX-XXXX-${aadhaar.slice(-4)}`;
}
```

## UAN (Universal Account Number)

12 digits. Issued by EPFO. Unique per individual; remains the same across employers throughout life.

### Format

`[VERIFY]` UAN format: 12 digits, no dashes, no checksum (UIDAI doesn't apply Verhoeff to UAN).

### Generation

UAN is allotted by EPFO:
- For new employees with no PF history: employer initiates allotment via EPFO portal
- For employees with prior PF: existing UAN from previous employer carries forward

Implementation:

1. On hire, ask employee for existing UAN
2. If not provided, ask if they had previous PF; if yes, prompt to fetch from previous employer / UAN passbook
3. If no previous PF, employer initiates allotment via EPFO
4. Once UAN known, map to current employer's PF establishment; generates a new "Member ID" under the same UAN

### KYC linking

Each UAN must be KYC-linked:
- Aadhaar linked
- PAN linked
- Bank account linked

EPFO requires KYC for PF withdrawal / advance / transfer. The HRMS should track KYC status per employee:

```typescript
interface UanKycStatus {
  uan: EncryptedString;
  aadhaarLinked: boolean;
  aadhaarLinkedOn?: Date;
  panLinked: boolean;
  panLinkedOn?: Date;
  bankLinked: boolean;
  bankLinkedOn?: Date;
  digitallySignedByEmployer: boolean;
  fullyKycCompliant: boolean;       // all of above
}
```

### Multiple member IDs under one UAN

When employee transfers between employers (or between entities of same tenant), a new Member ID is created under the same UAN. The HRMS tracks all member IDs:

```typescript
interface PfMemberIdRecord {
  uan: EncryptedString;
  establishmentCode: string;
  memberId: string;
  employerName: string;
  fromDate: string;
  toDate?: string;
  isCurrent: boolean;
  pfTransferToCurrent?: { initiatedOn?: Date; completedOn?: Date };
}
```

Most companies don't transfer balances on inter-entity transfer; employee initiates Form 13 themselves.

## ESI Number

17-character format: `[10 digits]-[5 digits]-[1 digit check]` `[VERIFY]`.

ESIC issues "IP Number" (Insured Person Number) on first ESI registration. Travels with employee across employers (similar to UAN).

### Allotment flow

1. Employee earnings ≤ ₹21,000 ceiling → eligible
2. Employer registers employee on ESIC portal
3. ESIC issues IP Number
4. ESIC issues Pehchan Card (digital + physical)
5. Family members nominated for medical benefits

### Lifecycle

ESI eligibility changes mid-period (employee gets a raise that takes them above ceiling) — has special handling:

- Per ESI Act, once an employee enters a contribution period (April-Sept or Oct-March), they remain contributory for that entire period even if wages rise above ceiling
- Next period, eligibility re-assessed
- The HRMS rules engine handles this in `/03-payroll/`; CompensationRecord just stores opt-in status

## Passport

For employees with international travel responsibilities. Standard format: 8 alphanumerics. Expiry tracked; alert sent 6 months before expiry.

## Driving License

Format varies by state. Two forms:
- Traditional: 13–16 chars including state code
- Smart card: 14 chars

Stored encrypted, expiry tracked.

## Voter ID (EPIC)

10 chars: `[A-Z]{3}[0-9]{7}`. Some older formats vary. Used as alternate identity proof.

## Storage layout in Employee

```typescript
interface EmployeeIdentitySection {
  pan: EncryptedString;
  panHash: string;                     // for lookup
  panEntityType: string;               // 'individual' typically
  panName?: string;                    // name on PAN (from verification)
  panNameMatchesLegalName?: boolean;   // computed
  panInoperative?: boolean;            // if Aadhaar-PAN unlinked
  panVerifiedOn?: Date;
  panVerificationSource?: 'manual' | 'nsdl' | 'incometax-portal';

  aadhaar?: EncryptedString;
  aadhaarHash?: string;
  aadhaarVerifiedOn?: Date;
  aadhaarVerificationSource?: 'manual' | 'digilocker' | 'esign-flow' | 'online-otp';
  aadhaarMaskedDisplay?: string;       // 'XXXX-XXXX-1234' — for UI

  passport?: EncryptedString;
  passportHash?: string;
  passportExpiry?: string;
  passportIssuedAt?: string;

  drivingLicense?: EncryptedString;
  drivingLicenseExpiry?: string;

  voterId?: EncryptedString;
}

interface EmployeeStatutorySection {
  uan?: EncryptedString;
  uanHash?: string;
  uanKyc?: UanKycStatus;
  pfMemberIds?: PfMemberIdRecord[];

  esiNumber?: EncryptedString;
  esiNumberHash?: string;
  esiVerifiedOn?: Date;
  esiDispensaryAssigned?: string;
  esiPehchanCardIssued?: boolean;

  pranNumber?: EncryptedString;        // NPS
}
```

## Access control

| Field | Read self | Read manager | Read HR Exec | Read HR Mgr | Read Payroll Admin |
|---|---|---|---|---|---|
| `pan` (masked) | full | mask only | mask | full | full |
| `pan` (full) | yes | no | no | yes (audit) | yes (audit) |
| `aadhaar` (masked) | last4 | hidden | mask | mask | mask |
| `aadhaar` (full) | yes (own) | no | no | yes (audit) | yes (audit) |
| `uan` | yes | mask | mask | full | full |
| `passport` | yes | no | mask | full | full |
| `pranNumber` | yes | no | mask | full | full |

Audit log entry created every time an "audit" cell is read.

## Display layer

All API responses through GraphQL/REST automatically apply masking based on the requesting user's permissions. Plaintext is **never** returned without a permission check. Even with permission, plaintext requires an explicit `unmask=true` query param, which triggers an audit log.

```typescript
// Default response
{
  "pan": { "masked": "AB****1234B" }
}

// With unmask=true and permission
{
  "pan": { "masked": "AB****1234B", "full": "ABCDE1234F" }
}
```

## Logging restrictions

- Application logs MUST NOT contain plaintext PII
- Stack traces MUST NOT contain plaintext PII
- Error responses MUST NOT echo plaintext PII back to caller
- BullMQ job arguments MUST NOT contain plaintext PII (use IDs, decrypt in worker)

Lint rules / static analysis to enforce.

## Verification (v2 features)

A "Verification Service" abstraction:

```typescript
interface VerificationService {
  verifyPan(pan: string): Promise<PanVerificationResult>;
  verifyAadhaar(aadhaar: string, otp?: string): Promise<AadhaarVerificationResult>;
  verifyAadhaarPanLink(aadhaar: string, pan: string): Promise<boolean>;
  verifyUanKyc(uan: string): Promise<UanKycResult>;
  verifyBankAccount(account: string, ifsc: string, name: string): Promise<BankVerificationResult>;
}
```

Implementations:
- `IdfyVerificationService`
- `OnGridVerificationService`
- `CashfreeVerificationService`
- `MockVerificationService` (for tests / dev)

Tenant chooses provider in settings.

## Open questions

`[OPEN]` Aadhaar reference number vs Aadhaar number. UIDAI introduced Virtual ID (VID) — a 16-digit number that maps to Aadhaar. Should we accept VID? Recommended: yes, support both; VID is preferable for privacy.

`[OPEN]` Should we offer "Aadhaar-less" mode for tenants who don't want to handle Aadhaar at all? Possible (PF works with PAN-only KYC `[VERIFY]`). Add tenant flag `aadhaarCollectionDisabled`.

`[OPEN]` PF KYC partial states. EPFO has 13 KYC fields (Aadhaar, PAN, Bank, IFSC, Driving License, etc.). Track each individually or aggregate? Recommended: store aggregated `fullyKycCompliant` derived from individual flags.

`[OPEN]` What's the data retention for these IDs after employee separation? Statutory minimum (7 years for tax) for PAN. Aadhaar may need shorter retention under DPDPA. Conservative: align with statutory archive period.

## Cross-references

- See [01-employee-master-schema.md](./01-employee-master-schema.md) for full Employee schema
- See [05-documents-and-kyc.md](./05-documents-and-kyc.md) for ID document storage (scans of PAN card, Aadhaar card)
- See [/00-foundations/04-audit-and-compliance-hooks.md](../00-foundations/04-audit-and-compliance-hooks.md) for audit log on PII access
- See [/04-compliance/01-pf-act-and-formulas.md](../04-compliance/01-pf-act-and-formulas.md) (Phase 3) for UAN-PF integration
- See [/04-compliance/03-tds-and-income-tax.md](../04-compliance/03-tds-and-income-tax.md) (Phase 3) for PAN-TDS integration
