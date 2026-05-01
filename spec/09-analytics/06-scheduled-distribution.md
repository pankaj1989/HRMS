# 06 — Scheduled Distribution

## Purpose

Reports and dashboards delivered automatically on schedule — daily attendance summary, weekly payroll preview, monthly compliance status, quarterly KPI digests. Reduces "where's the report?" pings.

## Schedule schema

```typescript
interface ScheduledDistribution extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  
  scheduleCode: string;
  scheduleName: string;
  
  // content
  reportCode: string;
  filters?: any;
  format: 'pdf' | 'excel' | 'csv' | 'in-app';
  
  // schedule
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'custom';
  
  // for daily
  timeOfDay: string;                       // 'HH:mm' local time
  timeZone: string;
  
  // for weekly
  daysOfWeek?: number[];                   // [1,2,3,4,5] = Mon-Fri
  
  // for monthly
  dayOfMonth?: number;                     // 1-31; -1 = last day
  
  // for quarterly
  quarterOffset?: number;                  // days from quarter start
  
  // custom cron
  cronExpression?: string;
  
  // recipients
  recipientEmployeeIds?: ObjectId[];
  recipientRoles?: string[];               // dynamic resolution
  recipientEmails?: string[];              // external
  
  // delivery channels
  channels: ('email' | 'in-app' | 'webhook' | 'shared-folder')[];
  
  // email config
  emailSubject: string;                    // template-able
  emailBody?: string;
  
  // attachments
  attachOutputAsFile: boolean;             // attach PDF/Excel
  inlineSummary: boolean;                  // include summary in email body
  
  // conditional sending
  sendIf?: {
    condition: 'always' | 'has-data' | 'value-change' | 'threshold-breach';
    threshold?: number;
    metric?: string;
  };
  
  // execution
  isActive: boolean;
  
  lastRunAt?: Date;
  lastRunStatus?: 'success' | 'failed' | 'skipped' | 'partial';
  lastRunErrorMessage?: string;
  
  nextScheduledAt: Date;
  
  // history
  totalRunsExecuted: number;
  totalSuccesses: number;
  totalFailures: number;
  
  // metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
  isDeleted: boolean;
}
```

## Standard scheduled distributions (templates)

Pre-defined templates tenants can activate:

### Daily

| Code | Distribution | Recipients |
|---|---|---|
| `daily-attendance-am` | 9:00 AM attendance summary | HR Manager, Tenant Admin |
| `daily-late-comers` | 11:00 AM late comers list | HR Manager |
| `daily-pending-approvals` | 9:00 AM pending approvals digest | All managers |
| `daily-helpdesk-status` | 9:00 AM tickets summary | HR Operations |

### Weekly

| Code | Distribution | Recipients |
|---|---|---|
| `weekly-payroll-preview` | Mon 9:00 AM (week before payroll) | HR Manager, Finance |
| `weekly-team-leave-calendar` | Mon 9:00 AM team calendar | All managers |
| `weekly-recruitment-funnel` | Mon 10:00 AM | Recruiters, HR Head |
| `weekly-performance-cycle-progress` | Mon 11:00 AM | HR Business Partners |
| `weekly-engagement-pulse` | Fri 4:00 PM | Tenant Admin |

### Monthly

| Code | Distribution | Recipients |
|---|---|---|
| `monthly-payroll-summary` | 5th of month (post-payroll close) | Finance, Tenant Admin |
| `monthly-compliance-status` | 25th of month | Compliance Officer, HR Head |
| `monthly-attrition-report` | 5th of month | HR Head, Tenant Admin |
| `monthly-headcount-summary` | 5th of month | Tenant Admin, Department Heads |
| `monthly-training-spend` | 5th of month | L&D Manager |

### Quarterly

| Code | Distribution | Recipients |
|---|---|---|
| `quarterly-org-overview` | First Monday of quarter | Tenant Admin, Board |
| `quarterly-recruitment-summary` | First Monday of quarter | HR Head, Recruiters |
| `quarterly-performance-summary` | After cycle close | HR Head, Tenant Admin |
| `quarterly-compliance-audit` | First Monday of quarter | Compliance Officer |
| `quarterly-financial-summary` | First Monday of quarter | Finance, Tenant Admin |

### Annual

| Code | Distribution | Recipients |
|---|---|---|
| `annual-statutory-readiness` | Start of FY | Compliance Officer |
| `annual-recruitment-trends` | End of FY | HR Head, Tenant Admin |
| `annual-attrition-deep-dive` | End of FY | HR Head, Tenant Admin |
| `annual-comp-survey` | Mid-year (industry survey period) | Tenant Admin |

