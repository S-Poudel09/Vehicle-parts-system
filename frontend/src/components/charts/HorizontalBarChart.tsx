import type { ComponentType, SVGProps } from "react";
import ChartCardHeader from "./ChartCardHeader";

type ChartIcon = ComponentType<SVGProps<SVGSVGElement>>;

type HorizontalBarChartProps = {
  labels: string[];
  values: number[];
  title: string;
  subtitle?: string;
  valueFormatter?: (n: number) => string;
  icon?: ChartIcon;
  iconClassName?: string;
};

export default function HorizontalBarChart({
  labels,
  values,
  title,
  subtitle,
  valueFormatter = (n) => n.toLocaleString(),
  icon,
  iconClassName,
}: HorizontalBarChartProps) {
  const maxVal = Math.max(1, ...values);

  return (
    <div className="rounded-2xl border border-slate-200/75 bg-white p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.02)]">
      <ChartCardHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        iconClassName={iconClassName}
      />

      {labels.length === 0 ? (
        <p className="py-10 text-center text-xs text-slate-400">
          No part sales recorded this month yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {labels.map((label, idx) => {
            const val = values[idx] ?? 0;
            const pct = (val / maxVal) * 100;

            return (
              <li key={label}>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-slate-700">{label}</span>
                  <span className="shrink-0 font-semibold text-slate-900">
                    {valueFormatter(val)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-teal-600 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
