import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subText?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subText,
  icon: Icon,
  trend,
  variant = 'default',
  onClick,
}) => {
  const variantStyles = {
    default: 'bg-white border-slate-200 text-slate-900',
    success: 'bg-emerald-50/50 border-emerald-200 text-emerald-950',
    warning: 'bg-amber-50/50 border-amber-200 text-amber-950',
    danger: 'bg-rose-50/50 border-rose-200 text-rose-950',
    info: 'bg-blue-50/50 border-blue-200 text-blue-950',
  };

  const iconBgStyles = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-rose-100 text-rose-700',
    info: 'bg-blue-100 text-blue-700',
  };

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-xl border transition-all shadow-sm ${variantStyles[variant]} ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight font-mono">{value}</p>
        </div>
        <div className={`p-2.5 rounded-lg ${iconBgStyles[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {(subText || trend) && (
        <div className="mt-3 flex items-center text-xs text-slate-500 gap-1.5">
          {trend && (
            <span
              className={`font-medium ${
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend.value}
            </span>
          )}
          {subText && <span>{subText}</span>}
        </div>
      )}
    </div>
  );
};
