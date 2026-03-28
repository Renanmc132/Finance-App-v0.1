import { ComponentChildren } from "preact";

export const today = new Date().toISOString().slice(0, 10);

export function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

export function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

export function isCurrentMonth(date: string) {
  return date.startsWith(today.slice(0, 7));
}

export function Panel({
  eyebrow,
  title,
  children
}: {
  eyebrow: string;
  title: string;
  children: ComponentChildren;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[32px] border border-white/70 bg-white/90 p-5 shadow-[0_16px_48px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6 md:p-7">
      <p className="break-words text-[0.68rem] uppercase tracking-[0.28em] text-slate-500 sm:text-xs sm:tracking-[0.32em]">
        {eyebrow}
      </p>
      <h2 className="mt-3 max-w-full text-[1.9rem] font-semibold leading-[1.15] text-slate-900 [overflow-wrap:anywhere] sm:text-[2.15rem] md:text-[1.9rem]">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
      {text}
    </div>
  );
}

export function TextInput({
  value,
  placeholder,
  type = "text",
  onInput
}: {
  value: string;
  placeholder: string;
  type?: string;
  onInput: (value: string) => void;
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      type={type}
      onInput={(event: Event) => onInput((event.currentTarget as HTMLInputElement).value)}
      className="min-h-[52px] min-w-0 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:bg-white"
    />
  );
}

export function SelectInput({
  value,
  onChange,
  children
}: {
  value: string;
  onChange: (value: string) => void;
  children: ComponentChildren;
}) {
  return (
    <select
      value={value}
      onChange={(event: Event) =>
        onChange((event.currentTarget as HTMLSelectElement).value)
      }
      className="min-h-[52px] min-w-0 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:bg-white"
    >
      {children}
    </select>
  );
}
