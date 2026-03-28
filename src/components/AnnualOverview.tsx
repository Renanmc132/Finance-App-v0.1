import { useState } from "preact/hooks";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FinanceStore } from "../hooks/useFinance";
import { Panel, formatCurrency } from "./financeUi";

const monthLabels = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];

function sumForMonth(
  values: Array<{ date?: string; paidAt?: string; amount: number; status?: string }>,
  year: number,
  month: number,
  mode: "income" | "expense"
) {
  return values
    .filter((item) => {
      const rawDate = mode === "expense" ? item.paidAt ?? item.date : item.date;
      if (!rawDate) return false;
      const parsed = new Date(`${rawDate}T12:00:00`);
      if (mode === "expense" && item.status !== "paid") return false;
      return parsed.getFullYear() === year && parsed.getMonth() === month;
    })
    .reduce((sum, item) => sum + item.amount, 0);
}

export default function AnnualOverview({
  finance,
  selectedYear
}: {
  finance: FinanceStore;
  selectedYear: number;
}) {
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");
  const rows = monthLabels.map((month, index) => {
    const income = sumForMonth(finance.incomes, selectedYear, index, "income");
    const expenses = sumForMonth(finance.expenses, selectedYear, index, "expense");
    const creditExpenses = finance.creditCardCharges
      .filter((item) => {
        if (item.invoiceStatus !== "paid" || !item.invoicePaidAt) return false;
        const parsed = new Date(`${item.invoicePaidAt}T12:00:00`);
        return parsed.getFullYear() === selectedYear && parsed.getMonth() === index;
      })
      .reduce((sum, item) => sum + item.amount, 0);
    const saved = finance.savingsBuckets
      .filter((bucket) => {
        const parsed = new Date(`${bucket.createdAt}T12:00:00`);
        return parsed.getFullYear() === selectedYear && parsed.getMonth() === index;
      })
      .reduce((sum, bucket) => sum + bucket.amount, 0);
    return {
      month,
      saldoFinal: income - expenses - creditExpenses,
      guardado: saved,
      gastos: expenses + creditExpenses
    };
  });

  const totalSaldo = rows.reduce((sum, row) => sum + row.saldoFinal, 0);
  const totalGuardado = rows.reduce((sum, row) => sum + row.guardado, 0);
  const totalGastos = rows.reduce((sum, row) => sum + row.gastos, 0);

  const TableBlock = ({
    title,
    valueKey
  }: {
    title: string;
    valueKey: "saldoFinal" | "guardado" | "gastos";
  }) => (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="rounded-xl bg-amber-700 px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white">
        {title}
      </h3>
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-amber-50 text-slate-700">
            <tr>
              <th className="border-b border-slate-200 px-3 py-2 text-left">Mes</th>
              <th className="border-b border-slate-200 px-3 py-2 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${title}-${row.month}`} className="bg-white">
                <td className="border-b border-slate-100 px-3 py-2 text-slate-700">{row.month}</td>
                <td className="border-b border-slate-100 px-3 py-2 text-right font-medium text-slate-900">
                  {formatCurrency(row[valueKey])}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50">
            <tr>
              <td className="px-3 py-2 font-semibold text-slate-700">Total</td>
              <td className="px-3 py-2 text-right font-semibold text-slate-900">
                {formatCurrency(
                  valueKey === "saldoFinal"
                    ? totalSaldo
                    : valueKey === "guardado"
                      ? totalGuardado
                      : totalGastos
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Analise geral</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">
          Visao anual de {selectedYear}
        </h2>
        <div className="mt-4 inline-flex gap-2 rounded-2xl bg-slate-100 p-1">
          <button
            onClick={() => setViewMode("table")}
            className={
              viewMode === "table"
                ? "rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm"
                : "rounded-xl px-4 py-2 text-sm text-slate-500"
            }
          >
            Tabela
          </button>
          <button
            onClick={() => setViewMode("chart")}
            className={
              viewMode === "chart"
                ? "rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm"
                : "rounded-xl px-4 py-2 text-sm text-slate-500"
            }
          >
            Grafico
          </button>
        </div>
      </div>
      {viewMode === "table" ? (
        <div className="grid gap-6 xl:grid-cols-3">
          <TableBlock title="Saldo final" valueKey="saldoFinal" />
          <TableBlock title="Guardado / investimento" valueKey="guardado" />
          <TableBlock title="Gastos" valueKey="gastos" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-3">
          <Panel eyebrow="Saldo final" title="Comportamento do saldo">
            <div className="h-[320px] rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" tickFormatter={(value) => String(value).slice(0, 3)} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                  <Bar dataKey="saldoFinal" fill="#60a5fa" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel eyebrow="Guardado" title="Evolucao do guardado">
            <div className="h-[320px] rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" tickFormatter={(value) => String(value).slice(0, 3)} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                  <Bar dataKey="guardado" fill="#34d399" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel eyebrow="Gastos" title="Gastos pagos no ano">
            <div className="h-[320px] rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" tickFormatter={(value) => String(value).slice(0, 3)} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                  <Bar dataKey="gastos" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      )}
      <Panel eyebrow="Leitura rapida" title="Como interpretar essa analise">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Saldo acumulado no ano</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatCurrency(totalSaldo)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Guardado total</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatCurrency(totalGuardado)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Gastos pagos no ano</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatCurrency(totalGastos)}
            </p>
          </div>
        </div>
      </Panel>
    </section>
  );
}