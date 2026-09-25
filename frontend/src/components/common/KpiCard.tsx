import React from 'react';

interface KpiCardProps {
  id?: string;
  title: string;
  value: string | number;
  unit?: string;
  badge?: {
    text: string;
    variant?: 'emerald' | 'amber' | 'orange' | 'rose' | 'cyan' | 'blue' | 'slate';
  };
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  onClick?: () => void;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  id,
  title,
  value,
  unit,
  badge,
  subtitle,
  icon,
  trend,
  onClick,
  className = '',
}) => {
  const badgeColors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  }[badge?.variant || 'slate'];

  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:border-cyan-400' : ''
      } ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate max-w-[110px] sm:max-w-none">
          {title}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {badge && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium whitespace-nowrap ${badgeColors}`}
            >
              {badge.text}
            </span>
          )}
          {icon && <div className="text-slate-400 shrink-0">{icon}</div>}
        </div>
      </div>

      <div className="my-2 flex items-baseline gap-1.5 flex-wrap">
        <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-slate-500">
            {unit}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 gap-1">
        {subtitle && <span className="truncate text-[11px] max-w-[120px] sm:max-w-none">{subtitle}</span>}
        {trend && (
          <span
            className={`font-medium flex items-center gap-0.5 shrink-0 text-[11px] ml-auto ${
              trend.isNeutral
                ? 'text-slate-500'
                : trend.isPositive
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
};
