const quickActions = [
  "Novo cenario de teste",
  "Novo caso de teste",
  "Importar requisitos",
  "Gerar com IA",
  "Relatorios",
  "FrankInDrift Check-up",
];

export function QuickActions() {
  return (
    <section className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">Acoes rapidas</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Atalhos operacionais do workspace</h2>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
          MVP local
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => (
          <button
            key={action}
            type="button"
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50"
          >
            {action}
          </button>
        ))}
      </div>
    </section>
  );
}
