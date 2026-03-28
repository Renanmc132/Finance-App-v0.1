import { useState } from "preact/hooks";
import { FinanceStore } from "../hooks/useFinance";
import { EmptyState, Panel, SelectInput, TextInput, formatCurrency, formatDate, today } from "./financeUi";

export default function CreditCardsPanel({ finance }: { finance: FinanceStore }) {
  const [cardForm, setCardForm] = useState({
    name: "",
    accountId: finance.accounts[0]?.id ?? "",
    limitAmount: "",
    closingDay: "25",
    dueDay: "5"
  });
  const [chargeForm, setChargeForm] = useState({
    cardId: finance.creditCards[0]?.id ?? "",
    description: "",
    amount: "",
    date: today,
    categoryId: finance.categories[0]?.id ?? "",
    type: "fixed" as const,
    installments: "1"
  });

  const categoryName = (categoryId: string) =>
    finance.categories.find((category) => category.id === categoryId)?.name ?? "Sem categoria";
  const accountName = (accountId: string) =>
    finance.accounts.find((account) => account.id === accountId)?.name ?? "Banco removido";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel eyebrow="Cartao de credito" title="Cadastre seus cartoes e acompanhe o limite">
          <div className="grid gap-3">
            <p className="text-sm leading-6 text-slate-600">
              Aqui voce cria o cartao e diz a qual banco ele pertence. O limite ajuda a
              acompanhar quanto ainda sobra para usar no credito.
            </p>
            <TextInput
              value={cardForm.name}
              placeholder="Ex.: Nubank cartao, Inter platinum"
              onInput={(name) => setCardForm((prev) => ({ ...prev, name }))}
            />
            <SelectInput
              value={cardForm.accountId}
              onChange={(accountId) => setCardForm((prev) => ({ ...prev, accountId }))}
            >
              <option value="">Qual banco paga essa fatura?</option>
              {finance.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </SelectInput>
            <div className="grid gap-3 sm:grid-cols-3">
              <TextInput
                value={cardForm.limitAmount}
                placeholder="Limite do cartao"
                type="number"
                onInput={(limitAmount) => setCardForm((prev) => ({ ...prev, limitAmount }))}
              />
              <TextInput
                value={cardForm.closingDay}
                placeholder="Dia de fechamento"
                type="number"
                onInput={(closingDay) => setCardForm((prev) => ({ ...prev, closingDay }))}
              />
              <TextInput
                value={cardForm.dueDay}
                placeholder="Dia de vencimento"
                type="number"
                onInput={(dueDay) => setCardForm((prev) => ({ ...prev, dueDay }))}
              />
            </div>
            <button
              onClick={() => {
                finance.addCreditCard({
                  name: cardForm.name,
                  accountId: cardForm.accountId,
                  limitAmount: Number(cardForm.limitAmount),
                  closingDay: Number(cardForm.closingDay),
                  dueDay: Number(cardForm.dueDay)
                });
                setCardForm({
                  name: "",
                  accountId: finance.accounts[0]?.id ?? "",
                  limitAmount: "",
                  closingDay: "25",
                  dueDay: "5"
                });
              }}
              className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800"
            >
              Adicionar cartao
            </button>
          </div>
        </Panel>

        <Panel eyebrow="Nova compra no credito" title="Registre o que entra na fatura">
          {finance.creditCards.length === 0 ? (
            <EmptyState text="Cadastre um cartao antes de lancar compras na fatura." />
          ) : (
            <div className="grid gap-3">
              <p className="text-sm leading-6 text-slate-600">
                Essas compras ficam separadas das saidas pagas. Elas so descontam do banco
                quando voce clicar em fatura paga.
              </p>
              <SelectInput
                value={chargeForm.cardId}
                onChange={(cardId) => setChargeForm((prev) => ({ ...prev, cardId }))}
              >
                <option value="">Em qual cartao foi a compra?</option>
                {finance.creditCards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                  </option>
                ))}
              </SelectInput>
              <TextInput
                value={chargeForm.description}
                placeholder="Ex.: Spotify, mercado, assinatura"
                onInput={(description) => setChargeForm((prev) => ({ ...prev, description }))}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput
                  value={chargeForm.amount}
                  placeholder="Valor da compra"
                  type="number"
                  onInput={(amount) => setChargeForm((prev) => ({ ...prev, amount }))}
                />
                <TextInput
                  value={chargeForm.date}
                  placeholder="Data da compra"
                  type="date"
                  onInput={(date) => setChargeForm((prev) => ({ ...prev, date }))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <SelectInput
                  value={chargeForm.categoryId}
                  onChange={(categoryId) => setChargeForm((prev) => ({ ...prev, categoryId }))}
                >
                  <option value="">Escolha a categoria</option>
                  {finance.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </SelectInput>
                <SelectInput
                  value={chargeForm.type}
                  onChange={(type) =>
                    setChargeForm((prev) => ({
                      ...prev,
                      type: type as typeof prev.type
                    }))
                  }
                >
                  <option value="fixed">{finance.preferences.expenseTypeLabels.fixed}</option>
                  <option value="expense">{finance.preferences.expenseTypeLabels.expense}</option>
                  <option value="installment">{finance.preferences.expenseTypeLabels.installment}</option>
                </SelectInput>
                <TextInput
                  value={chargeForm.installments}
                  placeholder="Qtd. parcelas"
                  type="number"
                  onInput={(installments) => setChargeForm((prev) => ({ ...prev, installments }))}
                />
              </div>
              <button
                onClick={() => {
                  finance.addCreditCardCharge({
                    cardId: chargeForm.cardId,
                    description: chargeForm.description,
                    amount: Number(chargeForm.amount),
                    date: chargeForm.date,
                    categoryId: chargeForm.categoryId,
                    type: chargeForm.type,
                    installments: Number(chargeForm.installments || 1),
                    currentInstallment:
                      Number(chargeForm.installments || 1) > 1 ? 1 : undefined
                  });
                  setChargeForm((prev) => ({
                    ...prev,
                    description: "",
                    amount: "",
                    installments: "1"
                  }));
                }}
                className="rounded-2xl bg-rose-300 px-5 py-3 font-medium text-slate-950 transition hover:bg-rose-200"
              >
                Adicionar na fatura
              </button>
            </div>
          )}
        </Panel>
      </div>

      <Panel eyebrow="Faturas" title="O que ainda nao foi pago no credito">
        {finance.creditCards.length === 0 ? (
          <EmptyState text="Seus cartoes vao aparecer aqui assim que voce cadastrar o primeiro." />
        ) : (
          <div className="space-y-4">
            {finance.creditCards.map((card) => {
              const openCharges = finance.creditCardCharges.filter(
                (charge) => charge.cardId === card.id && charge.invoiceStatus === "open"
              );
              const paidCharges = finance.creditCardCharges.filter(
                (charge) => charge.cardId === card.id && charge.invoiceStatus === "paid"
              );
              const openTotal = openCharges.reduce((sum, charge) => sum + charge.amount, 0);
              const availableLimit = card.limitAmount - openTotal;

              return (
                <div
                  key={card.id}
                  className="rounded-[28px] border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xl font-semibold text-slate-900">{card.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Banco pagador: {accountName(card.accountId)}. Fecha dia {card.closingDay} e
                        vence dia {card.dueDay}.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Limite</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {formatCurrency(card.limitAmount)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-amber-700">Em aberto</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {formatCurrency(openTotal)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Limite livre</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {formatCurrency(availableLimit)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 xl:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-slate-900">Ainda nao pagos</h3>
                        <button
                          onClick={() => finance.payCreditCardInvoice(card.id, today)}
                          disabled={openCharges.length === 0}
                          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          Fatura paga
                        </button>
                      </div>
                      {openCharges.length === 0 ? (
                        <EmptyState text="Nenhum item em aberto nesta fatura." />
                      ) : (
                        openCharges.map((charge) => (
                          <div
                            key={charge.id}
                            className="rounded-2xl border border-slate-200 bg-white p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium text-slate-900">{charge.description}</p>
                                <p className="text-sm text-slate-500">
                                  {categoryName(charge.categoryId)} - {formatDate(charge.date)}
                                </p>
                                {charge.installments && charge.installments > 1 ? (
                                  <p className="mt-1 text-sm text-slate-500">
                                    Parcela {charge.currentInstallment}/{charge.installments}
                                  </p>
                                ) : null}
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-rose-600">
                                  {formatCurrency(charge.amount)}
                                </p>
                                <button
                                  onClick={() => finance.removeCreditCardCharge(charge.id)}
                                  className="mt-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"
                                >
                                  Excluir
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-slate-900">Ultimas faturas pagas</h3>
                        <button
                          onClick={() => finance.removeCreditCard(card.id)}
                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"
                        >
                          Excluir cartao
                        </button>
                      </div>
                      {paidCharges.length === 0 ? (
                        <EmptyState text="Nenhuma fatura paga registrada ainda." />
                      ) : (
                        paidCharges.slice(0, 6).map((charge) => (
                          <div
                            key={charge.id}
                            className="rounded-2xl border border-slate-200 bg-white p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium text-slate-900">{charge.description}</p>
                                <p className="text-sm text-slate-500">
                                  Pago na fatura de {formatDate(charge.invoicePaidAt)}
                                </p>
                              </div>
                              <p className="font-semibold text-slate-900">
                                {formatCurrency(charge.amount)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}