import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
  badge?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  badge,
}) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50/70 text-indigo-700 border-indigo-100',
      iconBg: 'bg-indigo-600 text-white',
      badgeBg: 'bg-indigo-100 text-indigo-800',
    },
    emerald: {
      bg: 'bg-emerald-50/70 text-emerald-700 border-emerald-100',
      iconBg: 'bg-emerald-600 text-white',
      badgeBg: 'bg-emerald-100 text-emerald-800',
    },
    amber: {
      bg: 'bg-amber-50/70 text-amber-700 border-amber-100',
      iconBg: 'bg-amber-500 text-white',
      badgeBg: 'bg-amber-100 text-amber-800',
    },
    rose: {
      bg: 'bg-rose-50/70 text-rose-700 border-rose-100',
      iconBg: 'bg-rose-500 text-white',
      badgeBg: 'bg-rose-100 text-rose-800',
    },
    sky: {
      bg: 'bg-sky-50/70 text-sky-700 border-sky-100',
      iconBg: 'bg-sky-500 text-white',
      badgeBg: 'bg-sky-100 text-sky-800',
    },
  };

  const scheme = colorMap[color];

  return (
    <div
      className={`rounded-2xl p-5 border bg-white shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${scheme.iconBg} shadow-xs`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 tracking-tight">{value}</span>
          {badge && (
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${scheme.badgeBg}`}>
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};
