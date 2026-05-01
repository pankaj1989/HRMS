# 03 — Custom Report Builder

## Purpose

Tenants build reports without code. The custom report builder lets HR define data source, filters, columns, aggregations, and visualizations through a UI.

## Scope

- Choose data source (employees, payroll, leaves, etc.)
- Apply filters (multi-criteria)
- Select fields (columns)
- Group / pivot
- Aggregate (sum, avg, count, etc.)
- Choose visualization
- Save and share
- Schedule

## Data source schema

```typescript
interface DataSource {
  sourceCode: string;                      // 'employees', 'payroll-lines', etc.
  sourceName: string;                      // 'Employees', 'Payroll Records'
  
  // available fields for filter / display
  fields: Array<{
    fieldCode: string;
    fieldLabel: string;
    fieldType: 'string' | 'number' | 'date' | 'boolean' | 'enum' | 'reference';
    
    // reference fields
    referenceTo?: string;                  // 'departments', 'employees'
    referenceDisplayField?: string;
    
    // for enum
    enumOptions?: Array<{ value: string; label: string }>;
    
    // permissions
    sensitiveLevel: 'public' | 'restricted' | 'sensitive';
    accessibleByRoles: string[];
    
    // queryable
    isFilterable: boolean;
    isSortable: boolean;
    isAggregatable: boolean;
    
    // unit
    unit?: string;                         // 'INR', '%', 'days'
  }>;
  
  // joinable to other sources
  joinableSources: Array<{
    targetSource: string;
    joinKey: string;
    joinType: 'one-to-one' | 'one-to-many' | 'many-to-one';
  }>;
  
  // permissions
  visibleToRoles: string[];
  
  // record-level scope
  recordLevelScope: 'tenant' | 'entity' | 'department' | 'team' | 'self';
}
```

## Available data sources

| Source | Description | Records (typical) |
|---|---|---|
| `employees` | Employee master | 100s-10Ks |
| `employment-records` | Employment terms | same as employees |
| `compensation-records` | CTC and component revisions | 1-N per employee per year |
| `payroll-lines` | Monthly payroll lines | per employee per month |
| `payroll-runs` | Payroll execution records | monthly |
| `attendance-daily` | Daily attendance | daily per employee |
| `leave-applications` | Leave requests | per employee multiple/year |
| `leave-balances` | Current leave balances | per employee |
| `requisitions` | Job requisitions | dozens-hundreds |
| `applications` | Recruitment applications | hundreds-thousands |
| `interviews` | Interview records | per application |
| `offers` | Offers extended | per requisition |
| `goals` | Performance goals | per employee per cycle |
| `performance-reviews` | Reviews | per employee per cycle |
| `tickets` | Helpdesk tickets | hundreds/thousand monthly |
| `expense-claims` | Expense submissions | hundreds/thousand monthly |
| `documents` | Documents on file | per employee |
| `audit-events` | Audit log | thousands daily |

## Custom report definition schema

```typescript
interface CustomReport extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  
  reportCode: string;                      // tenant-defined
  reportName: string;
  description?: string;
  category?: string;                       // tenant categorization
  
  // ownership
  createdBy: ObjectId;
  ownerEmployeeId: ObjectId;
  
  // data
  primaryDataSource: string;
  joinedSources?: Array<{
    source: string;
    joinKey: string;
    joinType: string;
  }>;
  
  // filters
  filters: Array<{
    field: string;
    operator: 'eq' | 'ne' | 'in' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'contains' | 'starts-with' | 'is-null' | 'is-not-null';
    value: any;
    isUserConfigurable: boolean;           // can user override at run time
  }>;
  
  // columns / fields shown
  selectedFields: Array<{
    field: string;
    label?: string;                        // override default label
    sortable: boolean;
    sortOrder?: number;                    // default sort
  }>;
  
  // grouping
  groupBy?: string[];
  
  // aggregations
  aggregations?: Array<{
    field: string;
    aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct-count';
    label?: string;
  }>;
  
  // visualization
  visualization: 'table' | 'bar-chart' | 'line-chart' | 'pie-chart' | 'kpi-tile' | 'heatmap' | 'scatter';
  
  visualizationConfig?: any;               // axis labels, colors, etc.
  
  // sharing
  sharedWithRoles: string[];
  sharedWithEmployees: ObjectId[];
  isPublic: boolean;                       // visible to all in tenant
  
  // schedule
  scheduledRuns?: ScheduledRun[];
  
  // versioning
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

interface ScheduledRun {
  scheduleCode: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeOfDay: string;                       // 'HH:mm'
  timeZone: string;
  
  recipients: ObjectId[];
  format: 'pdf' | 'excel' | 'csv' | 'in-app';
  
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt: Date;
}
```

