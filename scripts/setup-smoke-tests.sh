#!/bin/bash

# Setup script for smoke tests
echo "🚀 Setting up FindableAI Smoke Tests..."

# Make scripts executable
chmod +x scripts/run-smoke-tests.sh
echo "✅ Made smoke test runner executable"

# Install Playwright if not already installed
if ! npx playwright --version > /dev/null 2>&1; then
    echo "📦 Installing Playwright..."
    npm install --save-dev @playwright/test
    npx playwright install
else
    echo "✅ Playwright already installed"
fi

# Install browsers
echo "🌐 Installing browser dependencies..."
npx playwright install chromium --with-deps

echo "
🎯 SMOKE TEST SETUP COMPLETE!

Available commands:
  ./scripts/run-smoke-tests.sh staging     # Run staging smoke tests  
  ./scripts/run-smoke-tests.sh production  # Run production smoke tests
  npx playwright test --config=playwright-staging.config.ts  # Manual test run

Next steps:
1. Set up staging environment (see scripts/staging-deploy-guide.md)
2. Add data-testid attributes to components (see scripts/add-test-attributes.md)  
3. Configure test user credentials in environment
4. Run your first smoke test: ./scripts/run-smoke-tests.sh staging

📚 Documentation:
  - Deployment guide: scripts/staging-deploy-guide.md
  - Test attributes: scripts/add-test-attributes.md
  - GitHub Actions: .github/workflows/smoke-tests.yml

🧪 Test Coverage:
  ✓ User signup/signin flow
  ✓ Site management  
  ✓ Website scanning
  ✓ AI prompt simulation
  ✓ Report generation
  ✓ Plan upgrade flow
  ✓ API health checks
  ✓ Alert system testing
"

echo "🎉 Ready to run smoke tests!"