# Recommendations and Advertising

How product recommendations and house promotions work, why each approach was
chosen, and what has to happen before the numbers can be trusted.

## Starting position

Before this work the platform had **no behavioural data whatsoever**. There was
no view tracking, no event table, and no ad tables. The discovery features that
looked like recommenders were placeholders:

- `TrendingProducts` ranked by `created_at` and called the result "trending".
- `CartCrossSells` suggested same-category products and labelled an unsorted
  `.slice(0, 4)` of the catalogue "best sellers".

So the first deliverable is not a recommender, it is the `product_events`
pipeline that gives one something to learn from.

## Evaluation of the four approaches

| Approach | Needs | Works from day one | Where it is used |
|---|---|---|---|
| Popularity | Any events at all | Yes, once traffic starts | Every surface, as the floor |
| Content-based | A product catalogue | Yes, immediately | Product, category, cart |
| Collaborative | Many users with overlapping histories | **No** | Blended once data exists |
| Hybrid | All of the above | Degrades gracefully | The default everywhere |

**Popularity** is the only strategy that works with no knowledge of the visitor,
which makes it the fallback under everything else. Scored with
`EVENT_WEIGHTS` (view 1, cart 4, purchase 10) and exponential time decay with a
15-day half-life, over a 30-day window. A purchase is weighted ten times a view
because it costs money and cannot be manufactured by a crawler; weighting them
equally would let high-traffic, low-converting products own every rail.

**Content-based** compares category (0.5), brand (0.2), tag overlap (0.2) and
price proximity (0.1). Category dominates deliberately: on a marketplace that
partners with one company per category, category is the strongest statement of
what a product *is*. Price proximity stops a ₹200 browse being answered with a
₹20,000 suggestion. A product is scored against its **best** matching seed
rather than the average, because averaging penalises a product for being unlike
the shopper's *other* interests, which is wrong when someone is shopping across
two unrelated departments.

**Collaborative** is item-to-item: from the visitor's products, find other
actors who touched the same products, then score what *those* actors also
touched. Item-to-item rather than user-to-user because the catalogue is far
smaller than the user base, so the co-occurrence matrix stays cheap.

> **The thin-data guard matters more than the algorithm.** With two orders in
> the database every pair of products looks like a perfect match, and the site
> will confidently claim "customers also bought" on a sample of one.
> `MIN_CO_OCCURRENCE = 3` requires at least three *distinct* actors before a
> co-occurrence counts, and counting distinct actors rather than raw events
> stops one obsessive user manufacturing a recommendation alone. Below the
> threshold the strategy returns nothing and the hybrid falls back. Expect it
> to contribute nothing until there is real order volume — that is correct
> behaviour, not a bug.

**Hybrid** normalises each strategy to 0..1 before blending at weights
collaborative 1.0, content 0.6, popularity 0.35. Normalisation is essential:
raw popularity scores run into the hundreds while content similarity never
exceeds 1, so an unnormalised blend would be pure popularity wearing a hybrid
label. Popularity is weighted lowest because it is the least personal signal
and would otherwise flatten every rail into the same bestseller list.

## Placement

| Surface | Component | Notes |
|---|---|---|
| Homepage | `RecommendationRail placement="home"` | Client-rendered on purpose — the page is statically generated and revalidated every 5 minutes, so a per-visitor rail baked into that cache would be served to everyone |
| Product page | `placement="product"` | Seeded with the product on screen |
| Category page | `placement="category"` | Scoped to the category; the `all` pseudo-category is excluded because no product has `category = 'All'` |
| Cart drawer | `placement="cart" compact` | Replaced `CartCrossSells` |

## Safeguards

- **Repetition.** `diversify()` caps any one category at 2 entries per rail,
  backfilling from the remainder rather than leaving the rail short.
- **Already-engaged products** are excluded: cart contents, previously
  purchased items, and the product currently being viewed.
- **Out of stock products are never recommended.** A rail of unbuyable
  products is an advert for the competition.
- **Ad frequency capping.** Each campaign has a `daily_frequency_cap`
  (default 5) counted per visitor per day. Unlimited repetition is the fastest
  way to train people to ignore a slot.
- **Empty beats irrelevant.** Both the rail and the ad slot render nothing
  rather than filling space with filler.

## Advertising

House campaigns run by the platform — no seller bidding or billing. A slot is
filled by eligibility (status, date window, has something to promote), then
frequency capping, then a relevance score.

`OBJECTIVE_FIT` maps objective to surface: conversion campaigns score highest
at the cart where intent is highest, awareness campaigns on the homepage where
reach is highest. Exact category match adds 1.0; a mismatched target is
multiplied by 0.3. **Relevance outranks the admin-set priority deliberately** —
priority should break ties between comparable campaigns, not let an irrelevant
one win because someone typed a big number.

### Measurement

- Impressions fire from an `IntersectionObserver` at 50% visibility, **not** on
  render. Counting on render inflates impressions with ads nobody scrolled to,
  which deflates CTR and makes ROAS meaningless.
- **Conversion revenue is read from the order row server-side, never accepted
  from the client,** and only credited when the order belongs to the caller.
  ROAS drives spending decisions; a browser must not be able to set it.
- `ad_events` has no client-facing insert policy for the same reason.
- Every derived rate is **null rather than zero** when its denominator is zero.
  A campaign that has never been shown has an *unknown* CTR, not 0%, and
  showing 0% makes a brand-new campaign look like a failing one. The UI renders
  these as `—`.

## A/B testing

`assignRecommendationVariant()` buckets each visitor into `hybrid` or
`popularity` using an FNV-1a hash of their identity, salted with the experiment
key. Deterministic, so the same visitor always lands in the same variant
without storing assignments; salted, so someone in the control group of one
experiment is not systematically in the control group of every other one.
Bucketing prefers the account id over the session id so a variant survives a
device switch.

The variant is written onto every `product_events` and `ad_events` row.
Comparison happens in an external analytics tool via a PostHog-compatible
capture endpoint, configured with `NEXT_PUBLIC_POSTHOG_KEY` /
`NEXT_PUBLIC_POSTHOG_HOST`. Forwarding is fire-and-forget with a 2s timeout —
analytics must never slow a page — and the first-party tables remain
authoritative, so a dropped forward loses reporting convenience, not data. With
no key set, bucketing still works and `/admin/campaigns` shows a warning so
nobody believes an experiment is running when it is not.

### Metrics to judge it on

Compare `hybrid` against `popularity` on: rail click-through rate, add-to-cart
rate on recommended products, attributed revenue per session, and average order
value. Do not read results until each variant has accumulated a few thousand
sessions; recommender effects are small percentage shifts and will be invisible
in early noise.

## Operational notes

- Recommendations are computed **live per request** (`dynamic = 'force-dynamic'`,
  `Cache-Control: private, no-store`). Queries are bounded: 5,000 events, 500
  catalogue rows, one round trip per signal, nothing fanning out per product.
- If rails become a latency problem at scale, the move is to precompute
  popularity and item-similarity on a schedule and keep only the visitor's own
  recent history live. `scoring.ts` is pure and has no database dependency, so
  it can be reused unchanged by a batch job.
- Migration: `database/supabase/migrations/20261013_recommendations_and_ads.sql`.
  **Not yet applied to live Supabase.**
