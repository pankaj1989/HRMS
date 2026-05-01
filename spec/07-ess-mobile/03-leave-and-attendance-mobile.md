# 03 — Leave & Attendance (Mobile)

## Purpose

Leave application and attendance check-in are the two highest-frequency ESS actions. This file specifies mobile UX for leave, leave balance, attendance check-in/out, and regularization.

## Leave dashboard

```
+----------------------------------+
| LEAVES                           |
+----------------------------------+
| Available Leave Balance          |
|   EL: 18.5 days                  |
|   CL: 5 days                     |
|   SL: 8 days                     |
|   Comp-Off: 1 day                |
+----------------------------------+
| [+ APPLY LEAVE]                  |
+----------------------------------+
| Active Applications (1)          |
|   • EL 28 Apr - 30 Apr (3 days)  |
|     Pending Approval             |
+----------------------------------+
| Recent (last 90 days)            |
|   • CL 12 Mar - Approved (1 day)  |
|   • EL 5 Feb - Approved (5 days)  |
|   ...                            |
+----------------------------------+
| Upcoming Holidays                |
|   • 1 May - Maharashtra Day      |
|   • 26 May - Buddha Purnima       |
|   • 15 Aug - Independence Day    |
+----------------------------------+
```

## Apply leave flow

```mermaid
sequenceDiagram
    actor Employee
    participant App
    participant Manager
    
    Employee->>App: tap [Apply Leave]
    App->>Employee: leave type selection (EL, CL, SL, etc.)
    Employee->>App: select EL
    App->>App: check EL balance (18.5)
    App->>Employee: date picker
    Employee->>App: 28 Apr - 30 Apr (3 days)
    App->>App: validate (no holidays, no overlapping leaves)
    App->>App: check balance vs requested
    App->>Employee: reason field + half-day option
    Employee->>App: enter reason
    Employee->>App: submit
    
    App->>Manager: notification (leave application)
    Manager->>App: review
    App->>Manager: shows: balance, calendar conflict, team coverage
    Manager->>App: approve / reject / query
    
    App->>Employee: notification (decision)
    
    alt Approved
        App->>App: deduct from balance
        App->>App: create LeaveRequest record
    else Rejected
        App->>App: status updated; reason provided
    end
```

## Leave application form

```
+----------------------------------+
| Apply Leave                      |
+----------------------------------+
| Leave Type                       |
|   ○ EL (18.5 days available)     |
|   ○ CL (5)                       |
|   ○ SL (8)                       |
|   ○ Comp-Off (1)                 |
|   ○ Maternity / Paternity         |
|   ○ Bereavement                   |
|   ○ Loss of Pay (LOP)             |
+----------------------------------+
| From Date                         |
|   📅 28 Apr 2026                  |
+----------------------------------+
| To Date                           |
|   📅 30 Apr 2026                  |
+----------------------------------+
| Day Type                          |
|   ⊙ Full day                      |
|   ○ First half                    |
|   ○ Second half                   |
+----------------------------------+
| Days Requested: 3                |
| (excludes weekends + holidays)   |
+----------------------------------+
| Reason                           |
|   [text area]                    |
+----------------------------------+
| Approver                          |
|   Manager: Rakesh Verma          |
+----------------------------------+
| Skipping holidays?               |
|   • 29 Apr (Holi) - skipped      |
+----------------------------------+
| [SUBMIT]                         |
+----------------------------------+
```

## Leave validation

Before submission:
- Balance check (cannot go negative for EL, CL, SL; LOP allowed always)
- Maximum continuous limit (e.g., max 10 days CL+SL combined)
- Overlap check with existing leaves
- Notice period rules (CL: same day allowed; EL: 7 days notice typical; long EL: 15 days)
- Calendar conflicts (team coverage)
- Holiday overlap (auto-exclude)
- Weekend handling per leave policy

## Calendar view

Visual calendar:

```
+----------------------------------+
| April 2026                       |
+----------------------------------+
| MO TU WE TH FR SA SU             |
|     1  2  3  4  5  6  7          |
|  8  9 10 11 12 13 14 15          |
| 15 16 17 18 19 20 21 22          |
| 22 23 24 25 26 27 28 29          |
+----------------------------------+
| Color coding:                    |
|   🟢 Working day                 |
|   🔵 Holiday                     |
|   🟡 Pending leave               |
|   🟢 Approved leave              |
|   🔴 Weekend                     |
+----------------------------------+
| Team coverage today: 12/15       |
+----------------------------------+
```

`[v2]` Team calendar overlay (see who else is on leave during requested period).

## Attendance check-in

```
+----------------------------------+
| Today: Wednesday, 29 Apr 2026    |
| Time: 11:30 AM                   |
+----------------------------------+
| You haven't checked in yet       |
+----------------------------------+
| [✓ CHECK IN]                     |
| (large prominent button)         |
+----------------------------------+
| Or report:                        |
|   ○ Working from home today      |
|   ○ Field work                    |
|   ○ Sick                          |
+----------------------------------+
```

Tapping [Check In]:
- Captures GPS (with consent)
- Stores in offline queue if offline
- Updates UI: "Checked in at 11:30 AM"
- Auto check-out: e.g., at 7 PM if no manual checkout

## Attendance check-out

End of work day:

