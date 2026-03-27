import { useEffect, useState } from "preact/hooks";
import { Session } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import {
  Account,
  Category,
  Expense,
  ExpenseStatus,
  ExpenseType,
  FinanceData,
  Goal,
  GoalContribution,
  Income,
  IncomeType,
  InstallmentPlan,
  PaymentMethod,
  SavingsBucket
} from "../types/finance";
import { supabase } from "../lib/supabase";

const STORAGE_KEY = "finance-app-v2";

const defaultCategories: Category[] = [
  { id: uuidv4(), name: "Moradia", color: "#f97316" },
  { id: uuidv4(), name: "Comida", color: "#22c55e" },
  { id: uuidv4(), name: "Transporte", color: "#38bdf8" },
  { id: uuidv4(), name: "Lazer", color: "#a78bfa" },
  { id: uuidv4(), name: "Assinaturas", color: "#f43f5e" }
];

const defaultAccounts: Account[] = [];
const defaultPreferences = {
  expenseTypeLabels: {
    expense: "Gasto variavel",
    fixed: "Gasto fixo",
    installment: "Parcela"
  },
  expenseStatusLabels: {
    pending: "Pendente",
    paid: "Ja pago"
  },
  paymentMethodLabels: {
    pix: "Pix",
    debit: "Debito",
    credit: "Cartao",
    cash: "Dinheiro",
    transfer: "Transferencia",
    other: "Outro"
  }
};

const initialState: FinanceData = {
  accounts: defaultAccounts,
  categories: defaultCategories,
  incomes: [],
  expenses: [],
  installmentPlans: [],
  goals: [],
  goalContributions: [],
  savingsBuckets: [],
  preferences: defaultPreferences
};

type AddAccountInput = {
  name: string;
  type: Account["type"];
  initialBalance?: number;
};

type AddIncomeInput = {
  description: string;
  amount: number;
  date: string;
  accountId: string;
  type: IncomeType;
};

type AddExpenseInput = {
  description: string;
  amount: number;
  date: string;
  accountId: string;
  categoryId: string;
  type: ExpenseType;
  status: ExpenseStatus;
  paymentMethod: PaymentMethod;
  paidAt?: string;
};

type AddInstallmentPlanInput = {
  title: string;
  totalInstallments: number;
  installmentAmount: number;
  accountId: string;
  categoryId: string;
  dueDay: number;
  startDate: string;
  paymentMethod: PaymentMethod;
};

type AddGoalInput = {
  name: string;
  targetAmount: number;
  savedAmount?: number;
  deadline?: string;
};

type AddSavingsBucketInput = {
  name: string;
  amount: number;
  type: SavingsBucket["type"];
  accountId?: string;
};

type AddGoalContributionInput = {
  goalId: string;
  accountId: string;
  amount: number;
  date: string;
};

function normalizeAccountType(type?: string): Account["type"] {
  if (type === "wallet") return "wallet";
  if (type === "card" || type === "credit") return "card";
  return "account";
}

