import { useState } from "preact/hooks";
import { FinanceStore } from "../hooks/useFinance";
import { Panel } from "./financeUi";

export default function DataManagementPanel({ finance }: { finance: FinanceStore }) {
  const [importMessage, setImportMessage] = useState("");

  function handleExport() {
    const blob = new Blob([finance.exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `finance-backup-${stamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        finance.importData(String(reader.result ?? ""));
        setImportMessage("Backup importado com sucesso.");
      } catch {
        setImportMessage("Nao foi possivel importar esse arquivo.");
      }
    };
    reader.onerror = () => setImportMessage("Erro ao ler o arquivo.");
    reader.readAsText(file);
  }

  return (
    <Panel eyebrow="Seus dados" title="Backup e migracao entre dispositivos">
      <div className="space-y-4">
        <p className="text-sm leading-6 text-slate-600">
          Hoje os dados ficam salvos no navegador deste aparelho. Se voce quiser usar no
          celular e no computador, exporte um backup e importe no outro dispositivo.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <button
            onClick={handleExport}
            className="rounded-2xl border border-slate-200 bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800"
          >
            Exportar backup
          </button>

          <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 font-medium text-slate-900 transition hover:bg-slate-100">
            Importar backup
            <input type="file" accept=".json,application/json" onChange={handleImport} className="hidden" />
          </label>
        </div>

        {importMessage ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {importMessage}
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
