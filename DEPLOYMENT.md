# Deployment Guide - Woozy Social Marketing Site

## Prerequisites

- Node.js 18+ installed
- Vercel account
- Access to main app API endpoints
- Domain DNS access for www.woozysocial.com

---

## Local Testing

1. **Navigate to project:**
   ```bash
   cd c:\Users\mageb\OneDrive\Desktop\woozysocial-marketing
   ```

2. **Create `.env` file:**
   ```bash
   PORT=3000
   NODE_ENV=development
   MAIN_APP_URL=http://localhost:5173
   MARKETING_SITE_URL=http://localhost:3000
   API_SECRET_KEY=dev-secret-key-123
   ```

3. **Start server:**
   ```bash
   npm start
   ```

4. **Test pages:**
   - Homepage: http://localhost:3000
   - Pricing: http://localhost:3000/pricing
   - Sign-up: http://localhost:3000/signup

---

## Deploy to Vercel

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy (First Time)

```bash
cd c:\Users\mageb\OneDrive\Desktop\woozysocial-marketing
vercel
```

Follow prompts:
- **Set up and deploy?** Yes
- **Which scope?** [Your account/team]
- **Link to existing project?** No
- **Project name?** woozysocial-marketing
- **Directory?** ./
- **Want to override settings?** No

### Step 4: Set Environment Variables

In Vercel dashboard (https://vercel.com):

1. Go to your project → Settings → Environment Variables
2. Add the following:

| Key | Value (Production) | Environment |
|-----|-------------------|-------------|
| `NODE_ENV` | `production` | Production |
| `MAIN_APP_URL` | `https://www.woozysocial.com` | Production |
| `MARKETING_SITE_URL` | `https://www.woozysocial.com` | Production |
| `API_SECRET_KEY` | `[Generate secure key]` | Production |

**Generate secure API key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Deploy to Production

```bash
vercel --prod
```

### Step 6: Configure Custom Domain

1. In Vercel project → Settings → Domains
2. Add domain: `www.woozysocial.com`
3. Vercel will provide DNS records

---

## DNS Configuration

Update your DNS provider with these records:

**Option A: CNAME (Recommended)**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

**Option B: A Record**
```
Type: A
Name: www
Value: 76.76.21.21
TTL: 3600
```

**Verify DNS:**
```bash
nslookup www.woozysocial.com
```

---

## Main App Integration

### Required Backend Endpoints

Before deploying, ensure these endpoints exist in your main app:

#### 1. POST `/api/signup/validate-email`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "available": true,
  "message": "Email is available"
}
```

**Implementation in main app:**
```javascript
// api/signup/validate-email.js
export default async function handler(req, res) {
  const { email } = req.body;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (data) {
    return res.status(200).json({
      available: false,
      message: 'Email already registered'
    });
  }

  res.status(200).json({
    available: true,
    message: 'Email is available'
  });
}
```

#### 2. POST `/api/signup/create-account`

**Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "securepass123",
  "workspaceName": "My Brand",
  "questionnaireAnswers": {
    "goals": ["schedule-posts", "team-collab"],
    "socialAccounts": "4-10",
    "teamSize": "small",
    "workspaces": "1"
  },
  "selectedTier": "pro"
}
```

**Response:**
```json
{
  "userId": "uuid-here",
  "workspaceId": "uuid-here",
  "message": "Account created successfully"
}
```

**Implementation:**
```javascript
// api/signup/create-account.js
export default async function handler(req, res) {
  const { fullName, email, password, workspaceName, questionnaireAnswers, selectedTier } = req.body;

  // 1. Create Supabase auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName
    }
  });

  if (authError) {
    return res.status(400).json({ error: authError.message });
  }

  // 2. Create user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      email,
      full_name: fullName,
      questionnaire_answers: questionnaireAnswers,
      onboarding_step: 4
    })
    .select()
    .single();

  // 3. Create workspace (pending payment)
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({
      name: workspaceName,
      owner_id: authData.user.id,
      onboarding_status: 'pending_payment',
      questionnaire_data: questionnaireAnswers
    })
    .select()
    .single();

  res.status(200).json({
    userId: authData.user.id,
    workspaceId: workspace.id,
    message: 'Account created successfully'
  });
}
```

#### 3. POST `/api/stripe/create-checkout-session-onboarding`

**Request:**
```json
{
  "userId": "uuid-here",
  "workspaceId": "uuid-here",
  "tier": "pro",
  "email": "john@example.com",
  "fullName": "John Doe",
  "successUrl": "https://www.woozysocial.com/signup/success",
  "cancelUrl": "https://www.woozysocial.com/signup?step=4&payment=cancelled"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "checkoutUrl": "https://checkout.stripe.com/c/pay/..."
}
```