function parseStoredFinance(data: string): FinanceData {
  try {
    const parsed = JSON.parse(data) as Partial<FinanceData> & {
      transactions?: Array<{
        id: string;
        name: string;
        amount: number;
        accountId: string;
        categoryId?: string;
        paid?: boolean;
      }>;
    };

    return {
      accounts: parsed.accounts?.length
        ? parsed.accounts.map((account) => ({
            ...account,
            type: normalizeAccountType(account.type)
          }))
        : initialState.accounts,
      categories: parsed.categories?.length ? parsed.categories : initialState.categories,
      incomes: parsed.incomes ?? [],
      expenses:
        parsed.expenses ??
        parsed.transactions?.map((transaction) => ({
          id: transaction.id,
          description: transaction.name,
          amount: transaction.amount,
          date: new Date().toISOString().slice(0, 10),
          accountId: transaction.accountId,
          categoryId: transaction.categoryId ?? "",
          type: "expense" as const,
          status: transaction.paid ? "paid" : "pending",
          paymentMethod: "other" as const,
          paidAt: transaction.paid ? new Date().toISOString().slice(0, 10) : undefined
        })) ??
        [],
      installmentPlans: parsed.installmentPlans ?? [],
      goals: parsed.goals ?? [],
      goalContributions: parsed.goalContributions ?? [],
      savingsBuckets: parsed.savingsBuckets ?? [],
      preferences: {
        expenseTypeLabels: {
          ...defaultPreferences.expenseTypeLabels,
          ...parsed.preferences?.expenseTypeLabels
        },
        expenseStatusLabels: {
          ...defaultPreferences.expenseStatusLabels,
          ...parsed.preferences?.expenseStatusLabels
        },
        paymentMethodLabels: {
          ...defaultPreferences.paymentMethodLabels,
          ...parsed.preferences?.paymentMethodLabels
        }
      }
    };
  } catch {
    return initialState;
  }
}

