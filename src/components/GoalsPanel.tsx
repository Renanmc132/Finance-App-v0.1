import { useState } from "preact/hooks";
import { FinanceStore } from "../hooks/useFinance";
import { EmptyState, Panel, SelectInput, TextInput, formatCurrency, formatDate, today } from "./financeUi";

export default function GoalsPanel({ finance }: { finance: FinanceStore }) {
  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    savedAmount: "",
    deadline: ""
  });
  const [contributionForm, setContributionForm] = useState<Record<string, { amount: string; accountId: string }>>({});
  const [editingContributionId, setEditingContributionId] = useState<string | null>(null);
  const [editingContributionAmount, setEditingContributionAmount] = useState("");

  return (
    <Panel eyebrow="Metas" title="Reserve dinheiro para o que importa">
      <div className="grid gap-5">
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-sm leading-6 text-emerald-800">
            Use esta area para criar uma meta, ajustar manualmente o total guardado e adicionar
            novos aportes quando voce separar dinheiro para ela.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput
            value={form.name}
            placeholder="Ex.: Viagem, notebook, reserva"
            onInput={(name) => setForm((prev) => ({ ...prev, name }))}
          />
          <TextInput
            value={form.deadline}
            placeholder="Prazo"
            type="date"
            onInput={(deadline) => setForm((prev) => ({ ...prev, deadline }))}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput
            value={form.targetAmount}
            placeholder="Meta total"
            type="number"
            onInput={(targetAmount) => setForm((prev) => ({ ...prev, targetAmount }))}
          />
          <TextInput
            value={form.savedAmount}
            placeholder="Quanto ja guardou"
            type="number"
            onInput={(savedAmount) => setForm((prev) => ({ ...prev, savedAmount }))}
          />
        </div>
        <button
          onClick={() => {
            finance.addGoal({
              name: form.name,
              targetAmount: Number(form.targetAmount),
              savedAmount: Number(form.savedAmount || 0),
              deadline: form.deadline || undefined
            });
            setForm({ name: "", targetAmount: "", savedAmount: "", deadline: "" });
          }}
          className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800"
        >
          Criar meta
        </button>

        {finance.goals.length === 0 ? (
          <EmptyState text="Nenhuma meta criada ainda." />
        ) : (
          <div className="space-y-4 pt-2">
            {finance.goals.map((goal) => {
              const progress = Math.min(100, (goal.savedAmount / Math.max(goal.targetAmount, 1)) * 100);
              const contribution = contributionForm[goal.id] ?? {
                amount: "",
                accountId: finance.accounts[0]?.id ?? ""
              };
              const goalHistory = finance.goalContributions
                .filter((item) => item.goalId === goal.id)
                .slice(0, 5);
              return (
                <div
                  key={goal.id}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{goal.name}</p>
                      <p className="text-sm text-slate-500">
                        {goal.deadline ? `Prazo: ${formatDate(goal.deadline)}` : "Sem prazo definido"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">
                        {formatCurrency(goal.savedAmount)} / {formatCurrency(goal.targetAmount)}
                      </p>
                      <p className="text-sm text-slate-500">{progress.toFixed(0)}% concluido</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-700">Adicionar dinheiro na meta</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <TextInput
                        value={contribution.amount}
                        placeholder="Valor do aporte"
                        type="number"
                        onInput={(amount) =>
                          setContributionForm((prev) => ({
                            ...prev,
                            [goal.id]: { ...contribution, amount }
                          }))
                        }
                      />
                      <SelectInput
                        value={contribution.accountId}
                        onChange={(accountId) =>
                          setContributionForm((prev) => ({
                            ...prev,
                            [goal.id]: { ...contribution, accountId }
                          }))
                        }
                      >
                        {finance.accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name}
                          </option>
                        ))}
                      </SelectInput>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          finance.addGoalContribution({
                            goalId: goal.id,
                            accountId: contribution.accountId,
                            amount: Number(contribution.amount),
                            date: today
                          });
                          setContributionForm((prev) => ({
                            ...prev,
                            [goal.id]: { ...contribution, amount: "" }
                          }));
                        }}
                        className="rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-300"
                      >
                        Aportar na meta
                      </button>
                      <button
                        onClick={() => finance.removeGoal(goal.id)}
                        className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700"
                      >
                        Excluir meta
                      </button>
                    </div>
                    {goalHistory.length > 0 ? (
                      <div className="space-y-2 pt-1">
                        {goalHistory.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl bg-white px-3 py-3 text-sm"
                          >
                            {editingContributionId === item.id ? (
                              <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                                <TextInput
                                  value={editingContributionAmount}
                                  placeholder="Novo valor do aporte"
                                  type="number"
                                  onInput={setEditingContributionAmount}
                                />
                                <button
                                  onClick={() => {
                                    finance.updateGoalContribution(
                                      item.id,
                                      Number(editingContributionAmount || 0)
                                    );
                                    setEditingContributionId(null);
                                    setEditingContributionAmount("");
                                  }}
                                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                                >
                                  Atualizar aporte
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingContributionId(null);
                                    setEditingContributionAmount("");
                                  }}
                                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <span className="text-slate-600">
                                    {finance.accounts.find((account) => account.id === item.accountId)?.name ?? "Conta"} - {formatDate(item.date)}
                                  </span>
                                  <p className="mt-1 font-medium text-slate-900">
                                    {formatCurrency(item.amount)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingContributionId(item.id);
                                      setEditingContributionAmount(String(item.amount));
                                    }}
                                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                                    aria-label="Editar aporte"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => finance.removeGoalContribution(item.id)}
                                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"
                                  >
                                    Excluir
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Panel>
  );
}