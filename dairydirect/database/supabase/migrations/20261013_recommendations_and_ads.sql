-- ============================================================================
-- Recommendations and advertising
--
-- Everything the recommender needs starts here, because the platform has no
-- behavioural data at all today: there is no view tracking, and the existing
-- "trending" rail is really just newest-by-created_at. Three tables:
--
--   product_events  raw customer activity (view / cart / purchase). The signal
--                   behind popularity, content-based and collaborative scoring.
--   ad_campaigns    admin-run house promotions.
--   ad_events       impression / click / conversion per campaign, which is what
--                   makes CTR and ROAS computable.
--
-- Events are append-only and deliberately denormalised; they are written on
-- nearly every page view, so writes must never block on joins.
-- ============================================================================

-- ─── Customer activity ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_events (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Null for signed-out visitors. session_id still groups their activity, so
  -- content-based recommendations work before anyone logs in.
  user_id      UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  session_id   TEXT          NOT NULL,
  product_id   UUID          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  event_type   TEXT          NOT NULL
               CHECK (event_type IN ('view', 'add_to_cart', 'purchase')),
  -- Where on the site this happened, so we can tell an organic click from a
  -- recommended one and measure whether the recommender actually earns clicks.
  source       TEXT,
  -- Experiment variant active when the event fired. Without this an A/B test
  -- cannot be settled after the fact.
  variant      TEXT,
  quantity     INTEGER       NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Popularity windows always filter by recency then group by product.
CREATE INDEX IF NOT EXISTS idx_product_events_type_time
  ON product_events (event_type, created_at DESC);

-- "What else did this person look at?" — content-based and the user side of
-- collaborative filtering.
CREATE INDEX IF NOT EXISTS idx_product_events_user_time
  ON product_events (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_events_session_time
  ON product_events (session_id, created_at DESC);

-- "Who else interacted with this product?" — the item side of collaborative
-- filtering, which walks product -> users -> their other products.
CREATE INDEX IF NOT EXISTS idx_product_events_product_time
  ON product_events (product_id, created_at DESC);

-- ─── House ad campaigns ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT          NOT NULL,
  -- What the campaign is for. Objective changes how a slot is filled: an
  -- awareness campaign spreads impressions, a conversion campaign favours
  -- products that actually sell.
  objective      TEXT          NOT NULL DEFAULT 'conversions'
                 CHECK (objective IN ('awareness', 'traffic', 'conversions', 'clearance')),
  status         TEXT          NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'active', 'paused', 'ended')),
  -- Which surfaces this campaign may appear on.
  placements     TEXT[]        NOT NULL DEFAULT ARRAY['home'],
  -- Products being promoted. A campaign may instead target a whole category.
  product_ids    UUID[]        NOT NULL DEFAULT ARRAY[]::UUID[],
  target_category TEXT,
  -- Higher wins when several campaigns compete for the same slot.
  priority       INTEGER       NOT NULL DEFAULT 0,
  -- House promos are not billed per click, but ROAS is meaningless without a
  -- cost. This is the budget attributed to the campaign.
  spend_amount   NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (spend_amount >= 0),
  -- Frequency cap: how many times one visitor may see this campaign per day.
  -- Null means uncapped. This is the safeguard against ad fatigue.
  daily_frequency_cap INTEGER  CHECK (daily_frequency_cap IS NULL OR daily_frequency_cap > 0),
  starts_at      TIMESTAMPTZ,
  ends_at        TIMESTAMPTZ,
  created_by     UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  -- A campaign cannot end before it starts.
  CONSTRAINT ad_campaigns_valid_window
    CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_serving
  ON ad_campaigns (status, priority DESC)
  WHERE status = 'active';

-- ─── Ad delivery events ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ad_events (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  UUID          NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  product_id   UUID          REFERENCES products(id) ON DELETE SET NULL,
  user_id      UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  session_id   TEXT          NOT NULL,
  event_type   TEXT          NOT NULL
               CHECK (event_type IN ('impression', 'click', 'conversion')),
  placement    TEXT,
  variant      TEXT,
  -- Order value credited to the campaign, set on conversion events only.
  -- Summed against spend_amount to produce ROAS.
  revenue      NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (revenue >= 0),
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Campaign reporting rolls up by campaign and type over a date range.
CREATE INDEX IF NOT EXISTS idx_ad_events_campaign
  ON ad_events (campaign_id, event_type, created_at DESC);

-- Frequency capping asks "how often has this visitor seen this campaign
-- today?" on every ad request, so it needs its own index.
CREATE INDEX IF NOT EXISTS idx_ad_events_frequency
  ON ad_events (session_id, campaign_id, created_at DESC)
  WHERE event_type = 'impression';

-- ─── Row level security ─────────────────────────────────────────────────────
-- All writes go through server routes using the service role, which bypasses
-- RLS. These policies exist so that a leaked anon key cannot read other
-- people's browsing history or rewrite campaign numbers.

ALTER TABLE product_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_events      ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- A signed-in customer may read back only their own activity.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'product_events' AND policyname = 'product_events_own_read'
  ) THEN
    CREATE POLICY product_events_own_read ON product_events
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- Active campaigns are public: they are shown to every visitor anyway.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ad_campaigns' AND policyname = 'ad_campaigns_public_read'
  ) THEN
    CREATE POLICY ad_campaigns_public_read ON ad_campaigns
      FOR SELECT USING (status = 'active');
  END IF;
END $$;

-- Deliberately no client-facing policy on ad_events. Impressions, clicks and
-- conversions are the billing record; if a browser could insert rows directly,
-- CTR and ROAS could be forged by anyone with the anon key.
