# Implementation Tasks: CareerPulse/JobFetch App Completion

## Phase 1: Backend OAuth State ✅ COMPLETE

- [x] 1.1 Create OAuth state manager (`backend/utils/oauthState.js`)
- [x] 1.2 Update auth routes to use state parameter
- [x] 1.3 Update Gmail config to accept state in OAuth URL
- [x] 1.4 Fix frontend token storage key issue
- [x] 1.5 Test OAuth flow with real Gmail account
- [x] 1.6 Add OAuth security measures (state expiration, validation)
- [x] 1.7 Add OAuth logging for debugging
- [x] 1.8 Fix table scroll issue (can't scroll to see all applications)

## Phase 2: Fix Email Parsing Logic with LLM (PRIORITY)

- [x] 2.1 Analyze current email parsing issues
  - Reviewed `backend/services/emailParser.js`
  - Tested with sample emails from fixtures
  - Documented incorrect status detections
  - Identified patterns being missed or misclassified
  - **Result**: Manual parsing too inaccurate (wrong companies, titles, statuses)

- [x] 2.2 Design LLM-based parsing pipeline
  - **Stage 1**: Gmail API query with broad keywords (free, fast)
  - **Stage 2**: Quick keyword filter to remove obvious non-job emails (free, fast)
  - **Stage 3**: LLM classification + extraction (accurate, small cost)
  - **Decision**: Use gpt-4o-mini for cost-effectiveness

- [x] 2.3 Implement LLM parser service
  - Created `backend/services/llmParser.js` with Gemini 2.0 Flash-Lite
  - Switched from OpenAI to Google Gemini (50% cheaper)
  - Implemented `extractWithLLM(from, subject, body)` function
  - LLM classifies (is job email?) AND extracts (company, title, status, location)
  - Added caching to avoid duplicate LLM calls for same email
  - Added error handling and graceful fallback
  - Updated environment variables to use GOOGLE_AI_API_KEY

- [x] 2.4 Update email parser to use LLM
  - Modified `backend/services/emailParser.js` to use Gemini pipeline
  - Removed all manual parsing logic (company, title, status extraction)
  - Keep manual parsing for: date extraction, basic metadata
  - Use Gemini for: company name, job title, status, location
  - Added confidence scoring (higher for LLM results)
  - Added notes indicating LLM was used

- [x] 2.5 Update Gmail service query
  - Expanded Gmail search query to cast wider net
  - Added more job-related keywords to catch all potential emails
  - Query now includes: application, apply, interview, offer, position, role, job, career, hiring, recruit, candidate, etc.

- [ ] 2.6 Test LLM parsing with real data
  - Sync emails from r.w.chen88@gmail.com
  - Verify LLM extracts correct company names (not ATS platforms)
  - Verify LLM extracts full job titles (not fragments)
  - Verify LLM classifies status correctly (Applied/Interview/Offer/Rejected)
  - Check for false positives/negatives
  - Monitor LLM costs and response times

- [ ] 2.7 Add/update email parsing tests
  - Add test cases for LLM parser
  - Mock OpenAI API responses
  - Test fallback to manual parsing when LLM fails
  - Test caching mechanism
  - Update existing tests to work with LLM approach

## Phase 3: Error Handling Improvements (OPTIONAL)

- [ ] 3.1 Improve OAuth error messages
  - Make error messages more user-friendly
  - Add specific guidance for common errors
  - Improve error display in OAuth callback page

- [ ] 3.2 Add token refresh error handling
  - Better handling when refresh fails
  - Clear messaging to user about reconnecting
  - Automatic cleanup of expired connections

## Phase 4: End-to-End Testing and Validation

- [ ] 4.1 Test complete Gmail flow
  - Connect Gmail with r.w.chen88@gmail.com
  - Sync emails and verify parsing accuracy
  - Test disconnect and reconnect
  - Verify duplicate detection works

- [ ] 4.2 Verify data quality
  - Check that applications have correct data
  - Verify status assignments are accurate
  - Confirm no duplicate applications created
  - Test with various email types

- [ ] 4.3 Performance testing
  - Test with large email volumes
  - Verify sync completes in reasonable time
  - Check database performance
  - Monitor memory usage during sync

## Phase 5: Documentation and Deployment Prep

- [ ] 5.1 Update documentation
  - Document email parsing logic
  - Add troubleshooting guide for common issues
  - Update README with Gmail setup instructions
  - Document known limitations

- [ ] 5.2 Deployment preparation
  - Verify environment variables are documented
  - Test in production-like environment
  - Create deployment checklist
  - Set up monitoring/logging

## Notes

**UI Changes Removed:**
- No Gmail connection status component
- No settings panel for Gmail management
- Keeping existing "Sync Gmail" button in header
- No visual connection status indicators

**Focus Areas:**
1. **Email parsing accuracy** - This is the main issue to fix
2. **Testing with real data** - Verify everything works with actual Gmail
3. **Error handling** - Make sure errors are clear and helpful
4. **Documentation** - Document how everything works

**What's Already Working:**
- OAuth flow with state parameter ✅
- Gmail connection properly linked to user ✅
- Email syncing functionality ✅
- Duplicate detection ✅
- Security measures ✅
- Logging ✅
