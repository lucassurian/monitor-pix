"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Activity, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

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

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pix-500/15">
            <Activity size={22} className="text-pix-400" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-xl font-semibold text-paper-50">Monitor Pix</h1>
            <p className="mt-1 text-sm text-paper-100/50">Conciliação bancária automática</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-ink-700 bg-ink-900/60 p-6 backdrop-blur"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-paper-100/60">
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
                className="w-full rounded-xl border border-ink-700 bg-ink-950/60 px-3 py-2.5 text-sm text-paper-50 placeholder:text-paper-100/20 focus:border-pix-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="senha" className="mb-1.5 block text-xs font-medium text-paper-100/60">
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
                className="w-full rounded-xl border border-ink-700 bg-ink-950/60 px-3 py-2.5 text-sm text-paper-50 placeholder:text-paper-100/20 focus:border-pix-500 focus:outline-none"
              />
            </div>

            {erro && (
              <div className="flex items-center gap-2 rounded-xl border border-coral-500/20 bg-coral-500/10 px-3 py-2.5 text-sm text-coral-400">
                <AlertCircle size={14} className="shrink-0" />
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full rounded-xl bg-pix-500 py-2.5 text-sm font-medium text-ink-950 hover:bg-pix-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
