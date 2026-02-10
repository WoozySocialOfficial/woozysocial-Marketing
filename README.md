# Woozy Social - Marketing Website

The marketing and sign-up portal for Woozy Social. This site handles user acquisition, plan selection, and payment processing before redirecting to the main application.

## Features

- **Homepage** - Showcases Woozy Social's features and capabilities
- **Pricing Page** - Displays all subscription tiers with detailed features
- **Multi-Step Sign-Up Wizard**:
  1. Account Information (name, email, password)
  2. Workspace Setup (brand name)
  3. Needs Assessment (questionnaire for plan recommendation)
  4. Plan Selection (with intelligent recommendations)
  5. Account Creation (backend processing)
  6. Payment (Stripe checkout integration)
- **Login Redirect** - Routes existing users to the main application

## Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Deployment**: Vercel
- **Payments**: Stripe (via main app API)
- **Authentication**: Supabase (via main app API)

## Project Structure

```
woozysocial-marketing/
├── public/
│   ├── css/
│   │   └── styles.css          # Shared styles
│   └── js/
│       └── signup.js           # Sign-up wizard logic
├── views/
│   ├── index.html              # Homepage
│   ├── pricing.html            # Pricing page
│   └── signup.html             # Sign-up wizard
├── api/
│   └── routes.js               # API endpoints
├── server.js                   # Express server
├── vercel.json                 # Vercel deployment config
├── package.json
└── README.md
```

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Update environment variables:**
   - Set `MAIN_APP_URL` to your main app URL (e.g., `http://localhost:5173` for local dev)
   - Set `MARKETING_SITE_URL` to `http://localhost:3000`
   - Set `API_SECRET_KEY` to a secure random string

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Visit:**
   - Homepage: http://localhost:3000
   - Pricing: http://localhost:3000/pricing
   - Sign-up: http://localhost:3000/signup

## Deployment to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Set environment variables in Vercel:**
   - Go to your project settings on Vercel
   - Add all variables from `.env.example`
   - Set production URLs

5. **Configure custom domain:**
   - In Vercel project settings, add `www.woozysocial.com`
   - Update your DNS records to point to Vercel

## Integration with Main App

This marketing site communicates with the main application via API endpoints:

### Required Main App Endpoints

1. **POST `/api/signup/validate-email`**
   - Checks if email is already registered
   - Returns: `{ available: boolean }`

2. **POST `/api/signup/create-account`**
   - Creates Supabase auth user and user profile
   - Returns: `{ userId, workspaceId, sessionToken }`

3. **POST `/api/stripe/create-checkout-session-onboarding`**
   - Creates Stripe checkout session for new user
   - Returns: `{ sessionId, checkoutUrl }`

### Authentication Flow

1. User completes sign-up wizard
2. Marketing site calls main app to create account
3. Marketing site creates Stripe checkout session
4. User redirected to Stripe for payment
5. After payment, Stripe webhook updates main app
6. User redirected to main app with one-time login token
7. Main app validates token and creates session
8. User lands on dashboard with full access

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `production` |
| `MAIN_APP_URL` | Main application URL | `https://www.woozysocial.com` |
| `MARKETING_SITE_URL` | This site's URL | `https://www.woozysocial.com` |
| `API_SECRET_KEY` | Shared secret for API calls | `random-secret-key` |

## Scripts

```json
{
  "start": "node server.js",
  "dev": "node server.js"
}
```

## Security Considerations

- All API calls to main app use `API_SECRET_KEY` header
- Passwords are never stored in this app (handled by main app/Supabase)
- Session storage used for wizard state (cleared on completion)
- HTTPS enforced in production
- CORS configured to only allow main app domain

## Future Enhancements

- [ ] Add blog section for content marketing
- [ ] Implement A/B testing for conversion optimization
- [ ] Add customer testimonials section
- [ ] Create feature showcase videos
- [ ] Add live chat support widget
- [ ] Implement abandoned cart email recovery
- [ ] Add FAQ section
- [ ] Create case studies page

## Support

For questions or issues, contact: support@woozysocial.com
