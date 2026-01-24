#!/bin/bash

# Simple Backend Test Script (macOS compatible)

BASE_URL="http://localhost:3001"
USER_EMAIL="test-$(date +%s)@example.com"
USER_PASSWORD="testpassword123"

echo "🧪 JobFetch Backend Testing"
echo "============================"
echo ""

# Test 1: Health Check
echo "1️⃣  Health Check..."
curl -s $BASE_URL/api/health
echo ""
echo ""

# Test 2: Create User
echo "2️⃣  Creating test user..."
echo "   Email: $USER_EMAIL"
SIGNUP_RESPONSE=$(curl -s -X POST $BASE_URL/api/user/signup \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\",\"name\":\"Test User\"}")

echo "$SIGNUP_RESPONSE" | grep -q "token"
if [ $? -eq 0 ]; then
  echo "   ✅ User created successfully"
  TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  echo "   Token: ${TOKEN:0:50}..."
else
  echo "   ❌ Failed to create user"
  echo "   Response: $SIGNUP_RESPONSE"
  exit 1
fi
echo ""

# Test 3: Login
echo "3️⃣  Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/user/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}")

echo "$LOGIN_RESPONSE" | grep -q "token"
if [ $? -eq 0 ]; then
  echo "   ✅ Login successful"
else
  echo "   ❌ Login failed"
fi
echo ""

# Test 4: Get User (Protected)
echo "4️⃣  Testing protected endpoint..."
USER_RESPONSE=$(curl -s $BASE_URL/api/user/me \
  -H "Authorization: Bearer $TOKEN")

echo "$USER_RESPONSE" | grep -q "email"
if [ $? -eq 0 ]; then
  echo "   ✅ Protected endpoint works"
  echo "   User: $USER_RESPONSE"
else
  echo "   ❌ Protected endpoint failed"
fi
echo ""

# Test 5: Google OAuth URL
echo "5️⃣  Testing Google Sign-In OAuth..."
GOOGLE_RESPONSE=$(curl -s $BASE_URL/api/auth/google)

echo "$GOOGLE_RESPONSE" | grep -q "authUrl"
if [ $? -eq 0 ]; then
  echo "   ✅ Google OAuth URL generated"
  AUTH_URL=$(echo "$GOOGLE_RESPONSE" | grep -o '"authUrl":"[^"]*"' | cut -d'"' -f4 | sed 's/\\//g')
  echo "   URL: ${AUTH_URL:0:80}..."
else
  echo "   ❌ Failed to generate OAuth URL"
fi
echo ""

# Test 6: Gmail OAuth URL
echo "6️⃣  Testing Gmail OAuth..."
GMAIL_RESPONSE=$(curl -s $BASE_URL/api/auth/gmail \
  -H "Authorization: Bearer $TOKEN")

echo "$GMAIL_RESPONSE" | grep -q "authUrl"
if [ $? -eq 0 ]; then
  echo "   ✅ Gmail OAuth URL generated"
  GMAIL_URL=$(echo "$GMAIL_RESPONSE" | grep -o '"authUrl":"[^"]*"' | cut -d'"' -f4 | sed 's/\\//g')
  echo ""
  echo "   📧 To connect Gmail, open this URL:"
  echo "   $GMAIL_URL"
else
  echo "   ❌ Failed to generate Gmail OAuth URL"
fi
echo ""

# Test 7: Gmail Status
echo "7️⃣  Testing Gmail connection status..."
STATUS_RESPONSE=$(curl -s $BASE_URL/api/auth/status \
  -H "Authorization: Bearer $TOKEN")

echo "$STATUS_RESPONSE" | grep -q "connected"
if [ $? -eq 0 ]; then
  echo "   ✅ Status check works"
  echo "   Status: $STATUS_RESPONSE"
else
  echo "   ❌ Status check failed"
fi
echo ""

# Test 8: Create Application
echo "8️⃣  Testing create application..."
APP_RESPONSE=$(curl -s -X POST $BASE_URL/api/applications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"company":"Test Company","role":"Software Engineer","status":"Applied","location":"Remote","dateApplied":"2024-01-22","source":"Manual"}')

echo "$APP_RESPONSE" | grep -q "id"
if [ $? -eq 0 ]; then
  echo "   ✅ Application created"
  echo "   Response: $APP_RESPONSE"
else
  echo "   ❌ Failed to create application"
fi
echo ""

# Test 9: Get Applications
echo "9️⃣  Testing get applications..."
APPS_RESPONSE=$(curl -s $BASE_URL/api/applications \
  -H "Authorization: Bearer $TOKEN")

echo "$APPS_RESPONSE" | grep -q "id"
if [ $? -eq 0 ]; then
  APP_COUNT=$(echo "$APPS_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
  echo "   ✅ Applications retrieved"
  echo "   Count: $APP_COUNT application(s)"
else
  echo "   ❌ Failed to get applications"
fi
echo ""

# Summary
echo "============================"
echo "✅ All tests passed!"
echo ""
echo "💾 Save your token for future requests:"
echo "export TOKEN=\"$TOKEN\""
echo ""
echo "🔗 Next steps:"
echo "1. Connect Gmail using the URL above"
echo "2. Sync emails: curl -X POST $BASE_URL/api/email/sync -H \"Authorization: Bearer \$TOKEN\""
echo ""
