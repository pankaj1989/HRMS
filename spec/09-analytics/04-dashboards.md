# 04 — Dashboards

## Purpose

Dashboards are role-based home pages with key metrics, alerts, and quick links. Different roles need different views.

## Dashboard schema

```typescript
interface Dashboard extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  
  dashboardCode: string;
  dashboardName: string;
  description: string;
  
  // applicability
  forRoles: string[];                      // 'tenant-admin', 'hr-head', 'manager', 'employee'
  forEmployeeId?: ObjectId;                // for personal dashboards
  
  // layout
  layoutType: 'grid' | 'rows' | 'columns';
  layout: Array<{
    widgetCode: string;
    position: { x: number; y: number; w: number; h: number };
    config?: any;
  }>;
  
  // template / source
  isTemplate: boolean;
  basedOnTemplateId?: ObjectId;
  
  // sharing
  isShared: boolean;
  sharedWithEmployees: ObjectId[];
  
  // status
  isActive: boolean;
  isDefault: boolean;                      // shown when role logs in
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
  isDeleted: boolean;
}

interface DashboardWidget {
  widgetCode: string;
  widgetName: string;
  widgetType: 'kpi-tile' | 'chart' | 'table' | 'alert-list' | 'quick-actions' | 'feed' | 'calendar' | 'pending-approvals';
  
  dataSource: {
    type: 'report' | 'metric' | 'custom';
    reportCode?: string;
    metricCode?: string;
  };
  
  // refresh
  refreshFrequency: 'real-time' | '5-min' | '15-min' | '1-hour' | 'daily';
  
  // visualization config
  config: any;
  
  // permissions
  visibleToRoles: string[];
}
```

## Default dashboards by role

### Employee dashboard

```
+-------------------------------------------------------+
| Welcome, [Name]                                        |
+-------------------------------------------------------+
| QUICK STATS                                            |
| [Today's Status: Checked In] [Pending Tasks: 2]       |
| [Leave Balance: EL 18.5/CL 5/SL 8] [Open Tickets: 1]  |
+-------------------------------------------------------+
| QUICK ACTIONS                                          |
| [Check Out] [Apply Leave] [View Payslip] [Raise Ticket]|
+-------------------------------------------------------+
| THIS MONTH                                             |
| Payslip: ₹1,10,482 (April 2026)                       |
| Days Worked: 22/22 | LOP: 0 | Leave: 2                |
+-------------------------------------------------------+
| UPCOMING                                               |
| • 1 May - Maharashtra Day (Holiday)                    |
| • 15 May - Performance Review Self-Assessment Due     |
| • 1 May - Payday                                      |
+-------------------------------------------------------+
| TEAM                                                   |
| 15 members | Today: 12 present, 2 leave, 1 WFH         |
+-------------------------------------------------------+
| ANNOUNCEMENTS                                          |
| • New leave policy effective May 1                    |
| • Q1 results announcement: 25 May                     |
+-------------------------------------------------------+
```

### Manager dashboard

```
+-------------------------------------------------------+
| MANAGER VIEW (Engineering Team)                        |
+-------------------------------------------------------+
| TEAM TODAY                                             |
| 12/15 present | 2 on leave | 1 WFH | 0 absent unauth.|
+-------------------------------------------------------+
| PENDING APPROVALS (4)                                  |
| • Leave: Pankaj (3 days)                              |
| • Expense: Suresh (₹3,500)                            |
| • Reg: Vikram (Apr 26)                                |
| • PIP Plan: Anita - REVIEW NEEDED                     |
+-------------------------------------------------------+
| PERFORMANCE CYCLE                                      |
| Self-assessments pending: 3                           |
| Manager assessments due: 5 (Q2 cycle)                 |
| Calibration session: 28 May                           |
+-------------------------------------------------------+
| TEAM HEALTH                                            |
| Avg engagement: 4.2/5 | Last 1:1: avg 14 days ago     |
| Open issues: 2 PIPs, 0 grievances                     |
+-------------------------------------------------------+
| BUDGET & HEADCOUNT                                     |
| FY26 Headcount: 15/18 (3 open)                        |
| Salary cost YTD: ₹1.8 Cr / ₹2.4 Cr budget             |
+-------------------------------------------------------+
| RECOGNITION                                            |
| • Pankaj completed 5 years today (5/29)               |
| • Suresh's birthday: 5 May                            |
+-------------------------------------------------------+
```

### HR Head dashboard

```
+-------------------------------------------------------+
| HR HEAD VIEW                                           |
+-------------------------------------------------------+
| ORG SNAPSHOT                                           |
| Total: 850 | New: 12 | Separations: 6 | Net: +6      |
| Attrition (12-mo): 18% | Voluntary: 14%               |
+-------------------------------------------------------+
| CURRENT MONTH                                          |
| Payroll cost: ₹4.5 Cr | Variance vs Budget: -2%       |
| Onboarding: 12 in process | Joined this month: 8      |
+-------------------------------------------------------+
| COMPLIANCE                                             |
| ⚠️ Form 24Q Q4 due in 5 days                          |
| ✓ PF Apr filed | ✓ ESI Apr filed                      |
| Inspection pack: 1 pending request                    |
+-------------------------------------------------------+
| RECRUITMENT                                            |
| Open requisitions: 18 | Avg time-to-hire: 42 days     |
| Pending offers: 4 | Pending pre-joining: 12           |
+-------------------------------------------------------+
| PERFORMANCE                                            |
| Q2 cycle progress: 45% complete                       |
| Calibration sessions scheduled: 6                     |
| Active PIPs: 4                                        |
+-------------------------------------------------------+
| ATTENTION NEEDED                                       |
| • 5 employees on long leave > 30 days                 |
| • 3 grievance tickets pending HR Head                 |
| • 2 separations in legal review                       |
+-------------------------------------------------------+
| QUICK ACTIONS                                          |
| [Run Inspection Pack] [Generate Form 16] [Export...] |
+-------------------------------------------------------+
```

