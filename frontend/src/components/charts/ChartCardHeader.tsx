import type { ComponentType, SVGProps } from "react";

type ChartIcon = ComponentType<SVGProps<SVGSVGElement>>;

type ChartCardHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: ChartIcon;
  iconClassName?: string;
};

export default function ChartCardHeader({
  title,
  subtitle,
  icon: Icon,
  iconClassName = "text-slate-600 bg-slate-50 ring-slate-500/20",
}: ChartCardHeaderProps) {
  return (
    <div className="mb-4 flex items-start gap-3">
      {Icon && (
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${iconClassName}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0">
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}
