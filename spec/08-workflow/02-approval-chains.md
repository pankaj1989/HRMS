# 02 — Approval Chains

## Purpose

Approval chains define the sequence and conditions under which an action requires approvals. Effective chains balance compliance, speed, and flexibility.

## Chain configuration schema

```typescript
interface ApprovalChainConfig {
  chainCode: string;
  
  // type
  chainType: 'sequential' | 'parallel-all' | 'parallel-any-n' | 'hybrid';
  
  // for parallel-any-n
  minimumApprovals?: number;
  
  // steps
  steps: ApprovalStep[];
  
  // conditions for chain selection
  preConditions?: WorkflowCondition[];
  
  // SLA
  totalSlaInHours?: number;
  perStepSlaInHours?: number;
  
  // notifications
  notifyAllApproversAtOnce: boolean;       // for sequential, false typically
  
  // skip conditions
  allowApproverSkipIfUnavailable: boolean;
  
  // self-approval
  allowSelfApproval: boolean;              // typically false
  
  // delegation enabled
  delegationAllowed: boolean;
}

interface ApprovalStep {
  sequence: number;
  stepCode: string;
  stepName: string;
  
  // resolution
  approverResolution: ApproverResolution;
  
  // for parallel within step
  isParallel: boolean;
  parallelMinimumCount?: number;
  
  // conditions - is this step needed?
  requiredIf?: WorkflowCondition[];
  
  // SLA
  slaInHours?: number;
  
  // skip rules
  canBeSkipped?: boolean;
  skipConditions?: WorkflowCondition[];
}

type ApproverResolution =
  | { type: 'fixed-employees'; employeeIds: ObjectId[] }
  | { type: 'fixed-roles'; roles: string[] }
  | { type: 'requester-direct-manager' }
  | { type: 'requester-skip-manager' }
  | { type: 'requester-manager-chain'; levels: number }
  | { type: 'role-in-entity'; role: string; entityScope: 'requester-entity' | 'tenant' }
  | { type: 'department-head' }
  | { type: 'function-head'; function: string }
  | { type: 'conditional'; rules: Array<{ if: WorkflowCondition; then: ApproverResolution }> }
  | { type: 'custom-script'; scriptCode: string };
```

## Chain examples

### Leave application chain

```typescript
const leaveChain: ApprovalChainConfig = {
  chainCode: 'LEAVE-STANDARD',
  chainType: 'sequential',
  
  steps: [
    {
      sequence: 1,
      stepCode: 'manager-approval',
      stepName: 'Manager Approval',
      approverResolution: { type: 'requester-direct-manager' },
      slaInHours: 48,
      canBeSkipped: false,
    },
    {
      sequence: 2,
      stepCode: 'hr-approval',
      stepName: 'HR Manager Approval',
      approverResolution: { type: 'role-in-entity', role: 'hr-manager', entityScope: 'requester-entity' },
      slaInHours: 24,
      requiredIf: [
        { field: 'leaveType', operator: 'in', value: ['maternity', 'paternity', 'sabbatical', 'medical-extended'] },
      ],
    },
  ],
  
  totalSlaInHours: 72,
  delegationAllowed: true,
  allowSelfApproval: false,
};
```

### Offer approval chain (CTC-conditional)

```typescript
const offerChain: ApprovalChainConfig = {
  chainCode: 'OFFER-STANDARD',
  chainType: 'sequential',
  
  steps: [
    {
      sequence: 1,
      stepCode: 'hiring-manager',
      approverResolution: { type: 'requester-direct-manager' },
      slaInHours: 48,
    },
    {
      sequence: 2,
      stepCode: 'hr-manager',
      approverResolution: { type: 'role-in-entity', role: 'hr-manager', entityScope: 'requester-entity' },
      slaInHours: 48,
    },
    {
      sequence: 3,
      stepCode: 'finance-head',
      approverResolution: { type: 'role-in-entity', role: 'finance-head', entityScope: 'requester-entity' },
      slaInHours: 72,
      requiredIf: [
        { field: 'proposedCtc', operator: 'gt', value: 3000000 },
      ],
    },
    {
      sequence: 4,
      stepCode: 'tenant-admin',
      approverResolution: { type: 'role-in-entity', role: 'tenant-admin', entityScope: 'tenant' },
      slaInHours: 96,
      requiredIf: [
        { field: 'proposedCtc', operator: 'gt', value: 7500000 },
      ],
    },
  ],
  
  totalSlaInHours: 240,                    // 10 days max
  delegationAllowed: true,
};
```

