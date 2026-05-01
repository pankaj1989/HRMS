# 09 — Blue-Collar Shift Patterns

## Purpose

Detailed specification of shift rotation patterns common in Indian blue-collar operations: continuous-process plants, manufacturing, factories, mines, retail, security services, hospitality, healthcare. White-collar's "9-to-6 with weekend off" doesn't apply to most of these settings.

This file extends [02-shifts-and-rosters.md](./02-shifts-and-rosters.md) with concrete rotation logic and worked examples.

## Pattern A — Single fixed shift

Most retail, hospitality, lower-end service.

```
Mon–Sat: shift S1 (10:00–19:00)
Sun: weekly off
```

No rotation. Trivial roster generation. Rest of this file ignores this pattern — it's covered by the base shift schema.

## Pattern B — 2-shift system (relay)

Common in light manufacturing and some retail.

```
Shifts:
  S1 (Day):   06:00 – 14:00
  S2 (Late):  14:00 – 22:00
  No night shift.

Rotation: weekly. Workers rotate between S1 and S2 each week.
Weekly off: Sunday for everyone (or split to maintain coverage).
```

### Roster pattern

Two crew groups (A, B). Each crew alternates:

| Week | Crew A | Crew B |
|---|---|---|
| Week 1 | S1 | S2 |
| Week 2 | S2 | S1 |
| Week 3 | S1 | S2 |
| ... | ... | ... |

If continuous coverage is needed (no Sunday off), introduce a third crew C for Sunday relief.

## Pattern C — 3-shift continuous system

Standard for continuous-process plants (steel, chemicals, paper, cement, refineries).

```
Shifts:
  S1 (Morning):  06:00 – 14:00
  S2 (Afternoon): 14:00 – 22:00
  S3 (Night):    22:00 – 06:00

Rotation: weekly. Workers rotate forward (S1 → S2 → S3 → S1 ...) or backward.
Weekly off: rotates with shift assignment.
```

### Crew structure

Continuous coverage requires at least 4 crews (because 3 shifts × 7 days / 5 days work per crew = 4.2 crews):

| Week | Crew A | Crew B | Crew C | Crew D |
|---|---|---|---|---|
| Week 1 | S1 | S2 | S3 | OFF |
| Week 2 | OFF | S1 | S2 | S3 |
| Week 3 | S3 | OFF | S1 | S2 |
| Week 4 | S2 | S3 | OFF | S1 |
| (cycle repeats) | | | | |

Each crew works 3 weeks on, 1 week off (or with weekly offs distributed). Shift health: forward rotation (S1 → S2 → S3) is better for circadian rhythm than backward (S1 → S3 → S2).

`[CA-REVIEW]` Factories Act § 61 requires a notice posted with shift schedules. The HRMS auto-generates Form 9 (Notice of Periods of Work) for posting.

### Roster generation parameters

```typescript
interface ThreeShiftContinuousPolicy {
  patternType: 'rotating';
  shifts: [s1Id, s2Id, s3Id];
  cycleDays: 28;                           // 4-week cycle
  crewCount: 4;
  rotationDirection: 'forward';
  rotationFrequency: 'weekly';
  weeklyOffPattern: {
    type: 'consecutive-shifts';
    workDaysBeforeOff: 21;                 // 3 weeks of work before 1 week off
    consecutiveOffDays: 7;
  };
}
```

## Pattern D — Panama (2-2-3 schedule)

12-hour shifts for 24/7 operations with fewer crews. Used in oil & gas, some power plants, security.

```
Shifts:
  Day:   06:00 – 18:00 (12 hours)
  Night: 18:00 – 06:00 (12 hours)

Rotation pattern (14-day cycle, 2-2-3):
  Day 1-2:  Day shift (work)
  Day 3-4:  Off
  Day 5-7:  Day shift (work)
  Day 8-9:  Off
  Day 10-12: Night shift (work)
  Day 13-14: Off

Cycle repeats. Each crew works 7 of 14 days, alternating which set of days.
```

Crews:
- 4 crews if 24/7 coverage needed
- 2 day shifts + 2 night shifts staggered

