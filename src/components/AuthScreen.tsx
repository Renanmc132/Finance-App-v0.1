import { useState } from "preact/hooks";
import { supabase } from "../lib/supabase";

export default function AuthScreen({ isRecovery = false }: { isRecovery?: boolean }) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(isRecovery ? "login" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!supabase) return;

    setLoading(true);
    setMessage("");

    try {
      if (isRecovery) {
        if (password !== confirmPassword) {
          throw new Error("As senhas precisam ser iguais.");
        }
        const { error } = await supabase.auth.updateUser({
          password
        });
        if (error) throw error;
        window.history.replaceState({}, document.title, window.location.pathname);
        setMessage("Senha atualizada. Agora voce ja pode entrar normalmente.");
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name
            }
          }
        });
        if (error) throw error;
        setMessage("Conta criada. Se o Supabase pedir confirmacao por email, confirme antes de entrar.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
        });
        if (error) throw error;
        setMessage("Email de recuperacao enviado. Abra o link para criar uma nova senha.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel continuar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
            Finance App
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-900">
            Seu controle financeiro, salvo na nuvem e acessivel no celular e no computador.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Cada pessoa usa a propria conta com email e senha. Assim os dados ficam
            separados e voce consegue abrir o app de qualquer lugar.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Acesso</p>
              <p className="mt-2 font-medium text-slate-900">PC e celular</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Contas</p>
              <p className="mt-2 font-medium text-slate-900">Uma por pessoa</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Sincronizacao</p>
              <p className="mt-2 font-medium text-slate-900">Banco online</p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          {!isRecovery ? (
            <div className="flex gap-2 rounded-2xl bg-slate-100 p-1">
              <button
                onClick={() => setMode("login")}
                className={
                  mode === "login"
                    ? "flex-1 rounded-xl bg-white px-4 py-2 font-medium text-slate-900 shadow-sm"
                    : "flex-1 rounded-xl px-4 py-2 text-slate-500"
                }
              >
                Entrar
              </button>
              <button
                onClick={() => setMode("signup")}
                className={
                  mode === "signup"
                    ? "flex-1 rounded-xl bg-white px-4 py-2 font-medium text-slate-900 shadow-sm"
                    : "flex-1 rounded-xl px-4 py-2 text-slate-500"
                }
              >
                Criar conta
              </button>
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            {mode === "signup" && !isRecovery ? (
              <input
                value={name}
                onInput={(event: Event) => setName((event.currentTarget as HTMLInputElement).value)}
                placeholder="Seu nome"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none"
              />
            ) : null}
            {!isRecovery ? (
              <input
                value={email}
                onInput={(event: Event) => setEmail((event.currentTarget as HTMLInputElement).value)}
                placeholder="Seu email"
                type="email"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none"
              />
            ) : null}
            {mode !== "forgot" || isRecovery ? (
              <input
                value={password}
                onInput={(event: Event) => setPassword((event.currentTarget as HTMLInputElement).value)}
                placeholder={isRecovery ? "Nova senha" : "Sua senha"}
                type="password"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none"
              />
            ) : null}
            {isRecovery ? (
              <input
                value={confirmPassword}
                onInput={(event: Event) =>
                  setConfirmPassword((event.currentTarget as HTMLInputElement).value)
                }
                placeholder="Confirme a nova senha"
                type="password"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none"
              />
            ) : null}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800 disabled:bg-slate-400"
            >
              {loading
                ? "Carregando..."
                : isRecovery
                  ? "Salvar nova senha"
                  : mode === "login"
                    ? "Entrar"
                    : mode === "signup"
                      ? "Criar conta"
                      : "Enviar email de recuperacao"}
            </button>
            {!isRecovery && mode === "login" ? (
              <button
                onClick={() => {
                  setMode("forgot");
                  setMessage("");
                  setPassword("");
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Esqueci minha senha
              </button>
            ) : null}
            {!isRecovery && mode === "forgot" ? (
              <button
                onClick={() => {
                  setMode("login");
                  setMessage("");
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Voltar para entrar
              </button>
            ) : null}
            {message ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {message}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