**Implementation:**
```javascript
// api/stripe/create-checkout-session-onboarding.js
export default async function handler(req, res) {
  const { userId, workspaceId, tier, email, fullName, successUrl, cancelUrl } = req.body;

  // Get or create Stripe customer
  let customer;
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profile?.stripe_customer_id) {
    customer = await stripe.customers.retrieve(profile.stripe_customer_id);
  } else {
    customer = await stripe.customers.create({
      email,
      name: fullName,
      metadata: { supabase_user_id: userId }
    });

    await supabase
      .from('user_profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId);
  }

  // Get price ID for tier
  const priceIds = {
    solo: process.env.STRIPE_PRICE_SOLO,
    pro: process.env.STRIPE_PRICE_PRO,
    'pro-plus': process.env.STRIPE_PRICE_PRO_PLUS,
    agency: process.env.STRIPE_PRICE_AGENCY
  };

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    mode: 'subscription',
    line_items: [{
      price: priceIds[tier],
      quantity: 1
    }],
    success_url: successUrl + '?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: cancelUrl,
    metadata: {
      supabase_user_id: userId,
      workspace_id: workspaceId,
      tier: tier,
      onboarding: 'true'
    }
  });

  res.status(200).json({
    sessionId: session.id,
    checkoutUrl: session.url
  });
}
```

#### 4. POST `/api/signup/complete-onboarding`

**Request:**
```json
{
  "sessionId": "cs_test_..."
}
```

**Response:**
```json
{
  "loginToken": "token-here",
  "dashboardUrl": "https://www.woozysocial.com/dashboard"
}
```

**Implementation:**
```javascript
// api/signup/complete-onboarding.js
export default async function handler(req, res) {
  const { sessionId } = req.body;

  // Get session from Stripe
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    return res.status(400).json({ error: 'Payment not completed' });
  }

  const userId = session.metadata.supabase_user_id;

  // Generate one-time login token
  const token = crypto.randomBytes(32).toString('hex');

  await supabase.from('login_tokens').insert({
    token,
    user_id: userId,
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    used: false
  });

  res.status(200).json({
    loginToken: token,
    dashboardUrl: process.env.APP_URL + '/dashboard'
  });
}
```

---

## Database Migrations

Run these migrations on your main app database:

### 1. Add onboarding fields to workspaces

```sql
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'complete'
CHECK (onboarding_status IN ('pending_payment', 'payment_completed', 'setup_complete', 'complete'));

ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS questionnaire_data JSONB DEFAULT '{}';
```

### 2. Add onboarding fields to user_profiles

```sql
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS questionnaire_answers JSONB DEFAULT '{}';
```

### 3. Create login_tokens table

```sql
CREATE TABLE IF NOT EXISTS login_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

CREATE INDEX idx_login_tokens_token ON login_tokens(token);
CREATE INDEX idx_login_tokens_user_id ON login_tokens(user_id);
CREATE INDEX idx_login_tokens_expires_at ON login_tokens(expires_at);
```

---

## Webhook Updates

Update your Stripe webhook handler to handle onboarding:

```javascript
// api/stripe/webhook.js

case 'checkout.session.completed':
  const metadata = session.metadata;

  if (metadata.onboarding === 'true') {
    // Onboarding flow
    await supabase
      .from('workspaces')
      .update({
        onboarding_status: 'payment_completed',
        subscription_status: 'active',
        subscription_tier: metadata.tier
      })
      .eq('id', metadata.workspace_id);

    // Create Ayrshare profile
    // ... your existing Ayrshare logic
  }

  // Update user profile
  await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'active',
      subscription_tier: metadata.tier,
      onboarding_completed: true
    })
    .eq('id', metadata.supabase_user_id);

  break;
```

---

## Security Checklist

- [ ] API_SECRET_KEY is strong and unique
- [ ] Environment variables set in Vercel
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] CORS configured in main app to allow marketing domain
- [ ] Stripe webhook signature validation enabled
- [ ] Rate limiting on sign-up endpoints
- [ ] Email validation on backend
- [ ] Password requirements enforced

---

## Testing Checklist

- [ ] Homepage loads correctly
- [ ] Pricing page displays all tiers
- [ ] Sign-up wizard steps 1-4 work
- [ ] Questionnaire calculates correct recommendation
- [ ] Plan selection saves correctly
- [ ] Account creation API call succeeds
- [ ] Stripe checkout redirect works
- [ ] Test payment with Stripe test cards
- [ ] Webhook processes payment correctly
- [ ] Success page redirects to dashboard
- [ ] Login token authenticates user
- [ ] User lands on dashboard with correct plan

**Stripe Test Cards:**
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 9995`
- 3D Secure: `4000 0025 0000 3155`

---

## Monitoring

Set up monitoring for:

1. **Vercel Analytics** - Page views, performance
2. **Error Tracking** - Add Sentry or similar
3. **Sign-up Funnel** - Google Analytics events
4. **Conversion Rate** - Track step completions
5. **Payment Success Rate** - Stripe dashboard

---

## Rollback Plan

If issues arise:

1. **Pause new sign-ups:**
   - Add maintenance message to /signup
   - Or redirect to old sign-up flow

2. **Check logs:**
   ```bash
   vercel logs [deployment-url]
   ```

3. **Rollback deployment:**
   ```bash
   # List deployments
   vercel ls

   # Promote previous deployment
   vercel promote [previous-deployment-url]
   ```

4. **Re-enable old flow:**
   - Update main app to allow direct sign-ups temporarily
   - Fix issues in staging
   - Re-deploy when ready

---

## Support

For deployment issues:
- Vercel Docs: https://vercel.com/docs
- Stripe Docs: https://stripe.com/docs
- Internal: support@woozysocial.com
