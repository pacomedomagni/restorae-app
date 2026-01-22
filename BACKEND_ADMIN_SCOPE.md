# Restorae Backend + Admin UI — Full System Scope

This document captures the complete production scope for the backend and admin UI based on current mobile app features.

## Backend — Full Scope

### 1) Identity & Access
- Anonymous device identity + optional account upgrade
- Auth methods: email/password, Apple, Google
- Session management + refresh tokens
- Role-based access (user, admin, analyst, support)
- Onboarding completion tracking

### 2) User Profile & Preferences
- Profile: name, timezone, locale
- Preferences: theme, sounds, haptics
- App lock settings:
  - Lock method (biometric, pin, both, none)
  - Lock on background toggle
  - Lock timeout (seconds, 0 = immediate)
  - Never store actual PIN/biometric data server-side

### 3) Content Library (All App Tools)
- Breathing patterns (timings: inhale, hold1, exhale, hold2, cycles)
- Grounding techniques (categories: sensory, body, mental)
- Reset exercises (categories: stretch, shake, flow)
- Focus sessions + ambient sounds
- SOS presets with 4-phase structure:
  - Phase types: interrupt, ground, reassure, next-step
  - Embedded breathing patterns per phase
  - Duration per phase
- Situational guides:
  - Categories: work, emotional, social, self
  - Step types: breathing, reflection, action, affirmation
  - Embedded breathing patterns per step
- Ambient sounds:
  - Name, description, vibe, icon
  - Audio file URL
  - Linked to focus sessions
- Journal prompts (categories: gratitude, reflection, release, growth)
- Morning/evening rituals with typed steps:
  - Step types: breathing, reflection, intention, gratitude, release, affirmation
  - Optional embedded breathing patterns
- Quick reset presets
- Custom categories, tags, ordering, best-for, duration
- Multi-language support
- Draft/publish/version history
- Audio/soundscape file storage (S3/CDN)
- Streaming endpoints for audio

### 4) Journaling
- Journal entries CRUD
- Encrypted payload support (encryption key management)
- Per-entry biometric lock flag (isLocked)
- Tags, mood link, prompts
- Search + export
- Soft delete with recovery period

### 5) Mood Tracking
- Mood entries CRUD
- Mood types: energized, calm, anxious, low, good, tough
- Entry context: morning, midday, evening, manual
- Mood factors/contributors (why user feels this way)
- Optional notes
- Stats: streaks, distributions, trends
- Weekly goals (target days, progress)
- Export

### 6) Rituals & Completions
- Custom rituals CRUD
- Scheduling: timeOfDay (morning, midday, evening, anytime)
- Day selection (monday-sunday)
- Reminder time (HH:mm format)
- Custom steps with title, duration, description
- Completion records (duration, steps completed, mood, notes)
- Favorites
- Archive/unarchive
- Streaks + completion metrics
- Reminders attached to rituals

### 7) Notifications
- Push token registry
- Default reminders: morning, midday, evening
- Custom reminder scheduling
- Timezone-aware delivery
- Quiet hours
- Campaign notifications (targeted, scheduled)
- Delivery logs + open tracking

### 8) Subscriptions & Entitlements
- Free / premium / lifetime tiers
- Trial system:
  - Trial duration configuration
  - Trial start/end tracking
  - Trial-to-paid conversion analytics
- Feature gating by item or category
- Receipt validation (RevenueCat integration)
- Webhook handlers for Apple/Google notifications
- Restore purchases
- Entitlement audit

### 9) Data Governance
- Data export (journal, mood, preferences, rituals)
- Account deletion + legal hold support
- Audit logs for admin actions

### 10) Support & Feedback
- Feedback submissions
- Abuse reports
- Feature requests
- Ticket status + internal notes
- FAQ management
- Email templates
- App rating prompts configuration

### 11) Analytics
- DAU/MAU
- Tool usage
- Completion funnels
- Retention cohorts
- Subscription conversion

---

## Admin UI — Full Scope

### A) Content Management
- CRUD for all content types
- Batch import/export JSON
- Tagging, categories, ordering
- Draft → review → publish workflow
- Localized text management

### B) User Management
- Search users
- View metadata + device list
- Export user data
- Disable/reactivate users
- GDPR/CCPA delete requests

### C) Subscription Admin
- View entitlements
- Grant/revoke premium
- Refund/chargeback notes

### D) Notification Console
- Compose campaigns
- Schedule by timezone
- Segment targeting
- Delivery analytics

### E) Analytics Dashboard
- Usage dashboards
- Mood trends (aggregate only)
- Retention & funnels
- Content performance

### F) Support Inbox
- View feedback
- Assign, tag, resolve
- Response templates

### G) System Settings
- Paywall copy
- Feature flags
- Legal content:
  - Privacy policy (editable sections)
  - Terms of service
- FAQ management (questions + answers)
- Maintenance toggles
- Trial duration configuration
- Audio upload management
- App rating prompt rules

---

## Core Data Entities (Full)
- User
- Device
- Preference
- JournalEntry
- MoodEntry
- MoodFactor
- WeeklyGoal
- Ritual
- RitualStep
- RitualCompletion
- Reminder
- ContentItem (per type)
- SOSPhase
- AudioFile
- Subscription
- Trial
- Entitlement
- Notification
- Feedback
- AuditLog
- Segment
- FeatureFlag
- Locale

---

## Technical Considerations

### Offline & Sync
- Offline-first data storage
- Conflict resolution strategy (last-write-wins vs merge)
- Sync queue for pending changes
- Delta sync for large datasets

### API Design
- API versioning (v1, v2)
- Rate limiting per user/device
- Request validation & sanitization
- Pagination for list endpoints

### Security
- Encryption key management for journals
- JWT token rotation
- Device fingerprinting
- Abuse detection

### Storage
- Audio file upload limits (max size)
- CDN for audio streaming
- Data export format (JSON, PDF)
- Backup retention policy

### Time Handling
- Store all timestamps in UTC
- Convert to user timezone on display
- Timezone-aware scheduling for reminders

### Data Lifecycle
- Soft delete with 30-day recovery
- Hard delete for GDPR requests
- Archival policy for old data
