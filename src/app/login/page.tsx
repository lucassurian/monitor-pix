"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Activity, AlertCircle, Sun, Moon } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("login-theme");
    if (saved === "dark") setDark(true);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("login-theme", next ? "dark" : "light");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const resultado = await signIn("credentials", {
      email,
      password: senha,
      redirect: false,
    });

    setCarregando(false);

    if (resultado?.error) {
      setErro("Email ou senha incorretos.");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  const bg = dark ? "bg-ink-950" : "bg-paper-50";
  const cardBg = dark ? "bg-ink-900/60 border-ink-700" : "bg-white border-gray-200";
  const title = dark ? "text-paper-50" : "text-ink-950";
  const subtitle = dark ? "text-paper-100/50" : "text-ink-700/50";
  const label = dark ? "text-paper-100/60" : "text-ink-700/70";
  const input = dark
    ? "border-ink-700 bg-ink-950/60 text-paper-50 placeholder:text-paper-100/20"
    : "border-gray-200 bg-gray-50 text-ink-950 placeholder:text-ink-700/30";
  const toggle = dark
    ? "text-paper-100/40 hover:text-paper-50"
    : "text-ink-700/40 hover:text-ink-950";
  const iconBg = dark ? "bg-pix-500/15" : "bg-pix-500/10";
  const iconColor = dark ? "text-pix-400" : "text-pix-600";

  return (
    <main className={`flex min-h-screen items-center justify-center ${bg} px-4 transition-colors duration-200`}>
      <div className="w-full max-w-sm">
        {/* Cabeçalho */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
            <Activity size={22} className={iconColor} />
          </div>
          <div className="text-center">
            <h1 className={`font-display text-xl font-semibold ${title}`}>Monitor Pix</h1>
            <p className={`mt-1 text-sm ${subtitle}`}>Conciliação bancária automática</p>
          </div>
        </div>

        {/* Card do formulário */}
        <div className={`relative rounded-2xl border ${cardBg} p-6`}>
          {/* Botão de tema */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`absolute right-4 top-4 rounded-lg p-1.5 transition-colors ${toggle}`}
            title={dark ? "Modo claro" : "Modo escuro"}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className={`mb-1.5 block text-xs font-medium ${label}`}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="financeiro@empresa.com.br"
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:border-pix-500 focus:outline-none ${input}`}
                />
              </div>

              <div>
                <label htmlFor="senha" className={`mb-1.5 block text-xs font-medium ${label}`}>
                  Senha
                </label>
                <input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:border-pix-500 focus:outline-none ${input}`}
                />
              </div>

              {erro && (
                <div className="flex items-center gap-2 rounded-xl border border-coral-500/20 bg-coral-500/10 px-3 py-2.5 text-sm text-coral-500">
                  <AlertCircle size={14} className="shrink-0" />
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={carregando}
                className="w-full rounded-xl bg-pix-500 py-2.5 text-sm font-medium text-ink-950 hover:bg-pix-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {carregando ? "Entrando..." : "Entrar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
