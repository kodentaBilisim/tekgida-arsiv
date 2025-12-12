#!/bin/bash

# Backend API Test Script
# Tests all endpoints and reports results

API_URL="http://localhost:3001/api"
HEALTH_URL="http://localhost:3001/health"

echo "🧪 Testing Backend API Endpoints..."
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    
    echo -n "Testing: $description... "
    
    response=$(curl -s -w "\n%{http_code}" -X $method "$endpoint")
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $status_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        echo "  Response: $body"
        ((FAILED++))
        return 1
    fi
}

echo "1. Health Check"
echo "---------------"
test_endpoint "GET" "$HEALTH_URL" "200" "Health check endpoint"
echo ""

echo "2. Departments API"
echo "------------------"
test_endpoint "GET" "$API_URL/departments" "200" "Get all departments"
echo ""

echo "3. Subjects API"
echo "---------------"
test_endpoint "GET" "$API_URL/subjects" "200" "Get all subjects"
test_endpoint "GET" "$API_URL/subjects?parentId=1" "200" "Get subjects by parent"
echo ""

echo "4. Folders API"
echo "--------------"
test_endpoint "GET" "$API_URL/folders" "200" "Get all folders"
test_endpoint "GET" "$API_URL/folders?departmentCode=A" "200" "Get folders by department"
test_endpoint "GET" "$API_URL/folders?subjectCode=01.00" "200" "Get folders by subject"
echo ""

echo "5. Statistics API"
echo "-----------------"
test_endpoint "GET" "$API_URL/statistics/overview" "200" "Get statistics overview"
test_endpoint "GET" "$API_URL/statistics/empty-folders" "200" "Get empty folders"
test_endpoint "GET" "$API_URL/statistics/documents-by-subject" "200" "Get documents by subject"
test_endpoint "GET" "$API_URL/statistics/uploads-by-date?startDate=2025-01-01&endDate=2025-12-31" "200" "Get uploads by date range"
echo ""

echo "6. Documents API (if folder exists)"
echo "------------------------------------"
# Try to get documents for folder 1 (may not exist)
curl -s "$API_URL/folders/1/documents" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    test_endpoint "GET" "$API_URL/folders/1/documents" "200" "Get documents for folder 1"
else
    echo -e "${YELLOW}⊘ SKIP${NC} - Folder 1 doesn't exist yet"
fi
echo ""

echo "=================================="
echo "Test Results:"
echo "=================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