### Expense claim chain (multi-amount)

```typescript
const expenseChain: ApprovalChainConfig = {
  chainCode: 'EXPENSE-STANDARD',
  chainType: 'sequential',
  
  steps: [
    {
      sequence: 1,
      stepCode: 'manager',
      approverResolution: { type: 'requester-direct-manager' },
      slaInHours: 48,
      requiredIf: [
        { field: 'amount', operator: 'gte', value: 5000 },
      ],
    },
    {
      sequence: 2,
      stepCode: 'department-head',
      approverResolution: { type: 'department-head' },
      requiredIf: [
        { field: 'amount', operator: 'gt', value: 25000 },
      ],
      slaInHours: 72,
    },
    {
      sequence: 3,
      stepCode: 'finance',
      approverResolution: { type: 'role-in-entity', role: 'finance-head', entityScope: 'requester-entity' },
      requiredIf: [
        { field: 'amount', operator: 'gt', value: 100000 },
      ],
      slaInHours: 96,
    },
  ],
  
  totalSlaInHours: 240,
  delegationAllowed: true,
};
```

### Performance review chain

```typescript
const reviewChain: ApprovalChainConfig = {
  chainCode: 'PERFORMANCE-REVIEW',
  chainType: 'hybrid',
  
  steps: [
    {
      sequence: 1,
      stepCode: 'self-assessment',
      approverResolution: { type: 'fixed-employees', employeeIds: [] },  // dynamic = the requester
      slaInHours: 168,                     // 7 days
    },
    {
      sequence: 2,
      stepCode: 'manager-review',
      approverResolution: { type: 'requester-direct-manager' },
      slaInHours: 168,
    },
    {
      sequence: 3,
      stepCode: 'skip-level-review',
      approverResolution: { type: 'requester-manager-chain', levels: 2 },
      slaInHours: 96,
      canBeSkipped: true,
      skipConditions: [
        { field: 'designationLevel', operator: 'in', value: ['L1', 'L2'] },  // junior; skip-level skips
      ],
    },
    {
      sequence: 4,
      stepCode: 'calibration',
      approverResolution: { type: 'role-in-entity', role: 'hr-business-partner', entityScope: 'requester-entity' },
      slaInHours: 168,
      isParallel: true,
    },
  ],
  
  totalSlaInHours: 720,                    // 30 days
  delegationAllowed: false,
};
```

### F&F settlement chain

```typescript
const fnfChain: ApprovalChainConfig = {
  chainCode: 'FNF-STANDARD',
  chainType: 'parallel-all',                // all clearances in parallel
  
  steps: [
    {
      sequence: 1,
      stepCode: 'manager-clearance',
      approverResolution: { type: 'requester-direct-manager' },
      slaInHours: 48,
    },
    {
      sequence: 1,
      stepCode: 'it-clearance',
      approverResolution: { type: 'role-in-entity', role: 'it-manager', entityScope: 'requester-entity' },
      slaInHours: 48,
    },
    {
      sequence: 1,
      stepCode: 'finance-clearance',
      approverResolution: { type: 'role-in-entity', role: 'finance-head', entityScope: 'requester-entity' },
      slaInHours: 48,
    },
    {
      sequence: 1,
      stepCode: 'admin-clearance',
      approverResolution: { type: 'role-in-entity', role: 'admin-manager', entityScope: 'requester-entity' },
      slaInHours: 48,
    },
    {
      sequence: 2,
      stepCode: 'hr-final-approval',
      approverResolution: { type: 'role-in-entity', role: 'hr-head', entityScope: 'requester-entity' },
      slaInHours: 24,                      // final after all clearances
    },
  ],
  
  totalSlaInHours: 72,                     // F&F 2-day SLA
  delegationAllowed: true,
};
```

