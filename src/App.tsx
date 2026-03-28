import { useState } from "preact/hooks";
import { useFinance } from "./hooks/useFinance";
import { useAuth } from "./hooks/useAuth";
import Dashboard from "./components/Dashboard";
import EntriesPage from "./components/EntriesPage";
import ExpensesPage from "./components/ExpensesPage";
import CreditCardsPanel from "./components/CreditCardsPanel";
import InstallmentsPage from "./components/InstallmentsPage";
import AccountsPage from "./components/AccountsPage";
import GoalsPanel from "./components/GoalsPanel";
import SavingsPanel from "./components/SavingsPanel";
import AnnualOverview from "./components/AnnualOverview";
import DashboardsPage from "./components/DashboardsPage";
import SettingsPanel from "./components/SettingsPanel";
import AuthScreen from "./components/AuthScreen";
import { supabase } from "./lib/supabase";

export default function App() {
  const auth = useAuth();
  const finance = useFinance(auth.session);
  const now = new Date();
  const [view, setView] = useState<"home" | "dashboards">("home");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const monthOptions = [
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
  if (auth.loading || !finance.ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-slate-600 shadow-sm">
          Carregando seu painel...
        </div>
      </main>
    );
  }

  if (auth.isConfigured && !auth.session) {
    return <AuthScreen />;
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 px-6 py-8 md:grid-cols-[1.3fr_0.9fr] md:px-8">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                Controle financeiro pessoal
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
                Uma visao unica para entradas, gastos, metas e parcelas.
              </h1>
              <p className="max-w-2xl text-sm text-slate-600 md:text-base">
                A ideia aqui eh deixar o uso diario simples, com tudo importante na
                mesma pagina. Depois a gente aprofunda com dashboards mensais e anuais.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    onClick={() => setView("home")}
                    className={
                      view === "home"
                        ? "rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm"
                        : "rounded-xl px-4 py-2 text-sm text-slate-500"
                    }
                  >
                    Home
                  </button>
                  <button
                    onClick={() => setView("dashboards")}
                    className={
                      view === "dashboards"
                        ? "rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm"
                        : "rounded-xl px-4 py-2 text-sm text-slate-500"
                    }
                  >
                    Dashboards
                  </button>
                </div>
                <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">
                    Mes
                  </span>
                  <select
                    value={selectedMonth}
                    onChange={(event: Event) =>
                      setSelectedMonth(Number((event.currentTarget as HTMLSelectElement).value))
                    }
                    className="bg-transparent font-medium text-slate-900 outline-none"
                  >
                    {monthOptions.map((label, index) => (
                      <option key={label} value={index}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">
                    Ano
                  </span>
                  <input
                    type="number"
                    value={selectedYear}
                    onInput={(event: Event) =>
                      setSelectedYear(Number((event.currentTarget as HTMLInputElement).value))
                    }
                    className="w-24 bg-transparent font-medium text-slate-900 outline-none"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedYear((year) => year - 1)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Ano -
                  </button>
                  <button
                    onClick={() => setSelectedYear((year) => year + 1)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Ano +
                  </button>
                </div>
                {auth.session ? (
                  <button
                    onClick={() => supabase?.auth.signOut()}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Sair
                  </button>
                ) : null}
              </div>
            </div>
            <Dashboard.HighlightCards
              finance={finance}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />
          </div>
        </section>

        {view === "home" ? (
          <>
            <Dashboard
              finance={finance}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />

            <div className="grid gap-6 xl:grid-cols-2">
              <EntriesPage finance={finance} />
              <ExpensesPage finance={finance} />
            </div>

            <div className="grid gap-6">
              <CreditCardsPanel finance={finance} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <InstallmentsPage finance={finance} />
              <div className="space-y-6">
                <SavingsPanel finance={finance} />
                <GoalsPanel finance={finance} />
              </div>
            </div>

            <AccountsPage finance={finance} />

            <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
              <AnnualOverview finance={finance} selectedYear={selectedYear} />
              <SettingsPanel finance={finance} />
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <DashboardsPage finance={finance} selectedYear={selectedYear} />
            <AnnualOverview finance={finance} selectedYear={selectedYear} />
          </div>
        )}
      </div>
    </main>
  );
}