### Tenant Admin (CEO/Founder) dashboard

```
+-------------------------------------------------------+
| ORGANIZATION OVERVIEW                                  |
+-------------------------------------------------------+
| HEADCOUNT                                              |
| 850 employees | YoY: +18% | This month: +6           |
+-------------------------------------------------------+
| FINANCIAL                                              |
| Payroll cost (annual): ₹54 Cr | YoY: +22%             |
| Avg comp/head: ₹6.4L                                   |
| Bonus pool: ₹4 Cr (Q4)                                |
+-------------------------------------------------------+
| ATTRITION                                              |
| 12-month rate: 18% | Industry avg: 22% (good)         |
| Top reasons: 1) Better opportunity, 2) Higher pay     |
+-------------------------------------------------------+
| DIVERSITY                                              |
| Gender (M/F): 65/35 | Leadership: 75/25 (target 60/40)|
| PWD: 1.5% | LGBTQ+: 3% (declared)                     |
+-------------------------------------------------------+
| ENGAGEMENT                                              |
| Last pulse score: 4.1/5 (down from 4.3)               |
| eNPS: +15                                              |
+-------------------------------------------------------+
| COMPLIANCE                                             |
| Statutory filings: 100% on time (last 12 months)      |
| Open litigation: 2 cases                              |
| Audit risk: Low                                       |
+-------------------------------------------------------+
| RECRUITMENT                                            |
| Open vs Plan: 18 vs 22 (4 ahead of plan)              |
| Recruiter productivity: 6 hires/recruiter/quarter     |
+-------------------------------------------------------+
```

## Widget types

### KPI tile

Single metric prominent display:

```
┌─────────────────────────┐
│ Headcount                │
│ 850                      │
│ ↑ 18% vs last year       │
│ ↑ 6 this month           │
└─────────────────────────┘
```

### Chart

Line, bar, pie, etc. from a report.

### Table

List of records (e.g., pending approvals).

### Alert list

Critical items needing attention:

```
[!] Payroll variance > 5% in Sales dept
[!] 3 employees not appearing in Form 24Q draft
[!] Form 16 generation for 2 employees pending
```

### Pending approvals widget

For approvers:

```
┌─────────────────────────┐
│ Pending (4)              │
│ • Leave: Pankaj (3 days) │
│ • Expense: Sara (₹3.5K)  │
│ • Reg: Vikram (Apr 26)  │
│ • Offer: Senior SDE       │
│ [VIEW ALL]              │
└─────────────────────────┘
```

### Calendar

Personal / team calendar:

```
┌─────────────────────────┐
│ This Week               │
│ Mon: Pankaj on leave    │
│ Tue: Team meeting       │
│ Wed: 2 birthdays        │
│ Thu: Performance review │
│ Fri: All-hands           │
└─────────────────────────┘
```

### Activity feed

Latest events:

```
┌─────────────────────────┐
│ Activity Feed           │
│ • Pankaj joined as L4 SDE│
│ • Sara promoted to SM    │
│ • Q2 review cycle launched│
│ • Maria's birthday today │
└─────────────────────────┘
```

## Personalization

Users can:
- Add / remove widgets
- Resize / reposition (drag-drop)
- Save personal layouts
- Reset to default

```typescript
interface DashboardCustomization {
  employeeId: ObjectId;
  dashboardCode: string;
  
  customLayout: any;
  hiddenWidgets: string[];
  addedCustomReports: string[];
  
  lastModifiedAt: Date;
}
```

## Mobile dashboard

Simplified for mobile (small screens):
- Vertical stack only
- Large tap targets
- Reduced widget density
- Swipe between sections

## Real-time updates

Critical widgets:
- Pending approvals → real-time
- Today's attendance → real-time
- Payroll status → real-time

Others:
- Charts → 5-15 min refresh
- Aggregates → hourly / daily

Implementation: WebSocket for real-time; HTTP polling for slower.

## Open questions

`[OPEN]` Dashboard sharing (e.g., HR head shares specific dashboard with CEO). Recommend: yes; share by URL with permissions.

`[OPEN]` Custom widget development (tenant-built widgets). Recommend: v3.

`[OPEN]` TV mode (large display in office showing dashboard). Recommend: v2.

`[OPEN]` Drill-down from dashboard widget to detailed report. Recommend: yes; default behavior.

## Cross-references

- [01-reports-architecture.md](./01-reports-architecture.md) — backend
- [02-standard-reports-catalog.md](./02-standard-reports-catalog.md) — widgets reuse reports
- [/07-ess-mobile/00-overview.md](../07-ess-mobile/00-overview.md) — employee dashboard mobile
