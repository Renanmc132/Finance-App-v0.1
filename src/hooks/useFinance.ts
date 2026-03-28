import { useEffect, useState } from "preact/hooks";
import { Session } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import {
  Account,
  Category,
  CreditCard,
  CreditCardCharge,
  CreditCardPayment,
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
  SavingsMovement,
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
  incomeTypeLabels: {
    salary: "Salario",
    bonus: "Bonus",
    pix: "Pix recebido",
    other: "Outro"
  },
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
  },
  savingsTypeLabels: {
    investment: "Investimento",
    reserve: "Reserva",
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
  savingsMovements: [],
  creditCards: [],
  creditCardCharges: [],
  creditCardPayments: [],
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
  createdAt: string;
};

type AddGoalContributionInput = {
  goalId: string;
  accountId: string;
  amount: number;
  date: string;
};

type AddCreditCardInput = {
  name: string;
  accountId: string;
  limitAmount: number;
  closingDay: number;
  dueDay: number;
};

type AddCreditCardChargeInput = {
  cardId: string;
  description: string;
  amount: number;
  date: string;
  categoryId: string;
  type: ExpenseType;
  installments?: number;
};

type MoveSavingsInput = {
  bucketId: string;
  accountId: string;
  amount: number;
  date: string;
  type: "deposit" | "withdrawal";
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
      savingsBuckets: (parsed.savingsBuckets ?? []).map((bucket) => ({
        ...bucket,
        createdAt: bucket.createdAt ?? new Date().toISOString().slice(0, 10)
      })),
      savingsMovements: parsed.savingsMovements ?? [],
      creditCards: parsed.creditCards ?? [],
      creditCardCharges: (parsed.creditCardCharges ?? []).map((charge) => {
        const legacyCharge = charge as CreditCardCharge & {
          currentInstallment?: number;
          invoicePaidAt?: string;
        };

        return {
          ...charge,
          installments: charge.installments ?? 1,
          paidInstallments:
            charge.paidInstallments ??
            (charge.invoiceStatus === "paid"
              ? charge.installments ?? 1
              : Math.max(0, (legacyCharge.currentInstallment ?? 1) - 1)),
          lastPaidAt: charge.lastPaidAt ?? legacyCharge.invoicePaidAt
        };
      }),
      creditCardPayments: parsed.creditCardPayments ?? [],
      preferences: {
        incomeTypeLabels: {
          ...defaultPreferences.incomeTypeLabels,
          ...parsed.preferences?.incomeTypeLabels
        },
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
        },
        savingsTypeLabels: {
          ...defaultPreferences.savingsTypeLabels,
          ...parsed.preferences?.savingsTypeLabels
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
    setFinance((prev) => {
      const removedCardIds = prev.creditCards
        .filter((card) => card.accountId === id)
        .map((card) => card.id);

      return {
        ...prev,
        accounts: prev.accounts.filter((account) => account.id !== id),
        incomes: prev.incomes.filter((income) => income.accountId !== id),
        expenses: prev.expenses.filter((expense) => expense.accountId !== id),
        installmentPlans: prev.installmentPlans.filter((plan) => plan.accountId !== id),
        creditCards: prev.creditCards.filter((card) => card.accountId !== id),
        creditCardCharges: prev.creditCardCharges.filter(
          (charge) => !removedCardIds.includes(charge.cardId)
        ),
        creditCardPayments: prev.creditCardPayments.filter(
          (payment) => !removedCardIds.includes(payment.cardId)
        ),
        savingsBuckets: prev.savingsBuckets.map((bucket) =>
          bucket.accountId === id ? { ...bucket, accountId: undefined } : bucket
        ),
        savingsMovements: prev.savingsMovements.filter((movement) => movement.accountId !== id)
      };
    });
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
      installmentPlans: prev.installmentPlans.filter((plan) => plan.categoryId !== id),
      creditCardCharges: prev.creditCardCharges.filter((charge) => charge.categoryId !== id),
      creditCardPayments: prev.creditCardPayments.filter((payment) => payment.categoryId !== id)
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

  function updateGoalSavedAmount(id: string, savedAmount: number) {
    if (!Number.isFinite(savedAmount) || savedAmount < 0) {
      return;
    }

    setFinance((prev) => ({
      ...prev,
      goals: prev.goals.map((goal) =>
        goal.id === id
          ? { ...goal, savedAmount }
          : goal
      )
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

  function updateGoalContribution(id: string, amount: number) {
    if (!Number.isFinite(amount) || amount < 0) {
      return;
    }

    setFinance((prev) => {
      const contribution = prev.goalContributions.find((item) => item.id === id);
      if (!contribution) {
        return prev;
      }

      const difference = amount - contribution.amount;

      return {
        ...prev,
        goalContributions: prev.goalContributions.map((item) =>
          item.id === id ? { ...item, amount } : item
        ),
        goals: prev.goals.map((goal) =>
          goal.id === contribution.goalId
            ? { ...goal, savedAmount: goal.savedAmount + difference }
            : goal
        ),
        accounts: prev.accounts.map((account) =>
          account.id === contribution.accountId
            ? { ...account, balance: account.balance - difference }
            : account
        )
      };
    });
  }

  function removeGoalContribution(id: string) {
    setFinance((prev) => {
      const contribution = prev.goalContributions.find((item) => item.id === id);
      if (!contribution) {
        return prev;
      }

      return {
        ...prev,
        goalContributions: prev.goalContributions.filter((item) => item.id !== id),
        goals: prev.goals.map((goal) =>
          goal.id === contribution.goalId
            ? { ...goal, savedAmount: Math.max(0, goal.savedAmount - contribution.amount) }
            : goal
        ),
        accounts: prev.accounts.map((account) =>
          account.id === contribution.accountId
            ? { ...account, balance: account.balance + contribution.amount }
            : account
        )
      };
    });
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
      accountId: input.accountId,
      createdAt: input.createdAt
    };

    setFinance((prev) => ({
      ...prev,
      savingsBuckets: [bucket, ...prev.savingsBuckets]
    }));
  }

  function removeSavingsBucket(id: string) {
    setFinance((prev) => ({
      ...prev,
      savingsBuckets: prev.savingsBuckets.filter((bucket) => bucket.id !== id),
      savingsMovements: prev.savingsMovements.filter((movement) => movement.bucketId !== id)
    }));
  }

  function updateSavingsBucket(id: string, updates: Partial<Pick<SavingsBucket, "name" | "type" | "accountId">>) {
    setFinance((prev) => ({
      ...prev,
      savingsBuckets: prev.savingsBuckets.map((bucket) =>
        bucket.id === id ? { ...bucket, ...updates } : bucket
      )
    }));
  }

  function moveSavings(input: MoveSavingsInput) {
    if (!input.bucketId || !input.accountId || !input.amount || input.amount < 0) {
      return;
    }

    setFinance((prev) => {
      const bucket = prev.savingsBuckets.find((item) => item.id === input.bucketId);
      if (!bucket) return prev;
      if (input.type === "withdrawal" && bucket.amount < input.amount) {
        return prev;
      }

      const movement: SavingsMovement = {
        id: uuidv4(),
        bucketId: input.bucketId,
        accountId: input.accountId,
        amount: input.amount,
        date: input.date,
        type: input.type
      };

      return {
        ...prev,
        savingsMovements: [movement, ...prev.savingsMovements],
        savingsBuckets: prev.savingsBuckets.map((item) =>
          item.id === input.bucketId
            ? {
                ...item,
                amount:
                  input.type === "deposit"
                    ? item.amount + input.amount
                    : item.amount - input.amount
              }
            : item
        ),
        accounts: prev.accounts.map((account) =>
          account.id === input.accountId
            ? {
                ...account,
                balance:
                  input.type === "deposit"
                    ? account.balance - input.amount
                    : account.balance + input.amount
              }
            : account
        )
      };
    });
  }

  function addCreditCard(input: AddCreditCardInput) {
    if (!input.name.trim() || !input.accountId || !input.limitAmount) {
      return;
    }

    const creditCard: CreditCard = {
      id: uuidv4(),
      name: input.name.trim(),
      accountId: input.accountId,
      limitAmount: input.limitAmount,
      closingDay: input.closingDay,
      dueDay: input.dueDay
    };

    setFinance((prev) => ({
      ...prev,
      creditCards: [creditCard, ...prev.creditCards]
    }));
  }

  function removeCreditCard(id: string) {
    setFinance((prev) => {
      const card = prev.creditCards.find((item) => item.id === id);
      if (!card) return prev;

      const refundedAmount = prev.creditCardPayments
        .filter((payment) => payment.cardId === id)
        .reduce((sum, payment) => sum + payment.amount, 0);

      return {
        ...prev,
        creditCards: prev.creditCards.filter((creditCard) => creditCard.id !== id),
        creditCardCharges: prev.creditCardCharges.filter((charge) => charge.cardId !== id),
        creditCardPayments: prev.creditCardPayments.filter((payment) => payment.cardId !== id),
        accounts: prev.accounts.map((account) =>
          account.id === card.accountId
            ? { ...account, balance: account.balance + refundedAmount }
            : account
        )
      };
    });
  }

  function addCreditCardCharge(input: AddCreditCardChargeInput) {
    if (!input.cardId || !input.description.trim() || !input.amount || !input.categoryId) {
      return;
    }

    const charge: CreditCardCharge = {
      id: uuidv4(),
      cardId: input.cardId,
      description: input.description.trim(),
      amount: input.amount,
      date: input.date,
      categoryId: input.categoryId,
      type: input.type,
      installments: Math.max(1, input.installments ?? 1),
      paidInstallments: 0,
      invoiceStatus: "open"
    };

    setFinance((prev) => ({
      ...prev,
      creditCardCharges: [charge, ...prev.creditCardCharges]
    }));
  }

  function payCreditCardInvoice(cardId: string, paidAt: string) {
    setFinance((prev) => {
      const card = prev.creditCards.find((item) => item.id === cardId);
      if (!card) return prev;

      const openCharges = prev.creditCardCharges.filter(
        (charge) => charge.cardId === cardId && charge.paidInstallments < charge.installments
      );

      if (openCharges.length === 0) {
        return prev;
      }

      const totalInvoice = openCharges.reduce(
        (sum, charge) => sum + charge.amount / Math.max(charge.installments, 1),
        0
      );

      return {
        ...prev,
        creditCardPayments: [
          ...openCharges.map((charge) => ({
            id: uuidv4(),
            chargeId: charge.id,
            cardId: charge.cardId,
            categoryId: charge.categoryId,
            description: charge.description,
            amount: charge.amount / Math.max(charge.installments, 1),
            paidAt,
            installmentNumber: charge.paidInstallments + 1
          })),
          ...prev.creditCardPayments
        ],
        creditCardCharges: prev.creditCardCharges.map((charge) =>
          charge.cardId === cardId && charge.paidInstallments < charge.installments
            ? {
                ...charge,
                paidInstallments: charge.paidInstallments + 1,
                invoiceStatus:
                  charge.paidInstallments + 1 >= charge.installments ? "paid" : "open",
                lastPaidAt: paidAt
              }
            : charge
        ),
        accounts: prev.accounts.map((account) =>
          account.id === card.accountId
            ? { ...account, balance: account.balance - totalInvoice }
            : account
        )
      };
    });
  }

  function removeCreditCardCharge(id: string) {
    setFinance((prev) => {
      const charge = prev.creditCardCharges.find((item) => item.id === id);
      if (!charge) return prev;

      const card = prev.creditCards.find((item) => item.id === charge.cardId);
      const relatedPayments = prev.creditCardPayments.filter((payment) => payment.chargeId === id);
      const refundedAmount = relatedPayments.reduce((sum, payment) => sum + payment.amount, 0);

      return {
        ...prev,
        creditCardCharges: prev.creditCardCharges.filter((item) => item.id !== id),
        creditCardPayments: prev.creditCardPayments.filter((payment) => payment.chargeId !== id),
        accounts:
          card && refundedAmount > 0
            ? prev.accounts.map((account) =>
                account.id === card.accountId
                  ? { ...account, balance: account.balance + refundedAmount }
                  : account
              )
            : prev.accounts
      };
    });
  }

  function exportData() {
    return JSON.stringify(finance, null, 2);
  }

  function importData(raw: string) {
    const parsed = parseStoredFinance(raw);
    setFinance(parsed);
  }

  function updatePreferenceLabel(
    group:
      | "incomeTypeLabels"
      | "expenseTypeLabels"
      | "expenseStatusLabels"
      | "paymentMethodLabels"
      | "savingsTypeLabels",
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

  function addSavingsType(label: string) {
    const normalizedLabel = label.trim();
    if (!normalizedLabel) return;

    const key = normalizedLabel
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!key) return;

    setFinance((prev) => {
      if (prev.preferences.savingsTypeLabels[key]) {
        return prev;
      }

      return {
        ...prev,
        preferences: {
          ...prev.preferences,
          savingsTypeLabels: {
            ...prev.preferences.savingsTypeLabels,
            [key]: normalizedLabel
          }
        }
      };
    });
  }

  function removeSavingsType(key: string) {
    if (key === "other") return;

    setFinance((prev) => {
      if (!prev.preferences.savingsTypeLabels[key]) {
        return prev;
      }

      const nextSavingsTypeLabels = { ...prev.preferences.savingsTypeLabels };
      delete nextSavingsTypeLabels[key];

      return {
        ...prev,
        savingsBuckets: prev.savingsBuckets.map((bucket) =>
          bucket.type === key ? { ...bucket, type: "other" } : bucket
        ),
        preferences: {
          ...prev.preferences,
          savingsTypeLabels: nextSavingsTypeLabels
        }
      };
    });
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
    updateGoalSavedAmount,
    addGoalContribution,
    updateGoalContribution,
    removeGoalContribution,
    addSavingsBucket,
    updateSavingsBucket,
    removeSavingsBucket,
    moveSavings,
    addCreditCard,
    removeCreditCard,
    addCreditCardCharge,
    payCreditCardInvoice,
    removeCreditCardCharge,
    exportData,
    importData,
    updatePreferenceLabel,
    addSavingsType,
    removeSavingsType
  };
}

export type FinanceStore = ReturnType<typeof useFinance>;
