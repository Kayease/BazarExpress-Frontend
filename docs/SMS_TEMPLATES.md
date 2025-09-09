## SMS Templates (Production)

This document defines concise, DLT-ready SMS templates and variables for core flows. Keep messages ≤160 chars where feasible. Use approved brand/sender IDs and register final text with your DLT provider.

### Placeholders
- {{brand_name}}
- {{customer_name}}
- {{phone}}
- {{order_id}}
- {{item_count}}
- {{amount}}
- {{payment_method}} (COD/Prepaid)
- {{payment_status}}
- {{tracking_number}}
- {{carrier}}
- {{tracking_url}}
- {{expected_date}}
- {{delivery_otp}}
- {{warehouse_name}}
- {{return_id}}
- {{refund_amount}}
- {{refund_method}} (UPI/Bank/Original)
- {{coupon_code}}
- {{coupon_value}}
- {{coupon_expiry}}
- {{short_link}}
- {{support_phone}}

Note: Avoid unapproved link shorteners if DLT disallows them. Prefer branded domains.

### Regulatory/Compliance Notes (India DLT)
- Register each exact message with variables and obtain Template IDs.
- Include your brand in text. Avoid excessive variables or dynamic punctuation.
- Use EntityId and dlttemplateid as configured in `server/services/smsService.js`.
- Opt-out text is typically not required for transactional messages; ensure compliance for promotional.

---

## Authentication / Access

1) Customer Login OTP
- ID: AUTH_OTP_CUSTOMER
- Type: Transactional
- Text: "{{brand_name}}: Use {{delivery_otp}} as your OTP to login. Do not share it. Valid 5 mins."

2) Delivery Confirmation OTP (Order)
- ID: ORDER_DELIVERY_OTP
- Type: Transactional
- Text: "{{brand_name}}: OTP {{delivery_otp}} to confirm delivery for Order {{order_id}}. Share only with delivery agent."

3) Pickup Confirmation OTP (Return)
- ID: RETURN_PICKUP_OTP
- Type: Transactional
- Text: "{{brand_name}}: OTP {{delivery_otp}} to verify pickup for Return {{return_id}}. Share only with pickup agent."

4) Admin/Staff Password Reset Link (via SMS)
- ID: ADMIN_PASSWORD_RESET_LINK
- Type: Service/Transactional
- Text: "{{brand_name}}: Reset your admin password: {{short_link}} (valid 10 mins). Do not share."

Implementation notes:
- Existing OTP flow text in `server/controllers/authOtpController.js` can be aligned with AUTH_OTP_CUSTOMER.
- Delivery OTP sending in `server/services/smsService.js` → align with ORDER_DELIVERY_OTP.

---

## Order Flow

1) Order Placed (New)
- ID: ORDER_PLACED
- Type: Transactional
- Text: "{{brand_name}}: Order {{order_id}} placed for ₹{{amount}} ({{payment_method}}). We will notify updates."

2) Payment Success (Prepaid)
- ID: PAYMENT_SUCCESS
- Type: Transactional
- Text: "{{brand_name}}: Payment received for Order {{order_id}} (₹{{amount}}). Thank you!"

3) Payment Failed/Timed Out
- ID: PAYMENT_FAILED
- Type: Service
- Text: "{{brand_name}}: Payment failed for Order {{order_id}}. Try again here: {{short_link}}. Need help? {{support_phone}}"

4) Order Processing
- ID: ORDER_PROCESSING
- Type: Transactional
- Text: "{{brand_name}}: Order {{order_id}} is being prepared."

5) Shipped with Tracking
- ID: ORDER_SHIPPED
- Type: Transactional
- Text: "{{brand_name}}: Order {{order_id}} shipped via {{carrier}} {{tracking_number}}. Track: {{tracking_url}}"

6) Out for Delivery (own fleet)
- ID: ORDER_OUT_FOR_DELIVERY
- Type: Transactional
- Text: "{{brand_name}}: Order {{order_id}} is out for delivery today. Keep phone reachable."

7) Delivered (COD marks Paid)
- ID: ORDER_DELIVERED
- Type: Transactional
- Text: "{{brand_name}}: Order {{order_id}} delivered. Thank you! Need help? {{support_phone}}"

8) Cancelled
- ID: ORDER_CANCELLED
- Type: Service
- Text: "{{brand_name}}: Order {{order_id}} has been cancelled. Refunds (if any) will be processed as per policy."

