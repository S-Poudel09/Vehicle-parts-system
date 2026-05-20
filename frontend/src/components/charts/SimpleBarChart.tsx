import { useMemo, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import ChartCardHeader from "./ChartCardHeader";

type ChartIcon = ComponentType<SVGProps<SVGSVGElement>>;

type SimpleBarChartProps = {
  labels: string[];
  values: number[];
  valueFormatter?: (n: number) => string;
  barColor?: string;
  title: string;
  subtitle?: string;
  icon?: ChartIcon;
  iconClassName?: string;
};

export default function SimpleBarChart({
  labels,
  values,
  valueFormatter = (n) => n.toLocaleString(),
  barColor = "#0f766e",
  title,
  subtitle,
  icon,
  iconClassName,
}: SimpleBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxVal = useMemo(
    () => Math.max(1, ...values) * 1.12,
    [values]
  );

  const width = 560;
  const height = 220;
  const paddingLeft = 48;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 36;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const barGap = 12;
  const barWidth =
    labels.length > 0
      ? (chartWidth - barGap * (labels.length - 1)) / labels.length
      : 0;

  return (
    <div className="rounded-2xl border border-slate-200/75 bg-white p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.02)]">
      <ChartCardHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        iconClassName={iconClassName}
      />
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {[0, 0.5, 1].map((pct) => {
          const y = paddingTop + chartHeight - pct * chartHeight;
          const tick = pct * maxVal;
          return (
            <g key={pct}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 text-[9px]"
              >
                {valueFormatter(tick)}
              </text>
            </g>
          );
        })}
        {values.map((val, idx) => {
          const barH = (val / maxVal) * chartHeight;
          const x = paddingLeft + idx * (barWidth + barGap);
          const y = paddingTop + chartHeight - barH;
          const isHovered = hoveredIdx === idx;

          return (
            <g
              key={labels[idx] ?? idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <rect
                x={x}
                y={paddingTop}
                width={barWidth}
                height={chartHeight}
                fill="transparent"
              />
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(2, barH)}
                rx={4}
                fill={barColor}
                opacity={isHovered ? 1 : 0.85}
              />
              <text
                x={x + barWidth / 2}
                y={height - 12}
                textAnchor="middle"
                className="fill-slate-500 text-[9px] font-medium"
              >
                {labels[idx]}
              </text>
              {isHovered && (
                <g>
                  <rect
                    x={x + barWidth / 2 - 42}
                    y={y - 28}
                    width={84}
                    height={22}
                    rx={6}
                    fill="#0f172a"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 13}
                    textAnchor="middle"
                    className="fill-white text-[9px] font-semibold"
                  >
                    {valueFormatter(val)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
