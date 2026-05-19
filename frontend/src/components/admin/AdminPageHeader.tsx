import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export default function AdminPageHeader({
  title,
  description,
  action,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-1.5 text-slate-500">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