`[VERIFY]` Factories Act § 54 limits work to 9 hours/day except with explicit exemption (state notification under § 65). Some states have notified exemptions for continuous-process industries allowing 12-hour shifts. Tenant must have notification on file. The HRMS flags 12-hour-shift policies for `[CA-REVIEW]`.

`[CA-REVIEW]` 48 hours/week limit (§ 51) is harder to comply with in a 12-hour shift system. Pattern of 7 working days per 14 = 84 hours per fortnight = 42 hours/week average. Within limits if averaged properly.

## Pattern E — DuPont (28-day cycle)

12-hour shifts. Stronger crew rotation. Provides more consecutive days off than Panama.

```
Pattern (28-day cycle, 4 crews):

Crew    1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28
A       D  D  D  D  -  -  -  N  N  N  -  D  D  D  -  -  -  N  N  N  N  -  -  -  -  D  D  D
B       N  N  N  -  -  -  D  D  D  D  -  -  -  N  N  N  -  D  D  D  -  -  -  N  N  N  N  -
C       -  -  -  N  N  N  N  -  -  -  D  D  D  D  -  -  -  N  N  N  -  D  D  D  -  -  -  N
D       -  -  -  -  D  D  D  -  -  -  N  N  N  -  -  -  D  D  D  D  -  -  -  N  N  N  -  -

Where: D = Day shift (06:00–18:00)
       N = Night shift (18:00–06:00)
       - = Off
```

Each crew has 7 days off in a row at one point in the cycle (the "long break"). Better for fatigue management than Panama.

`[VERIFY]` Various sources represent DuPont differently. Tenant must agree on exact pattern. The HRMS supports custom 28-day patterns; DuPont is one preset.

## Pattern F — Continental (3-3-3)

Common in European-influenced operations. 8-hour shifts.

```
Pattern (21-day cycle, 4 crews):
  3 days morning, 3 days afternoon, 3 days night, 2 days off, 3 days morning, ... and so on

Each crew works 6 days per week consecutively, then 2-3 days off.
```

Often easier on workers than Panama/DuPont because 8-hour shifts are less fatiguing.

## Pattern G — Split shift (retail / hospitality)

Common in restaurants, retail with peak hours. Worker covers two peaks with long break in between.

```
Shift SPLIT:
  11:00 – 15:00  (lunch service)
  Break: 15:00 – 18:00 (3 hours unpaid)
  18:00 – 22:00  (dinner service)

Total span: 11 hours
Net working: 8 hours (4 + 4)
Spread-over: 11 hours — within Factories Act § 56 (10.5 hours) `[CA-REVIEW]`
```

`[VERIFY]` § 56 spread-over limit may be violated by a 11-hour split. Some states have notification permitting up to 12 hours spread for hotel / catering. Verify tenant's industry + state.

## Pattern H — On-call / standby

Healthcare workers, IT support, plant maintenance.

```
Worker is on standby (not at workplace, but reachable). Compensated:
  - Standby allowance per hour standby (lower rate)
  - Full duty rate if called in
  - Travel time from home to site (if called in)
```

Schema additions:

```typescript
interface StandbyShift {
  standbyShiftId: ObjectId;
  startTime: string;
  endTime: string;
  
  standbyHourlyRate: Decimal128;           // typically 25-50% of normal rate
  callInHourlyRate: Decimal128;            // typically full rate
  travelTimeBilled: boolean;
  minimumCallInHours: number;              // e.g., 4 hours minimum even if called for 1
}
```

## Pattern I — Piece-rated (no shift, output-driven)

Garment workers, some construction, sometimes retail (commission-based).

```
No fixed shift hours. Worker comes in, works at pace, earns per piece.
Punch-in / out tracks presence; pay is based on units produced.
Minimum wage floor still applies (state minimum wage for unskilled / semi-skilled).
```

Schema:

```typescript
interface PieceRatedAttendance extends DailyAttendance {
  unitsCompleted: number;                  // production count
  unitsRejected: number;                   // QA failed
  payableUnits: number;                    // accepted output
  
  earnedFromPieces: Decimal128;
  guaranteedMinimum: Decimal128;           // statutory minimum wage if pieces fall short
  payableEarnings: Decimal128;             // MAX(earnedFromPieces, guaranteedMinimum)
}
```

