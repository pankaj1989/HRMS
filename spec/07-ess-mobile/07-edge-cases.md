# 07 — ESS & Mobile Edge Cases

## Purpose

Edge cases for ESS / mobile experience.

## EC1 — Employee at multiple devices simultaneously

Pankaj logs in on phone + tablet + web.

**Handling:**
- Multi-device support (each gets own session token)
- Audit log per device
- Notifications to all devices (configurable)
- Settings: max 5 active devices per employee
- Force-logout option for old devices

## EC2 — Employee shares phone with family

Personal phone shared by family members.

**Handling:**
- Mandatory app-level lock (PIN / biometric)
- Auto-logout on inactivity (30 min config)
- Session not persisted in shared cache
- Privacy: payslip viewing requires re-auth

## EC3 — Stolen / lost device

Pankaj's phone stolen.

**Handling:**
- Remote logout from web (Settings > Active Sessions > Revoke)
- Auth token invalidated
- Local cache cleared on next attempt
- Re-enroll biometric on new device

## EC4 — Slow / no network

Field worker with no network.

**Handling:**
- Critical actions cached: attendance check-in, leave, expense
- Local queue
- Sync when network restored
- Fallback: SMS-based check-in (per `/02-attendance/10`)

## EC5 — App permissions denied

Employee denies location permission.

**Handling:**
- Explain importance for attendance
- Fallback: manual location entry
- Warn employee about regularization need
- Some features simply unavailable (with clear messaging)

## EC6 — Time zone discrepancy

Employee on travel; phone time differs from office time.

**Handling:**
- Server time always authoritative
- Display in Asia/Kolkata for India employees
- Allow per-employee timezone (rare)
- Audit captures both times

## EC7 — Battery saver / Doze mode (Android)

Aggressive battery saver kills sync.

**Handling:**
- Detect Doze mode
- Recommend whitelisting app
- Critical actions (attendance) bypass Doze
- Show user-friendly explanation

## EC8 — App not opened for weeks

Employee hasn't opened app for 30 days.

**Handling:**
- Push reminder: "Apply leaves, see your payslip"
- Email digest if no push response
- Re-engagement campaign
- After 90 days: re-activate with major UI changes prompt

## EC9 — Login from new location

Pankaj normally logs in from Bangalore; suddenly logs in from Delhi.

**Handling:**
- Geolocation analytics
- Email + SMS alert: "New login from Delhi - was this you?"
- One-tap response
- Block if suspicious + force re-auth

## EC10 — Concurrent leave applications

Pankaj applies for leave on phone; then applies different leave on laptop simultaneously.

**Handling:**
- Optimistic concurrency
- Server validates last-write balance
- One application wins; other fails with conflict message
- User chooses

## EC11 — Push notifications not delivered

Manager doesn't get notification of urgent leave approval needed.

**Handling:**
- In-app counter still shows pending
- Email fallback after 4 hours
- Daily digest summary
- Manager can subscribe to SMS for critical
- Investigate: APN/FCM token expired? Reset on next app open

## EC12 — Phone clock incorrect

Phone time off by 30 mins.

**Handling:**
- Server time used for all critical timestamps (attendance, leave)
- Display only uses local time
- Audit in server time

## EC13 — App version too old

Employee on v0.5; current v1.2.

**Handling:**
- Compatible: silent upgrade prompt
- Breaking changes: force-update screen
- Critical: blocking (can't continue without update)

## EC14 — Corrupted local cache

IndexedDB corrupted; data shows wrong.

**Handling:**
- Detection: data integrity check on app open
- Auto-clear and re-fetch
- User notified: "Refreshing your data..."
- Fallback to login if persistent

## EC15 — Employee on extended leave

3 months on sabbatical; doesn't open app.

**Handling:**
- No automatic action
- Auth token still valid (long-lived refresh)
- Manager / HR can mark "on extended leave"
- Communications paused (no daily digests)

## EC16 — Employee changes phone number

Pankaj gets new phone number.

**Handling:**
- Update via profile (with OTP verification of new number)
- Old number marked inactive
- Push tokens migrated
- 2FA / OTP routes to new number after verification

## EC17 — Mobile dark mode

User prefers dark mode.

**Handling:**
- Auto-detect from OS preference
- Tenant override (some companies want only light or only dark)
- Toggle in settings
- Image / chart compatibility (avoid white-on-white in dark mode)

## EC18 — Accessibility user

Employee uses screen reader (VoiceOver / TalkBack).

**Handling:**
- ARIA labels on all interactive elements
- Skip-to-content links
- Keyboard navigation
- High-contrast mode option
- Text size scaling

## EC19 — Employee can't read English

Employee primarily speaks Hindi.

**Handling:**
- Hindi UI (v1)
- Regional languages (v2): Tamil, Telugu, Marathi, Kannada, Bengali, Gujarati, Punjabi
- Auto-detect or manual selection
- Some critical content remains in English (legal terms, statutory)

## EC20 — App crash mid-action

Employee submitting leave; app crashes.

**Handling:**
- Auto-save draft to local
- Crash report sent
- On re-open: "You had unsubmitted leave; resume?"
- Recovery within 24 hours

## EC21 — Network mid-upload

Uploading IT proof; network drops at 80%.

**Handling:**
- Resumable uploads (chunked)
- Retry on next online
- User sees progress bar with retry option
- Cancel option

## EC22 — Multiple tenants on one device

Pankaj has accounts at Acme + ConsultCo; uses same phone.

**Handling:**
- Account switcher in app
- Separate cache per tenant
- Separate notifications
- Logout / re-login per tenant context

## EC23 — Device root / jailbreak

Compromised device.

**Handling:**
- Detection (root/jailbreak detection libs)
- Tenant policy: block sensitive features (payslip view, etc.) on rooted devices
- User informed
- Audit log of root detection

## EC24 — Phone regulatory restrictions (some countries)

Worker traveling abroad.

**Handling:**
- VPN / region restrictions: rare for Indian employees abroad
- Most features work via internet
- Some compliance features (geotag) may not apply

## EC25 — Manager on vacation; pending approvals

Manager unreachable for 2 weeks.

**Handling:**
- Auto-delegation (per `/00-foundations/03-identity-and-rbac.md`)
- Employee can choose to wait or escalate to skip-level
- Notifications routed to delegate
- Emergency override path (HR Head can approve critical)

## Cross-references

All other files in `/07-ess-mobile/` contain handling logic.
- [/02-attendance/08-edge-cases.md](../02-attendance/08-edge-cases.md) — attendance edge cases
- [/00-foundations/03-identity-and-rbac.md](../00-foundations/03-identity-and-rbac.md) — auth edge cases
