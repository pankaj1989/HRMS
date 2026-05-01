# 07 — Recruitment Analytics

## Purpose

Recruitment generates rich data: applications, conversions, time-in-stage, source quality, recruiter productivity, cost per hire. Analytics turn this data into decisions: where to invest sourcing budget, which interviewers are biased, which roles have hiring problems.

## Core funnel metrics

```typescript
interface FunnelMetrics {
  fromDate: string;
  toDate: string;
  scope: { entityId?: ObjectId; departmentId?: ObjectId; jobFamily?: string };
  
  // counts
  applicationsCount: number;
  shortlistedCount: number;
  interviewedCount: number;
  offeredCount: number;
  acceptedCount: number;
  hiredCount: number;
  
  // conversion rates
  shortlistToInterview: number;            // %
  interviewToOffer: number;
  offerToAccept: number;
  acceptToHire: number;
  
  // time metrics (avg days)
  applicationToShortlistDays: number;
  shortlistToInterviewDays: number;
  interviewToOfferDays: number;
  offerToAcceptDays: number;
  acceptToJoinDays: number;
  totalTimeToHire: number;
}
```

## Source effectiveness

```typescript
interface SourceEffectiveness {
  source: SourceChannel;
  
  // volume
  candidatesSubmitted: number;
  candidatesShortlisted: number;
  candidatesInterviewed: number;
  candidatesHired: number;
  
  // quality
  shortlistRate: number;                   // % submitted that got shortlisted
  hireRate: number;                        // % submitted that got hired
  
  // cost
  totalCost: Decimal128;
  costPerHire: Decimal128;
  
  // time
  avgTimeToHire: number;                   // days
  
  // post-hire performance (1-year)
  oneYearRetentionRate?: number;
  avgPerformanceRating?: number;
}
```

Top sources for Indian SME typically:
- Referral (highest quality, lowest cost, but lower volume)
- Naukri (high volume, moderate quality)
- LinkedIn (moderate volume, high quality, expensive)
- Agency (high cost, fast for senior)
- Company careers page (lowest cost; quality varies)
- Walk-in (quick blue-collar; quality varies)

Insights:
- Referral hire rate often 5-10× higher than Naukri
- Agency cost for senior roles ₹2-5L per hire
- Posting fees recoverable via 5-10 hires per posting

## Recruiter productivity

```typescript
interface RecruiterMetrics {
  recruiterEmployeeId: ObjectId;
  
  period: { from: string; to: string };
  
  // assignments
  requisitionsAssigned: number;
  requisitionsClosed: number;
  
  // activity
  candidatesScreened: number;
  interviewsScheduled: number;
  offersExtended: number;
  hires: number;
  
  // efficiency
  avgTimeToHireDays: number;
  avgCostPerHire: Decimal128;
  offerToAcceptanceRate: number;
  
  // quality
  postHireRetention: number;               // % of hires still active after 1 year
  postHirePerformance?: number;            // avg rating of hires
  
  // SLA
  slaBreaches: number;
  feedbackTurnaroundAvg: number;
}
```

Used for:
- Performance reviews of recruiters
- Workload distribution
- Coaching and training

## Time to hire (TTH) analysis

Median TTH benchmarks (Indian context):
- Junior tech (L1-L3): 30-45 days
- Senior tech (L4-L6): 45-75 days
- Leadership: 90-180 days
- Sales: 30-60 days
- Operations / Admin: 15-30 days
- Blue-collar: 7-15 days

```typescript
interface TimeToHireBreakdown {
  scope: any;
  
  byStage: {
    sourceToScreen: number;
    screenToFirstInterview: number;
    firstInterviewToOffer: number;
    offerToAccept: number;
    acceptToJoin: number;
  };
  
  totalMedian: number;
  totalP90: number;                        // 90th percentile
  
  // bottleneck identification
  longestStage: string;
  longestStageDuration: number;
}
```

## Cost per hire (CPH)

```typescript
interface CostPerHire {
  scope: any;
  period: { from: string; to: string };
  
  costs: {
    sourcing: Decimal128;                  // job postings, ads
    agency: Decimal128;
    referralBonus: Decimal128;
    bgv: Decimal128;
    interviewerTime: Decimal128;           // estimated
    recruiterTime: Decimal128;
    technology: Decimal128;                // share of HRMS / tools cost
    travel: Decimal128;
    other: Decimal128;
    total: Decimal128;
  };
  
  hires: number;
  costPerHire: Decimal128;
  
  // benchmarks
  industryAverageCostPerHire?: Decimal128;
}
```