`[CA-REVIEW]` Minimum Wages Act mandates minimum daily/monthly wage regardless of piece rate. Compliance check.

## Pattern J — Delivery / field staff (no fixed location)

Delivery riders, field sales, technicians, drivers.

```
Workers track time + location; no fixed shift but expected daily hours.
Geo-fencing by route or customer site.
Allowances for travel, mobile, fuel.
```

Often gig-economy structure under Code on Social Security 2020 (gig workers, platform workers).

## Shift handover protocols `[BLUE-COLLAR]`

In continuous process plants, shift handover is a formal procedure:

1. Outgoing operator stays past shift end (typically 10–15 minutes overlap)
2. Briefs incoming operator on:
   - Equipment status
   - In-progress operations
   - Issues / abnormalities
   - Safety incidents
3. Both sign handover register
4. Outgoing punches out

Schema:

```typescript
interface ShiftHandover extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  
  outgoingShiftDate: string;
  outgoingShiftId: ObjectId;
  outgoingEmployeeId: ObjectId;
  
  incomingShiftDate: string;
  incomingShiftId: ObjectId;
  incomingEmployeeId: ObjectId;
  
  handoverTimestamp: Date;
  handoverDurationMinutes: number;
  
  // content
  equipmentStatus: string;
  ongoingOperations: string;
  issues: string;
  safetyIncidents?: string;
  
  // attestations
  outgoingAcknowledged: boolean;
  outgoingAcknowledgedAt?: Date;
  incomingAcknowledged: boolean;
  incomingAcknowledgedAt?: Date;
  
  // documents
  attachments?: ObjectId[];
  
  createdAt: Date;
  isDeleted: boolean;
}
```

`[v2]` Most basic plants don't digitize this; physical register. v1 captures via simple form. v2 may integrate with plant control systems.

## Relay vs continuous shifts (Factories Act § 61)

Factories Act distinguishes:
- **Single shift**: one set of workers per day
- **Multiple shift / relay**: workers in successive shifts handing over to one another
- **Continuous shift**: same workers continuously (rare)

Per § 61, factories operating with relays must:
- Post a notice (Form 9) showing shift periods, intervals, weekly holidays
- Submit copy to Inspector
- No worker shall be required to work in more than one relay (same shift) per day

The HRMS:
- Identifies relay configuration from RosterPolicy
- Auto-generates Form 9 with current shift assignments
- Tracks compliance (no worker double-shift)

## Worker classification register `[BLUE-COLLAR]`

Per Factories Act § 61, workers must be classified into groups based on relay assignment:

```typescript
interface WorkerGroupRegister {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  
  groupName: string;                       // 'Group A', 'Group B'
  shiftAssignment: ObjectId;
  workersAssigned: ObjectId[];             // employeeIds
  
  effectiveFrom: string;
  effectiveTo?: string;
  
  postedNoticeDocumentId?: ObjectId;       // Form 9 reference
  
  createdAt: Date;
  isDeleted: boolean;
}
```

The HRMS maintains this and updates whenever roster changes.

## Pattern transitions

Workers may transition between patterns:

- Promoted from production worker (3-shift) to supervisor (general shift)
- Transferred to different plant with different rotation
- Returning from extended leave to a different rotation

Roster engine handles transitions:
1. Effective date set
2. Old roster ends at transition date
3. New roster begins
4. Crew assignment recalculated for new pattern
5. Worker notified

## Worked example — Crew assignment

Plant Alpha runs 3-shift continuous. 80 production workers, 4 crews.

```
Crew A: 20 workers (employee IDs E001 – E020)
Crew B: 20 workers (E021 – E040)
Crew C: 20 workers (E041 – E060)
Crew D: 20 workers (E061 – E080)

Cycle (4-week, weekly rotation):
  Week 1: A→S1, B→S2, C→S3, D→OFF
  Week 2: A→OFF, B→S1, C→S2, D→S3
  Week 3: A→S3, B→OFF, C→S1, D→S2
  Week 4: A→S2, B→S3, C→OFF, D→S1
```

