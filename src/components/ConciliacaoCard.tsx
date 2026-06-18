"use client";

import { useState } from "react";
import { ChevronDown, ArrowRight, FileText, Landmark } from "lucide-react";
import clsx from "clsx";
import type { Conciliacao } from "@/types/domain";
import { StatusBadge } from "./StatusBadge";

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarDocumento(doc: string): string {
  const limpo = doc.replace(/\D/g, "");
  if (limpo.length === 11) {
    return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return doc;
}

export function ConciliacaoCard({ conciliacao }: { conciliacao: Conciliacao }) {
  const [expandido, setExpandido] = useState(false);
  const { comprovante, lancamento, status, motivosDivergencia, scoreConfianca } = conciliacao;

  return (
    <div
      className={clsx(
        "rounded-2xl border bg-ink-900/40 transition-colors",
        status === "divergente" && "border-coral-500/30",
        status === "pendente" && "border-amber-500/20",
        status === "conciliado" && "border-ink-700"
      )}
    >
      <button
        onClick={() => setExpandido(!expandido)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left"
      >
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <StatusBadge status={status} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-paper-50">{comprovante.clienteNome}</p>
            <p className="text-xs text-paper-100/40">{formatarDataHora(comprovante.dataHora)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 whitespace-nowrap">
          <span className="font-mono text-sm font-medium text-paper-50">
            {formatarMoeda(comprovante.valor)}
          </span>
          <ChevronDown
            size={16}
            className={clsx(
              "text-paper-100/40 transition-transform",
              expandido && "rotate-180"
            )}
          />
        </div>
      </button>

      {expandido && (
        <div className="border-t border-ink-700 px-4 pb-4 pt-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
            {/* Lado do comprovante */}
            <div className="rounded-xl bg-ink-800/60 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-paper-100/50">
                <FileText size={12} />
                COMPROVANTE INFORMADO
              </div>
              <dl className="space-y-1.5 text-xs">
                <Linha label="Nome" valor={comprovante.clienteNome} />
                <Linha label="Documento" valor={formatarDocumento(comprovante.clienteDocumento)} />
                <Linha label="Valor" valor={formatarMoeda(comprovante.valor)} mono />
                <Linha label="Data/Hora" valor={formatarDataHora(comprovante.dataHora)} />
                <Linha label="ID E2E" valor={comprovante.idTransacaoE2E || "Não informado"} mono />
                <Linha label="Cadastrado por" valor={comprovante.criadoPor} />
              </dl>
            </div>

            <div className="hidden items-center justify-center sm:flex">
              <ArrowRight size={16} className="text-paper-100/30" />
            </div>

            {/* Lado do lançamento bancário */}
            <div className="rounded-xl bg-ink-800/60 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-paper-100/50">
                <Landmark size={12} />
                LANÇAMENTO NO BANCO
              </div>
              {lancamento ? (
                <dl className="space-y-1.5 text-xs">
                  <Linha label="Nome" valor={lancamento.pagadorNome} />
                  <Linha label="Documento" valor={formatarDocumento(lancamento.pagadorDocumento)} />
                  <Linha label="Valor" valor={formatarMoeda(lancamento.valor)} mono />
                  <Linha label="Data/Hora" valor={formatarDataHora(lancamento.dataHora)} />
                  <Linha label="ID E2E" valor={lancamento.idTransacaoE2E} mono />
                  <Linha label="Conta" valor={lancamento.contaDestino} />
                </dl>
              ) : (
                <p className="text-xs italic text-paper-100/40">
                  Ainda não encontramos um lançamento correspondente no banco.
                </p>
              )}
            </div>
          </div>

          {motivosDivergencia.length > 0 && (
            <div className="mt-3 rounded-xl bg-ink-800/40 p-3">
              <p className="mb-1 text-xs font-medium text-paper-100/50">Observações da conciliação</p>
              <ul className="space-y-1 text-xs text-paper-100/70">
                {motivosDivergencia.map((motivo, i) => (
                  <li key={i}>• {motivo}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between text-xs text-paper-100/40">
            <span>Confiança do match: {scoreConfianca}%</span>
            {comprovante.observacoes && <span className="italic">"{comprovante.observacoes}"</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function Linha({ label, valor, mono }: { label: string; valor: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-paper-100/40">{label}</dt>
      <dd className={clsx("truncate text-right text-paper-50", mono && "font-mono")}>{valor}</dd>
    </div>
  );
}
