import { useState } from "preact/hooks";
import { FinanceStore } from "../hooks/useFinance";
import { Panel } from "./financeUi";

export default function SettingsPanel({ finance }: { finance: FinanceStore }) {
  const [newSavingsType, setNewSavingsType] = useState("");
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

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Tipos de investimento
          </h3>
          <div className="space-y-2">
            {Object.entries(finance.preferences.savingsTypeLabels).map(([itemKey, label]) => (
              <label
                key={itemKey}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <span className="w-28 text-sm text-slate-500">{itemKey}</span>
                <input
                  value={label}
                  onInput={(event: Event) =>
                    finance.updatePreferenceLabel(
                      "savingsTypeLabels",
                      itemKey,
                      (event.currentTarget as HTMLInputElement).value
                    )
                  }
                  className="flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none"
                />
                {itemKey !== "other" ? (
                  <button
                    onClick={() => finance.removeSavingsType(itemKey)}
                    className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
                  >
                    Excluir
                  </button>
                ) : null}
              </label>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input
              value={newSavingsType}
              onInput={(event: Event) => setNewSavingsType((event.currentTarget as HTMLInputElement).value)}
              placeholder="Novo tipo de investimento"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none"
            />
            <button
              onClick={() => {
                finance.addSavingsType(newSavingsType);
                setNewSavingsType("");
              }}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
            >
              Adicionar tipo
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Se excluir um tipo, os investimentos desse grupo passam para "Outro".
          </p>
        </div>
      </div>
    </Panel>
  );
}
