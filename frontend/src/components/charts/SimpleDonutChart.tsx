import type { ComponentType, SVGProps } from "react";
import ChartCardHeader from "./ChartCardHeader";

type ChartIcon = ComponentType<SVGProps<SVGSVGElement>>;

type Segment = {
  label: string;
  value: number;
  color: string;
  icon?: ChartIcon;
};

type SimpleDonutChartProps = {
  segments: Segment[];
  title: string;
  subtitle?: string;
  centerLabel?: string;
  valueFormatter?: (n: number) => string;
  icon?: ChartIcon;
  iconClassName?: string;
};

export default function SimpleDonutChart({
  segments,
  title,
  subtitle,
  centerLabel,
  valueFormatter = (n) => n.toLocaleString(),
  icon,
  iconClassName,
}: SimpleDonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 72;
  const stroke = 28;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  const arcs =
    total <= 0
      ? []
      : segments.map((seg) => {
          const fraction = seg.value / total;
          const dash = fraction * circumference;
          const arc = {
            ...seg,
            dash,
            gap: circumference - dash,
            offset: -offset,
          };
          offset += dash;
          return arc;
        });

  return (
    <div className="rounded-2xl border border-slate-200/75 bg-white p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.02)]">
      <ChartCardHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        iconClassName={iconClassName}
      />

      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center">
        <div className="relative shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth={stroke}
            />
            {arcs.map((arc) => (
              <circle
                key={arc.label}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={stroke}
                strokeDasharray={`${arc.dash} ${arc.gap}`}
                strokeDashoffset={arc.offset}
                transform={`rotate(-90 ${cx} ${cy})`}
                strokeLinecap="butt"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {centerLabel ?? "Total"}
            </span>
            <span className="text-lg font-bold text-slate-900">
              {valueFormatter(total)}
            </span>
          </div>
        </div>

        <ul className="space-y-2.5 min-w-[140px]">
          {segments.map((seg) => {
            const SegIcon = seg.icon;
            return (
            <li key={seg.label} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-2 text-slate-600">
                {SegIcon ? (
                  <SegIcon className="h-4 w-4 shrink-0" style={{ color: seg.color }} />
                ) : (
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: seg.color }}
                  />
                )}
                {seg.label}
              </span>
              <span className="font-semibold text-slate-900">
                {valueFormatter(seg.value)}
              </span>
            </li>
          );
          })}
        </ul>
      </div>
    </div>
  );
}