9) Refunded (Full)
- ID: ORDER_REFUNDED
- Type: Service
- Text: "{{brand_name}}: Refund of ₹{{refund_amount}} for Order {{order_id}} processed to {{refund_method}}."

10) Refunded (Partial)
- ID: ORDER_PARTIAL_REFUND
- Type: Service
- Text: "{{brand_name}}: Partial refund ₹{{refund_amount}} for Order {{order_id}} processed to {{refund_method}}."

---

## Return Flow

1) Return Requested
- ID: RETURN_REQUESTED
- Type: Service
- Text: "{{brand_name}}: Return {{return_id}} requested for Order {{order_id}} ({{item_count}} item/s). We will update you soon."

2) Return Approved
- ID: RETURN_APPROVED
- Type: Service
- Text: "{{brand_name}}: Return {{return_id}} approved. Pickup will be arranged. Keep items ready."

3) Pickup Assigned/Scheduled
- ID: RETURN_PICKUP_ASSIGNED
- Type: Service
- Text: "{{brand_name}}: Pickup scheduled for Return {{return_id}}. Keep OTP ready. Agent will contact you."

4) Pickup OTP (see AUTH section)
- ID: RETURN_PICKUP_OTP (already defined)

5) Picked Up
- ID: RETURN_PICKED_UP
- Type: Service
- Text: "{{brand_name}}: Items picked for Return {{return_id}}. We will inspect at {{warehouse_name}}."

6) Received at Warehouse
- ID: RETURN_RECEIVED
- Type: Service
- Text: "{{brand_name}}: Return {{return_id}} received at {{warehouse_name}}. Refund will be processed as per policy."

7) Refund Processed (Full)
- ID: RETURN_REFUNDED
- Type: Service
- Text: "{{brand_name}}: Refund ₹{{refund_amount}} for Return {{return_id}} processed to {{refund_method}}."

8) Refund Processed (Partial)
- ID: RETURN_PARTIAL_REFUND
- Type: Service
- Text: "{{brand_name}}: Partial refund ₹{{refund_amount}} for Return {{return_id}} processed to {{refund_method}}."

9) Return Rejected
- ID: RETURN_REJECTED
- Type: Service
- Text: "{{brand_name}}: Return {{return_id}} could not be accepted. Contact support: {{support_phone}}"

---

## Marketing / Growth

1) Welcome + Promocode on Registration
- ID: WELCOME_PROMO
- Type: Promotional (Consented)
- Text: "Welcome to {{brand_name}}! Use {{coupon_code}} to get {{coupon_value}} off. Valid till {{coupon_expiry}}. Shop: {{short_link}}"

2) Abandoned Cart Nudge (1)
- ID: AB_CART_1
- Type: Promotional (Consented)
- Text: "{{brand_name}}: Your items are waiting! Complete order {{short_link}}. Need help? {{support_phone}}"

3) Abandoned Cart Nudge (2) + Limited-time Coupon
- ID: AB_CART_2
- Type: Promotional (Consented)
- Text: "{{brand_name}}: Extra {{coupon_value}} off with {{coupon_code}}. Ends {{coupon_expiry}}. Checkout: {{short_link}}"

4) Order Review Request
- ID: POST_DELIVERY_REVIEW
- Type: Service/Promotional (Consented)
- Text: "{{brand_name}}: How was your experience with Order {{order_id}}? Review: {{short_link}}"

5) Back-in-Stock Alert
- ID: BACK_IN_STOCK
- Type: Promotional (Consented)
- Text: "{{brand_name}}: Your item is back! Grab it now: {{short_link}}"

---

## Mapping to Code (for implementers)
- SMS client: `server/services/smsService.js` (configure APIKey, senderid, EntityId, dlttemplateid)
- Delivery OTP flow: `server/controllers/orderController.js` (generate/verify) → use ORDER_DELIVERY_OTP
- Return flow: `server/controllers/returnController.js` and `server/models/Return.js` → use RETURN_* templates
- Auth login OTP: `server/controllers/authOtpController.js` → use AUTH_OTP_CUSTOMER
- Payment outcomes: hooks around payment success/failure (checkout handlers) → use PAYMENT_* templates

---

## Testing Checklist
- Verify placeholder substitution and length (<160 chars preferred)
- Validate DLT template IDs per message type
- Verify non-ASCII characters are avoided
- Ensure URLs are whitelisted domains
- Mask sensitive data and never include full card/bank info