## Execution flow

```mermaid
sequenceDiagram
    participant Scheduler
    participant Engine as Report Engine
    participant Storage as S3/Storage
    participant Email
    participant InApp
    participant Webhook
    
    Scheduler->>Scheduler: cron triggers
    Scheduler->>Scheduler: lookup ScheduledDistribution
    Scheduler->>Engine: run report with filters
    Engine->>Engine: compute report
    Engine->>Storage: store output (PDF/Excel)
    
    par Email
        Scheduler->>Email: send to recipients (with attachment / link)
    and In-App
        Scheduler->>InApp: notification with link
    and Webhook
        Scheduler->>Webhook: POST to tenant webhook
    end
    
    Scheduler->>Scheduler: update lastRunAt; nextScheduledAt
    Scheduler->>Storage: cleanup old outputs (retention)
```

## Conditional sending

Skip if no value:

```typescript
{
  sendIf: { condition: 'has-data' }       // only send if report has rows
}
```

Threshold breach alert:

```typescript
{
  reportCode: 'attrition-rate',
  sendIf: {
    condition: 'threshold-breach',
    metric: 'attritionRate',
    threshold: 25,                         // alert if > 25%
  }
}
```

Value change:

```typescript
{
  sendIf: {
    condition: 'value-change',
    metric: 'pendingApprovals',
  }
}
```

## Email template

```html
Subject: {tenantName} - {scheduleName} - {periodLabel}

Dear {recipientName},

Your {scheduleName} for {periodLabel} is ready.

Summary:
{inlineSummaryHtml}

[ View Full Report ]

This is an automated email. To unsubscribe or modify schedule, visit your HRMS dashboard.

Best regards,
{tenantName} HRMS
```

## Smart insights (v2)

Distributions can include AI-generated insights:

```
Subject: Weekly Attrition Report - April 22, 2026

Summary:
This week's attrition rate is 1.2%, slightly above your 12-month average of 1.1%.

Key insights:
• Engineering team saw 2 separations this week (notice in last 14 days: 3)
• Top reason: "Better opportunity" (3 of 5 separations)
• Compared to industry benchmark (1.5%/week), still healthy

Recommendation:
Consider engagement check-ins with Engineering team this week.

[ View Full Report ]
```

`[v3]` Generative AI summaries.

## Throttling

To prevent overwhelming recipients:
- Max 1 email per hour per scheduled distribution
- Aggregated digests preferred for high-frequency

## Bounces and failures

If email bounces:
- Log
- Retry next scheduled run
- After 3 consecutive failures: deactivate
- Notify scheduler creator

## Tenant configuration

Per-tenant defaults:
- Default time zone
- Email branding (logo, colors)
- Language
- Distribution lists
- Footer / signature

## Distribution lists

Reusable groups of recipients:

```typescript
interface DistributionList {
  listCode: string;
  listName: string;
  
  members: Array<{
    type: 'employee' | 'role' | 'external-email';
    employeeId?: ObjectId;
    role?: string;
    email?: string;
  }>;
  
  isActive: boolean;
}
```

Example:
- "Leadership" = Tenant Admin + All HR Heads + All Department Heads
- "Compliance Team" = Compliance Officer + HR Head + Legal
- "Finance Team" = CFO + Finance Head + Payroll Manager

## Reports

- **Schedule Health**: success rate per scheduled distribution
- **Delivery Status**: bounces, opens
- **Recipient Engagement**: open rates, click-through (v2 with email tracking)

## Open questions

`[OPEN]` Slack / Teams delivery (in addition to email). Recommend: v2; integration via webhooks.

`[OPEN]` Recipient feedback / unsubscribe. Recommend: simple link in every email.

`[OPEN]` Smart timing (deliver when recipient typically opens email). Recommend: v3.

`[OPEN]` Cross-tenant sharing (e.g., consultant sharing report across multiple tenants). Recommend: explicit per-tenant setup; never automatic cross-tenant.

## Cross-references

- [01-reports-architecture.md](./01-reports-architecture.md) — backend
- [02-standard-reports-catalog.md](./02-standard-reports-catalog.md) — reports catalog
- [05-exports-and-api.md](./05-exports-and-api.md) — file generation
- [/07-ess-mobile/00-overview.md](../07-ess-mobile/00-overview.md) — in-app notifications
