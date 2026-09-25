import React from 'react';
import { RiskLevel } from '../../types';
import { LanguageCode, getLocalizedRiskLevel } from '../../utils/i18n';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
  className?: string;
  language?: LanguageCode;
  label?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  size = 'md',
  showPulse = false,
  className = '',
  language = 'en',
  label,
}) => {
  const styles: Record<RiskLevel, { bg: string; text: string; border: string; dot: string; label: string }> = {
    stable: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Stable',
    },
    warning: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      label: 'Warning',
    },
    high: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      dot: 'bg-orange-500',
      label: 'High Risk',
    },
    critical: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
      label: 'Critical',
    },
  };

  const current = styles[level] || styles.stable;
  const displayLabel = label || getLocalizedRiskLevel(level, language);
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 font-medium tracking-wide',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-bold',
  }[size];

  return (
    <span
      id={`risk-badge-${level}`}
      className={`inline-flex items-center gap-1.5 rounded-full border ${current.bg} ${current.text} ${current.border} ${sizeClasses} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {(showPulse || level === 'critical') && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${current.dot}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${current.dot}`} />
      </span>
      <span>{displayLabel}</span>
    </span>
  );
};