For employee E005 in Crew A:
- April 1 (Week 1): S1 (06:00–14:00)
- April 2: S1
- April 3: S1
- April 4: S1
- April 5: S1
- April 6: S1
- April 7: weekly off (within work-week)
- April 8 (Week 2): OFF (4-day weekly break)
- April 9: OFF
- April 10: OFF
- April 11: OFF
- April 12: OFF
- April 13: OFF
- April 14: OFF (1 week off)
- April 15 (Week 3): S3 (22:00–06:00 next day)
- ... etc.

Wait — that gives 6 days S1 in a row then 7 off, which doesn't match the table. Let me redo:

Actually a more typical rotation:

| Week | Crew A | Crew B | Crew C | Crew D |
|---|---|---|---|---|
| Week 1 | S1 (Mon-Sat), Sun off | S2 (Mon-Sat), Sun off | S3 (Sun night-Sat morning), 7th day off | OFF (1 week) |

Each crew works 6 days/week, 1 day weekly off + 1 week off per 4-week cycle. Total: 18 working days per 28 days cycle = 64% workforce, just enough for 3-shift continuous.

`[VERIFY]` Exact crew configuration depends on plant. Above is illustrative.

## Pattern compliance checks

The HRMS auto-validates roster patterns against statutory limits:

| Check | Limit | Source |
|---|---|---|
| Daily working hours | ≤ 9 (or 12 with state notification) | Factories Act § 54, state notif |
| Weekly working hours | ≤ 48 | Factories Act § 51 |
| Weekly off | ≥ 1 day per week | Factories Act § 52 |
| Max consecutive working days | ≤ 10 (with adequate weekly off compensation) | § 52 |
| Spread-over | ≤ 10.5 hours (or 12 with notif) | § 56 |
| Rest interval | ≥ 30 min after 5 hrs continuous work | § 55 |
| Night-shift female | restricted in some states | § 66 |
| Quarterly OT | ≤ 50 hours | § 64 |

Roster generator and DailyAttendance computation flag violations. Tenant gets compliance dashboard with non-compliant cases.

## Statutory output

For factories using non-trivial patterns, the HRMS produces:

- **Form 9**: Notice of Periods of Work (posted)
- **Form 11**: Register of Adult Workers (with classification)
- **Form 12**: Register of Leave with Wages (per worker)
- **Form 21 / 22**: Annual / half-yearly returns showing aggregate man-hours
- **Form 25**: Adult worker register
- **Form D**: Annual return with shift breakdown

Detailed in [07-statutory-attendance-registers.md](./07-statutory-attendance-registers.md) and `/04-compliance/10-factories-act.md` (Phase 3).

## Mobile / field attendance integration

For field staff (Pattern J), mobile capture is the primary method. Detailed in [10-mobile-and-offline.md](./10-mobile-and-offline.md).

## Open questions

`[OPEN]` Forced rotation vs preferred rotation. Some workers prefer night shift permanently (allowance is higher). Mandatory rotation for fatigue management vs preference. Recommend: configurable per tenant; allow opt-out with HR + occupier approval.

`[OPEN]` Crew swap requests. Worker A in Crew A wants to swap with worker B in Crew B for one cycle. Recommend: yes via shift swap feature; chains of swaps for full crew swaps via batch tool.

`[OPEN]` Industry-specific pattern presets. Steel plants, refineries, hospitals, retail chains all have known patterns. Ship as templates? Recommend: yes; tenant chooses preset, customizes.

`[OPEN]` Pattern compliance enforcement. If pattern violates Factories Act, do we block roster publish? Or warn and allow (since some violations require state notification on file)? Recommend: warn + require explicit override flag with notification reference.

## Cross-references

- [02-shifts-and-rosters.md](./02-shifts-and-rosters.md) — base shift / roster
- [05-overtime-engine.md](./05-overtime-engine.md) — OT in 12-hour shifts
- [07-statutory-attendance-registers.md](./07-statutory-attendance-registers.md) — Form 9, 11, 25
- [/01-employee/08-white-vs-blue-collar-differences.md](../01-employee/08-white-vs-blue-collar-differences.md) — category context
- [/04-compliance/10-factories-act.md](../04-compliance/10-factories-act.md) (Phase 3) — Factories Act compliance
