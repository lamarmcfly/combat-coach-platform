# Combat Coach Platform - Integration Roadmap

## Core Feature Status: STABLE

All 15 core pages (10 athlete + 5 coach) are production-ready with:
- Complete API routes with CRUD operations
- Proper error handling (try/catch, status codes, toast notifications)
- Loading states (skeleton loaders)
- Empty states (icons, CTAs)
- TypeScript type safety
- NextAuth authentication

---

## Integration Readiness Standards

Before implementing an integration, verify:

### Prerequisites (Must Have)
- [ ] Core feature it extends is stable
- [ ] API authentication pattern established
- [ ] Error handling pattern established
- [ ] UI components available for display
- [ ] Database schema can accommodate data

### Implementation Standards
- [ ] Environment variables documented in `.env.example`
- [ ] Graceful degradation if service unavailable
- [ ] Rate limiting consideration
- [ ] User consent for data sharing (GDPR/privacy)
- [ ] Loading/error states for async operations

### Testing Standards
- [ ] Manual testing with real service
- [ ] Error scenarios handled
- [ ] Offline/unavailable scenarios handled

---

## Integration Priority Matrix

### Tier 1: High Value + Low Complexity (Do First)

| Integration | Value | Complexity | Extends | Status |
|-------------|-------|------------|---------|--------|
| **Sparring Partner Matching** | HIGH | LOW | Weight, Lineage | COMPLETE |
| **YouTube Embed** | HIGH | LOW | Fights, Courses | COMPLETE |
| **Calendar Export (.ics)** | HIGH | LOW | Schedule | COMPLETE |

### Tier 2: High Value + Medium Complexity

| Integration | Value | Complexity | Extends | Status |
|-------------|-------|------------|---------|--------|
| **Google Calendar Sync** | HIGH | MEDIUM | Schedule | COMPLETE |
| **Apple Calendar Sync** | HIGH | MEDIUM | Schedule | READY |
| **Email Notifications (SendGrid)** | HIGH | MEDIUM | All | COMPLETE |
| **Stripe Tax / 1099** | HIGH | MEDIUM | Earnings | READY |

### Tier 3: High Value + High Complexity

| Integration | Value | Complexity | Extends | Status |
|-------------|-------|------------|---------|--------|
| **Apple HealthKit** | HIGH | HIGH | Weight | READY |
| **Google Fit** | HIGH | HIGH | Weight | READY |
| **Zoom/Jitsi Video** | HIGH | HIGH | Live Sessions | READY |

### Tier 4: Medium Value (Consider Later)

| Integration | Value | Complexity | Extends | Status |
|-------------|-------|------------|---------|--------|
| **Discord/Slack** | MEDIUM | MEDIUM | Coaching, Teams | DEFER |
| **WhatsApp Business** | MEDIUM | HIGH | Notifications | DEFER |
| **SMS (Twilio)** | MEDIUM | LOW | Notifications | DEFER |

---

## Tier 1 Implementation Details

### 1. Sparring Partner Matching
**Why First:** Uses existing data (weight class, discipline, location from lineage)

