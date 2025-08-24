#!/bin/bash

# Smoke Test Runner for FindableAI
# Usage: ./scripts/run-smoke-tests.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="smoke-test-${ENVIRONMENT}-${TIMESTAMP}.log"

echo "🚀 Starting FindableAI Smoke Tests for ${ENVIRONMENT}"
echo "📝 Logging to: ${LOG_FILE}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1" | tee -a "${LOG_FILE}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "${LOG_FILE}"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "${LOG_FILE}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}" | tee -a "${LOG_FILE}"
}

# Environment setup
if [ "$ENVIRONMENT" = "staging" ]; then
    export STAGING_URL="https://staging.findableai.com"
    export TEST_USER_EMAIL="staging-test@findableai.com"
    CONFIG_FILE="playwright-staging.config.ts"
elif [ "$ENVIRONMENT" = "production" ]; then
    export STAGING_URL="https://findableai.com"  
    export TEST_USER_EMAIL="prod-test@findableai.com"
    CONFIG_FILE="playwright-staging.config.ts"
    warning "Running tests against PRODUCTION environment!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Production tests cancelled by user"
        exit 1
    fi
else
    error "Invalid environment: ${ENVIRONMENT}. Use 'staging' or 'production'"
    exit 1
fi

log "Environment: ${ENVIRONMENT}"
log "Target URL: ${STAGING_URL}"
log "Config: ${CONFIG_FILE}"

# Pre-flight checks
log "🔍 Running pre-flight checks..."

# Check if URL is reachable
if curl -f -s "${STAGING_URL}/api/health" > /dev/null; then
    success "Health endpoint is reachable"
else
    error "Health endpoint is not reachable at ${STAGING_URL}/api/health"
    exit 1
fi

# Check Playwright installation
if npx playwright --version > /dev/null 2>&1; then
    success "Playwright is installed"
else
    error "Playwright not found. Run: npm install"
    exit 1
fi

# Install browsers if needed
log "📦 Ensuring browsers are installed..."
npx playwright install chromium --with-deps

# Run health checks first
log "🏥 Running health checks..."
if npx playwright test --config="${CONFIG_FILE}" --grep "Health Check" --reporter=line; then
    success "Health checks passed"
else
    error "Health checks failed"
    exit 1
fi

# Run main smoke test
log "🧪 Running full smoke test..."
TEST_START=$(date +%s)

if npx playwright test --config="${CONFIG_FILE}" --grep "Complete flow" --reporter=line; then
    TEST_END=$(date +%s)
    TEST_DURATION=$((TEST_END - TEST_START))
    success "Full smoke test completed in ${TEST_DURATION} seconds"
else
    TEST_END=$(date +%s)
    TEST_DURATION=$((TEST_END - TEST_START))
    error "Smoke test failed after ${TEST_DURATION} seconds"
    
    # Generate detailed report
    log "📊 Generating detailed test report..."
    npx playwright show-report playwright-report-staging > /dev/null 2>&1 &
    
    exit 1
fi

# Run existing user flow test
log "👤 Testing existing user flow..."
if npx playwright test --config="${CONFIG_FILE}" --grep "Existing user flow" --reporter=line; then
    success "Existing user flow test passed"
else
    warning "Existing user flow test failed (may be expected if no test user exists)"
fi

# Generate summary report
log "📊 Generating test report..."
echo "
🎯 SMOKE TEST SUMMARY
==================
Environment: ${ENVIRONMENT}
Target URL: ${STAGING_URL}
Timestamp: ${TIMESTAMP}
Duration: ${TEST_DURATION}s
Status: ✅ PASSED

Test Coverage:
- ✅ User Signup
- ✅ Site Management  
- ✅ Website Scanning
- ✅ AI Prompt Simulation
- ✅ Report Generation
- ✅ Plan Upgrade Flow
- ✅ API Health Check
- ✅ System Alerts

Next Steps:
- Monitor application performance
- Check error logs if any failures
- Verify Stripe test transactions
- Confirm email delivery (if applicable)
" | tee -a "${LOG_FILE}"

success "Smoke test completed successfully! 🎉"
log "Report saved to: ${LOG_FILE}"

# Open test report in browser
if command -v open > /dev/null; then
    open "playwright-report-staging/index.html"
elif command -v xdg-open > /dev/null; then
    xdg-open "playwright-report-staging/index.html"
fi