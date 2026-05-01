# 04 — Workflow Templates

## Purpose

Pre-built workflow templates ship with the platform. Tenants can use as-is or customize. This file lists all templates with their default configurations.

## Template categories

1. **Leave & Attendance**
2. **Recruitment & Hiring**
3. **Compensation & Comp Revision**
4. **Performance Management**
5. **Separation & F&F**
6. **Expense & Reimbursement**
7. **Asset & Access**
8. **Documents & Compliance**

## Template schema

```typescript
interface WorkflowTemplate extends BaseDocument {
  _id: ObjectId;
  
  templateCode: string;                    // 'LEAVE-STANDARD', 'OFFER-STANDARD', etc.
  templateName: string;
  category: string;
  description: string;
  
  // applicability
  entityType: WorkflowEntityType;
  
  // defaults
  defaultStates: WorkflowState[];
  defaultTransitions: WorkflowTransition[];
  defaultApprovalChain: ApprovalChainConfig;
  defaultEscalationPolicy: EscalationPolicy;
  defaultNotificationConfig: NotificationConfig;
  
  // metadata
  recommendedFor: ('white-collar' | 'blue-collar' | 'senior-leadership' | 'all')[];
  tenantSizeBuckets: ('small' | 'mid' | 'large' | 'enterprise')[];
  
  isShipped: boolean;                      // shipped by platform
  version: string;
}
```

## Templates catalog

### LEAVE-STANDARD

| Aspect | Value |
|---|---|
| Description | Standard leave application flow |
| States | draft → pending-manager → pending-hr (conditional) → approved/rejected |
| Approvers | Direct manager (always); HR Manager (for ML, sabbatical, extended) |
| SLA | Manager 48h, HR 24h, Total 72h |
| Delegation | Allowed |
| Escalation | Standard SLA escalation |

### LEAVE-LOP-CONFIRMATION

| Aspect | Value |
|---|---|
| Description | Loss of Pay leave (paycheck impact); requires HR confirmation |
| Approvers | Direct manager → HR Manager |
| SLA | 48h each |

### REGULARIZATION-STANDARD

| Aspect | Value |
|---|---|
| Description | Attendance regularization |
| Approvers | Direct manager → (HR for missing > 5 days) |
| SLA | Manager 48h |

### OVERTIME-CLAIM

| Aspect | Value |
|---|---|
| Description | OT claim approval |
| Approvers | Direct manager → Department Head (if OT > 20h/month) |
| SLA | 48h, 72h |

### REQUISITION-STANDARD

| Aspect | Value |
|---|---|
| Description | Job requisition approval |
| Approvers | Reporting Manager → HR Manager → Finance Head (if budget exceeds plan) |
| SLA | Manager 48h, HR 48h, Finance 72h |
| Conditions | Headcount within plan; budget within range |

### REQUISITION-NEW-POSITION

| Aspect | Value |
|---|---|
| Description | New position not in headcount plan |
| Approvers | Reporting Manager → HR Head → Finance Head → Tenant Admin |
| SLA | Long; up to 14 days |

### OFFER-STANDARD

| Aspect | Value |
|---|---|
| Description | Standard offer; CTC ≤ ₹30L |
| Approvers | Hiring Manager → HR Manager |
| SLA | 48h each |

### OFFER-MID-SENIOR

| Aspect | Value |
|---|---|
| Description | Senior offer; CTC > ₹30L |
| Approvers | Hiring Manager → HR Manager → Department Head → Finance Head |
| SLA | Up to 5 days |

### OFFER-LEADERSHIP

| Aspect | Value |
|---|---|
| Description | Leadership offer; CTC > ₹75L |
| Approvers | Hiring Manager → HR Head → Department Head → Finance Head → Tenant Admin |
| SLA | Up to 10 days |

### COMP-REVISION-STANDARD

| Aspect | Value |
|---|---|
| Description | Annual increment / promotion-driven |
| Approvers | Direct manager → HR Business Partner → Department Head → Finance Head |
| SLA | 48h each |
| Conditions | Hike % ≤ 15%; total within budget |

### COMP-REVISION-EXCEPTIONAL

| Aspect | Value |
|---|---|
| Description | Exceptional hike (> 15%) or out-of-cycle |
| Approvers | Standard chain + Tenant Admin |
| SLA | Up to 10 days |

### PROMOTION-STANDARD

| Aspect | Value |
|---|---|
| Description | Promotion within level (e.g., L3 IC to L4 IC) |
| Approvers | Direct manager → HR Manager → Department Head → Skip-level Manager |
| SLA | Up to 7 days |

### PROMOTION-CROSS-TRACK

| Aspect | Value |
|---|---|
| Description | IC to Management track or similar |
| Approvers | Standard chain + HR Head + Tenant Admin |
| SLA | Up to 14 days |

### PERFORMANCE-REVIEW-CYCLE

