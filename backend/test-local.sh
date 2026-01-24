#!/bin/bash

# Local Backend Testing Script
# Tests all major endpoints without needing frontend

set -e  # Exit on error

BASE_URL="http://localhost:3001"
TOKEN=""
USER_EMAIL="test-$(date +%s)@example.com"
USER_PASSWORD="testpassword123"

echo "🧪 JobFetch Backend Local Testing"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function to print test results
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ $2${NC}"
  else
    echo -e "${RED}❌ $2${NC}"
    exit 1
  fi
}

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
RESPONSE=$(curl -s -w "\n%{http_code}" $BASE_URL/api/health)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  print_result 0 "Health check passed"
  echo "   Response: $BODY"
else
  print_result 1 "Health check failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 2: User Signup
echo "2️⃣  Testing User Signup..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/api/user/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"password\": \"$USER_PASSWORD\",
    \"name\": \"Test User\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ]; then
  TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  print_result 0 "User signup successful"
  echo "   Email: $USER_EMAIL"
  echo "   Token: ${TOKEN:0:50}..."
else
  print_result 1 "User signup failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 3: User Login
echo "3️⃣  Testing User Login..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/api/user/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"password\": \"$USER_PASSWORD\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  print_result 0 "User login successful"
else
  print_result 1 "User login failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 4: Get Current User (Protected)
echo "4️⃣  Testing Protected Endpoint (Get User)..."
RESPONSE=$(curl -s -w "\n%{http_code}" $BASE_URL/api/user/me \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  print_result 0 "Protected endpoint works"
  echo "   User: $BODY"
else
  print_result 1 "Protected endpoint failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 5: Google Sign-In OAuth URL
echo "5️⃣  Testing Google Sign-In OAuth URL..."
RESPONSE=$(curl -s -w "\n%{http_code}" $BASE_URL/api/auth/google)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q "authUrl"; then
  print_result 0 "Google OAuth URL generated"
  AUTH_URL=$(echo "$BODY" | grep -o '"authUrl":"[^"]*"' | cut -d'"' -f4)
  echo "   URL: ${AUTH_URL:0:80}..."
else
  print_result 1 "Google OAuth URL failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 6: Gmail OAuth URL (Protected)
echo "6️⃣  Testing Gmail OAuth URL..."
RESPONSE=$(curl -s -w "\n%{http_code}" $BASE_URL/api/auth/gmail \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q "authUrl"; then
  print_result 0 "Gmail OAuth URL generated"
  GMAIL_AUTH_URL=$(echo "$BODY" | grep -o '"authUrl":"[^"]*"' | cut -d'"' -f4)
  echo "   URL: ${GMAIL_AUTH_URL:0:80}..."
  echo ""
  echo -e "${YELLOW}📧 To connect Gmail:${NC}"
  echo "   1. Open this URL in your browser:"
  echo "   $GMAIL_AUTH_URL"
  echo "   2. Authorize Gmail access"
  echo "   3. You'll see 'Gmail Connected!' message"
else
  print_result 1 "Gmail OAuth URL failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 7: Gmail Connection Status
echo "7️⃣  Testing Gmail Connection Status..."
RESPONSE=$(curl -s -w "\n%{http_code}" $BASE_URL/api/auth/status \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  print_result 0 "Gmail status check works"
  echo "   Status: $BODY"
else
  print_result 1 "Gmail status check failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 8: Create Manual Application
echo "8️⃣  Testing Create Application..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/api/applications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Test Company",
    "role": "Software Engineer",
    "status": "Applied",
    "location": "Remote",
    "dateApplied": "2024-01-22",
    "source": "Manual"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ]; then
  print_result 0 "Application created"
  echo "   Response: $BODY"
else
  print_result 1 "Application creation failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 9: Get All Applications
echo "9️⃣  Testing Get Applications..."
RESPONSE=$(curl -s -w "\n%{http_code}" $BASE_URL/api/applications \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  APP_COUNT=$(echo "$BODY" | grep -o '"id"' | wc -l)
  print_result 0 "Applications retrieved"
  echo "   Count: $APP_COUNT application(s)"
else
  print_result 1 "Get applications failed (HTTP $HTTP_CODE)"
fi
echo ""

# Summary
echo "=================================="
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "📝 Test Summary:"
echo "   - User created: $USER_EMAIL"
echo "   - JWT token obtained"
echo "   - All endpoints responding correctly"
echo ""
echo "🔗 Next Steps:"
echo "   1. Connect Gmail using the URL above"
echo "   2. Run: curl -X POST $BASE_URL/api/email/sync -H \"Authorization: Bearer $TOKEN\""
echo "   3. Check synced applications"
echo ""
echo "💾 Save your token for future requests:"
echo "   export TOKEN=\"$TOKEN\""
echo ""
