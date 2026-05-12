export function InsightCards() {
  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-950">Check-up de qualidade</h3>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            Demo local
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Pontuação visual de saúde do workspace para priorizar validação recomendada.
        </p>
        <div className="mt-4 flex items-end gap-3">
          <p className="text-4xl font-black text-slate-950">82</p>
          <p className="pb-1 text-xs font-bold uppercase tracking-wide text-emerald-700">Muito bom</p>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-950">FrankInDrift Insights</h3>
          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
            UI apenas
          </span>
        </div>
        <ul className="mt-4 grid gap-2 text-sm text-slate-600">
          <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            Potencial de automacao identificado
          </li>
          <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            Riscos potenciais com validacao recomendada
          </li>
          <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            Oportunidade de otimizacao requer confirmacao
          </li>
        </ul>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-950">Execucao de testes</h3>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
            Demo sem ciclos
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Visual de distribuicao operacional sem implementar logica de execucao neste bloco.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Aprovado: 68%</p>
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Falhou: 18%</p>
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Bloqueado: 8%</p>
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Pendente: 6%</p>
        </div>
      </article>
    </section>
  );
}
