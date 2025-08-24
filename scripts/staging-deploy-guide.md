# Staging Deployment Guide

This guide outlines how to set up a staging environment for FindableAI with separate database and Stripe test keys.

## 🎯 Overview

The staging environment should mirror production but use:
- **Separate Supabase project** for database isolation
- **Stripe test keys** for safe payment testing  
- **Test domain** (e.g., staging.findableai.com)
- **Separate secrets** for all integrations

## 📋 Prerequisites

- Supabase account with ability to create new projects
- Stripe account with test mode enabled
- Domain/subdomain for staging
- Deployment platform access (Vercel, Netlify, etc.)

## 🗄️ Database Setup (Supabase)

### 1. Create New Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Name: "FindableAI Staging"
4. Choose same region as production
5. Set strong database password

### 2. Configure Staging Database

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Initialize Supabase in your project (if not done)
supabase init

# Link to your staging project
supabase link --project-ref YOUR_STAGING_PROJECT_REF

# Push all migrations to staging
supabase db push

# Verify deployment
supabase status
```

### 3. Set Up Environment Variables

Create staging environment configuration:

```bash
# Staging Supabase Keys
VITE_SUPABASE_URL=https://YOUR_STAGING_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_staging_anon_key

# Edge Function Secrets (set in Supabase Dashboard)
SUPABASE_URL=https://YOUR_STAGING_REF.supabase.co
SUPABASE_ANON_KEY=your_staging_anon_key  
SUPABASE_SERVICE_ROLE_KEY=your_staging_service_role_key
SUPABASE_DB_URL=postgresql://postgres:your_password@db.YOUR_STAGING_REF.supabase.co:5432/postgres
```

## 💳 Stripe Configuration

### 1. Get Stripe Test Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Ensure you're in **Test Mode** (toggle in left sidebar)
3. Go to Developers → API Keys
4. Copy your test keys:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`

### 2. Set Up Test Products

```bash
# Create test products in Stripe Dashboard or via API
# Example pricing for staging:
# - Basic: $5/month (test)
# - Pro: $15/month (test)  
# - Enterprise: $50/month (test)
```

### 3. Configure Webhooks (Optional)

If using Stripe webhooks:
```bash
# Staging webhook endpoint
https://staging.findableai.com/api/stripe-webhooks

# Test webhook events:
# - checkout.session.completed
# - customer.subscription.created
# - customer.subscription.updated
# - customer.subscription.deleted
```

## 🚀 Deployment Steps

### Option A: Vercel Deployment

1. **Create staging branch**:
   ```bash
   git checkout -b staging
   git push origin staging
   ```

2. **Deploy to Vercel**:
   - Connect staging branch to new Vercel project
   - Set environment variables in Vercel dashboard
   - Configure custom domain: staging.findableai.com

3. **Update Supabase edge function secrets**:
   ```bash
   # In Supabase Dashboard → Settings → Edge Functions
   STRIPE_SECRET_KEY=sk_test_your_test_key
   OPENAI_API_KEY=your_openai_key
   ```

### Option B: Manual Platform Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy build files to your hosting platform
3. Set environment variables in hosting dashboard
4. Configure domain and SSL

## 🧪 Testing Configuration

### 1. Update Test URLs

In your staging deployment, ensure these URLs point to staging:
- Success URLs: `https://staging.findableai.com/success`
- Cancel URLs: `https://staging.findableai.com/cancel`
- Webhook URLs: `https://staging.findableai.com/api/webhooks`

### 2. Test Data Setup

```sql
-- Create test admin user (run in Supabase SQL Editor)
INSERT INTO profiles (id, email, name, role, plan) 
VALUES (
  'test-admin-uuid', 
  'admin@staging.findableai.com',
  'Staging Admin', 
  'admin', 
  'enterprise'
);

-- Create test regular user
INSERT INTO profiles (id, email, name, role, plan)
VALUES (
  'test-user-uuid',
  'user@staging.findableai.com', 
  'Test User',
  'user',
  'free'
);
```

## ✅ Verification Checklist

Before running smoke tests:

- [ ] Staging site loads at staging.findableai.com
- [ ] Database migrations applied successfully
- [ ] Stripe test mode configured correctly
- [ ] Edge functions deploy and respond
- [ ] Authentication flows work
- [ ] API health check returns 200
- [ ] Admin panel accessible with test admin
- [ ] Email delivery configured (if applicable)

## 🔍 Running Smoke Tests

Once staging is deployed:

```bash
# Make script executable
chmod +x scripts/run-smoke-tests.sh

# Run staging smoke tests
./scripts/run-smoke-tests.sh staging

# Check specific test results
npx playwright test --config=playwright-staging.config.ts --reporter=html
```

## 🛠️ Troubleshooting

### Common Issues:

1. **Database connection fails**:
   - Verify SUPABASE_DB_URL format
   - Check database password
   - Ensure network access from deployment platform

2. **Stripe checkout fails**:
   - Confirm using test keys (pk_test_, sk_test_)
   - Verify success/cancel URLs match staging domain
   - Check Stripe dashboard for error logs

3. **Edge functions timeout**:
   - Verify all secrets are set in Supabase dashboard
   - Check function logs in Supabase Functions tab
   - Ensure service role key has proper permissions

4. **Authentication issues**:
   - Verify redirect URLs in Supabase Auth settings
   - Check email confirmation settings
   - Ensure JWT secrets match between frontend/backend

## 📊 Monitoring

Set up monitoring for:
- Application uptime
- Database performance  
- Edge function execution
- Payment processing
- Error rates

## 🔄 Maintenance

Regular staging maintenance:
- Sync production migrations to staging monthly
- Update test data quarterly
- Rotate API keys annually
- Monitor and clean up test users

---

**Next Step**: Once staging is deployed, run the smoke tests:
```bash
./scripts/run-smoke-tests.sh staging
```