export function useFinance(session?: Session | null) {
  const [finance, setFinance] = useState<FinanceData>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (session?.user?.id && supabase) {
        const { data, error } = await supabase
          .from("finance_data")
          .select("payload")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (!cancelled) {
          if (!error && data?.payload) {
            setFinance(parseStoredFinance(JSON.stringify(data.payload)));
          } else {
            const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("finance");
            if (stored) {
              setFinance(parseStoredFinance(stored));
            } else {
              setFinance(initialState);
            }
          }
          setReady(true);
        }
        return;
      }

      const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("finance");
      if (!cancelled) {
        if (stored) {
          setFinance(parseStoredFinance(stored));
        }
        setReady(true);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!ready) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(finance));
  }, [finance, ready]);

  useEffect(() => {
    if (!ready || !session?.user?.id || !supabase) {
      return;
    }

    const client = supabase;
    const timeout = window.setTimeout(async () => {
      await client.from("finance_data").upsert(
        {
          user_id: session.user.id,
          payload: finance,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id" }
      );
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [finance, ready, session?.user?.id]);

  function addAccount({ name, type, initialBalance = 0 }: AddAccountInput) {
    if (!name.trim()) return;

    setFinance((prev) => ({
      ...prev,
      accounts: [
        ...prev.accounts,
        {
          id: uuidv4(),
          name: name.trim(),
          type,
          balance: initialBalance
        }
      ]
    }));
  }

  function removeAccount(id: string) {
    setFinance((prev) => ({
      ...prev,
      accounts: prev.accounts.filter((account) => account.id !== id),
      incomes: prev.incomes.filter((income) => income.accountId !== id),
      expenses: prev.expenses.filter((expense) => expense.accountId !== id),
      installmentPlans: prev.installmentPlans.filter((plan) => plan.accountId !== id),
      savingsBuckets: prev.savingsBuckets.map((bucket) =>
        bucket.accountId === id ? { ...bucket, accountId: undefined } : bucket
      )
    }));
  }

  function addCategory(name: string, color: string) {
    if (!name.trim()) return;

    setFinance((prev) => ({
      ...prev,
      categories: [
        ...prev.categories,
        { id: uuidv4(), name: name.trim(), color }
      ]
    }));
  }

  function removeCategory(id: string) {
    setFinance((prev) => ({
      ...prev,
      categories: prev.categories.filter((category) => category.id !== id),
      expenses: prev.expenses.filter((expense) => expense.categoryId !== id),
      installmentPlans: prev.installmentPlans.filter((plan) => plan.categoryId !== id)
    }));
  }

  function addIncome(input: AddIncomeInput) {
    if (!input.description.trim() || !input.amount || !input.accountId) return;

    const income: Income = {
      id: uuidv4(),
      description: input.description.trim(),
      amount: input.amount,
      date: input.date,
      accountId: input.accountId,
      type: input.type
    };

    setFinance((prev) => ({
      ...prev,
      incomes: [income, ...prev.incomes],
      accounts: prev.accounts.map((account) =>
        account.id === input.accountId
          ? { ...account, balance: account.balance + input.amount }
          : account
      )
    }));
  }

  function removeIncome(id: string) {
    setFinance((prev) => {
      const income = prev.incomes.find((item) => item.id === id);
      if (!income) return prev;

      return {
        ...prev,
        incomes: prev.incomes.filter((item) => item.id !== id),
        accounts: prev.accounts.map((account) =>
          account.id === income.accountId
            ? { ...account, balance: account.balance - income.amount }
            : account
        )
      };
    });
  }

  function addExpense(input: AddExpenseInput) {
    if (
      !input.description.trim() ||
      !input.amount ||
      !input.accountId ||
      !input.categoryId
    ) {
      return;
    }

    const expense: Expense = {
      id: uuidv4(),
      description: input.description.trim(),
      amount: input.amount,
      date: input.date,
      accountId: input.accountId,
      categoryId: input.categoryId,
      type: input.type,
      status: input.status,
      paymentMethod: input.paymentMethod,
      paidAt: input.status === "paid" ? input.paidAt ?? input.date : undefined
    };

    setFinance((prev) => ({
      ...prev,
      expenses: [expense, ...prev.expenses],
      accounts:
        expense.status === "paid"
          ? prev.accounts.map((account) =>
              account.id === input.accountId
                ? { ...account, balance: account.balance - input.amount }
                : account
            )
          : prev.accounts
    }));
  }

  function markExpenseAsPaid(id: string, paidAt: string) {
    setFinance((prev) => {
      const expense = prev.expenses.find((item) => item.id === id);
      if (!expense || expense.status === "paid") {
        return prev;
      }

      return {
        ...prev,
        expenses: prev.expenses.map((item) =>
          item.id === id ? { ...item, status: "paid", paidAt } : item
        ),
        accounts: prev.accounts.map((account) =>
          account.id === expense.accountId
            ? { ...account, balance: account.balance - expense.amount }
            : account
        )
      };
    });
  }

  function removeExpense(id: string) {
    setFinance((prev) => {
      const expense = prev.expenses.find((item) => item.id === id);
      if (!expense) return prev;

      return {
        ...prev,
        expenses: prev.expenses.filter((item) => item.id !== id),
        accounts:
          expense.status === "paid"
            ? prev.accounts.map((account) =>
                account.id === expense.accountId
                  ? { ...account, balance: account.balance + expense.amount }
                  : account
              )
            : prev.accounts
      };
    });
  }

  function addInstallmentPlan(input: AddInstallmentPlanInput) {
    if (
      !input.title.trim() ||
      !input.accountId ||
      !input.categoryId ||
      !input.totalInstallments ||
      !input.installmentAmount
    ) {
      return;
    }

    const plan: InstallmentPlan = {
      id: uuidv4(),
      title: input.title.trim(),
      totalInstallments: input.totalInstallments,
      paidInstallments: 0,
      installmentAmount: input.installmentAmount,
      accountId: input.accountId,
      categoryId: input.categoryId,
      dueDay: input.dueDay,
      startDate: input.startDate,
      paymentMethod: input.paymentMethod
    };

    setFinance((prev) => ({
      ...prev,
      installmentPlans: [plan, ...prev.installmentPlans]
    }));
  }

  function payInstallment(planId: string, paidAt: string) {
    setFinance((prev) => {
      const plan = prev.installmentPlans.find((item) => item.id === planId);
      if (!plan || plan.paidInstallments >= plan.totalInstallments) {
        return prev;
      }

      const installmentNumber = plan.paidInstallments + 1;
      const expense: Expense = {
        id: uuidv4(),
        description: `${plan.title} - ${installmentNumber}/${plan.totalInstallments}`,
        amount: plan.installmentAmount,
        date: paidAt,
        accountId: plan.accountId,
        categoryId: plan.categoryId,
        type: "installment",
        status: "paid",
        paymentMethod: plan.paymentMethod,
        paidAt
      };

      return {
        ...prev,
        expenses: [expense, ...prev.expenses],
        installmentPlans: prev.installmentPlans.map((item) =>
          item.id === planId
            ? {
                ...item,
                paidInstallments: item.paidInstallments + 1,
                lastPaidAt: paidAt
              }
            : item
        ),
        accounts: prev.accounts.map((account) =>
          account.id === plan.accountId
            ? { ...account, balance: account.balance - plan.installmentAmount }
            : account
        )
      };
    });
  }

  function removeInstallmentPlan(id: string) {
    setFinance((prev) => ({
      ...prev,
      installmentPlans: prev.installmentPlans.filter((plan) => plan.id !== id)
    }));
  }

  function addGoal(input: AddGoalInput) {
    if (!input.name.trim() || !input.targetAmount) {
      return;
    }

    const goal: Goal = {
      id: uuidv4(),
      name: input.name.trim(),
      targetAmount: input.targetAmount,
      savedAmount: input.savedAmount ?? 0,
      deadline: input.deadline
    };

    setFinance((prev) => ({
      ...prev,
      goals: [goal, ...prev.goals]
    }));
  }

  function removeGoal(id: string) {
    setFinance((prev) => ({
      ...prev,
      goals: prev.goals.filter((goal) => goal.id !== id),
      goalContributions: prev.goalContributions.filter((item) => item.goalId !== id)
    }));
  }

  function addGoalContribution(input: AddGoalContributionInput) {
    if (!input.goalId || !input.accountId || !input.amount) {
      return;
    }

    const contribution: GoalContribution = {
      id: uuidv4(),
      goalId: input.goalId,
      accountId: input.accountId,
      amount: input.amount,
      date: input.date
    };

    setFinance((prev) => ({
      ...prev,
      goalContributions: [contribution, ...prev.goalContributions],
      goals: prev.goals.map((goal) =>
        goal.id === input.goalId
          ? { ...goal, savedAmount: goal.savedAmount + input.amount }
          : goal
      ),
      accounts: prev.accounts.map((account) =>
        account.id === input.accountId
          ? { ...account, balance: account.balance - input.amount }
          : account
      )
    }));
  }

  function addSavingsBucket(input: AddSavingsBucketInput) {
    if (!input.name.trim()) {
      return;
    }

    const bucket: SavingsBucket = {
      id: uuidv4(),
      name: input.name.trim(),
      amount: input.amount,
      type: input.type,
      accountId: input.accountId
    };

    setFinance((prev) => ({
      ...prev,
      savingsBuckets: [bucket, ...prev.savingsBuckets]
    }));
  }

  function removeSavingsBucket(id: string) {
    setFinance((prev) => ({
      ...prev,
      savingsBuckets: prev.savingsBuckets.filter((bucket) => bucket.id !== id)
    }));
  }

  function exportData() {
    return JSON.stringify(finance, null, 2);
  }

  function importData(raw: string) {
    const parsed = parseStoredFinance(raw);
    setFinance(parsed);
  }

  function updatePreferenceLabel(
    group: "expenseTypeLabels" | "expenseStatusLabels" | "paymentMethodLabels",
    key: string,
    value: string
  ) {
    setFinance((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [group]: {
          ...prev.preferences[group],
          [key]: value
        }
      }
    }));
  }

  return {
    ...finance,
    ready,
    addAccount,
    removeAccount,
    addCategory,
    removeCategory,
    addIncome,
    removeIncome,
    addExpense,
    markExpenseAsPaid,
    removeExpense,
    addInstallmentPlan,
    payInstallment,
    removeInstallmentPlan,
    addGoal,
    removeGoal,
    addGoalContribution,
    addSavingsBucket,
    removeSavingsBucket,
    exportData,
    importData,
    updatePreferenceLabel
  };
}

export type FinanceStore = ReturnType<typeof useFinance>;
