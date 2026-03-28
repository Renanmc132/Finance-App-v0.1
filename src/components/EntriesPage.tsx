import { useState } from "preact/hooks";
import { FinanceStore } from "../hooks/useFinance";
import { EmptyState, Panel, SelectInput, TextInput, formatCurrency, formatDate, today } from "./financeUi";

export default function EntriesPage({ finance }: { finance: FinanceStore }) {
  const [form, setForm] = useState({
    description: "",
    amount: "",
    date: today,
    accountId: finance.accounts[0]?.id ?? "",
    type: "salary" as const
  });
  const incomeTypeLabels = finance.preferences.incomeTypeLabels;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Panel eyebrow="Nova entrada" title="Salario, bonus, Pix e sobras">
        <div className="grid gap-3">
          <TextInput
            value={form.description}
            placeholder="Ex.: Salario, bonus, Pix da Maria"
            onInput={(description) => setForm((prev) => ({ ...prev, description }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput
              value={form.amount}
              placeholder="Valor"
              type="number"
              onInput={(amount) => setForm((prev) => ({ ...prev, amount }))}
            />
            <TextInput
              value={form.date}
              placeholder="Data"
              type="date"
              onInput={(date) => setForm((prev) => ({ ...prev, date }))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectInput
              value={form.type}
              onChange={(type) => setForm((prev) => ({ ...prev, type: type as typeof prev.type }))}
            >
              {Object.entries(incomeTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectInput>
            <SelectInput
              value={form.accountId}
              onChange={(accountId) => setForm((prev) => ({ ...prev, accountId }))}
            >
              {finance.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </SelectInput>
          </div>
          <button
            onClick={() => {
              finance.addIncome({
                description: form.description,
                amount: Number(form.amount),
                date: form.date,
                accountId: form.accountId,
                type: form.type
              });
              setForm((prev) => ({ ...prev, description: "", amount: "" }));
            }}
            className="rounded-2xl bg-emerald-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-emerald-300"
          >
            Registrar entrada
          </button>
        </div>
      </Panel>

      <Panel eyebrow="Historico" title="Entradas registradas">
        {finance.incomes.length === 0 ? (
          <EmptyState text="Nenhuma entrada registrada ainda." />
        ) : (
          <div className="space-y-3">
            {finance.incomes.map((income) => (
              <div
                key={income.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div>
                  <p className="font-medium text-slate-900">{income.description}</p>
                  <p className="text-sm text-slate-500">
                    {finance.accounts.find((account) => account.id === income.accountId)?.name} -{" "}
                    {formatDate(income.date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-emerald-600">{formatCurrency(income.amount)}</p>
                  <p className="text-sm text-slate-500">
                    {incomeTypeLabels[income.type]}
                  </p>
                </div>
                <button
                  onClick={() => finance.removeIncome(income.id)}
                  className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
