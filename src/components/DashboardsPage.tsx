import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
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

function getExpenseDate(date?: string, paidAt?: string) {
  return new Date(`${(paidAt ?? date ?? "2000-01-01")}T12:00:00`);
}

function getIncomeDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

function getCreditChargeDate(date?: string) {
  return new Date(`${date ?? "2000-01-01"}T12:00:00`);
}

export default function DashboardsPage({
  finance,
  selectedYear
}: {
  finance: FinanceStore;
  selectedYear: number;
}) {
  const yearSet = new Set<number>();
  finance.incomes.forEach((item) => yearSet.add(getIncomeDate(item.date).getFullYear()));
  finance.expenses.forEach((item) => yearSet.add(getExpenseDate(item.date, item.paidAt).getFullYear()));
  finance.creditCardCharges.forEach((item) => {
    if (item.invoicePaidAt) {
      yearSet.add(getCreditChargeDate(item.invoicePaidAt).getFullYear());
    }
  });
  yearSet.add(selectedYear);

  const yearlyData = Array.from(yearSet)
    .sort((a, b) => a - b)
    .map((year) => {
      const income = finance.incomes
        .filter((item) => getIncomeDate(item.date).getFullYear() === year)
        .reduce((sum, item) => sum + item.amount, 0);
      const expense = finance.expenses
        .filter((item) => item.status === "paid" && getExpenseDate(item.date, item.paidAt).getFullYear() === year)
        .reduce((sum, item) => sum + item.amount, 0);
      const creditExpense = finance.creditCardCharges
        .filter((item) => item.invoiceStatus === "paid" && item.invoicePaidAt && getCreditChargeDate(item.invoicePaidAt).getFullYear() === year)
        .reduce((sum, item) => sum + item.amount, 0);
      return {
        year: String(year),
        entradas: income,
        gastos: expense + creditExpense,
        saldo: income - expense - creditExpense
      };
    });

  const monthlyData = monthLabels.map((month, index) => {
    const income = finance.incomes
      .filter((item) => {
        const date = getIncomeDate(item.date);
        return date.getFullYear() === selectedYear && date.getMonth() === index;
      })
      .reduce((sum, item) => sum + item.amount, 0);
    const expense = finance.expenses
      .filter((item) => {
        if (item.status !== "paid") return false;
        const date = getExpenseDate(item.date, item.paidAt);
        return date.getFullYear() === selectedYear && date.getMonth() === index;
      })
      .reduce((sum, item) => sum + item.amount, 0);
    const creditExpense = finance.creditCardCharges
      .filter((item) => {
        if (item.invoiceStatus !== "paid" || !item.invoicePaidAt) return false;
        const date = getCreditChargeDate(item.invoicePaidAt);
        return date.getFullYear() === selectedYear && date.getMonth() === index;
      })
      .reduce((sum, item) => sum + item.amount, 0);
    return {
      month,
      shortMonth: month.slice(0, 3),
      entradas: income,
      gastos: expense + creditExpense,
      saldo: income - expense - creditExpense
    };
  });

  const topExpenseYear = [...yearlyData].sort((a, b) => b.gastos - a.gastos)[0];
  const lowExpenseYear = [...yearlyData].sort((a, b) => a.gastos - b.gastos)[0];
  const topExpenseMonth = [...monthlyData].sort((a, b) => b.gastos - a.gastos)[0];
  const lowExpenseMonth = [...monthlyData].sort((a, b) => a.gastos - b.gastos)[0];

  const accountData = finance.accounts
    .map((account) => {
      const total = finance.expenses
        .filter((expense) => {
          if (expense.status !== "paid") return false;
          const date = getExpenseDate(expense.date, expense.paidAt);
          return expense.accountId === account.id && date.getFullYear() === selectedYear;
        })
        .reduce((sum, expense) => sum + expense.amount, 0) +
        finance.creditCardCharges
          .filter((charge) => {
            if (charge.invoiceStatus !== "paid" || !charge.invoicePaidAt) return false;
            const card = finance.creditCards.find((item) => item.id === charge.cardId);
            const date = getCreditChargeDate(charge.invoicePaidAt);
            return card?.accountId === account.id && date.getFullYear() === selectedYear;
          })
          .reduce((sum, charge) => sum + charge.amount, 0);
      return {
        name: account.name,
        total
      };
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);

  const paymentMethodLabels = finance.preferences.paymentMethodLabels;

  const paymentMethodData = Object.entries(paymentMethodLabels)
    .map(([method, label]) => {
      const total = finance.expenses
        .filter((expense) => {
          if (expense.status !== "paid") return false;
          const date = getExpenseDate(expense.date, expense.paidAt);
          return expense.paymentMethod === method && date.getFullYear() === selectedYear;
        })
        .reduce((sum, expense) => sum + expense.amount, 0) +
        (method === "credit"
          ? finance.creditCardCharges
              .filter((charge) => {
                if (charge.invoiceStatus !== "paid" || !charge.invoicePaidAt) return false;
                const date = getCreditChargeDate(charge.invoicePaidAt);
                return date.getFullYear() === selectedYear;
              })
              .reduce((sum, charge) => sum + charge.amount, 0)
          : 0);
      return {
        name: label,
        total
      };
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);

  const categoryData = finance.categories
    .map((category) => {
      const total = finance.expenses
        .filter((expense) => {
          if (expense.status !== "paid") return false;
          const date = getExpenseDate(expense.date, expense.paidAt);
          return expense.categoryId === category.id && date.getFullYear() === selectedYear;
        })
        .reduce((sum, expense) => sum + expense.amount, 0) +
        finance.creditCardCharges
          .filter((charge) => {
            if (charge.invoiceStatus !== "paid" || !charge.invoicePaidAt) return false;
            const date = getCreditChargeDate(charge.invoicePaidAt);
            return charge.categoryId === category.id && date.getFullYear() === selectedYear;
          })
          .reduce((sum, charge) => sum + charge.amount, 0);
      return {
        name: category.name,
        total
      };
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);

  const topAccount = accountData[0];
  const topMethod = paymentMethodData[0];
  const topCategory = categoryData[0];
  const totalAccountBalance = finance.accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalGoalTarget = finance.goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalGoalSaved = finance.goals.reduce((sum, goal) => sum + goal.savedAmount, 0);
  const totalInvested = finance.savingsBuckets
    .filter((bucket) => bucket.type === "investment")
    .reduce((sum, bucket) => sum + bucket.amount, 0);
  const totalReserved = finance.savingsBuckets
    .filter((bucket) => bucket.type === "reserve")
    .reduce((sum, bucket) => sum + bucket.amount, 0);
  const totalSavedOutsideGoals = finance.savingsBuckets.reduce((sum, bucket) => sum + bucket.amount, 0);
  const averageGoalProgress =
    finance.goals.length > 0
      ? finance.goals.reduce(
          (sum, goal) => sum + goal.savedAmount / Math.max(goal.targetAmount, 1),
          0
        ) / finance.goals.length
      : 0;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Dashboards</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">
          Visualize os extremos e o comportamento dos seus gastos
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-rose-100 bg-rose-50 p-5">
          <p className="text-sm text-rose-700">Ano que voce mais gastou</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{topExpenseYear?.year ?? "-"}</p>
          <p className="mt-1 text-sm text-slate-600">
            {topExpenseYear ? formatCurrency(topExpenseYear.gastos) : "-"}
          </p>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-sm text-emerald-700">Ano que voce menos gastou</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{lowExpenseYear?.year ?? "-"}</p>
          <p className="mt-1 text-sm text-slate-600">
            {lowExpenseYear ? formatCurrency(lowExpenseYear.gastos) : "-"}
          </p>
        </div>
        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
          <p className="text-sm text-amber-700">Mes com maior gasto em {selectedYear}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{topExpenseMonth?.month ?? "-"}</p>
          <p className="mt-1 text-sm text-slate-600">
            {topExpenseMonth ? formatCurrency(topExpenseMonth.gastos) : "-"}
          </p>
        </div>
        <div className="rounded-3xl border border-sky-100 bg-sky-50 p-5">
          <p className="text-sm text-sky-700">Mes com menor gasto em {selectedYear}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{lowExpenseMonth?.month ?? "-"}</p>
          <p className="mt-1 text-sm text-slate-600">
            {lowExpenseMonth ? formatCurrency(lowExpenseMonth.gastos) : "-"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Conta em que voce mais gastou</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{topAccount?.name ?? "-"}</p>
          <p className="mt-1 text-sm text-slate-600">
            {topAccount ? formatCurrency(topAccount.total) : "-"}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Metodo de pagamento mais usado</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{topMethod?.name ?? "-"}</p>
          <p className="mt-1 text-sm text-slate-600">
            {topMethod ? formatCurrency(topMethod.total) : "-"}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Categoria em que mais gastou</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{topCategory?.name ?? "-"}</p>
          <p className="mt-1 text-sm text-slate-600">
            {topCategory ? formatCurrency(topCategory.total) : "-"}
          </p>
        </div>
      </div>

      <Panel eyebrow="Saldos separados" title="Veja bancos, metas e investimentos lado a lado">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Saldo em conta corrente</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatCurrency(totalAccountBalance)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Saldo em metas</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatCurrency(totalGoalSaved)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Saldo em investimentos</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatCurrency(totalInvested)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Saldo em reserva / guardado</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatCurrency(totalReserved)}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total guardado fora das metas</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatCurrency(totalSavedOutsideGoals)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total planejado nas metas</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatCurrency(totalGoalTarget)}
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel eyebrow="Comparacao anual" title="Veja quais anos pesaram mais no bolso">
          <div className="h-[320px] rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="year" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Bar dataKey="gastos" fill="#fb7185" radius={[8, 8, 0, 0]} />
                <Bar dataKey="entradas" fill="#34d399" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel eyebrow="Curva mensal" title={`Entradas x gastos em ${selectedYear}`}>
          <div className="h-[320px] rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="shortMonth" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Area
                  type="monotone"
                  dataKey="entradas"
                  stroke="#10b981"
                  fill="#a7f3d0"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="gastos"
                  stroke="#f43f5e"
                  fill="#fecdd3"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel eyebrow="Por conta" title={`Onde saiu mais dinheiro em ${selectedYear}`}>
          <div className="h-[300px] rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accountData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Bar dataKey="total" fill="#60a5fa" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel eyebrow="Por metodo" title={`Como voce mais pagou em ${selectedYear}`}>
          <div className="h-[300px] rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethodData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Bar dataKey="total" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel eyebrow="Por categoria" title={`Categoria mais pesada em ${selectedYear}`}>
          <div className="h-[300px] rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Bar dataKey="total" fill="#34d399" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel eyebrow="Metas" title="Como esta o andamento das suas metas">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total de metas</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {finance.goals.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Ja guardado nas metas</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatCurrency(totalGoalSaved)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Progresso medio</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {(averageGoalProgress * 100).toFixed(0)}%
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">Total planejado nas metas</p>
            <p className="font-medium text-slate-900">{formatCurrency(totalGoalTarget)}</p>
          </div>
          <div className="mt-3 h-3 rounded-full bg-slate-200">
            <div
              className="h-3 rounded-full bg-emerald-400"
              style={{
                width: `${Math.min(100, (totalGoalSaved / Math.max(totalGoalTarget, 1)) * 100)}%`
              }}
            />
          </div>
        </div>
      </Panel>
    </section>
  );
}