| Aspect | Value |
|---|---|
| Description | Annual / mid-year review cycle |
| Approvers | Self → Manager → Skip-level → Calibration |
| SLA | Long; per phase 7 days |

### PIP-INITIATION

| Aspect | Value |
|---|---|
| Description | PIP plan approval |
| Approvers | Direct manager → HR Business Partner → HR Head + Legal |
| SLA | 5 days |

### TRANSFER-STANDARD

| Aspect | Value |
|---|---|
| Description | Internal transfer (location, department, role) |
| Approvers | Current manager → New manager → HR Manager → HR Business Partner |
| SLA | Up to 7 days |

### SEPARATION-RESIGNATION

| Aspect | Value |
|---|---|
| Description | Employee-initiated resignation |
| Approvers | Direct manager (acknowledgment) → HR Manager (acceptance) |
| SLA | 48h each |

### SEPARATION-TERMINATION

| Aspect | Value |
|---|---|
| Description | Employer-initiated termination |
| Approvers | Direct manager → HR Manager → HR Head → Legal → Tenant Admin |
| SLA | Up to 7 days; legal review critical |

### FNF-CLEARANCE

| Aspect | Value |
|---|---|
| Description | F&F multi-clearance |
| Approvers | Manager + IT + Finance + Admin (parallel) → HR Final |
| SLA | 72 hours |

### EXPENSE-CLAIM-STANDARD

| Aspect | Value |
|---|---|
| Description | Standard expense reimbursement |
| Approvers | Manager (always) → Department Head (if > ₹25K) → Finance (if > ₹100K) |
| SLA | 48h, 72h, 96h |

### EXPENSE-CLAIM-TRAVEL

| Aspect | Value |
|---|---|
| Description | Travel-related expenses with travel claim form |
| Approvers | Manager → Travel Desk → Finance |
| SLA | Up to 7 days |

### ASSET-REQUISITION

| Aspect | Value |
|---|---|
| Description | Equipment / asset request |
| Approvers | Manager → IT/Admin Manager → Procurement (if > ₹50K) |
| SLA | 48h, 72h |

### ACCESS-REQUEST

| Aspect | Value |
|---|---|
| Description | System / application access |
| Approvers | Manager → System Owner → Security (for sensitive systems) |
| SLA | 48h each |

### TRAINING-REQUEST

| Aspect | Value |
|---|---|
| Description | Training / certification request |
| Approvers | Manager → L&D Manager → Finance (if > ₹50K) |
| SLA | Up to 7 days |

### TRAVEL-REQUEST

| Aspect | Value |
|---|---|
| Description | Domestic / international travel request |
| Approvers | Manager → Department Head (if > 5 days) → Travel Desk |
| SLA | Up to 5 days |

### POLICY-ACKNOWLEDGMENT

| Aspect | Value |
|---|---|
| Description | New policy acknowledgment by employee |
| Approvers | None (one-way; employee acknowledges) |
| SLA | Reminder cadence; 30-day deadline |

### DOCUMENT-APPROVAL

| Aspect | Value |
|---|---|
| Description | Generic document review |
| Approvers | Configurable per document type |
| SLA | Configurable |

## Template customization

Tenants can:
1. Use template as-is
2. Override specific config (SLAs, approvers)
3. Clone and create custom workflow

```typescript
interface TenantWorkflowOverride {
  tenantId: ObjectId;
  baseTemplateCode: string;
  
  overrides: {
    states?: Partial<WorkflowState>[];
    transitions?: Partial<WorkflowTransition>[];
    approvalChain?: Partial<ApprovalChainConfig>;
    escalationPolicy?: Partial<EscalationPolicy>;
    notificationConfig?: Partial<NotificationConfig>;
  };
  
  isActive: boolean;
}
```

## Activating a template

When tenant activates:
1. Template config copied to WorkflowDefinition
2. Tenant overrides applied
3. WorkflowDefinition saved
4. Activate (effectiveFrom = today)

## Deactivating

When tenant deactivates:
- Existing instances continue
- New requests blocked / use fallback workflow
- Audit log

## Migration when tenants update template

Template version 2 ships with improved chain:
- Existing v1 instances unaffected (pinned)
- New instances use v2

Tenant can migrate active instances to v2 (with care):
- Confirmation required
- All affected instances reset (pending approval re-routed)
- Audit log

## Open questions

`[OPEN]` Template marketplace / tenant-shared templates: out of v1 scope.

`[OPEN]` Industry-specific defaults (manufacturing vs IT vs retail). Recommend: yes; bundle by tenant signup industry.

`[OPEN]` AI-suggested approval chain based on past patterns. Recommend: v3.

`[OPEN]` Workflow simulation (test before activating). Recommend: yes, valuable for tenants.

## Cross-references

- [01-workflow-engine.md](./01-workflow-engine.md) — engine
- [02-approval-chains.md](./02-approval-chains.md) — chains
- All other modules use these templates
