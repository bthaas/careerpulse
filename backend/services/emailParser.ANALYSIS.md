# Email Parser Analysis

## Current Issues

Based on testing with real email samples, the following issues have been identified:

### 1. Status Detection Problems

**Offer Detection:**
- ✅ GOOD: Keywords like "offer", "congratulations", "pleased to offer", "extending an offer" work well
- ✅ GOOD: Compensation-related keywords help identify offers
- ⚠️ ISSUE: Some offers might be missed if they use less common phrasing

**Interview Detection:**
- ✅ GOOD: Keywords like "interview", "schedule a call", "phone screen" work well
- ⚠️ ISSUE: "Next steps" is too generic and might catch non-interview emails
- ⚠️ ISSUE: "Let's chat" or "speak with you" might be too broad

**Rejection Detection:**
- ✅ GOOD: Keywords like "unfortunately", "not moving forward", "decided to pursue other candidates" work well
- ⚠️ ISSUE: "not selected", "not a fit" are good but might need more context
- ⚠️ ISSUE: Some rejections use softer language like "decided to pursue other applicants"

**Applied Detection:**
- ✅ GOOD: Keywords like "application received", "thank you for applying" work well
- ⚠️ ISSUE: Default fallback to "Applied" might misclassify some emails

### 2. Priority Order Issues

Current order: Offer → Rejection → Interview → Applied

**Problem:** An email saying "Unfortunately, we won't be moving forward with an interview" would be classified as "Rejected" (correct) but an email saying "Congratulations on moving to the interview stage" might be classified as "Offer" if it contains "congratulations" (incorrect).

**Solution:** Need better context-aware detection, not just keyword matching.

### 3. Company Extraction Issues

- ✅ GOOD: Domain extraction works for most companies
- ⚠️ ISSUE: Skips common ATS domains (greenhouse, lever, workday) but then falls back to sender name
- ⚠️ ISSUE: For emails like "Application for Frontend Developer - Shopify", the company is in the subject but might not be extracted correctly

### 4. Job Title Extraction Issues

- ✅ GOOD: Patterns like "for the [Title] position" work well
- ⚠️ ISSUE: Titles with multiple words might not be captured fully
- ⚠️ ISSUE: Titles in format "Application Received - Software Engineer" work well
- ⚠️ ISSUE: Titles like "Senior Backend Developer" should be captured fully

## Recommended Improvements

### 1. Context-Aware Status Detection

Instead of simple keyword matching, check for:
- **Offer**: Must have "offer" + compensation/start date keywords
- **Rejection**: Must have negative keywords + "not"/"unfortunately"
- **Interview**: Must have interview keywords + scheduling/invitation context
- **Applied**: Confirmation keywords + "received"/"submitted"

### 2. Improved Keyword Lists

**Add to OFFER_KEYWORDS:**
- "we would like to offer"
- "pleased to extend"
- "compensation package"
- "base salary"
- "equity"
- "stock options"

**Add to REJECTION_KEYWORDS:**
- "not able to move forward"
- "not able to offer"
- "pursue other candidates"
- "pursue other applicants"
- "decided to pursue"
- "not a match"
- "better fit"

**Add to INTERVIEW_KEYWORDS:**
- "invite you to"
- "schedule an interview"
- "phone screen"
- "video interview"
- "technical interview"
- "meet with our team"
- "conversation"
- "discuss your"

**Remove from INTERVIEW_KEYWORDS:**
- "next steps" (too generic)

### 3. Better Company Extraction

For ATS emails (greenhouse, lever, workday), extract company from subject line:
- Pattern: "at [Company]"
- Pattern: "for [Title] at [Company]"
- Pattern: "[Title] - [Company]"

### 4. Confidence Scoring Improvements

Current scoring is too simple. Improve by:
- Higher confidence for emails with clear status indicators
- Lower confidence for ambiguous emails
- Consider multiple factors: company clarity, title clarity, status clarity

## Test Cases to Validate

1. ✅ Application confirmation → "Applied"
2. ✅ Interview invitation → "Interview"
3. ✅ Offer letter → "Offer"
4. ✅ Rejection email → "Rejected"
5. ⚠️ "Congratulations on interview" → Should be "Interview", not "Offer"
6. ⚠️ "Unfortunately, no interview" → Should be "Rejected", not "Interview"
7. ⚠️ ATS emails with company in subject → Should extract correct company
8. ⚠️ Multi-word job titles → Should capture full title

## Implementation Priority

1. **HIGH**: Fix status detection with better context awareness
2. **HIGH**: Improve rejection keyword detection
3. **MEDIUM**: Better company extraction from ATS emails
4. **MEDIUM**: Improve confidence scoring
5. **LOW**: Handle edge cases (forwarded emails, automated replies)
