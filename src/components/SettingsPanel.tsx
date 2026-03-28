import { FinanceStore } from "../hooks/useFinance";
import { Panel } from "./financeUi";

export default function SettingsPanel({ finance }: { finance: FinanceStore }) {
  const groups = [
    {
      title: "Tipos de entrada",
      key: "incomeTypeLabels" as const,
      items: finance.preferences.incomeTypeLabels
    },
    {
      title: "Tipos de gasto",
      key: "expenseTypeLabels" as const,
      items: finance.preferences.expenseTypeLabels
    },
    {
      title: "Status do gasto",
      key: "expenseStatusLabels" as const,
      items: finance.preferences.expenseStatusLabels
    },
    {
      title: "Metodos de pagamento",
      key: "paymentMethodLabels" as const,
      items: finance.preferences.paymentMethodLabels
    }
  ];

  return (
    <Panel eyebrow="Personalizacao" title="Edite os nomes das opcoes prontas">
      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.title} className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              {group.title}
            </h3>
            <div className="space-y-2">
              {Object.entries(group.items).map(([itemKey, label]) => (
                <label
                  key={itemKey}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <span className="w-28 text-sm text-slate-500">{itemKey}</span>
                  <input
                    value={label}
                    onInput={(event: Event) =>
                      finance.updatePreferenceLabel(
                        group.key,
                        itemKey,
                        (event.currentTarget as HTMLInputElement).value
                      )
                    }
                    className="flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none"
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
