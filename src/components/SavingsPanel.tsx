import { useState } from "preact/hooks";
import { FinanceStore } from "../hooks/useFinance";
import { EmptyState, Panel, SelectInput, TextInput, formatCurrency, formatDate, today } from "./financeUi";

export default function SavingsPanel({ finance }: { finance: FinanceStore }) {
  const [form, setForm] = useState({
    name: "",
    type: "investment",
    accountId: "",
    createdAt: today,
    hasExistingAmount: false,
    existingAmount: ""
  });
  const [movementForm, setMovementForm] = useState<
    Record<string, { amount: string; accountId: string; date: string }>
  >({});
  const [editingBucketId, setEditingBucketId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const savingsTypeLabels = finance.preferences.savingsTypeLabels;
  const savingsTypeEntries = Object.entries(savingsTypeLabels);

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
            Cadastre o nome do seu investimento ou reserva. Depois voce pode depositar e
            resgatar dinheiro dele sem contar isso como gasto.
          </p>
          <TextInput
            value={form.name}
            placeholder="Ex.: Reserva, Harry Styles, Tesouro"
            onInput={(name) => setForm((prev) => ({ ...prev, name }))}
          />
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.hasExistingAmount}
              onChange={(event: Event) =>
                setForm((prev) => ({
                  ...prev,
                  hasExistingAmount: (event.currentTarget as HTMLInputElement).checked,
                  existingAmount: (event.currentTarget as HTMLInputElement).checked
                    ? prev.existingAmount
                    : ""
                }))
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            <span>Voce ja tem dinheiro investido aqui?</span>
          </label>
          {form.hasExistingAmount ? (
            <TextInput
              value={form.existingAmount}
              placeholder="Quanto ja esta investido"
              type="number"
              onInput={(existingAmount) => setForm((prev) => ({ ...prev, existingAmount }))}
            />
          ) : null}
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <SelectInput
              value={form.type}
              onChange={(type) => setForm((prev) => ({ ...prev, type }))}
            >
              {savingsTypeEntries.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
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
                amount: form.hasExistingAmount ? Number(form.existingAmount || 0) : 0,
                type: form.type,
                accountId: form.accountId || undefined,
                createdAt: form.createdAt
              });
              setForm({
                name: "",
                type: "investment",
                accountId: "",
                createdAt: today,
                hasExistingAmount: false,
                existingAmount: ""
              });
            }}
            className="rounded-2xl bg-emerald-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-emerald-300"
          >
            Adicionar guardado
          </button>
          <p className="text-xs text-slate-400">
            Se marcar que o valor ja estava investido, ele entra no investimento sem descontar do saldo da conta.
          </p>
        </div>

        {finance.savingsBuckets.length === 0 ? (
          <EmptyState text="Nenhum valor guardado registrado ainda." />
        ) : (
          <div className="space-y-3">
            {finance.savingsBuckets.map((bucket) => (
              <div
                key={bucket.id}
                className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
              >
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                  <div className="min-w-0">
                    {editingBucketId === bucket.id ? (
                      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                        <div className="min-w-0">
                          <TextInput
                            value={editingName}
                            placeholder="Novo nome"
                            onInput={setEditingName}
                          />
                        </div>
                        <button
                          onClick={() => {
                            finance.updateSavingsBucket(bucket.id, { name: editingName || bucket.name });
                            setEditingBucketId(null);
                            setEditingName("");
                          }}
                          className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                        >
                          Salvar
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-medium text-slate-900 [overflow-wrap:anywhere]">
                          {bucket.name}
                        </p>
                        <button
                          onClick={() => {
                            setEditingBucketId(bucket.id);
                            setEditingName(bucket.name);
                          }}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          Editar nome
                        </button>
                      </div>
                    )}
                    <p className="text-sm text-slate-500">
                      {savingsTypeLabels[bucket.type] ?? bucket.type}
                      {bucket.accountId
                        ? ` - ${finance.accounts.find((account) => account.id === bucket.accountId)?.name ?? "Banco"}`
                        : ""}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Criado em {formatDate(bucket.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <p className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-900">
                      {formatCurrency(bucket.amount)}
                    </p>
                    <button
                      onClick={() => finance.removeSavingsBucket(bucket.id)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-medium text-slate-700">
                    Depositar no investimento ou resgatar sem contar como gasto
                  </p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <TextInput
                      value={movementForm[bucket.id]?.amount ?? ""}
                      placeholder="Valor"
                      type="number"
                      onInput={(amount) =>
                        setMovementForm((prev) => ({
                          ...prev,
                          [bucket.id]: {
                            amount,
                            accountId: prev[bucket.id]?.accountId ?? bucket.accountId ?? finance.accounts[0]?.id ?? "",
                            date: prev[bucket.id]?.date ?? today
                          }
                        }))
                      }
                    />
                    <SelectInput
                      value={movementForm[bucket.id]?.accountId ?? bucket.accountId ?? finance.accounts[0]?.id ?? ""}
                      onChange={(accountId) =>
                        setMovementForm((prev) => ({
                          ...prev,
                          [bucket.id]: {
                            amount: prev[bucket.id]?.amount ?? "",
                            accountId,
                            date: prev[bucket.id]?.date ?? today
                          }
                        }))
                      }
                    >
                      {finance.accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </SelectInput>
                    <TextInput
                      value={movementForm[bucket.id]?.date ?? today}
                      placeholder="Data"
                      type="date"
                      onInput={(date) =>
                        setMovementForm((prev) => ({
                          ...prev,
                          [bucket.id]: {
                            amount: prev[bucket.id]?.amount ?? "",
                            accountId: prev[bucket.id]?.accountId ?? bucket.accountId ?? finance.accounts[0]?.id ?? "",
                            date
                          }
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        finance.moveSavings({
                          bucketId: bucket.id,
                          accountId: movementForm[bucket.id]?.accountId ?? bucket.accountId ?? "",
                          amount: Number(movementForm[bucket.id]?.amount ?? 0),
                          date: movementForm[bucket.id]?.date ?? today,
                          type: "deposit"
                        })
                      }
                      className="rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-medium text-slate-950"
                    >
                      Investir agora
                    </button>
                    <button
                      onClick={() =>
                        finance.moveSavings({
                          bucketId: bucket.id,
                          accountId: movementForm[bucket.id]?.accountId ?? bucket.accountId ?? "",
                          amount: Number(movementForm[bucket.id]?.amount ?? 0),
                          date: movementForm[bucket.id]?.date ?? today,
                          type: "withdrawal"
                        })
                      }
                      className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800"
                    >
                      Resgatar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}
