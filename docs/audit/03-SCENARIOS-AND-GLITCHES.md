# 03 — Scenarios & Glitches

Fourteen real people, fourteen real situations. Each scenario is traced against the current implementation, not an imagined one. Every failure links to the [Bug Register](./04-BUG-REGISTER.md).

**Severity of the *experience*, not the code:** 🔴 breaks the journey · 🟠 damages trust · 🟡 friction · 🟢 works well.

---

## Scenario 1 — Priya's first five seconds

> **Priya, 29, Ahmedabad. Product manager. Saw a reel, taps the link on a 4G phone (390×844). One hand. 11:40 p.m.**

**She wants:** to know what this is, whether it's legit, and whether she can get milk tomorrow.

| Step | What should happen | What actually happens | Verdict |
|---|---|---|---|
| Tap link | Instant, stable first paint with a brand promise | `/` rewrites to static `/home`; paint is fast (cached) but the first screen is a category rail + trust bar + product rail | 🟠 |
| Understand the brand | One line: what, for whom, delivered when | No hero. The promise exists in a component (`HeroBanner`) that is **not mounted**. The tagline only appears in metadata | 🟠 |
| See delivery certainty | "Delivering to Ahmedabad 380015 · tomorrow 6:30–7:30 a.m." | No location capture, no pincode, no window. The only address control is hidden until login | 🔴 |
| Browse | 5–7 clear categories | `CircularCategories` is gated **off** in `launch.ts` but rendered anyway; it fetches after hydration, so a skeleton rail appears then pops/changes | 🟡 |
| Tap a product | PDP with price, pack, freshness, trust | Works; PDP is one of the stronger screens | 🟢 |
| Find the cart | A cart tab in the bottom nav | Bottom nav is Home / Categories / Search / Account. Cart exists only in the header, and **only when it has items** | 🔴 |
| Language | Auto-detect or a gentle prompt | A permanent `EN / हि / ગુ` pill competes with the address and theme controls | 🟡 |

**Emotional result:** "Looks nice, but what do they actually sell? And where's my cart?" → she leaves to compare on Blinkit.

**Root causes:** no merchandise-led hero, no location/serviceability, missing cart affordance, over-eager personalisation rails.

**Fixes:** mount a real hero with the promise + pincode capture + "tomorrow's window"; add Cart as the third bottom-nav item with a badge; move language to Account; make the category rail server-rendered or remove it while dairy-only.

