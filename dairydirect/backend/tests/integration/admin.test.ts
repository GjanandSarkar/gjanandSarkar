import { adminService } from '../../src/services/adminService';

export async function runAdminIntegrationTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: Get dashboard statistics structure
  try {
    const stats = await adminService.getDashboardStats();
    if (
      stats.totalOrders === undefined ||
      stats.totalRevenue === undefined ||
      stats.mrr === undefined ||
      stats.activeSubscriptions === undefined
    ) {
      throw new Error('Dashboard stats missing core BI KPI metrics');
    }
    results.push({ name: 'Admin Integration: BI Dashboard KPIs computation', passed: true });
  } catch (err: any) {
    results.push({ name: 'Admin Integration: BI Dashboard KPIs computation', passed: false, error: err.message });
  }

  // Test 2: Reports generation format (JSON & CSV)
  try {
    const jsonReports = await adminService.getReports({ period: 'daily', format: 'json' });
    if (!Array.isArray(jsonReports.reports)) {
      throw new Error('Expected reports array');
    }

    const csvReports = await adminService.getReports({ period: 'daily', format: 'csv' });
    if (typeof csvReports !== 'string' || !csvReports.startsWith('Date,Orders Count')) {
      throw new Error('Expected formatted CSV export');
    }

    results.push({ name: 'Admin Integration: Sales Report & CSV Export generation', passed: true });
  } catch (err: any) {
    results.push({ name: 'Admin Integration: Sales Report & CSV Export generation', passed: false, error: err.message });
  }

  // Test 3: Settings retrieval
  try {
    const settings = await adminService.getSettings();
    if (!settings.standard_delivery_fee || !settings.free_delivery_threshold) {
      throw new Error('Business settings missing threshold values');
    }
    results.push({ name: 'Admin Integration: Business settings retrieval', passed: true });
  } catch (err: any) {
    results.push({ name: 'Admin Integration: Business settings retrieval', passed: false, error: err.message });
  }

  return results;
}
