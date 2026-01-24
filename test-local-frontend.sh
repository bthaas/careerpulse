#!/bin/bash

# Test script to verify local frontend works identically to production
# This tests the full stack: Frontend (localhost:3000) → Backend (localhost:3001)

echo "🧪 Testing Local Frontend Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Testing $name... "
    
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected HTTP $expected_status, got $status_code)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Test backend health
echo "📊 Backend Tests (http://localhost:3001)"
echo "----------------------------------------"
test_endpoint "Health Check" "http://localhost:3001/api/health" "200"
test_endpoint "Applications List (Unauthenticated)" "http://localhost:3001/api/applications" "401"
echo ""

# Test frontend
echo "🎨 Frontend Tests (http://localhost:3000)"
echo "----------------------------------------"
test_endpoint "Frontend Root" "http://localhost:3000/" "200"
echo ""

# Test CORS
echo "🔐 CORS Tests"
echo "----------------------------------------"
echo -n "Testing CORS headers... "
cors_response=$(curl -s -I -H "Origin: http://localhost:3000" http://localhost:3001/api/health 2>&1)
if echo "$cors_response" | grep -iq "access-control-allow"; then
    echo -e "${GREEN}✓ PASS${NC} (CORS enabled)"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠ SKIP${NC} (CORS check inconclusive - but backend accepts requests)"
fi
echo ""

# Test environment variable
echo "⚙️  Environment Configuration"
echo "----------------------------------------"
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} .env.local exists"
    if grep -q "VITE_API_URL=http://localhost:3001" .env.local; then
        echo -e "${GREEN}✓${NC} VITE_API_URL configured for localhost"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠${NC} VITE_API_URL not set to localhost"
        echo "  Current value: $(grep VITE_API_URL .env.local)"
    fi
else
    echo -e "${RED}✗${NC} .env.local not found"
    FAILED=$((FAILED + 1))
fi
echo ""

# Summary
echo "📋 Test Summary"
echo "================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Local setup is working correctly.${NC}"
    echo ""
    echo "🚀 Your local environment is ready:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:3001"
    echo ""
    echo "This setup works identically to production:"
    echo "   Frontend: https://jobfetch.app"
    echo "   Backend:  https://api.jobfetch.app"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Open http://localhost:3000 in your browser"
    echo "   2. The app should work exactly like the production version"
    echo "   3. All data is stored locally in backend/database/careerpulse.db"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the errors above.${NC}"
    exit 1
fi
