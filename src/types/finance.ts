export type Account = {
  id: string;
  name: string;
  type: "account" | "wallet" | "card";
  balance: number;
};

export type Category = {
  id: string;
  name: string;
  color: string;
};

export type IncomeType = "salary" | "bonus" | "pix" | "other";

export type Income = {
  id: string;
  description: string;
  amount: number;
  date: string;
  accountId: string;
  type: IncomeType;
};

export type ExpenseType = "expense" | "fixed" | "installment";

export type ExpenseStatus = "pending" | "paid";
export type PaymentMethod = "pix" | "debit" | "credit" | "cash" | "transfer" | "other";

export type Expense = {
  id: string;
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

export type InstallmentPlan = {
  id: string;
  title: string;
  totalInstallments: number;
  paidInstallments: number;
  installmentAmount: number;
  accountId: string;
  categoryId: string;
  dueDay: number;
  startDate: string;
  paymentMethod: PaymentMethod;
  lastPaidAt?: string;
};

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: string;
};

export type GoalContribution = {
  id: string;
  goalId: string;
  accountId: string;
  amount: number;
  date: string;
};

export type SavingsBucket = {
  id: string;
  name: string;
  amount: number;
  type: "investment" | "reserve" | "other";
  accountId?: string;
  createdAt: string;
};

export type CreditCard = {
  id: string;
  name: string;
  accountId: string;
  limitAmount: number;
  closingDay: number;
  dueDay: number;
};

export type CreditCardCharge = {
  id: string;
  cardId: string;
  description: string;
  amount: number;
  date: string;
  categoryId: string;
  type: ExpenseType;
  installments?: number;
  currentInstallment?: number;
  invoiceStatus: "open" | "paid";
  invoicePaidAt?: string;
};

export type FinancePreferences = {
  expenseTypeLabels: Record<ExpenseType, string>;
  expenseStatusLabels: Record<ExpenseStatus, string>;
  paymentMethodLabels: Record<PaymentMethod, string>;
};

export type FinanceData = {
  accounts: Account[];
  categories: Category[];
  incomes: Income[];
  expenses: Expense[];
  installmentPlans: InstallmentPlan[];
  goals: Goal[];
  goalContributions: GoalContribution[];
  savingsBuckets: SavingsBucket[];
  creditCards: CreditCard[];
  creditCardCharges: CreditCardCharge[];
  preferences: FinancePreferences;
};