Indian benchmarks:
- Tech junior: ₹15-30K
- Tech senior: ₹50K-2L
- Leadership: ₹2-10L
- Operations: ₹10-25K

## Quality of hire

Hardest metric. Combination of:
- Time to productivity (manager assessment)
- 1st year performance rating
- 1st year retention
- Manager satisfaction with hire

```typescript
interface QualityOfHire {
  hireGroupId: string;                     // e.g., 'Q1-FY26-engineering-hires'
  hires: ObjectId[];
  
  ninetyDayMetrics: {
    onboardingCompletionRate: number;
    earlyAttritionCount: number;           // left within 90 days
  };
  
  oneYearMetrics: {
    retentionRate: number;
    avgPerformanceRating: number;
    promotionRate: number;
    managerSatisfaction: number;
  };
  
  qualityScore: number;                    // composite
}
```

## Diversity analytics (with consent)

```typescript
interface DiversityMetrics {
  scope: any;
  
  byGender: {
    male: { applied: number; hired: number; rate: number };
    female: { applied: number; hired: number; rate: number };
    other: { applied: number; hired: number; rate: number };
  };
  
  byEducation?: {
    tier1: { applied: number; hired: number };
    tier2: { applied: number; hired: number };
    tier3: { applied: number; hired: number };
    other: { applied: number; hired: number };
  };
  
  byExperience?: { ... };
  byLocation?: { ... };
  byPriorEmployer?: { ... };
  
  // bias indicators
  potentialBias: Array<{
    dimension: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}
```

`[CA-REVIEW]` Diversity tracking sensitive. Used aggregated only; never individual decisions.

## Drop-off analysis

```typescript
interface DropoffAnalysis {
  stage: string;
  
  enteredCount: number;
  droppedCount: number;
  dropoffRate: number;
  
  dropReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  
  trendVsLastPeriod: 'improving' | 'stable' | 'worsening';
}
```

Common drop-off points:
- Application → Shortlist (volume thinning; expected)
- Interview → Offer (selection happens here)
- Offer → Accept (compensation, counter-offer)
- Accept → Join (no-shows; counter-offers)

## Predictive metrics (v2)

`[v2]` ML predictions:
- Probability that candidate accepts offer
- Probability that candidate shows up
- Time to fill estimate for new requisitions
- Source recommendation given role context

## Dashboards

### Recruitment leader dashboard

Top-level health metrics:
- Open requisitions count + aging
- Hires this quarter vs target
- Avg time to hire trend
- Cost per hire trend
- Source distribution
- Funnel conversion overview

### Hiring manager dashboard

Per-manager view:
- Their open requisitions
- Active applications in their pipeline
- Pending interviews
- Pending feedback (from them)
- Status of offers extended

### Recruiter dashboard

Per-recruiter view:
- Their active requisitions
- Pipeline by stage
- Today's interviews
- Pending actions
- Productivity metrics

### Candidate / Application dashboard

Per-application detailed view:
- Stage history
- Interview schedule
- Feedback summary
- Communication history
- Documents

## Reports schema

```typescript
interface RecruitmentReport extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  reportType: 'funnel' | 'source-effectiveness' | 'recruiter-productivity' | 'cost-per-hire' | 'diversity' | 'time-to-hire';
  
  period: { from: string; to: string };
  scope: any;
  
  data: any;                               // report-specific structure
  
  generatedAt: Date;
  generatedBy?: ObjectId | 'scheduled-job';
  
  // delivery
  recipients?: ObjectId[];                 // employees who get this
  scheduleFrequency?: 'one-time' | 'weekly' | 'monthly' | 'quarterly';
  nextScheduledRunAt?: Date;
  
  outputFormats: ('pdf' | 'excel' | 'in-app')[];
  documentIds: { format: string; documentId: ObjectId }[];
  
  isDeleted: boolean;
}
```

## Open questions

`[OPEN]` Real-time vs scheduled reports? Recommend: real-time for dashboards; scheduled for distributed reports (weekly to leadership).

`[OPEN]` Anonymized industry benchmarks (cross-tenant)? Marketplace feature with opt-in. Recommend: v3.

`[OPEN]` AI insights ("Your offer-to-accept rate dropped 20% this quarter; usual culprits are X, Y, Z"). Recommend: v2.

`[OPEN]` Quality of hire requires `/06-performance/` data. Cross-module link. Recommend: built-in once Performance module ready.

## Cross-references

- All other recruitment files feed analytics
- [/06-performance/](../06-performance/) — quality of hire data
- [/09-analytics/](../09-analytics/) (Phase 5) — full analytics architecture
