# Payment process audit

## Why the order was placed before M-Pesa STK push

The current checkout is intentionally **“place order first, then pay”**:

1. **Steps:** Contact → Delivery → Payment (method + M-Pesa phone) → **Review**.
2. On **Review**, the user clicks **“Place order”** → `handleCreateOrder()` runs → **order is created** via `POST /api/orders` (status `PENDING`).
3. The UI then shows **“Order placed”** with a single button: **“View order & complete payment”**.
4. That button was linking to **`/order-confirmation/{orderId}`**, which is a **thank-you / confirmation page only**. It does **not** trigger M-Pesa STK push or show any payment UI.

So the order is created before payment by design. M-Pesa was never part of the main checkout flow: STK push only happens on the **`/pay/[orderId]`** page (payment recovery), not on checkout or order-confirmation.

---

## M-Pesa functionality — not removed

None of the M-Pesa logic was removed. It is implemented but used only after the order exists:

| Piece | Location | Purpose |
|-------|----------|---------|
| STK push API | `POST /api/payments/mpesa/stkpush` | Sends STK to phone; requires `orderId` (order must exist first). |
| STK callback | `POST /api/payments/mpesa/callback` | Daraja webhook; updates Payment + Order status. |
| Status polling | `GET /api/payments/mpesa/status?checkoutRequestId=&orderId=` | Used by client to wait for STK result. |
| Pay page | `/pay/[orderId]` | Renders `PayOrderClient`: STK push, manual Paybill, proof upload. |
| PayOrderClient | `app/(public)/pay/[orderId]/pay-order-client.tsx` | Full M-Pesa (and manual) payment UI. |
| PaymentStep | `components/checkout/PaymentStep.tsx` | Has STK push + polling + manual; **not used** in main checkout. |

So: **order is created in checkout → payment (including M-Pesa) is intended to happen on `/pay/[orderId]`**. The bug was that after “Place order”, users were sent to **order-confirmation** (no payment) instead of **pay** (where M-Pesa runs).

---

## End-to-end payment flow (intended)

1. **Checkout**  
   Contact → Delivery → Payment (choose M-Pesa, enter phone) → Review → **Place order** → order created (`PENDING`).

2. **After “Place order”**  
   User should go to **`/pay/{orderId}`** to complete payment (STK push, manual Paybill, or proof upload).  
   *(Previously they were sent to order-confirmation and never saw the pay page.)*

3. **Pay page** (`/pay/[orderId]`)  
   - Allowed with valid payment-link token **or** logged-in order owner when order is `PENDING`.  
   - **PayOrderClient** options: M-Pesa STK (phone + “Pay with M-Pesa”), manual Paybill instructions, proof upload.  
   - On STK: call `POST /api/payments/mpesa/stkpush`, then poll `GET /api/payments/mpesa/status` until CONFIRMED/FAILED.  
   - On success → redirect to `/order-confirmation/[orderId]`.

4. **Later**  
   - **Account → My Orders → [order]** shows **“Pay now”** for `PENDING` orders → same `/pay/[orderId]` flow.  
   - Email payment links use `/pay/[orderId]?token=...` (unchanged).

---

## Fixes applied (payment before Review)

- **Checkout:** After “Order placed”, the button **“View order & complete payment”** now links to **`/pay/{orderId}`** instead of `/order-confirmation/{orderId}`.  
- So right after placing the order, the customer lands on the pay page and can complete M-Pesa (STK or manual) there.  
- Order confirmation is still shown after successful payment (redirect from pay page to order-confirmation).

**Payment before Review (latest):** Step 3 now requires completing payment before Review. For M-Pesa: "Pay with M-Pesa" creates the order, sends STK push, and polls; only on success do we show step 4. For other methods: "Proceed to payment" creates the order and redirects to `/pay/{orderId}`. Step 4 is only reachable after payment.

---

## Summary

| Question | Answer |
|----------|--------|
| Why was the order placed before M-Pesa? | Checkout is “place order first”; STK push was never triggered in checkout, only on `/pay/[orderId]`. |
| Was M-Pesa removed? | No. STK push, callback, status, and Pay page are all present and used on `/pay/[orderId]`. |
| What was wrong? | After “Place order”, users were sent to order-confirmation (no payment) instead of the pay page. |
| What was fixed? | “View order & complete payment” now goes to `/pay/{orderId}` so payment (M-Pesa included) happens there. |
