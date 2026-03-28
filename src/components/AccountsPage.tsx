import { useState } from "preact/hooks";
import { FinanceStore } from "../hooks/useFinance";
import { Panel, TextInput, formatCurrency } from "./financeUi";

export default function AccountsPage({ finance }: { finance: FinanceStore }) {
  const [accountForm, setAccountForm] = useState({
    name: "",
    initialBalance: ""
  });
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    color: "#38bdf8"
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Panel eyebrow="Bancos" title="Saldo atual por banco">
          <div className="space-y-3">
            {finance.accounts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                Nenhum banco cadastrado ainda.
              </div>
            ) : (
              finance.accounts.map((account) => {
                const relatedSavings = finance.savingsBuckets.filter(
                  (bucket) => bucket.accountId === account.id
                );
                const savedAmount = relatedSavings.reduce((sum, bucket) => sum + bucket.amount, 0);

                return (
                  <details
                    key={account.id}
                    className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                  >
                    <summary className="grid cursor-pointer list-none gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                      <div className="min-w-0">
                        <p className="text-lg font-medium text-slate-900 [overflow-wrap:anywhere]">
                          {account.name}
                        </p>
                        <p className="text-sm text-slate-500">Clique para ver detalhes</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        <p className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-emerald-600">
                          {formatCurrency(account.balance)}
                        </p>
                        <button
                          onClick={(event) => {
                            event.preventDefault();
                            finance.removeAccount(account.id);
                          }}
                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
                        >
                          Excluir
                        </button>
                      </div>
                    </summary>
                    <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-slate-500">Saldo da conta</span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(account.balance)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-slate-500">Guardado vinculado</span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(savedAmount)}
                        </span>
                      </div>
                      {relatedSavings.length > 0 ? (
                        <div className="space-y-2">
                          {relatedSavings.map((bucket) => (
                            <div
                              key={bucket.id}
                              className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm"
                            >
                              <span className="text-slate-600">{bucket.name}</span>
                              <span className="font-medium text-slate-900">
                                {formatCurrency(bucket.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          Nenhum guardado vinculado a este banco.
                        </p>
                      )}
                    </div>
                  </details>
                );
              })
            )}
          </div>
        </Panel>

        <Panel eyebrow="Novo banco" title="Adicione os bancos que voce quer acompanhar">
          <div className="grid gap-3">
            <p className="text-sm leading-6 text-slate-600">
              Crie os bancos em uma faixa compacta: nome, saldo inicial e acao no mesmo bloco.
            </p>
            <TextInput
              value={accountForm.name}
              placeholder="Ex.: Inter, Nubank, Itau"
              maxLength={32}
              onInput={(name) => setAccountForm((prev) => ({ ...prev, name }))}
            />
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
              <TextInput
                value={accountForm.initialBalance}
                placeholder="Saldo inicial"
                type="number"
                onInput={(initialBalance) =>
                  setAccountForm((prev) => ({ ...prev, initialBalance }))
                }
              />
              <button
                onClick={() => {
                  finance.addAccount({
                    name: accountForm.name,
                    type: "account",
                    initialBalance: Number(accountForm.initialBalance || 0)
                  });
                  setAccountForm({ name: "", initialBalance: "" });
                }}
                className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800"
              >
                Adicionar banco
              </button>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <Panel eyebrow="Nova categoria" title="Personalize como voce organiza seus gastos">
          <div className="grid gap-3">
            <TextInput
              value={categoryForm.name}
              placeholder="Ex.: Saude, pets, estudos"
              maxLength={32}
              onInput={(name) => setCategoryForm((prev) => ({ ...prev, name }))}
            />
            <div className="grid gap-3 sm:grid-cols-[96px_minmax(0,1fr)]">
              <input
                type="color"
                value={categoryForm.color}
                onInput={(event: Event) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    color: (event.currentTarget as HTMLInputElement).value
                  }))
                }
                className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-2"
              />
              <button
                onClick={() => {
                  finance.addCategory(categoryForm.name, categoryForm.color);
                  setCategoryForm((prev) => ({ ...prev, name: "" }));
                }}
                className="rounded-2xl bg-sky-300 px-5 py-3 font-medium text-slate-950 transition hover:bg-sky-200"
              >
                Criar categoria
              </button>
            </div>
            <p className="text-xs text-slate-400">Maximo de 32 caracteres por categoria.</p>
          </div>
        </Panel>
      </div>

      <Panel eyebrow="Categorias" title="Como seus gastos aparecem no dashboard">
        <div className="grid gap-3 md:grid-cols-2">
          {finance.categories.map((category) => (
            <div
              key={category.id}
              className="flex min-h-[72px] items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <p className="text-base font-medium text-slate-900 [overflow-wrap:anywhere]">
                  {category.name}
                </p>
              </div>
              <button
                onClick={() => finance.removeCategory(category.id)}
                className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
              >
                Excluir
              </button>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-400">
          As categorias agora ficam em uma area mais larga para nao espremer nomes grandes.
        </p>
      </Panel>
    </div>
  );
}
