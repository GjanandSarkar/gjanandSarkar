"use client";

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';


export type ChartDataPoint = {
  label: string;
  value: number;
  subLabel?: string;
  fullDate?: string;
};

// ─── Custom Tooltip for Hover ─────────────────────────────────
const CustomTooltip = ({ active, payload, label, valuePrefix, valueSuffix }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0];
    const val = dataPoint.value;
    return (
      <div className="bg-gray-900/95 text-white px-3 py-2 rounded-xl shadow-xl backdrop-blur-md border border-gray-700/50 text-xs flex flex-col gap-0.5 z-50">
        <span className="font-semibold text-gray-300 tracking-wide uppercase text-[10px]">
          {dataPoint.payload.fullDate || label}
        </span>
        <span className="font-extrabold text-sm text-emerald-400">
          {valuePrefix || ''}{val.toLocaleString()}{valueSuffix || ''}
        </span>
      </div>
    );
  }
  return null;
};

// ─── 1. Smooth Area Chart (For Continuous Revenue Trend) ─────
interface SmoothAreaChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  gradientId?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}

export function SmoothAreaChart({
  data,
  height = 220,
  color = '#0c3c26',
  gradientId = 'areaGradient',
  valuePrefix = '',
  valueSuffix = '',
}: SmoothAreaChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-muted text-sm font-medium">
        No trend data available
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.45} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(195,201,187,0.2)" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--color-muted, #71717a)', fontSize: 11, fontWeight: 600 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--color-muted, #71717a)', fontSize: 11, fontWeight: 600 }}
            tickFormatter={(val) => `${valuePrefix}${val}`}
          />
          <Tooltip
            content={
              <CustomTooltip valuePrefix={valuePrefix} valueSuffix={valueSuffix} />
            }
            cursor={{ stroke: color, strokeWidth: 1.5, strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 6, fill: color, stroke: '#ffffff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── 2. Lollipop Stem Chart (For Order Analytics) ─────────────
interface LollipopChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  valueSuffix?: string;
}

export function LollipopChart({
  data,
  height = 220,
  color = '#0284c7',
  valueSuffix = ' orders',
}: LollipopChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-muted text-sm font-medium">
        No order data available
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="w-full">
      <div
        className="flex items-end justify-between gap-2 w-full pt-8 pb-3"
        style={{ height: `${height}px` }}
      >
        {data.map((item, idx) => {
          const percentage = item.value === 0 ? 8 : Math.max((item.value / maxVal) * 100, 14);
          const isZero = item.value === 0;

          return (
            <div
              key={idx}
              className="flex flex-col items-center flex-1 h-full justify-end group relative cursor-pointer"
            >
              {/* Floating Hover Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 absolute -top-10 bg-gray-900 text-white px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shadow-xl z-30 pointer-events-none transform -translate-y-1">
                {item.fullDate || item.label}: <span className="text-sky-400 font-extrabold">{item.value}{valueSuffix}</span>
              </div>

              {/* Top Lollipop Badge */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs transition-all duration-300 group-hover:scale-125 group-hover:shadow-lg z-10"
                style={{
                  backgroundColor: isZero ? 'var(--color-surface-container-high, #e2e8f0)' : color,
                  color: isZero ? 'var(--color-muted, #94a3b8)' : '#ffffff',
                  boxShadow: isZero ? 'none' : `0 4px 14px ${color}66`,
                }}
              >
                {item.value}
              </div>

              {/* Vertical Stem Line */}
              <div className="w-full flex justify-center flex-1 items-end pt-1">
                <div
                  className="w-1 rounded-full transition-all duration-500 ease-out group-hover:w-1.5"
                  style={{
                    height: `${percentage}%`,
                    backgroundColor: isZero ? 'var(--color-surface-container-high, #cbd5e1)' : color,
                    opacity: isZero ? 0.35 : 0.85,
                  }}
                />
              </div>

              {/* Day Label */}
              <span className="text-[11px] uppercase font-bold tracking-wider text-muted truncate w-full text-center mt-2 group-hover:text-on-surface transition-colors">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 3. Modern Column / Bar Chart ─────────────────────────────
interface ModernBarChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  valueSuffix?: string;
}

export function ModernBarChart({
  data,
  height = 220,
  color = '#0284c7',
  valueSuffix = ' orders',
}: ModernBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-muted text-sm font-medium">
        No order data available
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(195,201,187,0.2)" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--color-muted, #71717a)', fontSize: 11, fontWeight: 600 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--color-muted, #71717a)', fontSize: 11, fontWeight: 600 }}
            allowDecimals={false}
          />
          <Tooltip
            content={
              <CustomTooltip valueSuffix={valueSuffix} />
            }
            cursor={{ fill: 'rgba(2, 132, 199, 0.08)' }}
          />
          <Bar
            dataKey="value"
            fill={color}
            radius={[8, 8, 0, 0]}
            maxBarSize={44}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── 4. Donut Ring Chart ──────────────────────────────────────
interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  centerTitle?: string;
  centerValue?: string | number;
  height?: number;
}

export function DonutChart({
  data,
  centerTitle,
  centerValue,
  height = 220,
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-around gap-4" style={{ minHeight: `${height}px` }}>
      <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: any, name: any) => [`${val} (${total > 0 ? ((val / total) * 100).toFixed(1) : 0}%)`, name]}
              contentStyle={{ background: '#111827', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
        {(centerTitle || centerValue) && (
          <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
            {centerValue !== undefined && (
              <span className="text-xl font-extrabold text-on-surface leading-tight">
                {centerValue}
              </span>
            )}
            {centerTitle && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                {centerTitle}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5 flex-1 w-full max-w-[200px]">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="font-semibold text-on-surface">{item.label}</span>
            </div>
            <span className="font-bold text-on-surface">
              {item.value} <span className="text-muted font-normal text-[11px]">({total > 0 ? Math.round((item.value / total) * 100) : 0}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 5. Horizontal Bar Chart (Product Performance) ───────────
interface HorizontalBarChartProps {
  data: ChartDataPoint[];
  color?: string;
  valuePrefix?: string;
}

export function HorizontalBarChart({
  data,
  color = '#3f6530',
  valuePrefix = '',
}: HorizontalBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-muted text-sm font-medium">
        No sales data available yet
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {data.map((item, idx) => {
        const percentage = Math.max((item.value / maxVal) * 100, 3);
        return (
          <div key={idx} className="flex flex-col gap-1 w-full group">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-on-surface truncate pr-2 group-hover:text-primary transition-colors">
                {item.label}
              </span>
              <span className="font-bold text-on-surface shrink-0">
                {valuePrefix}{item.value.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out shadow-sm"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color,
                }}
              />
            </div>
            {item.subLabel && (
              <span className="text-xs text-muted font-medium">{item.subLabel}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── 6. Legacy SimpleBarChart Component ───────────────────────
export function SimpleBarChart({
  data,
  height = 200,
  color = '#3f6530',
  valuePrefix = '',
}: {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  valuePrefix?: string;
}) {
  return (
    <SmoothAreaChart
      data={data}
      height={height}
      color={color}
      valuePrefix={valuePrefix}
    />
  );
}

// ─── 7. Calendar Heatmap Chart (For Orders Calendar View) ───────
export interface CalendarHeatmapProps {
  orders?: Array<{ created_at: string; total_amount?: number | string; status?: string }>;
  data?: Array<{ date: string; count: number; revenue?: number }>;
  currencyPrefix?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function CalendarHeatmapChart({
  orders,
  data,
  currencyPrefix = '₹',
  title = 'Orders Calendar View',
  subtitle = 'Calendar Heatmap View',
  className = '',
}: CalendarHeatmapProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => new Date());

  // Aggregate orders by YYYY-MM-DD
  const aggregatedData = React.useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};

    if (data && data.length > 0) {
      data.forEach((item) => {
        map[item.date] = {
          count: item.count,
          revenue: item.revenue || 0,
        };
      });
    } else if (orders && orders.length > 0) {
      orders.forEach((o) => {
        if (o.status === 'cancelled') return;
        if (!o.created_at) return;
        const cleanStr =
          o.created_at.includes(' ') && !o.created_at.includes('T')
            ? o.created_at.replace(' ', 'T')
            : o.created_at;
        const d = new Date(cleanStr);
        if (isNaN(d.getTime())) return;
        const dateKey = format(d, 'yyyy-MM-dd');
        const rev =
          typeof o.total_amount === 'string'
            ? parseFloat(o.total_amount)
            : Number(o.total_amount) || 0;

        if (!map[dateKey]) {
          map[dateKey] = { count: 0, revenue: 0 };
        }
        map[dateKey].count += 1;
        map[dateKey].revenue += rev;
      });
    }

    return map;
  }, [orders, data]);

  // Compute calendar grid days for currentMonth
  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Compute maximum orders in a single day for proportional scaling
  const maxDayCount = React.useMemo(() => {
    const counts = Object.values(aggregatedData).map((d) => d.count);
    return counts.length > 0 ? Math.max(...counts, 1) : 5;
  }, [aggregatedData]);

  // Stats for selected month
  const monthStats = React.useMemo(() => {
    let totalCount = 0;
    let totalRev = 0;
    let maxCount = 0;

    calendarDays.forEach((day) => {
      if (isSameMonth(day, currentMonth)) {
        const key = format(day, 'yyyy-MM-dd');
        const dayData = aggregatedData[key];
        if (dayData) {
          totalCount += dayData.count;
          totalRev += dayData.revenue;
          if (dayData.count > maxCount) maxCount = dayData.count;
        }
      }
    });

    return { totalCount, totalRev, maxCount };
  }, [calendarDays, currentMonth, aggregatedData]);

  const prevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const nextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));
  const resetToToday = () => setCurrentMonth(new Date());

  // Function to determine cell background based on count intensity
  const getCellIntensityStyle = (count: number, inMonth: boolean) => {
    if (!inMonth) {
      return {
        bg: 'bg-slate-100/50 border-slate-100/80',
        text: 'text-slate-300 font-normal',
      };
    }

    if (count === 0) {
      return {
        bg: 'bg-emerald-50/40 border-emerald-100/60 hover:bg-emerald-100/50',
        text: 'text-slate-700 font-bold',
      };
    }

    const ratio = count / Math.max(maxDayCount, 4);

    if (ratio <= 0.25 || count === 1) {
      return {
        bg: 'bg-emerald-100 border-emerald-200 hover:bg-emerald-200/80 shadow-2xs',
        text: 'text-emerald-950 font-extrabold',
      };
    } else if (ratio <= 0.5 || count <= 3) {
      return {
        bg: 'bg-emerald-300 border-emerald-400 hover:bg-emerald-400/90 shadow-xs text-white',
        text: 'text-white font-extrabold',
      };
    } else if (ratio <= 0.75 || count <= 5) {
      return {
        bg: 'bg-emerald-500 border-emerald-600 hover:bg-emerald-600 shadow-sm text-white',
        text: 'text-white font-extrabold',
      };
    } else {
      return {
        bg: 'bg-[#0c3c26] border-[#072617] hover:bg-[#114e32] shadow-md text-white',
        text: 'text-white font-extrabold',
      };
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`w-full bg-surface-container-lowest border border-sand/30 rounded-2xl p-4 sm:p-5 shadow-xs ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-on-surface tracking-tight">
            {title}
          </h3>
          <p className="text-[11px] text-muted font-medium mt-0.5">{subtitle}</p>
        </div>

        {/* Right Header Controls: Stats + Intensity + Month Picker */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto justify-end">
          {/* Month Summary & Intensity */}
          <div className="flex items-center gap-2.5 text-xs font-semibold text-muted bg-surface-container border border-sand/30 rounded-xl px-3 py-1.5 shadow-2xs">
            <span>
              Month Orders: <strong className="text-on-surface font-extrabold">{monthStats.totalCount}</strong>
            </span>
            <span>•</span>
            <span>
              Revenue: <strong className="text-emerald-600 font-extrabold">{currencyPrefix}{monthStats.totalRev.toLocaleString()}</strong>
            </span>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-muted font-semibold text-[10px] uppercase tracking-wider">
                Intensity:
              </span>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-50 border border-amber-200" title="0" />
                <span className="text-[10px] text-muted">0</span>
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-100 border border-emerald-200" title="Low" />
                <span className="text-[10px] text-muted">Low</span>
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-300 border border-emerald-400" title="Med" />
                <span className="text-[10px] text-muted">Med</span>
                <span className="w-2.5 h-2.5 rounded-xs bg-[#0c3c26] border border-[#072617]" title="High" />
                <span className="text-[10px] text-muted">High</span>
              </div>
            </div>
          </div>

          {/* Month Navigation Switcher */}
          <div className="flex items-center bg-surface-container border border-sand/40 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={prevMonth}
              className="p-1 rounded-md hover:bg-surface-container-high transition-colors text-on-surface cursor-pointer"
              title="Previous Month"
              type="button"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetToToday}
              className="px-2 py-0.5 text-xs font-bold text-on-surface hover:text-primary transition-colors cursor-pointer"
              title="Reset to Current Month"
              type="button"
            >
              {format(currentMonth, 'MMM yyyy')}
            </button>
            <button
              onClick={nextMonth}
              className="p-1 rounded-md hover:bg-surface-container-high transition-colors text-on-surface cursor-pointer"
              title="Next Month"
              type="button"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-[10px] sm:text-xs font-bold text-muted uppercase tracking-wider py-0.5"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid of Calendar Days */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarDays.map((day, idx) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isSameDay(day, new Date());
          const dayData = aggregatedData[dateKey] || { count: 0, revenue: 0 };
          const intensity = getCellIntensityStyle(dayData.count, inMonth);

          return (
            <div
              key={idx}
              className="group relative flex flex-col items-center justify-center"
            >
              {/* Day Cell */}
              <div
                className={`w-full h-10 sm:h-11 rounded-lg sm:rounded-xl border flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${intensity.bg} ${
                  isTodayDate ? 'ring-2 ring-emerald-600 ring-offset-1' : ''
                }`}
              >
                <span className={`text-xs sm:text-sm ${intensity.text}`}>
                  {format(day, 'd')}
                </span>

                {/* Micro order count indicator badge if > 0 */}
                {inMonth && dayData.count > 0 && (
                  <span className="text-[9px] opacity-90 font-semibold -mt-0.5 hidden sm:block truncate px-0.5">
                    {dayData.count} {dayData.count === 1 ? 'order' : 'orders'}
                  </span>
                )}
              </div>

              {/* Hover Tooltip */}
              {inMonth && (
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 absolute -top-12 bg-gray-900 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap shadow-2xl z-50 pointer-events-none transform -translate-y-1 border border-gray-700/60 flex flex-col gap-0.5 text-center">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                    {format(day, 'EEEE, MMM d, yyyy')}
                  </span>
                  <div className="flex items-center justify-center gap-1.5 text-[11px]">
                    <span className="text-emerald-300 font-extrabold">
                      {dayData.count} {dayData.count === 1 ? 'Order' : 'Orders'}
                    </span>
                    {dayData.revenue > 0 && (
                      <span className="text-emerald-400 font-extrabold">
                        ({currencyPrefix}{dayData.revenue.toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 8. Day & Time Heatmap Chart (Orders by Day & Time) ───────
export interface DayTimeHeatmapProps {
  orders?: Array<{ created_at: string; total_amount?: number | string; status?: string }>;
  currencyPrefix?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function DayTimeHeatmapChart({
  orders,
  currencyPrefix = '₹',
  title = 'Orders by Day & Time',
  subtitle = 'Peak order times distribution',
  className = '',
}: DayTimeHeatmapProps) {
  const timeSlots = [
    { key: 'morning', label: 'Morning', sub: '6AM - 12PM' },
    { key: 'afternoon', label: 'Afternoon', sub: '12PM - 4PM' },
    { key: 'evening', label: 'Evening', sub: '4PM - 8PM' },
    { key: 'night', label: 'Night', sub: '8PM - 12AM' },
  ];

  const weekDays = [
    { key: 0, label: 'SUN' },
    { key: 1, label: 'MON' },
    { key: 2, label: 'TUE' },
    { key: 3, label: 'WED' },
    { key: 4, label: 'THU' },
    { key: 5, label: 'FRI' },
    { key: 6, label: 'SAT' },
  ];

  // Aggregate orders by day of week (0-6) and time slot
  const matrixData = React.useMemo(() => {
    const grid: Record<number, Record<string, { count: number; revenue: number }>> = {};

    weekDays.forEach((day) => {
      grid[day.key] = {
        morning: { count: 0, revenue: 0 },
        afternoon: { count: 0, revenue: 0 },
        evening: { count: 0, revenue: 0 },
        night: { count: 0, revenue: 0 },
      };
    });

    if (orders && orders.length > 0) {
      orders.forEach((o) => {
        if (o.status === 'cancelled') return;
        if (!o.created_at) return;
        const cleanStr =
          o.created_at.includes(' ') && !o.created_at.includes('T')
            ? o.created_at.replace(' ', 'T')
            : o.created_at;
        const d = new Date(cleanStr);
        if (isNaN(d.getTime())) return;

        const dayIdx = d.getDay();
        const hour = d.getHours();

        let slotKey = 'night';
        if (hour >= 6 && hour < 12) slotKey = 'morning';
        else if (hour >= 12 && hour < 16) slotKey = 'afternoon';
        else if (hour >= 16 && hour < 20) slotKey = 'evening';
        else slotKey = 'night';

        const rev =
          typeof o.total_amount === 'string'
            ? parseFloat(o.total_amount)
            : Number(o.total_amount) || 0;

        if (grid[dayIdx] && grid[dayIdx][slotKey]) {
          grid[dayIdx][slotKey].count += 1;
          grid[dayIdx][slotKey].revenue += rev;
        }
      });
    }

    return grid;
  }, [orders]);

  // Find max count for intensity ratio
  const maxCount = React.useMemo(() => {
    let max = 0;
    Object.values(matrixData).forEach((daySlots) => {
      Object.values(daySlots).forEach((cell) => {
        if (cell.count > max) max = cell.count;
      });
    });
    return Math.max(max, 1);
  }, [matrixData]);

  // Color intensity style helper (Emerald/Green palette matching app theme)
  const getGreenIntensity = (count: number) => {
    if (count === 0) {
      return {
        bg: 'bg-emerald-50/70 border-emerald-100/80 hover:bg-emerald-100/60',
        text: 'text-emerald-300 font-normal',
      };
    }

    const ratio = count / Math.max(maxCount, 3);

    if (ratio <= 0.35 || count === 1) {
      return {
        bg: 'bg-emerald-100 border-emerald-200/80 hover:bg-emerald-200/80 shadow-2xs',
        text: 'text-emerald-950 font-extrabold',
      };
    } else if (ratio <= 0.7 || count <= 3) {
      return {
        bg: 'bg-emerald-400 border-emerald-500/90 hover:bg-emerald-500 shadow-xs text-white',
        text: 'text-white font-extrabold',
      };
    } else {
      return {
        bg: 'bg-[#0c3c26] border-[#072617] hover:bg-[#114e32] shadow-md',
        text: 'text-white font-extrabold',
      };
    }
  };

  return (
    <div className={`w-full bg-surface-container-lowest border border-sand/30 rounded-2xl p-4 sm:p-5 shadow-xs ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-on-surface tracking-tight">
            {title}
          </h3>
          <p className="text-[11px] text-muted font-medium mt-0.5">{subtitle}</p>
        </div>

        {/* Top-Right Segmented Scale Legend */}
        <div className="flex items-center gap-2.5 text-xs self-start sm:self-auto">
          <span className="text-muted font-semibold text-[11px]">Low Orders</span>

          {/* Segmented Color Bar */}
          <div className="flex items-center gap-0.5 rounded-full overflow-hidden p-0.5 bg-surface-container border border-sand/30 shadow-2xs">
            <span className="w-5 sm:w-6 h-2 rounded-l-full bg-emerald-50" />
            <span className="w-5 sm:w-6 h-2 bg-emerald-100" />
            <span className="w-5 sm:w-6 h-2 bg-emerald-200" />
            <span className="w-5 sm:w-6 h-2 bg-emerald-300" />
            <span className="w-5 sm:w-6 h-2 bg-emerald-500" />
            <span className="w-5 sm:w-6 h-2 rounded-r-full bg-[#0c3c26]" />
          </div>

          <span className="text-muted font-semibold text-[11px]">High Orders</span>
        </div>
      </div>

      {/* Heatmap Grid Layout */}
      <div className="flex flex-col gap-2">
        {/* Days Rows */}
        {weekDays.map((day) => (
          <div key={day.key} className="grid grid-cols-5 items-center gap-2">
            {/* Day Label (Y-Axis) */}
            <div className="text-[11px] font-bold text-muted uppercase tracking-wider text-right pr-2">
              {day.label}
            </div>

            {/* Time Slot Cells (X-Axis) */}
            {timeSlots.map((slot) => {
              const cellData = matrixData[day.key]?.[slot.key] || { count: 0, revenue: 0 };
              const intensity = getGreenIntensity(cellData.count);

              return (
                <div
                  key={slot.key}
                  className="group relative flex flex-col items-center justify-center"
                >
                  <div
                    className={`w-full h-8 sm:h-9 rounded-lg border flex items-center justify-center transition-all duration-200 cursor-pointer ${intensity.bg}`}
                  >
                    <span className={`text-xs ${intensity.text}`}>
                      {cellData.count > 0 ? cellData.count : ''}
                    </span>
                  </div>

                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 absolute -top-12 bg-gray-900 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap shadow-2xl z-50 pointer-events-none transform -translate-y-1 border border-gray-700/60 flex flex-col gap-0.5 text-center">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                      {day.label} • {slot.label} ({slot.sub})
                    </span>
                    <div className="flex items-center justify-center gap-1.5 text-[11px]">
                      <span className="text-emerald-300 font-extrabold">
                        {cellData.count} {cellData.count === 1 ? 'Order' : 'Orders'}
                      </span>
                      {cellData.revenue > 0 && (
                        <span className="text-emerald-400 font-extrabold">
                          ({currencyPrefix}{cellData.revenue.toLocaleString()})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Time Slot Labels (X-Axis Header Footer) */}
        <div className="grid grid-cols-5 items-center gap-2 mt-1">
          <div /> {/* Empty space for Y-Axis alignment */}
          {timeSlots.map((slot) => (
            <div key={slot.key} className="text-center flex flex-col items-center">
              <span className="text-xs font-bold text-on-surface">{slot.label}</span>
              <span className="text-[9px] text-muted font-medium">{slot.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 9. Treemap Chart (Orders by Category) ─────────────────────
export interface TreemapItem {
  label: string;
  value: number;
  percentage?: number;
  revenue?: number;
  color?: string;
}

export interface CategoryTreemapProps {
  data?: TreemapItem[];
  orders?: Array<{
    status?: string;
    order_items?: Array<{
      quantity?: number;
      price?: number;
      products?: { name?: string; category?: string };
    }>;
  }>;
  currencyPrefix?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

const CATEGORY_COLORS = [
  'bg-blue-500 hover:bg-blue-600 border-blue-400',
  'bg-emerald-500 hover:bg-emerald-600 border-emerald-400',
  'bg-amber-500 hover:bg-amber-600 border-amber-400',
  'bg-purple-500 hover:bg-purple-600 border-purple-400',
  'bg-pink-500 hover:bg-pink-600 border-pink-400',
  'bg-teal-500 hover:bg-teal-600 border-teal-400',
];

export function CategoryTreemapChart({
  data,
  orders,
  currencyPrefix = '₹',
  title = 'Orders by Category',
  subtitle = 'Category market share breakdown',
  className = '',
}: CategoryTreemapProps) {
  // Aggregate categories if orders array provided
  const categoriesList = React.useMemo(() => {
    if (data && data.length > 0) return data;

    const catStats: Record<string, { units: number; revenue: number }> = {};
    let grandTotal = 0;

    if (orders && orders.length > 0) {
      orders.forEach((o) => {
        if (o.status === 'cancelled') return;
        o.order_items?.forEach((item) => {
          const catName = item.products?.category?.trim() || 'Uncategorised';
          const qty = Number(item.quantity) || 1;
          const price = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price) || 0;

          if (!catStats[catName]) {
            catStats[catName] = { units: 0, revenue: 0 };
          }
          catStats[catName].units += qty;
          catStats[catName].revenue += price * qty;
          grandTotal += qty;
        });
      });
    }

    // No mock fallback. Showing invented dairy revenue on an admin dashboard
    // is worse than showing an honest empty state.
    if (Object.keys(catStats).length === 0) {
      return [];
    }

    const sorted = Object.entries(catStats)
      .map(([name, stats]) => ({
        label: name,
        value: stats.units,
        revenue: stats.revenue,
        percentage: grandTotal > 0 ? Math.round((stats.units / grandTotal) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);

    return sorted;
  }, [data, orders]);

  const totalValue = categoriesList.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={`w-full bg-surface-container-lowest border border-sand/30 rounded-2xl p-4 sm:p-5 shadow-xs ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-on-surface tracking-tight">
            {title}
          </h3>
          <p className="text-[11px] text-muted font-medium mt-0.5">{subtitle}</p>
        </div>

        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-2xs self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Treemap
        </span>
      </div>

      {categoriesList.length === 0 && (
        <div className="min-h-[220px] flex items-center justify-center text-center">
          <p className="text-xs text-muted font-medium max-w-[240px]">
            No category sales data yet. Tiles appear here once orders are placed.
          </p>
        </div>
      )}

      {/* Treemap Tile Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 min-h-[220px]" hidden={categoriesList.length === 0}>
        {categoriesList.slice(0, 5).map((item, idx) => {
          const colorClass = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
          const pct = item.percentage ?? (totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0);

          // Span larger tile for top categories (matching image layout)
          const spanClass = idx === 0 ? 'md:col-span-1 md:row-span-2' : idx === 1 ? 'md:col-span-1 md:row-span-2' : '';

          return (
            <div
              key={idx}
              className={`group relative rounded-xl p-4 text-white transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm cursor-pointer flex flex-col justify-between ${colorClass} ${spanClass}`}
            >
              <div>
                <span className="text-xs sm:text-sm font-bold tracking-wide block truncate opacity-95">
                  {item.label}
                </span>
                <span className="text-xl sm:text-2xl font-extrabold mt-1 block">
                  {item.value.toLocaleString()}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-semibold opacity-90">{pct}%</span>
              </div>

              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap shadow-2xl z-50 pointer-events-none border border-gray-700/60 flex flex-col gap-0.5 text-center">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                  {item.label}
                </span>
                <div className="flex items-center justify-center gap-1.5 text-[11px]">
                  <span className="text-emerald-400 font-extrabold">
                    {item.value} units ({pct}%)
                  </span>
                  {item.revenue && item.revenue > 0 && (
                    <span className="text-amber-300 font-extrabold">
                      • {currencyPrefix}{item.revenue.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Legend */}
      <div className="mt-4 pt-3 border-t border-sand/20 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <span className="text-muted font-semibold text-[10px] uppercase tracking-wider">
          Categories: {categoriesList.length}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {categoriesList.slice(0, 5).map((cat, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-sm ${CATEGORY_COLORS[idx % CATEGORY_COLORS.length].split(' ')[0]}`} />
              <span className="text-muted font-medium text-[11px]">{cat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 10. Order Status Donut Chart ──────────────────────────────
export interface OrderStatusDonutProps {
  orders?: Array<{ status?: string }>;
  data?: Array<{ label: string; value: number; color: string }>;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function OrderStatusDonutChart({
  orders,
  data,
  title = 'Order Status Distribution',
  subtitle,
  className = '',
}: OrderStatusDonutProps) {
  const chartData = React.useMemo(() => {
    if (data && data.length > 0) return data;

    let completed = 0;
    let processing = 0;
    let pending = 0;
    let cancelled = 0;

    if (orders && orders.length > 0) {
      orders.forEach((o) => {
        const status = o.status || 'pending';
        if (status === 'delivered' || status === 'completed') {
          completed += 1;
        } else if (status === 'confirmed' || status === 'out_for_delivery' || status === 'processing') {
          processing += 1;
        } else if (status === 'pending') {
          pending += 1;
        } else if (status === 'cancelled') {
          cancelled += 1;
        }
      });
    }

    const total = completed + processing + pending + cancelled;

    // Fallback mock data if total is 0 (matching image demo)
    if (total === 0) {
      return [
        { label: 'Completed', value: 42, color: '#10b981' },
        { label: 'Processing', value: 30, color: '#3b82f6' },
        { label: 'Pending', value: 18, color: '#f59e0b' },
        { label: 'Cancelled', value: 10, color: '#f43f5e' },
      ];
    }

    return [
      { label: 'Completed', value: completed, color: '#10b981' },
      { label: 'Processing', value: processing, color: '#3b82f6' },
      { label: 'Pending', value: pending, color: '#f59e0b' },
      { label: 'Cancelled', value: cancelled, color: '#f43f5e' },
    ];
  }, [data, orders]);

  const totalCount = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={`w-full bg-surface-container-lowest border border-sand/30 rounded-2xl p-4 sm:p-5 shadow-xs ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-on-surface tracking-tight">
            {title}
          </h3>
          {subtitle && <p className="text-[11px] text-muted font-medium mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Main Content Layout (Donut Left, Breakdown Legend Right) */}
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
        {/* Donut Ring with Center Text */}
        <div className="relative flex items-center justify-center shrink-0" style={{ width: 170, height: 170 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: any, name: any) => [
                  `${val} (${totalCount > 0 ? ((val / totalCount) * 100).toFixed(0) : 0}%)`,
                  name,
                ]}
                contentStyle={{
                  background: '#111827',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Text */}
          <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[11px] font-semibold text-muted">Total</span>
            <span className="text-2xl font-extrabold text-on-surface leading-none mt-0.5">
              {totalCount}
            </span>
          </div>
        </div>

        {/* Right Side Status Breakdown Legend */}
        <div className="flex flex-col gap-3 flex-1 w-full max-w-[240px]">
          {chartData.map((item, idx) => {
            const pct = totalCount > 0 ? Math.round((item.value / totalCount) * 100) : 0;
            return (
              <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="font-bold text-on-surface">{item.label}</span>
                </div>

                <div className="flex items-center gap-1 font-semibold text-muted text-xs">
                  <span>{pct}%</span>
                  <span className="text-muted/70">({item.value})</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── 11. Top Categories Card (Matching UI Mockup) ─────────────
export interface TopCategoriesCardProps {
  orders?: Array<{
    status?: string;
    order_items?: Array<{
      quantity?: number;
      price?: number;
      products?: { name?: string; category?: string };
    }>;
  }>;
  className?: string;
}

export function TopCategoriesCard({ orders, className = '' }: TopCategoriesCardProps) {
  // Previously rendered two hardcoded cards ("Milk & Dairy 3 / 60%" and
  // "Buttermilk 3 / 60%") and a hardcoded "Total Categories 6", completely
  // ignoring the `orders` prop it was given. It now aggregates real order
  // items, like every other card on the dashboard.
  const ranked = React.useMemo(() => {
    const units: Record<string, number> = {};
    let total = 0;

    for (const order of orders ?? []) {
      if (order.status === 'cancelled') continue;
      for (const item of order.order_items ?? []) {
        const name = item.products?.category?.trim();
        if (!name) continue;
        const qty = Number(item.quantity) || 1;
        units[name] = (units[name] ?? 0) + qty;
        total += qty;
      }
    }

    const sorted = Object.entries(units)
      .map(([label, value]) => ({
        label,
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);

    return { sorted, categoryCount: sorted.length };
  }, [orders]);

  const cards = ranked.sorted.slice(0, 2);
  const cardStyles = ['bg-[#0c3c26]', 'bg-[#b87d20]'];
  const dotStyles = ['bg-[#0c3c26]', 'bg-[#b87d20]'];

  return (
    <div className={`w-full bg-surface-container-lowest border border-sand/30 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between ${className}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm sm:text-base font-extrabold text-on-surface tracking-tight">
          Top Categories
        </h3>
      </div>

      {cards.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-10 text-center">
          <p className="text-xs text-muted font-medium max-w-[220px]">
            No category sales yet. This card fills in once orders start coming through.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {cards.map((cat, i) => (
              <div
                key={cat.label}
                className={`${cardStyles[i]} rounded-2xl p-4 text-white flex flex-col justify-between min-h-[135px] relative overflow-hidden shadow-sm`}
              >
                <div>
                  <span className="text-xs font-bold tracking-wide opacity-95 block truncate">{cat.label}</span>
                  <span className="text-2xl font-extrabold mt-1 block">{cat.value}</span>
                </div>

                <div className="flex items-end justify-between mt-4">
                  <span className="text-xs font-semibold opacity-90">{cat.percentage}%</span>
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Text */}
          <div className="pt-3 border-t border-sand/20 flex items-center justify-between text-[11px] text-muted font-medium">
            <span>
              Total Categories{' '}
              <strong className="text-on-surface font-extrabold">{ranked.categoryCount}</strong>
            </span>
            <div className="flex items-center gap-2">
              {cards.map((cat, i) => (
                <span key={cat.label} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${dotStyles[i]}`} /> {cat.label}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── 12. Product Performance Bar List ──────────────────────────
export interface ProductPerformanceBarListProps {
  title: string;
  valueHeader: string;
  items: Array<{ label: string; value: number; displayValue?: string }>;
  color?: string;
}

export function ProductPerformanceBarList({
  title,
  valueHeader,
  items,
  color = '#0c3c26',
}: ProductPerformanceBarListProps) {
  const maxValue = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="bg-surface-container-lowest border border-sand/30 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-bold text-on-surface mb-4">{title}</h3>

        {/* Table Header */}
        <div className="flex justify-between text-[11px] font-bold text-muted uppercase tracking-wider mb-3">
          <span>Product</span>
          <span>{valueHeader}</span>
        </div>

        {/* Items List */}
        <div className="flex flex-col gap-4">
          {items.map((item, idx) => {
            const pct = Math.max((item.value / maxValue) * 100, 12);
            return (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="font-semibold text-on-surface truncate pr-2">
                    {item.label}
                  </span>
                  <span className="font-extrabold text-on-surface shrink-0">
                    {item.displayValue || item.value}
                  </span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}






