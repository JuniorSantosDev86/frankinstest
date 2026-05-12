type MetricCardProps = {
  title: string;
  value: string;
  trend: string;
  tone: "teal" | "blue" | "violet" | "orange" | "red";
};

const toneStyles: Record<MetricCardProps["tone"], string> = {
  teal: "from-teal-500 to-emerald-400",
  blue: "from-sky-500 to-blue-500",
  violet: "from-violet-500 to-indigo-500",
  orange: "from-amber-500 to-orange-500",
  red: "from-rose-500 to-red-500",
};

const toneText: Record<MetricCardProps["tone"], string> = {
  teal: "text-teal-700",
  blue: "text-blue-700",
  violet: "text-violet-700",
  orange: "text-orange-700",
  red: "text-rose-700",
};

export function MetricCard({ title, value, trend, tone }: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <div className={`h-1.5 w-20 rounded-full bg-gradient-to-r ${toneStyles[tone]}`} />
      <p className="mt-5 text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-1 text-4xl font-black tracking-tight text-slate-950">{value}</p>
      <p className={`mt-2 text-xs font-bold uppercase tracking-wide ${toneText[tone]}`}>
        {trend}
      </p>
    </article>
  );
}
