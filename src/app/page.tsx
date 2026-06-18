"use client";

import { useEffect, useState, useCallback } from "react";
import { signOut } from "next-auth/react";
import { Plus, RefreshCw, Activity, CheckCircle2, Clock, AlertTriangle, Search, LogOut } from "lucide-react";
import type { Conciliacao, StatusConciliacao } from "@/types/domain";
import { MetricCard } from "@/components/MetricCard";
import { ConciliacaoCard } from "@/components/ConciliacaoCard";
import { NovoComprovanteModal } from "@/components/NovoComprovanteModal";

interface Resumo {
  total: number;
  conciliados: number;
  pendentes: number;
  divergentes: number;
}

export default function MonitorPixPage() {
  const [conciliacoes, setConciliacoes] = useState<Conciliacao[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<StatusConciliacao | "todos">("todos");
  const [busca, setBusca] = useState("");
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const resposta = await fetch("/api/conciliacoes");
      const data = await resposta.json();
      setConciliacoes(data.conciliacoes);
      setResumo(data.resumo);
      setUltimaAtualizacao(new Date());
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const conciliacoesFiltradas = conciliacoes.filter((c) => {
    if (filtroStatus !== "todos" && c.status !== filtroStatus) return false;
    if (busca) {
      const termo = busca.toLowerCase();
      const corresponde =
        c.comprovante.clienteNome.toLowerCase().includes(termo) ||
        c.comprovante.clienteDocumento.includes(termo) ||
        c.comprovante.idTransacaoE2E?.toLowerCase().includes(termo);
      if (!corresponde) return false;
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-ink-950 pb-16">
      {/* Header */}
      <header className="border-b border-ink-700 bg-ink-900/40">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pix-500/15">
                <Activity size={18} className="text-pix-400" />
              </div>
              <div>
                <h1 className="font-display text-lg font-semibold leading-tight text-paper-50">
                  Monitor Pix
                </h1>
                <p className="text-xs text-paper-100/40">Conciliação bancária automática</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setModalAberto(true)}
                className="flex items-center gap-1.5 rounded-xl bg-pix-500 px-3.5 py-2 text-sm font-medium text-ink-950 hover:bg-pix-400"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Novo comprovante</span>
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-1.5 rounded-xl border border-ink-700 px-3 py-2 text-sm text-paper-100/50 hover:bg-ink-800 hover:text-paper-50"
                title="Sair"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        {/* Métricas */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="Total" value={resumo?.total ?? "—"} icon={Activity} />
          <MetricCard
            label="Conciliados"
            value={resumo?.conciliados ?? "—"}
            icon={CheckCircle2}
            tone="pix"
          />
          <MetricCard label="Pendentes" value={resumo?.pendentes ?? "—"} icon={Clock} tone="amber" />
          <MetricCard
            label="Divergentes"
            value={resumo?.divergentes ?? "—"}
            icon={AlertTriangle}
            tone="coral"
          />
        </div>

        {/* Barra de ações: busca, filtro, atualizar */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto">
            <FiltroBotao
              ativo={filtroStatus === "todos"}
              onClick={() => setFiltroStatus("todos")}
              label="Todos"
            />
            <FiltroBotao
              ativo={filtroStatus === "conciliado"}
              onClick={() => setFiltroStatus("conciliado")}
              label="Conciliados"
            />
            <FiltroBotao
              ativo={filtroStatus === "pendente"}
              onClick={() => setFiltroStatus("pendente")}
              label="Pendentes"
            />
            <FiltroBotao
              ativo={filtroStatus === "divergente"}
              onClick={() => setFiltroStatus("divergente")}
              label="Divergentes"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-100/30"
              />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, CPF ou ID..."
                className="w-full rounded-xl border border-ink-700 bg-ink-900/60 py-2 pl-8 pr-3 text-sm text-paper-50 placeholder:text-paper-100/30 focus:border-pix-500 focus:outline-none sm:w-56"
              />
            </div>
            <button
              onClick={carregarDados}
              className="flex items-center gap-1.5 rounded-xl border border-ink-700 px-3 py-2 text-sm text-paper-100/60 hover:bg-ink-800 hover:text-paper-50"
              title="Atualizar dados do banco"
            >
              <RefreshCw size={14} className={carregando ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {ultimaAtualizacao && (
          <p className="mt-2 text-xs text-paper-100/30">
            Última sincronização com o banco: {ultimaAtualizacao.toLocaleTimeString("pt-BR")}
          </p>
        )}

        {/* Lista de conciliações */}
        <div className="mt-4 space-y-2">
          {carregando && conciliacoes.length === 0 && (
            <div className="rounded-2xl border border-ink-700 bg-ink-900/40 p-8 text-center text-sm text-paper-100/40">
              Buscando lançamentos no banco e comparando com os comprovantes...
            </div>
          )}

          {!carregando && conciliacoesFiltradas.length === 0 && (
            <div className="rounded-2xl border border-ink-700 bg-ink-900/40 p-8 text-center text-sm text-paper-100/40">
              Nenhuma conciliação encontrada com esses filtros.
            </div>
          )}

          {conciliacoesFiltradas.map((c) => (
            <ConciliacaoCard key={c.id} conciliacao={c} />
          ))}
        </div>
      </div>

      <NovoComprovanteModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSalvar={carregarDados}
      />
    </main>
  );
}

function FiltroBotao({
  ativo,
  onClick,
  label,
}: {
  ativo: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        ativo
          ? "bg-paper-50 text-ink-950"
          : "bg-ink-900/60 text-paper-100/50 hover:bg-ink-800 hover:text-paper-50"
      }`}
    >
      {label}
    </button>
  );
}
