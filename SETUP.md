# AI Skill Academy — owner setup

## 1. Admin access
1. Add secret `ADMIN_EMAILS` (comma-separated emails) in Project Settings → Secrets.
2. Open `/auth`, create a staff account with that email, confirm via email link, sign in.
3. On `/admin`, click "Claim admin access". Only confirmed listed emails are granted the admin role.

## 2. Razorpay (registration fee ₹149 = 14900 paise)
1. Razorpay Dashboard (Test Mode) → Settings → API Keys → generate.
2. Add secrets: `RAZORPAY_KEY_ID` (rzp_test_...), `RAZORPAY_KEY_SECRET`.
3. Webhooks → Add: URL `https://<your-site>/api/public/razorpay-webhook`, events `payment.captured`, `order.paid`, `payment.failed`, set a secret, then add it as `RAZORPAY_WEBHOOK_SECRET`.
4. Test with Razorpay test cards/UPI. Registration is PAID only after server signature check or verified webhook.
5. Go live: complete Razorpay KYC, generate Live keys, replace both key secrets with rzp_live_ values, create a Live-mode webhook with its own secret.
Without keys, the site shows "Payments setup pending" and never marks anyone as paid.
