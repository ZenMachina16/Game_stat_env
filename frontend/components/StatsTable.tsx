type Props = {
  title: string;
  headers: string[];
  rows: Array<Array<string | number>>;
};

export default function StatsTable({ title, headers, rows }: Props) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-brand-copper/15 bg-white/80 shadow-panel dark:bg-white/5">
      <div className="border-b border-brand-copper/15 px-5 py-4">
        <h3 className="font-display text-xl font-bold text-brand-night dark:text-white">{title}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-brand-night text-xs uppercase tracking-[0.18em] text-white dark:bg-brand-gold dark:text-brand-ink">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`${title}-${index}`}
                className="border-t border-brand-copper/10 text-sm text-slate-700 odd:bg-brand-sand/35 dark:text-slate-200 dark:odd:bg-white/[0.03]"
              >
                {row.map((cell, cellIndex) => (
                  <td key={`${title}-${index}-${cellIndex}`} className="px-4 py-3">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
