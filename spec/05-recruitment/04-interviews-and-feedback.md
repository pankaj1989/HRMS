# 04 — Interviews & Feedback

## Purpose

Interviews are the bottleneck of recruitment. Scheduling across panels, candidate availability, calendar integration, feedback collection — all friction-heavy. This file specifies the interview entity, scheduling flow, panel management, feedback templates, and integration with calendar systems.

## Interview schema

```typescript
interface Interview extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  entityId: ObjectId;
  
  // identity
  interviewCode: string;                   // 'INT-2026-04-001234'
  
  // links
  applicationId: ObjectId;
  candidateId: ObjectId;
  requisitionId: ObjectId;
  pipelineStageCode: string;               // 'tech-1', 'manager-interview' etc.
  
  // scheduling
  scheduledAt: Date;
  durationMinutes: number;                 // typically 45-60
  timeZone: string;                        // 'Asia/Kolkata'
  
  // mode
  mode: 'in-person' | 'video-call' | 'phone';
  videoCallLink?: string;                  // Google Meet / Zoom / Teams
  videoCallProvider?: 'google-meet' | 'zoom' | 'teams' | 'other';
  inPersonLocation?: {
    locationId: ObjectId;
    roomName?: string;
    address?: string;
  };
  
  // panel
  panel: Array<{
    interviewerEmployeeId: ObjectId;
    role: 'primary' | 'secondary' | 'observer' | 'note-taker';
    isMandatory: boolean;
    rsvpStatus?: 'pending' | 'accepted' | 'declined' | 'tentative';
    rsvpAt?: Date;
  }>;
  
  // candidate context
  candidateAvailabilityProvided: boolean;
  candidateRsvpStatus?: 'pending' | 'confirmed' | 'requested-reschedule' | 'declined';
  
  // status
  status: 'scheduled' | 'rescheduled' | 'in-progress' | 'completed' | 'cancelled' | 'no-show-candidate' | 'no-show-interviewer';
  
  // pre-interview
  resumeAccessible: boolean;
  briefingNotes?: string;                  // notes for panel
  questionTemplate?: ObjectId;             // ref InterviewQuestionTemplate
  
  // post-interview
  feedbackDeadline?: Date;
  allFeedbackReceived: boolean;
  feedbackSummary?: string;
  averageRating?: number;
  consensusRecommendation?: 'strong-hire' | 'hire' | 'no-hire' | 'strong-no-hire';
  
  // calendar integration
  externalCalendarEventId?: string;        // Google / Outlook event ID
  externalCalendarProvider?: 'google' | 'outlook';
  
  // audit
  scheduledBy: ObjectId;
  scheduledAt_audit: Date;                 // distinct from scheduled time
  rescheduleHistory: Array<{
    originalTime: Date;
    rescheduledAt: Date;
    rescheduledBy: ObjectId;
    reason: string;
  }>;
  
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}
```

## Indexes

```typescript
{ tenantId: 1, interviewCode: 1 }, unique
{ tenantId: 1, applicationId: 1, scheduledAt: -1 }
{ tenantId: 1, panel: { $elemMatch: { interviewerEmployeeId: 1 } }, scheduledAt: 1 }
{ tenantId: 1, status: 1, scheduledAt: 1 }
{ tenantId: 1, scheduledAt: 1 }            // calendar view
```

## Feedback schema

```typescript
interface InterviewFeedback extends BaseDocument {
  _id: ObjectId;
  tenantId: ObjectId;
  interviewId: ObjectId;
  applicationId: ObjectId;
  candidateId: ObjectId;
  
  interviewerEmployeeId: ObjectId;
  
  // overall
  overallRating: number;                   // 1-5 (or per template)
  recommendation: 'strong-hire' | 'hire' | 'leaning-hire' | 'leaning-no-hire' | 'no-hire' | 'strong-no-hire';
  
  // structured ratings (template-driven)
  ratings: Array<{
    competencyCode: string;                // 'technical-depth', 'communication', 'culture-fit'
    competencyName: string;
    rating: number;                        // 1-5
    comments?: string;
  }>;
  
  // narrative
  strengths: string;
  weaknesses: string;
  questionsAsked?: string[];
  candidateQuestions?: string[];
  followUpRecommendations?: string;
  
  // hiring concern flags
  redFlags?: Array<{
    category: 'integrity' | 'skill-gap' | 'culture' | 'communication' | 'compensation' | 'other';
    description: string;
    severity: 'minor' | 'moderate' | 'major';
  }>;
  
  // metadata
  submittedAt: Date;
  durationToFeedbackMinutes: number;
  
  createdAt: Date;
  isDeleted: boolean;
}
```

## Question templates

Standardized questions per role family:

```typescript
interface InterviewQuestionTemplate {
  _id: ObjectId;
  tenantId: ObjectId;
  
  templateName: string;                    // 'Tech-1 Backend Engineer'
  applicableTo: {
    jobFamily?: string;
    designationLevels?: string[];
    pipelineStages?: string[];
  };
  
  competencies: Array<{
    competencyCode: string;
    competencyName: string;
    weight: number;                        // % weight in overall
    questions: Array<{
      questionId: string;
      question: string;
      expectedTopics: string[];
      difficultyLevel: 'easy' | 'medium' | 'hard';
      timeMinutes: number;
    }>;
  }>;
  
  isActive: boolean;
}
```

`[v2]` Interview question banks; AI-suggested questions per role.

## Scheduling flow