## Conditional resolution

### CTC-tiered approver

```typescript
const offerApprover: ApproverResolution = {
  type: 'conditional',
  rules: [
    { if: { field: 'amount', operator: 'lte', value: 1000000 }, then: { type: 'role-in-entity', role: 'hr-manager', entityScope: 'requester-entity' } },
    { if: { field: 'amount', operator: 'lte', value: 5000000 }, then: { type: 'role-in-entity', role: 'department-head', entityScope: 'requester-entity' } },
    { if: { field: 'amount', operator: 'gt', value: 5000000 }, then: { type: 'role-in-entity', role: 'tenant-admin', entityScope: 'tenant' } },
  ],
};
```

## Approver resolution at runtime

```typescript
async function resolveApprovers(step: ApprovalStep, context: WorkflowContext): Promise<Employee[]> {
  switch (step.approverResolution.type) {
    case 'fixed-employees':
      return await Employee.find({ _id: { $in: step.approverResolution.employeeIds } });
    
    case 'fixed-roles':
      return await Employee.find({
        tenantId: context.tenantId,
        'roles.role': { $in: step.approverResolution.roles },
      });
    
    case 'requester-direct-manager':
      const requester = await Employee.findById(context.requesterEmployeeId);
      return [await Employee.findById(requester.managerId)];
    
    case 'requester-skip-manager':
      // ...resolve skip-level
    
    case 'requester-manager-chain':
      return await getManagerChain(context.requesterEmployeeId, step.approverResolution.levels);
    
    case 'role-in-entity':
      return await Employee.find({
        tenantId: context.tenantId,
        ...(step.approverResolution.entityScope === 'requester-entity' && { entityId: context.entityId }),
        'roles.role': step.approverResolution.role,
      });
    
    case 'department-head':
      // resolve dept head from org chart
    
    case 'conditional':
      const matched = step.approverResolution.rules.find(r => evaluateCondition(r.if, context));
      if (matched) return resolveApprovers({ ...step, approverResolution: matched.then }, context);
      return [];
    
    default:
      throw new Error(`Unknown resolution type: ${step.approverResolution.type}`);
  }
}
```

## Self-approval guard

If approver = requester (e.g., manager applies leave; resolves to self):
- Default: skip step (with audit) and route to next
- Or: route to manager's manager (skip-level)
- Tenant config

## Approver unavailability

If approver is on leave / not available:
- Active delegation rules apply (`/08-workflow/03`)
- Or: SLA breach → escalation
- Or: tenant-config "auto-skip" (rare; risky)

## Multiple matched approvers

If resolution returns multiple employees:
- Default: any of them can approve (parallel-any-n with n=1)
- Some workflows: all must approve (parallel-all)
- First-to-respond pattern

## Reports

- **Approval Speed**: median time per step / per chain
- **Bottlenecks**: which steps consistently delay
- **Approval Rate**: rate of approval vs reject vs reverted
- **Chain Health**: SLA breaches per chain
- **Approver Workload**: pending counts per approver

## Open questions

`[OPEN]` Threshold-based auto-approval (e.g., expense < ₹500 auto-approves). Recommend: tenant config; default require manual.

`[OPEN]` Mandatory comment for rejection. Recommend: yes; required for clarity + audit.

`[OPEN]` AI-suggested approval (for repeat-pattern actions). Recommend: v3.

`[OPEN]` 4-eyes for sensitive actions (e.g., 2 admins for terminations). Recommend: yes; specific configs.

## Cross-references

- [01-workflow-engine.md](./01-workflow-engine.md) — engine
- [03-delegation-and-escalation.md](./03-delegation-and-escalation.md) — delegation
- [04-workflow-templates.md](./04-workflow-templates.md) — pre-built chains
