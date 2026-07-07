import React from 'react';

export type ChartDataPoint = {
  label: string;
  value: number;
  subLabel?: string;
};

interface SimpleBarChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  valuePrefix?: string;
}

export function SimpleBarChart({ data, height = 200, color = 'var(--color-primary)', valuePrefix = '' }: SimpleBarChartProps) {
  const maxVal = Math.max(...data.map(d => d.value), 1); // Avoid div by 0

  return (
    <div className="flex items-end justify-between gap-2 w-full pt-6" style={{ height: `${height}px` }}>
      {data.map((item, idx) => {
        const percentage = Math.max((item.value / maxVal) * 100, 2); // Minimum 2% height for visibility
        return (
          <div key={idx} className="flex flex-col items-center gap-2 flex-1 group relative">
            {/* Tooltip */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
              {valuePrefix}{item.value.toLocaleString()}
            </div>
            
            {/* Bar */}
            <div 
              className="w-full rounded-t-sm transition-all duration-500 ease-out"
              style={{ 
                height: `${percentage}%`, 
                backgroundColor: color,
                opacity: item.value === 0 ? 0.2 : 0.9 
              }}
            />
            
            {/* Label */}
            <span className="text-[10px] uppercase font-semibold tracking-wider text-muted truncate w-full text-center">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface HorizontalBarChartProps {
  data: ChartDataPoint[];
  color?: string;
  valuePrefix?: string;
}

export function HorizontalBarChart({ data, color = 'var(--color-primary)', valuePrefix = '' }: HorizontalBarChartProps) {
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex flex-col gap-3 w-full">
      {data.map((item, idx) => {
        const percentage = Math.max((item.value / maxVal) * 100, 2);
        return (
          <div key={idx} className="flex flex-col gap-1 w-full">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-on-surface truncate pr-2">{item.label}</span>
              <span className="font-semibold text-on-surface shrink-0">
                {valuePrefix}{item.value.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${percentage}%`, backgroundColor: color }}
              />
            </div>
            {item.subLabel && (
              <span className="text-xs text-muted">{item.subLabel}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
