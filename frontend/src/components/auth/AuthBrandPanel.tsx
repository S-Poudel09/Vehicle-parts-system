type AuthBrandPanelProps = {
  title: string;
  titleAccent: string;
  description: string;
};

export default function AuthBrandPanel({
  title,
  titleAccent,
  description,
}: AuthBrandPanelProps) {
  return (
    <div className="relative hidden w-1/2 overflow-hidden bg-slate-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 80%, #64748b 0%, transparent 50%), radial-gradient(circle at 80% 20%, #475569 0%, transparent 40%)",
        }}
      />
      <div className="relative z-10">
        <img
          src="/logo.png"
          alt="GadiParts"
          className="h-12 w-auto brightness-0 invert"
        />
      </div>
      <div className="relative z-10">
        <h2 className="text-3xl font-bold leading-tight tracking-tight text-white">
          {title}
          <br />
          <span className="text-slate-400">{titleAccent}</span>
        </h2>
        <p className="mt-4 max-w-sm text-slate-400">{description}</p>
      </div>
      <p className="relative z-10 text-sm text-slate-500">
        © GadiParts Vehicle Services
      </p>
    </div>
  );
}
