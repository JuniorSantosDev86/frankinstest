type TraceabilityNode = {
  label: string;
  value: string;
  detail?: string;
};

type TraceabilityFlowProps = {
  nodes: TraceabilityNode[];
};

export function TraceabilityFlow({ nodes }: TraceabilityFlowProps) {
  return (
    <section className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 md:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">Rastreabilidade</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Projeto para caso de teste
          </h2>
        </div>
        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
          Fluxo local MVP
        </span>
      </div>

      <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
        {nodes.map((node, index) => (
          <div key={`${node.label}-${index}`} className="flex items-center gap-3">
            <article className="min-w-44 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{node.label}</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{node.value}</p>
              {node.detail ? <p className="mt-1 text-xs text-slate-500">{node.detail}</p> : null}
            </article>
            {index < nodes.length - 1 ? (
              <span className="text-slate-400" aria-hidden>
                &rarr;
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
