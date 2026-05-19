import type { ReactNode } from "react";

type AuthFormShellProps = {
  children: ReactNode;
};

export default function AuthFormShell({ children }: AuthFormShellProps) {
  return (
    <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2">
      <div className="mb-8 flex w-full max-w-md justify-center lg:hidden">
        <img src="/logo.png" alt="GadiParts" className="h-10 w-auto" />
      </div>
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
          <div className="h-1 bg-slate-900" />
          <div className="p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}


