const express = require('express');
const router = express.Router();
const axios = require('axios');

// Debug endpoint to check environment variables
router.get('/debug', (req, res) => {
  res.json({
    mainAppUrl: process.env.MAIN_APP_URL || 'NOT SET',
    marketingSiteUrl: process.env.MARKETING_SITE_URL || 'NOT SET',
    hasApiKey: !!process.env.API_SECRET_KEY,
    nodeEnv: process.env.NODE_ENV || 'NOT SET'
  });
});

// Validate email availability
router.post('/validate-email', async (req, res) => {
  try {
    const { email } = req.body;

    // Call main app API to check email
    const response = await axios.post(
      `${process.env.MAIN_APP_URL}/api/signup/validate-email`,
      { email },
      {
        headers: {
          'x-api-key': process.env.API_SECRET_KEY
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Email validation error:', error);
    res.status(500).json({ error: 'Failed to validate email' });
  }
});

// Create account and workspace
router.post('/create-account', async (req, res) => {
  try {
    const { fullName, email, password, workspaceName, questionnaireAnswers, selectedTier } = req.body;

    const targetUrl = `${process.env.MAIN_APP_URL}/api/signup/create-account`;
    console.log('[CREATE-ACCOUNT] Calling:', targetUrl);
    console.log('[CREATE-ACCOUNT] Payload:', { fullName, email, workspaceName, selectedTier });

    // Call main app API to create account
    const response = await axios.post(
      targetUrl,
      {
        fullName,
        email,
        password,
        workspaceName,
        questionnaireAnswers,
        selectedTier
      },
      {
        headers: {
          'x-api-key': process.env.API_SECRET_KEY
        }
      }
    );

    console.log('[CREATE-ACCOUNT] Success:', response.data);
    console.log('[CREATE-ACCOUNT] userId:', response.data.userId);
    console.log('[CREATE-ACCOUNT] workspaceId:', response.data.workspaceId);

    // Ensure we're returning the data structure the frontend expects
    if (!response.data.userId || !response.data.workspaceId) {
      console.error('[CREATE-ACCOUNT] WARNING: Missing userId or workspaceId in response!');
    }

    res.json(response.data);
  } catch (error) {
    console.error('[CREATE-ACCOUNT] Error:', error.message);
    console.error('[CREATE-ACCOUNT] Response:', error.response?.data);
    console.error('[CREATE-ACCOUNT] Status:', error.response?.status);

    res.status(error.response?.status || 500).json({
      error: 'Failed to create account',
      message: error.response?.data?.message || error.message,
      details: error.response?.data
    });
  }
});

// Create Stripe checkout session
router.post('/create-checkout', async (req, res) => {
  try {
    const { userId, workspaceId, tier, email, fullName } = req.body;

    console.log('[CREATE-CHECKOUT] Received:', { userId, workspaceId, tier, email, fullName });

    // Validate required fields
    if (!userId || !workspaceId) {
      console.error('[CREATE-CHECKOUT] Missing IDs - userId:', userId, 'workspaceId:', workspaceId);
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userId and workspaceId are required',
        received: { userId, workspaceId, tier, email, fullName }
      });
    }

    // Call main app Stripe endpoint
    const response = await axios.post(
      `${process.env.MAIN_APP_URL}/api/stripe/create-checkout-session-onboarding`,
      {
        userId,
        workspaceId,
        tier,
        email,
        fullName,
        successUrl: `${process.env.MARKETING_SITE_URL}/signup/success`,
        cancelUrl: `${process.env.MARKETING_SITE_URL}/signup?step=4&payment=cancelled`
      },
      {
        headers: {
          'x-api-key': process.env.API_SECRET_KEY
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Checkout creation error:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.response?.data?.message || error.message
    });
  }
});

module.exports = router;