**Bugs:** [F-06](./04-BUG-REGISTER.md#f-06), [F-13](./04-BUG-REGISTER.md#f-13), [F-14](./04-BUG-REGISTER.md#f-14), [F-19](./04-BUG-REGISTER.md#f-19), [F-40](./04-BUG-REGISTER.md#f-40).

---

## Scenario 2 — Meera's 11 p.m. reorder

> **Meera, 34, two kids, Gandhinagar. Has ordered twice. Wants the same milk and curd for tomorrow morning. In bed, phone dimmed.**

**She wants:** three taps maximum. Blinkit has trained her that "Buy again" is one tap.

| Step | What should happen | What actually happens | Verdict |
|---|---|---|---|
| Open app | "Buy again" rail at the top, with her exact previous basket | `BuyAgainCarousel` exists but is not first; home leads with categories/trending | 🟠 |
| Add milk | One tap, optimistic, quantity remembered (2 L) | "Add" adds 1 unit of the default variant; she must use the stepper to reach 2 L | 🟡 |
| See total & delivery | Sticky cart bar with total and free-delivery gap | Floating cart bar exists on mobile; free-delivery bar starts at 0% | 🟡 |
| Choose delivery | Tomorrow 6:30–7:30 preselected, cutoff shown | No slot picker. Cart shows hardcoded "Tomorrow, 7:00 – 9:00 AM" | 🔴 |
| Pay | Saved UPI intent, one tap | Razorpay modal every time; no saved payment | 🟡 |
| Confirm | Clear success with window and rider info | Order-confirmed page works, but no rider/slot details | 🟠 |

**Emotional result:** "Why is this more work than Blinkit?" The product is *good enough*, but the habit loop is not.

**Fixes:** reorder-first home for returning users; persist preferred variant quantity; real slot selection with cutoff; saved payment methods via Razorpay; one-tap "repeat last order".

**Bugs:** [F-15](./04-BUG-REGISTER.md#f-15), [F-20](./04-BUG-REGISTER.md#f-20), [F-21](./04-BUG-REGISTER.md#f-21).

---

## Scenario 3 — Arjun tries to subscribe

> **Arjun, 26, Ahmedabad. Wants 1 L A2 milk every morning, alternate days. Sees a subscription banner.**

| Step | What should happen | What actually happens | Verdict |
|---|---|---|---|
| Tap banner | Plan builder: product, quantity, frequency, start date, address, payment | Banner links to `/subscribe/new` | 🔴 |
| Page loads | Builder UI | Client component whose only effect is `router.replace('/home')` | 🔴 |
| Try profile → subscriptions | Manage active plans | `/subscribe` also redirects home | 🔴 |
| Notification "subscription" | Opens subscription | Routes to `/subscribe` → home | 🔴 |
| Edit an existing plan | `/subscribe/new?edit=…` | Redirects home | 🔴 |

**Emotional result:** "This is a demo." A single dead link is forgivable; an entire advertised pillar is not.

**Root cause:** the API (`createSubscription`, `pauseSubscription`, `cancelSubscription`, `modify`) and admin screen exist, and the DB table exists — but the customer UI was never built and was replaced with a redirect.

**Fixes (choose one, this week):**
- **Ship it:** 4-step builder (product → schedule → address → pay), plan card with skip/pause, upcoming deliveries, modification report.
- **Hide it:** remove every subscription banner, nav item, notification route and profile section until it ships.

Shipping is strongly preferred: dairy subscription is the retention engine and the reason the brand exists.

**Bugs:** [F-04](./04-BUG-REGISTER.md#f-04), [F-22](./04-BUG-REGISTER.md#f-22).

---

## Scenario 4 — Rakesh pays with "Direct UPI"

> **Rakesh, 41, Surat. First order. ₹640 of dairy and groceries. He chooses the UPI option because he trusts GPay more than a card form.**

| Step | What should happen | What actually happens | Verdict |
|---|---|---|---|
| Checkout opens | Razorpay preselected, or a clean method list | Store default is `'upi'`, so **Direct UPI is preselected** | 🔴 |
| Enter VPA | Validated, then a real collect request to his UPI app | A free-text field accepts `name@okhdfc`; no validation beyond `@` | 🔴 |
| Tap Place Order | Payment request or clear guidance | Reservation is created, then `/api/orders/place` returns **HTTP 400**: "UPI payments must go through Razorpay checkout…" | 🔴 |
| Error shown | Inline, actionable, method switch | `alert()` with a developer-facing sentence | 🔴 |
| Retry | Switch to Razorpay, keep cart and coupon | He must re-read the page and reselect; reservation may still be held | 🟠 |

**Emotional result:** "They took my details and then said no." At the final step, this is the most expensive possible failure.

**Why it happens:** the API was hardened to reject unverified UPI (correct!), but the UI and the default state were never updated. This is a classic "security fixed the server, forgot the client" regression.

**Fix (today):** remove the `upi` option and the `upiId` state from checkout; default to `razorpay`; migrate any stored `'upi'` selection to `'razorpay'`; keep COD. Add a regression test that asserts every method rendered by `PaymentSelection` is accepted by `PlaceOrderSchema` and the route.

**Bugs:** [F-03](./04-BUG-REGISTER.md#f-03), [F-23](./04-BUG-REGISTER.md#f-23).

---

## Scenario 5 — Sneha's payment succeeds, the order doesn't

> **Sneha, 31, Mumbai. Pays ₹1,240 via UPI inside Razorpay. The modal closes. Then a native alert appears with a payment id.**

| Step | What should happen | What actually happens | Verdict |
|---|---|---|---|
| Razorpay success | Verified server-side, order created, redirect | Verification succeeds; `placeOrder` may fail (stock, address, validation, network) | 🟠 |
| Failure | Recovery screen: money status, automatic refund, retry, human | `alert("Payment verified but order creation failed. Please contact support with your payment ID: pay_…")` | 🔴 |
| Money | Refund initiated automatically or order completed | No automatic reconciliation on this path; the cron `refund-reconcile` exists but is not guaranteed to catch it | 🔴 |
| Trust | Reference id, timeline, "we'll call you" | A browser alert with a developer string | 🔴 |

**Emotional result:** panic. "Did I just lose ₹1,240?" This is the moment that produces a chargeback and a 1-star review.

**Fix:** a dedicated `/checkout/recovery?payment_id=…` route that:
1. looks up the payment and pending order server-side,
2. shows "Payment received · order not confirmed",
3. offers **Complete order** (if stock available) or **Refund now** (creates a refund record, shows 3–5 day timeline),
4. opens support with the reference pre-filled,
5. never exposes raw gateway ids without a human-readable reference.

**Bugs:** [F-24](./04-BUG-REGISTER.md#f-24), [F-25](./04-BUG-REGISTER.md#f-25), [F-11](./04-BUG-REGISTER.md#f-11).

---

## Scenario 6 — Farhan's cash-on-delivery morning

> **Farhan, 38, delivery-job schedule. Orders at 10 p.m., pays cash at 6:45 a.m., may not have exact change.**

| Step | What should happen | What actually happens | Verdict |
|---|---|---|---|
| Choose COD | Clear fee/limit rules, OTP confirmation | COD is available; no COD limit or fee explained | 🟡 |
| Pick a window | 6:30–7:30 or 7:30–8:30 | No slot picker | 🔴 |
| Track | "Packed at 5:12, rider Imran, 1.2 km away" | Tracking page exists; rider identity/ETA not confirmed in data model | 🟠 |
| Deliver | Rider marks delivered, change handled | Admin/seller can confirm COD payment; rider app does not exist | 🟠 |
| Receipt | Digital receipt + loyalty points | Order confirmed page; loyalty scheme disabled (`rewards: false`) but points shown in profile | 🟡 |

**Fix:** slot selection + COD eligibility rules + rider assignment + "carry change" note + digital receipt.

**Bugs:** [F-20](./04-BUG-REGISTER.md#f-20), [F-26](./04-BUG-REGISTER.md#f-26), [F-27](./04-BUG-REGISTER.md#f-27).

---

## Scenario 7 — Kavita returns sour paneer

> **Kavita, 52, Vadodara. The paneer smells off. She is not confident with English or small text.**

| Step | What should happen | What actually happens | Verdict |
|---|---|---|---|
| Find help | "Something wrong?" on the order, one tap | Returns live under `/returns`, linked from order details; discoverability depends on the order screen | 🟠 |
| Report | 3 taps, photo optional under ₹200, replacement default | Form requires reason, item, type, photo evidence, address | 🟡 |
| Understand outcome | "Replacement tomorrow 7 a.m. or refund in 3 days" | Status exists; date/SLA not prominent | 🟠 |
| Read the UI | 16px body, high contrast, Hindi/Gujarati | 10–12px labels in places; error chip contrast 3.95:1; language pill only | 🔴 |

**Emotional result:** "I'll just call the number." Which is fine — but there is no visible number with an SLA.

**Fix:** an always-visible "Problem with this order?" action; a three-choice resolution (replace / refund / credit); large-type mode; Hindi/Gujarati support with a real human; promise language on the first screen of the flow.

**Bugs:** [F-28](./04-BUG-REGISTER.md#f-28), [F-29](./04-BUG-REGISTER.md#f-29), [F-30](./04-BUG-REGISTER.md#f-30).

---

## Scenario 8 — Dev uses a shared phone

> **Dev, 24, borrows his cousin's phone to order. His cousin later opens the site.**

| Step | What should happen | What actually happens | Verdict |
|---|---|---|---|
| Log out | Session cleared, PII gone | `logout()` clears Zustand state, but persisted storage is rehydrated from `localStorage` on next load; the custom cookie is deleted via API, Supabase sign-out may be partial | 🔴 |
| Next user | Sees their own account or guest | May see Dev's name, phone, email, addresses and role from the persisted store before auth resolves | 🔴 |
| Consent | Itemised, purpose-specific consent | None; no consent record | 🔴 |

**This is a DPDP Act issue, not just a UX one.** Personal data must be minimised and secured; a persisted identity blob in `localStorage` is readable by any script and any subsequent user on the device.

**Fix:** persist only non-identifying UI state (language, cart for guests, wishlist for guests). Keep identity in the HttpOnly cookie + an in-memory store, rehydrated from `/api/auth/session`. Add a consent screen at sign-up with separate toggles for fulfilment, personalisation, marketing and analytics.

**Bugs:** [F-10](./04-BUG-REGISTER.md#f-10), [F-31](./04-BUG-REGISTER.md#f-31).

---

## Scenario 9 — Ramesh applies to become a seller

> **Ramesh, 44, owns a dairy brand in Mehsana. Wants to join as the dairy partner.**

| Step | What should happen | What actually happens | Verdict |
|---|---|---|---|
| Land on /become-seller | Clear value prop, commission, requirements, timeline | Long marketing page + inquiry form; no timeline or checklist | 🟠 |
| Apply | Guided form with save-and-resume, document upload | Multi-field form; validation is on submit; no draft | 🟡 |
| Wait | Status page with SLA and next step | `getMySellerInquiry` exists; email/notification unclear | 🟠 |
| Get approved | KYC, store setup, first product, go-live checklist | Admin approval workflow exists; seller onboarding is a set of disconnected tabs | 🔴 |
| First product | Guided create with category lock, images, compliance fields | Product modal; approval pending; rejection reason visible | 🟡 |

**Fix:** a 5-step onboarding wizard with progress, document checklist, SLA and a "what happens next" timeline; then a go-live checklist (store profile, bank, first SKU, quality report, delivery slots).

**Bugs:** [F-32](./04-BUG-REGISTER.md#f-32), [F-33](./04-BUG-REGISTER.md#f-33).

---

## Scenario 10 — Ramesh at 5 a.m.

> **Ramesh opens the seller hub on his phone in the dark. He needs today's litres, orders to pack, and what's out of stock.**

| Step | What should happen | What actually happens | Verdict |
|---|---|---|---|
| Open | "Today" operational brief: 128 L, 42 orders, 3 stock-outs, 2 returns | Generic analytics overview with charts | 🔴 |
| Pack list | Printable/pickable list by route | Order manager exists; no route grouping or print view | 🟠 |
| Update stock | One-thumb quick edit | Quick stock modal exists | 🟢 |
| Navigation | One clear tab bar | Header + 7-pill nav + drawer + in-page tabs | 🟠 |
| Low light | Dark mode | Theme available | 🟢 |

**Fix:** a "Morning brief" home for sellers: today's volume, orders by slot, stock alerts, returns to collect, payout status, and one primary action ("Print pack list"). Move analytics to a separate tab.

**Bugs:** [F-34](./04-BUG-REGISTER.md#f-34), [F-35](./04-BUG-REGISTER.md#f-35).

---

## Scenario 11 — Anita runs Diwali from her phone

> **Anita, 36, ops lead. Diwali week. 3× orders. She is on the floor, phone in hand, not at her desk.**

| Step | What should happen | What actually happens | Verdict |
|---|---|---|---|
| Open /admin | Mobile command centre: live orders, exceptions, stock-outs | Desktop dashboard; chart takes the first screen; cards are small | 🔴 |
| Find order #1042 | Search by order number / phone, one field | No global search; must choose between two order screens | 🔴 |
| Change status | One tap, allowed transitions only | Status control exists with transition guard (good); table is dense on mobile | 🟠 |
| Stock-out | Alert + one-tap restock/notify | Inventory page not in the sidebar | 🔴 |
| Add a coupon | Campaign for the evening | Campaigns/coupons exist; multi-step forms | 🟡 |
| Handover | Notes for the next shift | No shift notes/handover | 🟡 |

**Fix:** mobile admin home = exception queue (late orders, failed payments, stock-outs, open returns) with one-tap actions; global ⌘K search; group the sidebar; make `/admin/inventory` and `/admin/settings` reachable; sticky bulk-action bar.

**Bugs:** [F-09](./04-BUG-REGISTER.md#f-09), [F-36](./04-BUG-REGISTER.md#f-36), [F-37](./04-BUG-REGISTER.md#f-37).

---

## Scenario 12 — Anita reconciles money

> **Month-end. A COD order was marked paid twice; a refund shows "processed" but the customer says no money arrived.**

| Step | What should happen | What actually happens | Verdict |
|---|---|---|---|
| Open reconciliation | Payments view: gateway id, amount, status, settlement date | `/admin/reports`, `/admin/audit`, order detail; no single reconciliation screen | 🟠 |
| Find mismatch | Filter by status/date/method | Filters exist in places; export unclear | 🟠 |
| Refund | One action, idempotent, with gateway reference | Refund helpers exist; multiple paths (`refund-helper`, `refunds`, `razorpay-refund`, cron) | 🟠 |
| Audit | Immutable trail | `audit_logs` exists and is used for some actions | 🟢 |

**Fix:** a **Money** screen: today's collected, settled, refunded, COD pending, failed webhooks, unmatched payments, with CSV export and one idempotent refund action. Add a daily reconciliation job with alerts.

**Bugs:** [F-38](./04-BUG-REGISTER.md#f-38), [F-39](./04-BUG-REGISTER.md#f-39).

---

## Scenario 13 — Vikram demos the product to an investor

> **Vikram, founder, opens the site on a laptop in a café to show an angel investor.**

| Step | What should happen | What actually happens | Verdict |
|---|---|---|---|
| Open /login | A credible sign-in | A tab called **"Instant Access"** with Customer / Seller / **Super Admin** test profiles | 🔴 |
| Click Super Admin | Never possible in production | Mints an admin JWT and enters the console with no password | 🔴 |
| Investor reaction | "This is a serious company" | "Anyone can be your admin?" | 🔴 |

**Fix:** remove the demo tab entirely from production builds; keep a seeded staging environment for demos. If a demo is genuinely needed, use a read-only, watermarked sandbox with no real data and no write APIs.

**Bugs:** [F-01](./04-BUG-REGISTER.md#f-01), [F-05](./04-BUG-REGISTER.md#f-05).

---

## Scenario 14 — A screen-reader user checks out

> **Nikhil, 28, low vision, uses VoiceOver on iOS and a keyboard on desktop.**

| Step | What should happen | What actually happens | Verdict |
|---|---|---|---|
| Navigate header | Landmarks, logical order, skip link | Header is a stack of links/buttons; no skip-to-content link found | 🟠 |
| Open address dropdown | Announced as menu, Escape closes, focus trapped appropriately | Opens on hover **and** click; no `aria-expanded`, no `aria-haspopup`, no Escape handler | 🔴 |
| Payment method | Radio group semantics, arrow keys | Clickable `<div>`s with no role/radio semantics | 🔴 |
| Add to cart | Announced confirmation | Visual stepper only; no live region for "added" | 🟠 |
| Error | Focus moves to error, announced | `alert()` (announced, but blocks and is ugly) | 🟡 |
| Text size | 16px minimum, zoom to 200% | 10px labels exist; zoom layout may break fixed bars | 🟠 |

**Fix:** a `Dialog`/`Popover` primitive with focus trap, Escape and ARIA; real radio inputs for payment; `aria-live="polite"` for cart and status changes; skip link; 16px minimum; test with VoiceOver + keyboard every release.

**Bugs:** [F-41](./04-BUG-REGISTER.md#f-41), [F-42](./04-BUG-REGISTER.md#f-42), [F-43](./04-BUG-REGISTER.md#f-43).

---

## Coverage matrix

| Journey | Works | Friction | Broken |
|---|---|---|---|
| Discover home | — | 🟡 no hero, categories pop-in | — |
| Search | Server FTS + results | 🟡 no suggestions/recent | — |
| Product detail | 🟢 strong | 🟡 provenance missing | — |
| Add to cart | 🟢 optimistic + stepper | 🟡 no toast/live region | — |
| Cart | 🟢 unresolved-item handling | 🟡 no slots, hardcoded ETA | — |
| Checkout | 🟢 address/coupon/Razorpay | — | 🔴 default UPI |
| Payment failure | — | — | 🔴 alert + no recovery |
| Order tracking | 🟢 timeline | 🟠 no rider/ETA | — |
| Returns | 🟢 real flow | 🟠 discoverability, SLA | — |
| Subscriptions | — | — | 🔴 entire module |
| Wishlist | 🟢 works | 🟡 header only | — |
| Notifications | 🟢 realtime | 🟡 no preferences | — |
| Profile | 🟢 rich | 🟡 rewards advertised, disabled | — |
| Seller onboarding | 🟡 form exists | 🔴 no guided flow | — |
| Seller ops | 🟢 tooling exists | 🟠 morning brief missing | — |
| Admin ops | 🟢 capability | 🟠 discoverability, mobile | — |
| Admin money | 🟡 audit exists | 🟠 no reconciliation | — |
| Accessibility | 🟡 intent | 🟠 ARIA gaps | 🔴 payment/dropdowns |

---

*Next: [Bug Register](./04-BUG-REGISTER.md) — every defect, with evidence and a fix.*