```
+----------------------------------+
| Today's Attendance               |
+----------------------------------+
| Check In:  11:30 AM (Office)     |
| Check Out: ?                     |
| Hours so far: 7h 30m             |
+----------------------------------+
| [✓ CHECK OUT]                    |
+----------------------------------+
| OR                               |
| [Stay in office]                 |
+----------------------------------+
```

After check-out:
- Hours computed
- Eligibility for OT calculated
- If beyond shift hours: prompt for OT consent

## Attendance history

```
+----------------------------------+
| Attendance: April 2026           |
+----------------------------------+
| 29 Apr Wed   IN: 11:30 / OUT: 7:00  ✓ Present
| 28 Apr Tue   IN: 11:15 / OUT: 7:30  ✓ Present
| 27 Apr Mon   IN: 11:45 / OUT: 6:00  ✓ Present  (1h 15m short)
| 26 Apr Sun   ──                    Weekend
| 25 Apr Sat   ──                    Weekend
| 24 Apr Fri   IN: 11:20 / OUT: 7:30  ✓ Present
| 23 Apr Thu   ──                    🟡 Absent (regularize)
| 22 Apr Wed   IN: 11:00 / OUT: 7:45  ✓ Present
| ...                              
+----------------------------------+
```

Tap any day → details + actions.

## Regularization request

If attendance is missing / wrong:

```
+----------------------------------+
| Regularize: 23 Apr 2026          |
+----------------------------------+
| You don't have attendance        |
| recorded for this day.           |
+----------------------------------+
| Request type:                    |
|   ⊙ I was present                |
|   ○ I was on leave (apply)       |
|   ○ It was a holiday             |
|   ○ Mark as LOP                  |
+----------------------------------+
| If present:                      |
|   Check-in time: 10:30 AM        |
|   Check-out time: 7:00 PM        |
|   Mode: ⊙ Office ○ WFH ○ Field   |
|   Reason: [text]                 |
+----------------------------------+
| [SUBMIT FOR APPROVAL]            |
+----------------------------------+
```

## Leave balance trends

`[v2]` Visual:
- Balance over time (graph)
- Encashable balance projection
- Use-it-or-lose-it warnings

## Manager view: leave approvals

```
+----------------------------------+
| MANAGER VIEW                      |
+----------------------------------+
| Pending Leave Approvals (3)      |
+----------------------------------+
| Pankaj Kumar - 28 Apr to 30 Apr  |
|   Type: EL | Days: 3              |
|   Balance after: 15.5 EL          |
|   Conflict: 1 other on leave     |
|   Reason: Family wedding          |
|   [APPROVE] [REJECT]              |
|   [QUERY] [VIEW DETAILS]          |
+----------------------------------+
| Suresh Mehta - 5 May              |
|   Type: CL | Days: 1              |
|   ...                             |
+----------------------------------+
| Vikram Singh - 12 May             |
|   ...                             |
+----------------------------------+
```

Quick approve / reject from notification.

## Calendar conflicts

When approving:
- Show team's calendar
- Already approved leaves
- Holidays
- Critical events (e.g., monthly close)
- Coverage assessment

```
+----------------------------------+
| Team Calendar                    |
| Week of 28 Apr - 4 May            |
+----------------------------------+
|       Mon Tue Wed Thu Fri        |
| Pankaj  ─   ─   L   L   L         |
| Suresh  ─   ─   ─   ─   ─         |
| Vikram  ─   ─   ─   L   ─         |
| Anita   ─   ─   ─   ─   ─         |
| ───────────────────────          |
| Available:  4   4   3   2   3    |
+----------------------------------+
| ⚠️ Wed Thu both <50% present       |
+----------------------------------+
```

## Bulk regularization (manager)

For team leads needing to regularize multiple days:
- Select team members
- Select dates
- Submit batch
- Goes through skip-level approval

## Notifications

Push notifications:
- Leave approved / rejected
- Leave balance low (e.g., < 3 days EL with 6 months left)
- Reminder to check-in (if missed by certain time)
- Attendance auto-marked LOP (if not regularized after X days)

## Policy reference

In-app:
- Leave policy document accessible
- Annual leave entitlement
- Encashment rules
- Carry-forward rules
- Probation leave rules

## Open questions

`[OPEN]` Auto-attendance via geofence: when entering office geo-fence, auto check-in. Privacy concern. Recommend: opt-in v2.

`[OPEN]` Leave conflict prevention: don't allow > 50% of team on leave same day. Recommend: warning, not block.

`[OPEN]` Multiple manager approvals (e.g., line + functional). Recommend: tenant config; typically line manager only.

`[OPEN]` Leave plan visibility: should peers see who's on leave? Recommend: yes; team calendar.

`[OPEN]` Half-day leave: how does it interact with attendance? Recommend: half-day deduct from balance; attendance for working half required.

## Cross-references

- [/02-attendance/](../02-attendance/) — full attendance + leave specs
- [/02-attendance/10-mobile-and-offline.md](../02-attendance/10-mobile-and-offline.md) — mobile attendance details
- [/02-attendance/03-leave-types-and-policies.md](../02-attendance/03-leave-types-and-policies.md) — leave types
- [/02-attendance/06-regularization-workflow.md](../02-attendance/06-regularization-workflow.md) — regularization
