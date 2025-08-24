# A/B Testing System Documentation

## Overview
The A/B testing system for the onboarding checklist randomly assigns users to one of two variants: "short" or "guided". This system tracks completion rates and user engagement to determine which onboarding experience is more effective.

## Variant Switch Location
**Primary Hook**: `src/hooks/useABTest.ts`
- `useABTest(testName: string)` - Main hook for variant assignment and management
- `trackABTestEvent()` - Function for tracking events with variant metadata

## Variant Assignment Logic
```typescript
// 50/50 random split
const randomVariant: ABTestVariant = Math.random() < 0.5 ? 'short' : 'guided';
```

## Storage Strategy
1. **localStorage**: Immediate storage for persistence across browser sessions
2. **User Metadata**: Stored in Supabase auth user metadata (if authenticated)
3. **Fallback**: If database fails, falls back to localStorage only

## Event Names & Tracking
### Core Events:
- `ab_test_assigned` - When user gets assigned a variant
- `onboarding_completed` - When user completes the checklist
- `onboarding_step_completed` - Individual step completions
- `onboarding_started` - When user begins onboarding
- `onboarding_skipped` - When user skips onboarding

### Event Metadata Structure:
```typescript
{
  test_name: 'onboarding_checklist',
  variant: 'short' | 'guided',
  timestamp: string,
  // Additional event-specific data
}
```

## Variant Differences

### Short Variant (Quick Start)
- **Steps**: 3 total
  1. Welcome to FindableAI
  2. Add Your Website
  3. Run First Scan
- **UI**: Target icon, "Quick Start" heading
- **Focus**: Get users to basic functionality quickly

### Guided Variant (Complete Onboarding)
- **Steps**: 6 total
  1. Welcome to FindableAI
  2. Learn About AI Findability
  3. Add Your Website
  4. Run Comprehensive Scan
  5. Test AI Prompts
  6. Review Optimization Tips
- **UI**: Sparkles icon, "Complete Onboarding" heading
- **Focus**: Comprehensive education and setup

## File Locations

### Core Implementation:
- `src/hooks/useABTest.ts` - A/B test logic and event tracking
- `src/components/onboarding/OnboardingChecklist.tsx` - Variant-aware checklist component
- `src/pages/Onboarding.tsx` - Updated onboarding page using new system

### Analytics & Admin:
- `src/components/admin/ABTestAnalytics.tsx` - Admin dashboard for viewing results
- `src/pages/Admin.tsx` - Updated to include A/B test tab
- `src/components/admin/AdminSubNav.tsx` - Navigation includes A/B Tests tab

## Analytics Dashboard
Located at `/admin?tab=ab-tests` (admin access required)

### Metrics Tracked:
- **Total Assignments**: Number of users assigned to each variant
- **Total Completions**: Users who completed onboarding
- **Completion Rate**: Percentage completion by variant
- **Average Steps Completed**: Mean steps completed per variant

### Statistical Validity:
- Events stored in `user_events` table with full metadata
- Real-time data refresh capability
- Breakdown by variant for comparative analysis
- Historical tracking with timestamps

## Testing the A/B Test

### For Development:
- Clear localStorage: `localStorage.removeItem('ab_test_onboarding_checklist')`
- Check variant in browser console: `localStorage.getItem('ab_test_onboarding_checklist')`
- Debug info visible in development mode at bottom of checklist

### For Production Verification:
1. Create multiple test accounts
2. Go through onboarding flow
3. Check admin analytics dashboard
4. Verify events in `user_events` table

## Database Schema
Events are stored in the existing `user_events` table:
```sql
SELECT 
  event_name,
  metadata->>'variant' as variant,
  metadata->>'test_name' as test_name,
  COUNT(*) as count
FROM user_events 
WHERE event_name IN ('ab_test_assigned', 'onboarding_completed')
GROUP BY event_name, variant, test_name;
```

## Future Extensions
To add more A/B tests:
1. Call `useABTest('new_test_name')` in your component
2. Use the returned variant to conditionally render content
3. Track events with `trackABTestEvent()`
4. Add analytics queries to `ABTestAnalytics.tsx`

## Security & Privacy
- No personally identifiable information stored in test metadata
- Variant assignment is pseudorandom, not tracking-based
- GDPR compliant - user can delete account and all associated events
- Admin-only access to aggregated analytics data