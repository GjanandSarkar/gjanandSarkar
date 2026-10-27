# Lighthouse Baseline — Phase 4 Performance

> Run: **before** `perf/phase4-performance` merge  
> Date: 2026-10-27  
> Device: Mobile, throttled 4G (40 ms RTT, 10 Mbps down, 750 Kbps up)  
> Lighthouse version: CLI v12 (or Chrome DevTools Lighthouse panel)

## How to capture the "before" scores

Run this on the **production URL** (or the staging preview of `security-redesign-phase1` **before** the Phase 4 branch is merged):

```bash
npx lighthouse https://YOUR_PRODUCTION_URL/home \
  --preset=mobile \
  --output=json \
  --output-path=tests/lh-before-home.json

npx lighthouse https://YOUR_PRODUCTION_URL/products \
  --preset=mobile \
  --output=json \
  --output-path=tests/lh-before-products.json

npx lighthouse https://YOUR_PRODUCTION_URL/search?q=ghee \
  --preset=mobile \
  --output=json \
  --output-path=tests/lh-before-search.json
```

Then fill in the table below.

---

## Before Scores (fill in manually)

| Page | Performance | LCP (s) | CLS | TBT (ms) | FCP (s) |
|------|------------|---------|-----|---------|---------|
| `/home` | ___ | ___ | ___ | ___ | ___ |
| `/products` | ___ | ___ | ___ | ___ | ___ |
| `/search?q=ghee` | ___ | ___ | ___ | ___ | ___ |

### Known problem areas (from code review)
- `/products`: ships up to **500 product rows** in RSC payload → inflated HTML, slow TTFB
- `/search`: `force-dynamic` disabled CDN caching → every visit hits the origin
- `recharts` (~160 KB gzip): static import in `admin/page.tsx` pulls into shared chunk
- `maplibre-gl` (~720 KB raw): risk of appearing in shared chunk without explicit `serverExternalPackages`
- `ProductCard` `sizes` attr was `"(max-width: 768px) 50vw, 25vw"` — browser fetched wrong-sized images

---

## After Scores (fill in after deploy)

Run the same Lighthouse commands against the deployed Phase 4 build.

| Page | Performance | LCP (s) | CLS | TBT (ms) | FCP (s) |
|------|------------|---------|-----|---------|---------|
| `/home` | ___ | ___ | ___ | ___ | ___ |
| `/products` | ___ | ___ | ___ | ___ | ___ |
| `/search?q=ghee` | ___ | ___ | ___ | ___ | ___ |

---

## Target Thresholds

| Metric | Target | Source |
|--------|--------|--------|
| LCP | **< 2.5 s** | Core Web Vitals "Good" threshold |
| CLS | **< 0.1** | Core Web Vitals "Good" threshold |
| Home JS bundle (gzip) | **< 250 KB** | Phase 4 requirement |
| `/search` TTFB | **< 400 ms** | Vercel CDN cache hit |

---

## Vercel Bundle Analysis

After deploying, check the build output in Vercel dashboard → Deployment → Functions.

Or locally:

```bash
ANALYZE=true npm run build
# Opens bundle-analyzer report in browser showing chunk weights
```

Key chunks to verify:
- `pages/home` — should NOT contain `recharts` or `maplibre-gl`
- `pages/products` — should NOT contain `recharts`
- `pages/admin/page` — recharts present here is expected (lazy, user-initiated)