**Schema Addition:**
```prisma
model SparringPreference {
  id            String   @id @default(cuid())
  userId        String   @unique
  isAvailable   Boolean  @default(true)
  weightClass   String?
  disciplines   String[]
  location      String?
  radius        Int      @default(25) // miles
  experienceMin Int?     // years
  experienceMax Int?
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**API Routes:**
- GET /api/sparring/matches - Find matching partners
- POST /api/sparring/preferences - Set preferences
- POST /api/sparring/request - Request to spar

**Effort:** 1-2 days

---

### 2. YouTube Video Embed
**Why:** Fight videos and course content often on YouTube

**Implementation:**
- Extract YouTube video ID from URL
- Use react-youtube or iframe embed
- Add to FightDetailView component
- Add to course lesson player

**Effort:** 0.5 days

---

### 3. Calendar Export (.ics)
**Why:** Users want training in their calendar

**Implementation:**
- Generate .ics file from TrainingSchedule
- Download button on schedule page
- Use ical-generator package

**Effort:** 0.5 days

---

## Minor Stabilization Items (Pre-Integration)

These should be addressed before starting integrations:

1. **Email Notifications in Stripe Webhooks** ✅ DONE
   - File: `/api/webhooks/stripe/route.ts`
   - Implemented: Renewal, payment failure, credit pack emails
   - Using: `/lib/email/emailService.ts` with SendGrid support

2. **Stripe SDK Update** ✅ DONE
   - File: `/lib/stripe/client.ts`
   - Updated to Stripe SDK v19.3.1 methods
   - Added: `getUpcomingInvoice()`, `createBillingPortalSession()`

3. **Consistent Loading States** ✅ DONE
   - Replace "Loading..." text with SkeletonCard
   - Files: coaching pages
   - Effort: 0.25 days

---

## Completed Integrations

### Email Notification Service

**Location:** `/lib/email/emailService.ts`

**Templates Available:**
- `subscription_renewed` - Sent when subscription is renewed
- `payment_failed` - Sent when payment fails (with retry link)
- `credit_pack_purchased` - Sent after credit pack purchase
- `coaching_request_received` - Sent to coach when student requests coaching
- `coaching_response_received` - Sent to student when coach responds
- `sparring_request_received` - Sent when someone wants to spar
- `sparring_request_accepted` - Sent when sparring request is accepted
- `welcome` - Welcome email for new users

**Configuration:**
- Set `SENDGRID_API_KEY` env variable for production
- Set `EMAIL_FROM` for custom sender address
- Logs to console in development mode when SendGrid not configured

**Usage:**
```typescript
import { sendTemplatedEmail } from '@/lib/email/emailService';

await sendTemplatedEmail(userEmail, 'template_name', {
  firstName: 'John',
  // ... template-specific variables
});
```

### Google Calendar Sync

**Location:** `/lib/calendar/googleCalendar.ts`

**Features:**
- OAuth 2.0 authentication flow
- Automatic token refresh
- List available calendars
- Create events from training schedules
- Sync multiple weeks of training
- Select which calendar to sync to

**API Routes:**
- `GET /api/calendar/google` - Get connection status
- `GET /api/calendar/google/connect` - Start OAuth flow
- `GET /api/calendar/google/callback` - Handle OAuth callback
- `POST /api/calendar/google` - Sync schedules to calendar
- `DELETE /api/calendar/google` - Disconnect calendar
- `GET /api/calendar/google/calendars` - List available calendars
- `PUT /api/calendar/google/calendars` - Select calendar for sync

**Configuration:**
- Get credentials from Google Cloud Console: https://console.cloud.google.com/apis/credentials
- Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env variables
- Enable Google Calendar API in your project
- Add redirect URI: `{APP_URL}/api/calendar/google/callback`

**UI Component:** `GoogleCalendarSync` on Schedule page

---

## Implementation Order

### Phase 1: Foundation (Week 1)
1. Fix 4 minor stabilization items
2. Implement Sparring Partner Matching
3. Add YouTube embed support

### Phase 2: Scheduling (Week 2)
1. Calendar .ics export
2. Google Calendar sync (OAuth)
3. Apple Calendar sync

### Phase 3: Communication (Week 3)
1. SendGrid email integration
2. Email templates for key events
3. Notification preferences UI

### Phase 4: Advanced (Week 4+)
1. Health kit integrations
2. Video conferencing
3. Team features

---

## Ready to Implement

The platform passes all readiness standards for Tier 1 integrations:
- [x] Core features stable
- [x] API patterns established
- [x] Error handling consistent
- [x] UI components available
- [x] Database schema extensible

**Recommendation:** Start with Sparring Partner Matching as it provides immediate combat-sports-specific value using existing data.
