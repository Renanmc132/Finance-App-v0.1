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

  if (auth.isConfigured && (!auth.session || auth.isRecovery)) {
    return <AuthScreen isRecovery={auth.isRecovery} />;
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-10">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-10">
        <section className="rounded-[36px] border border-white/70 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="grid gap-8 px-6 py-8 md:grid-cols-[1.2fr_0.95fr] md:px-10 md:py-10">
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
                <div className="flex gap-2 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5">
                  <button
                    onClick={() => setView("home")}
                    className={
                      view === "home"
                        ? "rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-slate-900 shadow-sm"
                        : "rounded-xl px-5 py-2.5 text-sm text-slate-500"
                    }
                  >
                    Home
                  </button>
                  <button
                    onClick={() => setView("dashboards")}
                    className={
                      view === "dashboards"
                        ? "rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-slate-900 shadow-sm"
                        : "rounded-xl px-5 py-2.5 text-sm text-slate-500"
                    }
                  >
                    Dashboards
                  </button>
                </div>
                <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
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
                <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
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
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Ano -
                  </button>
                  <button
                    onClick={() => setSelectedYear((year) => year + 1)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Ano +
                  </button>
                </div>
                {auth.session ? (
                  <button
                    onClick={() => supabase?.auth.signOut()}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
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

            <div className="grid gap-8 xl:grid-cols-2">
              <EntriesPage finance={finance} />
              <ExpensesPage finance={finance} />
            </div>

            <section className="rounded-[36px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-4 shadow-[0_20px_60px_rgba(16,185,129,0.08)] md:p-6">
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-emerald-700">
                    Metas em destaque
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                    Area de metas da home
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    Aqui voce cria metas, ajusta o valor guardado manualmente e registra aportes
                    sem precisar procurar essa parte em outro lugar da pagina.
                  </p>
                </div>
              </div>
              <GoalsPanel finance={finance} />
            </section>

            <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
              <SavingsPanel finance={finance} />
              <CreditCardsPanel finance={finance} />
            </div>

            <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
              <InstallmentsPage finance={finance} />
              <AccountsPage finance={finance} />
            </div>

            <div className="grid gap-8 xl:grid-cols-[1fr_0.9fr]">
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