```mermaid
sequenceDiagram
    participant Recruiter
    participant App
    participant Interviewer
    participant Candidate
    participant Calendar as Google/Outlook
    
    Recruiter->>App: schedule interview (panel + slot)
    App->>App: check interviewer availability (calendar API)
    App->>App: check candidate availability (form filled or async)
    
    alt All available
        App->>Calendar: create event (interviewer)
        App->>Email: invite candidate
        App->>Email: confirm panel
    else Conflict
        App->>Recruiter: alert; suggest alternative slots
    end
    
    Note over Calendar: Reminder 24h, 1h before
    
    Calendar->>Interviewer: notification
    Calendar->>Candidate: notification (calendar invite)
    
    Note over App: Interview happens
    
    App->>Interviewer: feedback request (post-meeting)
    Interviewer->>App: submit feedback
    
    App->>Recruiter: aggregated feedback ready
    Recruiter->>App: review, decision
```

## Calendar integration

`[v1]` Email-based:
- HRMS sends calendar invite via .ics email
- Interviewer adds to own calendar
- HRMS doesn't see actual calendar; relies on RSVP

`[v2]` API-based:
- OAuth integration with Google Calendar / Outlook 365
- HRMS reads availability slots
- HRMS creates events directly
- Conflicts auto-detected

## Slot suggestion (v2)

For ease of scheduling:
1. Recruiter selects time window (e.g., next 5 working days)
2. HRMS computes slots where panel is free
3. Sent to candidate as bookable slots (via candidate portal or email link)
4. Candidate picks slot → auto-confirmed

`[v2]` Calendly-like booking experience embedded.

## Panel management

```typescript
interface InterviewPanel {
  panelCode: string;
  applicableTo: { jobFamily?: string; pipelineStages?: string[] };
  
  members: Array<{
    employeeId: ObjectId;
    role: 'primary' | 'secondary' | 'specialist';
    expertise: string[];
    maxInterviewsPerWeek?: number;
  }>;
  
  rotation?: 'round-robin' | 'load-balance' | 'manual-select';
  
  isActive: boolean;
}
```

For frequent hiring, panels pre-defined; recruiter just picks panel + slot.

## RSVP and reminders

| Event | Time | Channel |
|---|---|---|
| Schedule confirmation to interviewer | Immediate | Email + calendar |
| Schedule confirmation to candidate | Immediate | Email |
| Reminder 24 hours before | T-24h | Email + push |
| Reminder 1 hour before | T-1h | Push + SMS |
| Post-interview feedback request | T+30 mins | Email |

## Feedback collection

After interview ends, feedback prompted to interviewer within structured form:
- Per-competency ratings (from template)
- Narrative
- Recommendation

Feedback SLA: 24 hours. Beyond → reminder. Beyond 48h → escalation.

## Consolidated decision

Once all panel feedback in:
- Recruiter sees aggregated view
- Average ratings
- Consensus recommendation
- Conflict surfaced (e.g., 2 hire + 1 strong-no-hire)
- Hiring manager makes final decision

```typescript
interface InterviewDecisionPoint {
  applicationId: ObjectId;
  pipelineStage: string;
  
  feedbackCollected: number;
  feedbackPending: number;
  
  averageRating: number;
  consensusRecommendation: string;
  hasConflict: boolean;
  
  // decision
  decision?: 'pass' | 'fail' | 'hold-for-discussion';
  decisionMadeBy?: ObjectId;
  decisionMadeAt?: Date;
  decisionNotes?: string;
  
  // next stage
  nextStageMoveTriggered?: boolean;
}
```

## Interview kit

Pre-interview materials shared with panel:
- Candidate resume
- Application data
- Prior interview feedback (if multi-stage)
- Question template (suggested)
- Briefing notes

Auto-emailed before interview.

## Candidate experience

Post-interview:
- Thank-you email
- Status communication ("we'll get back to you in X days")
- If selected for next round: scheduling link
- If rejected: respectful rejection email (with optional feedback)
- Survey: candidate experience rating (used for recruitment process improvement)

## Multi-round interviews

Many roles require 4-7 rounds. The HRMS:
- Tracks each round as separate Interview record
- Stage in pipeline drives which round next
- Cumulative feedback view for hiring decision
- Time gap tracking (don't drag candidate too long)

## Reschedule / cancellation

Common scenarios:
- Interviewer drops out (sick, urgent meeting)
- Candidate requests
- Time slot not working

Process:
- Reschedule: new time, new calendar event, notify all
- Cancel: notify candidate, drop calendar
- Audit: all changes logged

## No-show handling

| Type | Action |
|---|---|
| Candidate no-show | Alert recruiter; note on application; consider blacklist after 2-3 |
| Interviewer no-show | Apologize to candidate; reschedule; note for interviewer feedback |

## Interview compensation (some companies pay candidates)

Travel reimbursement, time compensation. Out of v1 scope; basic notes capture only.

## Reports

- **Interview Throughput**: per panel per week
- **Feedback Submission Rate**: % submitted within SLA
- **Interview-to-Hire Ratio**: efficiency metric
- **Drop-off in Interview Stages**: where candidates fail
- **Interview Rating Distribution**: rating bias detection

## Open questions

`[OPEN]` AI-assisted feedback (transcription + summary). Useful but privacy concerns. Recommend: opt-in v2.

`[OPEN]` Interview recording: legal in most Indian states with consent. Recommend: opt-in tenant policy; consent at scheduling.

`[OPEN]` Candidate self-scheduling vs recruiter-scheduling. Recommend: tenant config; default recruiter for senior roles, self for high-volume.

`[OPEN]` Bias monitoring: track who's on panel, decisions, demographics. Sensitive but important. Recommend: aggregated analytics in v2.

## Cross-references

- [03-pipeline-and-stages.md](./03-pipeline-and-stages.md) — interview as stages
- [05-offer-management.md](./05-offer-management.md) — offer after interviews
- [/00-foundations/03-identity-and-rbac.md](../00-foundations/03-identity-and-rbac.md) — interviewer permissions
