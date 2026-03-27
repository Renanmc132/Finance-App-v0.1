import { useState } from "preact/hooks";
import { FinanceStore } from "../hooks/useFinance";
import { EmptyState, Panel, SelectInput, TextInput, formatCurrency, today } from "./financeUi";

export default function InstallmentsPage({ finance }: { finance: FinanceStore }) {
  const [form, setForm] = useState({
    title: "",
    totalInstallments: "",
    installmentAmount: "",
    dueDay: "10",
    startDate: today,
    accountId: finance.accounts[0]?.id ?? "",
    categoryId: finance.categories[0]?.id ?? "",
    paymentMethod: "credit" as const
  });

  const paymentMethodLabels = finance.preferences.paymentMethodLabels;

  const accountName = (accountId: string) =>
    finance.accounts.find((account) => account.id === accountId)?.name ?? "Conta removida";
  const categoryName = (categoryId: string) =>
    finance.categories.find((category) => category.id === categoryId)?.name ?? "Sem categoria";

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Panel eyebrow="Nova compra parcelada" title="Controle cada parcela sem perder o fio">
        <div className="grid gap-3">
          <p className="text-sm leading-6 text-slate-600">
            Aqui voce registra uma compra parcelada inteira: nome, quantidade de parcelas,
            valor de cada uma, banco, categoria, dia de vencimento e como ela foi paga.
          </p>
          <TextInput
            value={form.title}
            placeholder="Nome da compra parcelada. Ex.: Celular, curso, sofa"
            onInput={(title) => setForm((prev) => ({ ...prev, title }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput
              value={form.totalInstallments}
              placeholder="Quantas parcelas existem no total"
              type="number"
              onInput={(totalInstallments) => setForm((prev) => ({ ...prev, totalInstallments }))}
            />
            <TextInput
              value={form.installmentAmount}
              placeholder="Valor de cada parcela"
              type="number"
              onInput={(installmentAmount) => setForm((prev) => ({ ...prev, installmentAmount }))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <TextInput
              value={form.dueDay}
              placeholder="Dia em que costuma vencer"
              type="number"
              onInput={(dueDay) => setForm((prev) => ({ ...prev, dueDay }))}
            />
            <TextInput
              value={form.startDate}
              placeholder="Data da primeira parcela"
              type="date"
              onInput={(startDate) => setForm((prev) => ({ ...prev, startDate }))}
            />
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
          <SelectInput
            value={form.categoryId}
            onChange={(categoryId) => setForm((prev) => ({ ...prev, categoryId }))}
          >
            {finance.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectInput>
          <SelectInput
            value={form.paymentMethod}
            onChange={(paymentMethod) =>
              setForm((prev) => ({
                ...prev,
                paymentMethod: paymentMethod as typeof prev.paymentMethod
              }))
            }
          >
            {Object.entries(paymentMethodLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectInput>
          <button
            onClick={() => {
              finance.addInstallmentPlan({
                title: form.title,
                totalInstallments: Number(form.totalInstallments),
                installmentAmount: Number(form.installmentAmount),
                dueDay: Number(form.dueDay),
                startDate: form.startDate,
                accountId: form.accountId,
                categoryId: form.categoryId,
                paymentMethod: form.paymentMethod
              });
              setForm((prev) => ({
                ...prev,
                title: "",
                totalInstallments: "",
                installmentAmount: ""
              }));
            }}
            className="rounded-2xl bg-amber-300 px-5 py-3 font-medium text-slate-950 transition hover:bg-amber-200"
          >
            Criar plano parcelado
          </button>
        </div>
      </Panel>

      <Panel eyebrow="Parcelas abertas" title="Marque cada parcela quando pagar">
        {finance.installmentPlans.length === 0 ? (
          <EmptyState text="Nenhum plano parcelado criado ainda." />
        ) : (
          <div className="space-y-3">
            {finance.installmentPlans.map((plan) => {
              const progress = (plan.paidInstallments / plan.totalInstallments) * 100;
              const nextInstallment = Math.min(plan.paidInstallments + 1, plan.totalInstallments);
              const finished = plan.paidInstallments >= plan.totalInstallments;

              return (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{plan.title}</p>
                      <p className="text-sm text-slate-500">
                        {categoryName(plan.categoryId)} - {accountName(plan.accountId)} - vence dia {plan.dueDay}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">
                        {nextInstallment}/{plan.totalInstallments}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatCurrency(plan.installmentAmount)} por parcela
                      </p>
                      <p className="text-sm text-slate-500">
                        Via {paymentMethodLabels[plan.paymentMethod]}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-amber-300" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      {finished
                        ? "Todas as parcelas foram pagas."
                        : `${plan.totalInstallments - plan.paidInstallments} parcela(s) restantes.`}
                    </p>
                    <button
                      onClick={() => finance.payInstallment(plan.id, today)}
                      disabled={finished}
                      className="rounded-full bg-amber-300 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                    >
                      {finished ? "Finalizado" : "Marcar parcela paga"}
                    </button>
                    <button
                      onClick={() => finance.removeInstallmentPlan(plan.id)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
