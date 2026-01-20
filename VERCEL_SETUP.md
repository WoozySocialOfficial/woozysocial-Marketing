# Vercel Deployment Guide - Marketing Site

## Quick Fix for the 404 Error

The 404 error you're seeing happens because the environment variables aren't set in Vercel. Follow these steps:

---

## Step 1: Link to Vercel (If Not Already Done)

```bash
cd c:\Users\mageb\OneDrive\Desktop\woozysocial-marketing
vercel
```

Follow the prompts:
- Link to existing project? **Yes**
- Select your `woozysocial-marketing` project
- Link to production? **Yes**

---

## Step 2: Set Environment Variables in Vercel Dashboard

### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com
2. Select your **woozysocial-marketing** project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `MAIN_APP_URL` | `https://api.woozysocial.com` | Production |
| `MARKETING_SITE_URL` | `https://woozysocial-marketing.vercel.app` | Production |
| `API_SECRET_KEY` | `e053d6b64eb61118d35f4699963590c42ce0ee72348e0e7981be14ff6ebe0c3e` | Production |
| `NODE_ENV` | `production` | Production |

5. Click **Save** for each variable

### Option B: Via Vercel CLI (Faster)

```bash
cd c:\Users\mageb\OneDrive\Desktop\woozysocial-marketing

# Add each environment variable
vercel env add MAIN_APP_URL production
# When prompted, enter: https://api.woozysocial.com

vercel env add MARKETING_SITE_URL production
# When prompted, enter: https://woozysocial-marketing.vercel.app

vercel env add API_SECRET_KEY production
# When prompted, enter: e053d6b64eb61118d35f4699963590c42ce0ee72348e0e7981be14ff6ebe0c3e

vercel env add NODE_ENV production
# When prompted, enter: production
```

---

## Step 3: Deploy to Vercel

### Option A: Push to Git (Triggers Auto-Deploy)

If you linked Vercel to a GitHub repo:

```bash
cd c:\Users\mageb\OneDrive\Desktop\woozysocial-marketing
git add -A
git commit -m "Fix environment variables and add debugging"
git push
```

Vercel will auto-deploy.

### Option B: Deploy via Vercel CLI

```bash
cd c:\Users\mageb\OneDrive\Desktop\woozysocial-marketing
vercel --prod
```

This deploys directly to production.

---

## Step 4: Verify the Fix

After deployment completes:

1. **Check environment variables are loaded:**
   Visit: `https://your-marketing-site.vercel.app/api/debug`

   You should see:
   ```json
   {
     "mainAppUrl": "https://api.woozysocial.com",
     "marketingSiteUrl": "https://woozysocial-marketing.vercel.app",
     "hasApiKey": true,
     "nodeEnv": "production"
   }
   ```

2. **Test the signup flow:**
   - Go to your marketing site
   - Start the signup wizard
   - Fill in steps 1-3
   - On step 4, select a plan
   - Click "Continue to Payment"
   - Should now redirect to Stripe checkout instead of 404!

---

## Step 5: Check Vercel Logs (If Still Issues)

If you still get errors:

1. Go to Vercel Dashboard → Your Project
2. Click on the latest deployment
3. Click **Function Logs** or **Runtime Logs**
4. Look for the `[CREATE-ACCOUNT]` logs to see what's happening

The logs will show:
- What URL it's calling
- What error it's getting
- Response from the main app API

---

## When Your Custom Domain is Ready

Once `www.woozysocials.com` is configured:

1. Update the `MARKETING_SITE_URL` environment variable:
   ```
   MARKETING_SITE_URL=https://www.woozysocials.com
   ```

2. Redeploy

---

## Troubleshooting

### Still Getting 404?

**Check:**
1. Environment variables are set in Vercel (Settings → Environment Variables)
2. You redeployed after setting environment variables
3. Visit `/api/debug` to confirm variables are loaded
4. Check Vercel function logs for errors

### Environment Variables Not Showing in /api/debug?

**Solution:**
- Redeploy after adding environment variables
- Environment variables only take effect on NEW deployments

### API Key Not Working?

**Check:**
1. The API_SECRET_KEY matches between marketing site and main app
2. Main app has the same API_SECRET_KEY in its environment
3. Main app endpoints are checking for `x-api-key` header

---

## Current Deployment Status

- **Marketing Site:** `https://woozysocial-marketing.vercel.app`
- **Main App API:** `https://api.woozysocial.com`
- **Custom Domain (pending):** `https://www.woozysocials.com`

---

## Quick Deploy Command

```bash
cd c:\Users\mageb\OneDrive\Desktop\woozysocial-marketing
vercel --prod
```

This will deploy the latest code with updated debugging to production.

---

**After following these steps, try the signup flow again!**
