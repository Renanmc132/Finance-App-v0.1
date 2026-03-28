import { useState } from "preact/hooks";
import { FinanceStore } from "../hooks/useFinance";
import { EmptyState, Panel, SelectInput, TextInput, formatCurrency, formatDate, today } from "./financeUi";

const bucketLabels = {
  investment: "Investimento",
  reserve: "Reserva",
  other: "Outro"
} as const;

export default function SavingsPanel({ finance }: { finance: FinanceStore }) {
  const [form, setForm] = useState({
    name: "",
    amount: "",
    type: "investment" as const,
    accountId: "",
    createdAt: today
  });

  const totalSaved = finance.savingsBuckets.reduce((sum, bucket) => sum + bucket.amount, 0);

  return (
    <Panel eyebrow="Guardado" title="Reserva e investimento">
      <div className="space-y-4">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">Total guardado</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {formatCurrency(totalSaved)}
          </p>
        </div>

        <div className="grid gap-3">
          <p className="text-sm leading-6 text-slate-600">
            Coloque a data em que esse valor foi guardado. Assim a analise anual entende em
            qual mes esse investimento ou reserva entrou.
          </p>
          <TextInput
            value={form.name}
            placeholder="Ex.: Reserva, Harry Styles, Tesouro"
            onInput={(name) => setForm((prev) => ({ ...prev, name }))}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput
              value={form.amount}
              placeholder="Valor guardado"
              type="number"
              onInput={(amount) => setForm((prev) => ({ ...prev, amount }))}
            />
            <SelectInput
              value={form.type}
              onChange={(type) => setForm((prev) => ({ ...prev, type: type as typeof prev.type }))}
            >
              <option value="investment">Investimento</option>
              <option value="reserve">Reserva</option>
              <option value="other">Outro</option>
            </SelectInput>
          </div>
          <TextInput
            value={form.createdAt}
            placeholder="Data em que voce guardou esse valor"
            type="date"
            onInput={(createdAt) => setForm((prev) => ({ ...prev, createdAt }))}
          />
          <SelectInput
            value={form.accountId}
            onChange={(accountId) => setForm((prev) => ({ ...prev, accountId }))}
          >
            <option value="">Sem banco vinculado</option>
            {finance.accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </SelectInput>
          <button
            onClick={() => {
              finance.addSavingsBucket({
                name: form.name,
                amount: Number(form.amount || 0),
                type: form.type,
                accountId: form.accountId || undefined,
                createdAt: form.createdAt
              });
              setForm({ name: "", amount: "", type: "investment", accountId: "", createdAt: today });
            }}
            className="rounded-2xl bg-emerald-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-emerald-300"
          >
            Adicionar guardado
          </button>
        </div>

        {finance.savingsBuckets.length === 0 ? (
          <EmptyState text="Nenhum valor guardado registrado ainda." />
        ) : (
          <div className="space-y-3">
            {finance.savingsBuckets.map((bucket) => (
              <div
                key={bucket.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div>
                  <p className="font-medium text-slate-900">{bucket.name}</p>
                  <p className="text-sm text-slate-500">
                    {bucketLabels[bucket.type]}
                    {bucket.accountId
                      ? ` - ${finance.accounts.find((account) => account.id === bucket.accountId)?.name ?? "Banco"}`
                      : ""}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Guardado em {formatDate(bucket.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-semibold text-slate-900">
                    {formatCurrency(bucket.amount)}
                  </p>
                  <button
                    onClick={() => finance.removeSavingsBucket(bucket.id)}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}