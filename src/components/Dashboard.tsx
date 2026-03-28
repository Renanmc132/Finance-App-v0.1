import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { FinanceStore } from "../hooks/useFinance";
import { EmptyState, Panel, formatCurrency, formatDate } from "./financeUi";

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

type PeriodProps = {
  selectedMonth: number;
  selectedYear: number;
};

type DashboardProps = {
  finance: FinanceStore;
} & PeriodProps;

function isInPeriod(date: string, selectedMonth: number, selectedYear: number) {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.getMonth() === selectedMonth && parsed.getFullYear() === selectedYear;
}

function HighlightCards({ finance, selectedMonth, selectedYear }: DashboardProps) {
  const currentMonthIncomes = finance.incomes.filter((item) =>
    isInPeriod(item.date, selectedMonth, selectedYear)
  );
  const paidCurrentMonthExpenses = finance.expenses.filter(
    (item) =>
      item.status === "paid" &&
      isInPeriod(item.paidAt ?? item.date, selectedMonth, selectedYear)
  );
  const pendingAmount = finance.expenses
    .filter((item) => item.status === "pending")
    .reduce((sum, item) => sum + item.amount, 0);
  const pendingCreditAmount = finance.creditCardCharges
    .filter((item) => item.paidInstallments < item.installments)
    .reduce((sum, item) => sum + item.amount / Math.max(item.installments, 1), 0);
  const paidCurrentMonthCreditPayments = finance.creditCardPayments.filter((item) =>
    isInPeriod(item.paidAt, selectedMonth, selectedYear)
  );
  const totalBalance = finance.accounts.reduce((sum, account) => sum + account.balance, 0);
  const incomeThisMonth = currentMonthIncomes.reduce((sum, item) => sum + item.amount, 0);
  const expenseThisMonth =
    paidCurrentMonthExpenses.reduce((sum, item) => sum + item.amount, 0) +
    paidCurrentMonthCreditPayments.reduce((sum, item) => sum + item.amount, 0);

  const cards = [
    {
      label: "Saldo em conta corrente",
      value: formatCurrency(totalBalance),
      tone: "border-emerald-100 bg-emerald-50",
      details: finance.accounts
    },
    {
      label: "Resultado do mes",
      value: formatCurrency(incomeThisMonth - expenseThisMonth),
      tone: "border-sky-100 bg-sky-50"
    },
    {
      label: "Entradas do mes",
      value: formatCurrency(incomeThisMonth),
      tone: "border-cyan-100 bg-cyan-50"
    },
    {
      label: "Pendencias",
      value: formatCurrency(pendingAmount + pendingCreditAmount),
      tone: "border-amber-100 bg-amber-50"
    }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((card) =>
        card.details ? (
          <details key={card.label} className={`rounded-3xl border p-5 ${card.tone}`}>
            <summary className="cursor-pointer list-none">
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                Clique para ver por banco
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
            </summary>
            <div className="mt-4 space-y-2 border-t border-emerald-100 pt-4">
              {card.details.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum banco cadastrado ainda.</p>
              ) : (
                card.details.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3"
                  >
                    <span className="text-sm text-slate-600">{account.name}</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(account.balance)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </details>
        ) : (
          <div key={card.label} className={`rounded-3xl border p-5 ${card.tone}`}>
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
              {monthLabels[selectedMonth]} {selectedYear}
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
          </div>
        )
      )}
    </div>
  );
}

