import { useState } from "preact/hooks";
import { FinanceStore } from "../hooks/useFinance";
import { EmptyState, Panel, SelectInput, TextInput, formatCurrency, formatDate, today } from "./financeUi";

export default function ExpensesPage({ finance }: { finance: FinanceStore }) {
  const [form, setForm] = useState({
    description: "",
    amount: "",
    date: today,
    accountId: finance.accounts[0]?.id ?? "",
    categoryId: finance.categories[0]?.id ?? "",
    type: "expense" as const,
    status: "paid" as const,
    paymentMethod: "pix" as const
  });

  const paymentMethodLabels = finance.preferences.paymentMethodLabels;
  const expenseTypeLabels = finance.preferences.expenseTypeLabels;
  const expenseStatusLabels = finance.preferences.expenseStatusLabels;

  const accountName = (accountId: string) =>
    finance.accounts.find((account) => account.id === accountId)?.name ?? "Conta removida";
  const categoryName = (categoryId: string) =>
    finance.categories.find((category) => category.id === categoryId)?.name ?? "Sem categoria";

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Panel eyebrow="Novo gasto" title="Registre uma saida de dinheiro">
        <div className="grid gap-3">
          <p className="text-sm leading-6 text-slate-600">
            Preencha: o nome do gasto, o valor, a data, de qual banco saiu, a categoria,
            se ele e um gasto unico ou fixo, se ja foi pago e por qual metodo voce pagou.
            Se foi compra no cartao de credito, lance na area de fatura logo abaixo.
          </p>
          <TextInput
            value={form.description}
            placeholder="Nome do gasto. Ex.: Mercado, aluguel, internet"
            onInput={(description) => setForm((prev) => ({ ...prev, description }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput
              value={form.amount}
              placeholder="Valor total do gasto"
              type="number"
              onInput={(amount) => setForm((prev) => ({ ...prev, amount }))}
            />
            <TextInput
              value={form.date}
              placeholder="Data em que o gasto aconteceu"
              type="date"
              onInput={(date) => setForm((prev) => ({ ...prev, date }))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectInput
              value={form.accountId}
              onChange={(accountId) => setForm((prev) => ({ ...prev, accountId }))}
            >
              <option value="">De qual banco saiu?</option>
              {finance.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </SelectInput>
            <SelectInput
              value={form.categoryId}
              onChange={(categoryId) => setForm((prev) => ({ ...prev, categoryId }))}
            >
              <option value="">Escolha a categoria</option>
              {finance.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </SelectInput>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectInput
              value={form.type}
              onChange={(type) => setForm((prev) => ({ ...prev, type: type as typeof prev.type }))}
            >
              <option value="expense">{expenseTypeLabels.expense} - gasto que acontece sem frequencia fixa</option>
              <option value="fixed">{expenseTypeLabels.fixed} - gasto recorrente, como internet ou aluguel</option>
            </SelectInput>
            <SelectInput
              value={form.status}
              onChange={(status) => setForm((prev) => ({ ...prev, status: status as typeof prev.status }))}
            >
              <option value="paid">{expenseStatusLabels.paid} - o dinheiro ja saiu da conta</option>
              <option value="pending">{expenseStatusLabels.pending} - ainda falta pagar</option>
            </SelectInput>
          </div>
          <SelectInput
            value={form.paymentMethod}
            onChange={(paymentMethod) =>
              setForm((prev) => ({
                ...prev,
                paymentMethod: paymentMethod as typeof prev.paymentMethod
              }))
            }
          >
            {Object.entries(paymentMethodLabels)
              .filter(([value]) => value !== "credit")
              .map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectInput>
          <button
            onClick={() => {
              finance.addExpense({
                description: form.description,
                amount: Number(form.amount),
                date: form.date,
                accountId: form.accountId,
                categoryId: form.categoryId,
                type: form.type,
                status: form.status,
                paymentMethod: form.paymentMethod,
                paidAt: form.status === "paid" ? form.date : undefined
              });
              setForm((prev) => ({ ...prev, description: "", amount: "" }));
            }}
            className="rounded-2xl bg-rose-300 px-5 py-3 font-medium text-slate-950 transition hover:bg-rose-200"
          >
            Registrar gasto
          </button>
        </div>
      </Panel>

      <Panel eyebrow="Lista de gastos" title="Pendentes e pagos">
        {finance.expenses.length === 0 ? (
          <EmptyState text="Nenhum gasto registrado ainda." />
        ) : (
          <div className="space-y-3">
            {finance.expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">{expense.description}</p>
                  <p className="text-sm text-slate-500">
                    {categoryName(expense.categoryId)} - {accountName(expense.accountId)} -{" "}
                    {formatDate(expense.date)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Saida por {paymentMethodLabels[expense.paymentMethod]}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-medium text-rose-600">{formatCurrency(expense.amount)}</p>
                    <p className="text-sm text-slate-500">
                      {expense.status === "paid"
                        ? `Pago em ${formatDate(expense.paidAt)}`
                        : "Pendente"}
                    </p>
                  </div>
                  {expense.status === "pending" && (
                    <button
                      onClick={() => finance.markExpenseAsPaid(expense.id, today)}
                      className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Marcar pago
                    </button>
                  )}
                  <button
                    onClick={() => finance.removeExpense(expense.id)}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}