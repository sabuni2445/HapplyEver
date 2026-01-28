# Chapa Payment Integration Guide

## Required Chapa API Keys

To integrate Chapa payments, you'll need the following credentials from your Chapa dashboard:

1. **CHAPA_SECRET_KEY** (Required)
   - Get this from: https://dashboard.chapa.co/settings/developers
   - This is used for backend API calls to create payment transactions
   - Keep this secure and never expose it in frontend code

2. **CHAPA_PUBLIC_KEY** (Optional)
   - Public key for frontend integration (if needed)
   - Can be used for client-side payment initialization

3. **CHAPA_WEBHOOK_SECRET** (Recommended)
   - Webhook secret for verifying payment callbacks
   - Get this from: https://dashboard.chapa.co/settings/webhooks
   - Used to verify that payment notifications are actually from Chapa

## Configuration

Add these to your `backend/src/main/resources/application.properties`:

```properties
# Chapa Payment Configuration
chapa.secret.key=CHASECK_TEST_YOUR_SECRET_KEY_HERE
chapa.public.key=CHAPUBK_TEST_YOUR_PUBLIC_KEY_HERE
chapa.webhook.secret=YOUR_WEBHOOK_SECRET_HERE
chapa.callback.url=http://localhost:8080/api/payments/chapa/callback
```

## Payment Flow

1. **Create Payment Request**: Manager sets payment schedule
2. **Initialize Payment**: Couple clicks "Pay Now" → Backend creates Chapa transaction
3. **Redirect to Chapa**: User redirected to Chapa payment page
4. **Payment Callback**: Chapa sends webhook to verify payment
5. **Update Status**: Payment status updated in database

## Implementation Status

- ✅ Payment schedule structure created
- ✅ Wedding management page with payment overview
- ⏳ Chapa SDK integration (pending API keys)
- ⏳ Payment webhook handler (pending)
- ⏳ Payment status tracking (pending)

## Next Steps

1. Get your Chapa API keys from https://dashboard.chapa.co
2. Add keys to `application.properties`
3. Implement Chapa SDK in backend service
4. Create payment initialization endpoint
5. Set up webhook endpoint for payment verification
6. Update payment status in database after successful payment

## Chapa Documentation

- API Documentation: https://developer.chapa.co/
- Dashboard: https://dashboard.chapa.co
- Test Mode: Use test keys for development