function DashboardPage({ finance, selectedMonth, selectedYear }: DashboardProps) {
  const paidCurrentMonthExpenses = finance.expenses.filter(
    (item) =>
      item.status === "paid" &&
      isInPeriod(item.paidAt ?? item.date, selectedMonth, selectedYear)
  );
  const paidCurrentMonthCreditPayments = finance.creditCardPayments.filter((item) =>
    isInPeriod(item.paidAt, selectedMonth, selectedYear)
  );
  const currentMonthIncomes = finance.incomes.filter((item) =>
    isInPeriod(item.date, selectedMonth, selectedYear)
  );
  const categoryTotals = finance.categories
    .map((category) => ({
      ...category,
      total:
        paidCurrentMonthExpenses
          .filter((expense) => expense.categoryId === category.id)
          .reduce((sum, expense) => sum + expense.amount, 0) +
        paidCurrentMonthCreditPayments
          .filter((expense) => expense.categoryId === category.id)
          .reduce((sum, expense) => sum + expense.amount, 0)
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);
  const expenseThisMonth =
    paidCurrentMonthExpenses.reduce((sum, item) => sum + item.amount, 0) +
    paidCurrentMonthCreditPayments.reduce((sum, item) => sum + item.amount, 0);
  const incomeThisMonth = currentMonthIncomes.reduce((sum, item) => sum + item.amount, 0);
  const annualSummary = monthLabels.map((label, index) => {
    const monthIncome = finance.incomes
      .filter((item) => isInPeriod(item.date, index, selectedYear))
      .reduce((sum, item) => sum + item.amount, 0);
    const monthExpense = finance.expenses
      .filter((item) => item.status === "paid" && isInPeriod(item.paidAt ?? item.date, index, selectedYear))
      .reduce((sum, item) => sum + item.amount, 0);
    const monthCreditExpense = finance.creditCardPayments
      .filter((item) => isInPeriod(item.paidAt, index, selectedYear))
      .reduce((sum, item) => sum + item.amount, 0);
    return {
      month: label.slice(0, 3),
      entradas: monthIncome,
      gastos: monthExpense + monthCreditExpense,
      saldo: monthIncome - monthExpense - monthCreditExpense
    };
  });
  const recentActivity = [
    ...finance.incomes,
    ...finance.expenses,
    ...finance.creditCardPayments
  ]
    .sort((a, b) => {
      const dateA =
        "installmentNumber" in a ? a.paidAt : "paidAt" in a ? a.paidAt ?? a.date : a.date;
      const dateB =
        "installmentNumber" in b ? b.paidAt : "paidAt" in b ? b.paidAt ?? b.date : b.date;
      return dateB.localeCompare(dateA);
    })
    .slice(0, 8);

  const accountName = (accountId: string) =>
    finance.accounts.find((account) => account.id === accountId)?.name ?? "Conta removida";
  const categoryName = (categoryId: string) =>
    finance.categories.find((category) => category.id === categoryId)?.name ?? "Sem categoria";
  const paymentMethodLabels = finance.preferences.paymentMethodLabels;

  return (
    <div className="space-y-6">
      <Panel eyebrow="Periodo" title="Filtre seus resultados por mes e ano">
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mes atual</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {monthLabels[selectedMonth]}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Ano</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{selectedYear}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Saldo do periodo</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {formatCurrency(incomeThisMonth - expenseThisMonth)}
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel eyebrow="Resumo do mes" title="Para onde seu dinheiro esta indo">
          {categoryTotals.length === 0 ? (
            <EmptyState text="Ainda nao ha gastos pagos neste mes para comparar por categoria." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="h-[280px] rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryTotals}
                      dataKey="total"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={100}
                      paddingAngle={3}
                    >
                      {categoryTotals.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value ?? 0))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {categoryTotals.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <p className="font-medium text-slate-900">{category.name}</p>
                      </div>
                      <p className="text-sm font-medium text-slate-700">
                        {formatCurrency(category.total)}
                      </p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (category.total / Math.max(expenseThisMonth, 1)) * 100)}%`,
                          backgroundColor: category.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel eyebrow="Analise anual" title={`Como ${selectedYear} esta se comportando`}>
          <div className="h-[320px] rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annualSummary}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Bar dataKey="entradas" fill="#34d399" radius={[6, 6, 0, 0]} />
                <Bar dataKey="gastos" fill="#fda4af" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel eyebrow="Resumo rapido" title="Leitura geral do periodo">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Entradas no periodo</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCurrency(incomeThisMonth)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Gastos pagos no periodo</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCurrency(expenseThisMonth)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Contas cadastradas</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {finance.accounts.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Categorias usadas</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {categoryTotals.length}
              </p>
            </div>
          </div>
        </Panel>

        <Panel eyebrow="Atividade recente" title="Ultimos lancamentos">
          {recentActivity.length === 0 ? (
            <EmptyState text="Os lancamentos vao aparecer aqui assim que voce comecar a usar o app." />
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item) => {
                const isExpense = "status" in item || "installmentNumber" in item;
                const isCreditCharge = "installmentNumber" in item;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{item.description}</p>
                      <p className="text-sm text-slate-500">
                        {isCreditCharge
                          ? `${categoryName(item.categoryId)} - fatura do cartao`
                          : "status" in item
                            ? `${categoryName(item.categoryId)} - ${accountName(item.accountId)}`
                            : `${accountName(item.accountId)} - entrada`}
                      </p>
                      {"paymentMethod" in item ? (
                        <p className="mt-1 text-sm text-slate-500">
                          Via {paymentMethodLabels[item.paymentMethod]}
                        </p>
                      ) : isCreditCharge ? (
                        <p className="mt-1 text-sm text-slate-500">Via cartao de credito</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className={isExpense ? "font-medium text-rose-600" : "font-medium text-emerald-600"}>
                        {isExpense ? "-" : "+"}
                        {formatCurrency(item.amount)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatDate(
                          "installmentNumber" in item
                            ? item.paidAt
                            : "paidAt" in item
                              ? item.paidAt ?? item.date
                              : item.date
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

DashboardPage.HighlightCards = HighlightCards;

export default DashboardPage as typeof DashboardPage & {
  HighlightCards: typeof HighlightCards;
};