## UI walkthrough

### Step 1: Choose data source

```
+----------------------------------+
| Build Custom Report              |
+----------------------------------+
| What do you want to report on?   |
|                                   |
|   ⊙ Employees                     |
|   ○ Payroll                       |
|   ○ Attendance                    |
|   ○ Leave                         |
|   ○ Recruitment                   |
|   ○ Performance                   |
|   ○ Tickets                       |
|   ○ More...                       |
+----------------------------------+
| [NEXT]                           |
+----------------------------------+
```

### Step 2: Apply filters

```
+----------------------------------+
| Add Filters (optional)            |
+----------------------------------+
| Filter 1                          |
|   Field: Department                |
|   Operator: equals                 |
|   Value: Engineering               |
|   [Configurable by user] ✓        |
|                                   |
| [+ ADD ANOTHER FILTER]            |
+----------------------------------+
| [BACK] [NEXT]                     |
+----------------------------------+
```

### Step 3: Choose fields

```
+----------------------------------+
| Choose Fields to Display         |
+----------------------------------+
| Available Fields                 |
|   ☑ Employee Code                |
|   ☑ Full Name                    |
|   ☑ Designation                  |
|   ☑ Department                   |
|   ☐ Email                        |
|   ☑ Joining Date                 |
|   ☐ Date of Birth                |
|   ☑ Annual CTC (sensitive)       |
|   ...                            |
+----------------------------------+
| [BACK] [NEXT]                    |
+----------------------------------+
```

### Step 4: Group / Aggregate (optional)

```
+----------------------------------+
| Group By (optional)              |
+----------------------------------+
| Group by:                         |
|   ⊙ Department                   |
|   ○ Designation Level            |
|   ○ Location                     |
+----------------------------------+
| Aggregations:                    |
|   ☑ Count of employees           |
|   ☑ Sum of CTC                   |
|   ☑ Average tenure               |
+----------------------------------+
| [BACK] [NEXT]                    |
+----------------------------------+
```

### Step 5: Visualization

```
+----------------------------------+
| Choose Visualization              |
+----------------------------------+
|   ⊙ Table                        |
|   ○ Bar Chart                    |
|   ○ Line Chart                   |
|   ○ Pie Chart                    |
|   ○ KPI Tile                     |
+----------------------------------+
| Preview:                          |
|   [embedded chart preview]        |
+----------------------------------+
| [BACK] [NEXT]                    |
+----------------------------------+
```

### Step 6: Save and share

```
+----------------------------------+
| Save Report                      |
+----------------------------------+
| Report Name:                      |
|   [Engineering Team Headcount]    |
+----------------------------------+
| Description:                      |
|   Engineering team headcount and  |
|   compensation summary            |
+----------------------------------+
| Sharing:                          |
|   ⊙ Private (only me)            |
|   ○ Specific roles               |
|   ○ Specific people              |
|   ○ Public (visible to all in    |
|     tenant)                       |
+----------------------------------+
| Schedule (optional):              |
|   ☑ Email weekly Monday 9am       |
+----------------------------------+
| [SAVE]                           |
+----------------------------------+
```

## Permissions enforcement

User can only:
- Filter on fields they have access to
- See data in their scope
- Sensitive fields masked unless authorized
- Export only data they can see

When sharing:
- Recipients see report only if they have access to underlying data
- Filtering at report run-time per recipient (no leakage)

## Cloning standard reports

User can:
- "Clone this report" → starts custom report builder pre-populated
- Customize and save

## Power features (v2+)

- **Calculated fields**: derived columns (e.g., `tenure-bucket = case when tenure < 12 then 'New' else 'Tenured'`)
- **Formula columns**: arithmetic on existing fields
- **Multi-source joins**: explicit join definitions
- **Subqueries**: filter on aggregated values
- **Conditional formatting**: color-code rows / cells
- **Pivot tables**: cross-tab data

## Open questions

`[OPEN]` SQL access for power users? Recommend: no in v1; UI builder is sufficient.

`[OPEN]` Report templates marketplace (community / industry-specific). Recommend: v2.

`[OPEN]` AI-assisted report builder ("Show me employees with high attrition risk"). Recommend: v3.

`[OPEN]` Performance limits on custom reports (data volume cap to prevent runaway). Recommend: 100K rows; warn user; offer async export.

## Cross-references

- [01-reports-architecture.md](./01-reports-architecture.md) — architecture
- [02-standard-reports-catalog.md](./02-standard-reports-catalog.md) — standard reports
- [04-dashboards.md](./04-dashboards.md) — embed in dashboards
- [/00-foundations/03-identity-and-rbac.md](../00-foundations/03-identity-and-rbac.md) — permissions
