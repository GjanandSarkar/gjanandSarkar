-- Quality Reports Table & Workflow
-- Migration: 20261026_quality_reports.sql

CREATE TABLE IF NOT EXISTS quality_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  batch_number TEXT,
  laboratory_name TEXT NOT NULL,
  test_date DATE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quality_reports_product ON quality_reports(product_id);
CREATE INDEX IF NOT EXISTS idx_quality_reports_seller ON quality_reports(seller_id);
CREATE INDEX IF NOT EXISTS idx_quality_reports_status ON quality_reports(status);

-- Enable RLS
ALTER TABLE quality_reports ENABLE ROW LEVEL SECURITY;

-- 1. Public / Customer can view approved quality reports
CREATE POLICY "Public read approved quality reports"
  ON quality_reports FOR SELECT
  USING (status = 'approved');

-- 2. Sellers can read all their own quality reports
CREATE POLICY "Sellers read own quality reports"
  ON quality_reports FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- 3. Sellers can insert their own reports (must start as pending)
CREATE POLICY "Sellers insert own quality reports"
  ON quality_reports FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid() AND status = 'pending');

-- 4. Admins have full access
CREATE POLICY "Admin full access quality reports"
  ON quality_reports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
