"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface NovoComprovanteModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSalvar: () => void;
}

export function NovoComprovanteModal({ aberto, onFechar, onSalvar }: NovoComprovanteModalProps) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [form, setForm] = useState({
    clienteNome: "",
    clienteDocumento: "",
    valor: "",
    dataHora: "",
    idTransacaoE2E: "",
    observacoes: "",
  });

  if (!aberto) return null;

  function atualizarCampo(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!form.clienteNome || !form.clienteDocumento || !form.valor || !form.dataHora) {
      setErro("Preencha nome, documento, valor e data/hora — esses campos são obrigatórios.");
      return;
    }

    setCarregando(true);
    try {
      const resposta = await fetch("/api/comprovantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          valor: Number(form.valor.replace(",", ".")),
          dataHora: new Date(form.dataHora).toISOString(),
          criadoPor: "Você",
        }),
      });

      if (!resposta.ok) {
        const data = await resposta.json();
        throw new Error(data.erro || "Não foi possível salvar o comprovante.");
      }

      setForm({ clienteNome: "", clienteDocumento: "", valor: "", dataHora: "", idTransacaoE2E: "", observacoes: "" });
      onSalvar();
      onFechar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado ao salvar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg rounded-t-2xl border border-gray-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-950 dark:text-paper-50">
            Novo comprovante
          </h2>
          <button
            onClick={onFechar}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-paper-100/50 dark:hover:bg-ink-800 dark:hover:text-paper-50"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-500 dark:text-paper-100/50">
          Digite os dados do comprovante que o cliente enviou. Vamos cruzar essas informações com os lançamentos recebidos no banco.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Campo label="Nome do cliente" obrigatorio>
            <input
              type="text"
              value={form.clienteNome}
              onChange={(e) => atualizarCampo("clienteNome", e.target.value)}
              placeholder="Ex: João Pedro Almeida"
              className="campo-input"
            />
          </Campo>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="CPF/CNPJ do pagador" obrigatorio>
              <input
                type="text"
                value={form.clienteDocumento}
                onChange={(e) => atualizarCampo("clienteDocumento", e.target.value)}
                placeholder="000.000.000-00"
                className="campo-input"
              />
            </Campo>
            <Campo label="Valor (R$)" obrigatorio>
              <input
                type="text"
                inputMode="decimal"
                value={form.valor}
                onChange={(e) => atualizarCampo("valor", e.target.value)}
                placeholder="287,90"
                className="campo-input font-mono"
              />
            </Campo>
          </div>

          <Campo label="Data e hora do pagamento" obrigatorio>
            <input
              type="datetime-local"
              value={form.dataHora}
              onChange={(e) => atualizarCampo("dataHora", e.target.value)}
              className="campo-input"
            />
          </Campo>

          <Campo label="ID da transação E2E (opcional)">
            <input
              type="text"
              value={form.idTransacaoE2E}
              onChange={(e) => atualizarCampo("idTransacaoE2E", e.target.value)}
              placeholder="E00000000202401011200abcdef123456"
              className="campo-input font-mono text-xs"
            />
          </Campo>

          <Campo label="Observações (opcional)">
            <textarea
              value={form.observacoes}
              onChange={(e) => atualizarCampo("observacoes", e.target.value)}
              placeholder="Qualquer detalhe relevante sobre esse comprovante"
              rows={2}
              className="campo-input resize-none"
            />
          </Campo>

          {erro && (
            <p className="rounded-lg bg-coral-500/10 px-3 py-2 text-xs text-coral-500">{erro}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onFechar}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-ink-700 dark:text-paper-100/70 dark:hover:bg-ink-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={carregando}
              className="flex-1 rounded-xl bg-pix-500 px-4 py-2.5 text-sm font-medium text-ink-950 hover:bg-pix-400 disabled:opacity-50"
            >
              {carregando ? "Salvando..." : "Salvar comprovante"}
            </button>
          </div>
        </form>
      </div>

      <style jsx global>{`
        .campo-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          background-color: #f9fafb;
          padding: 0.6rem 0.75rem;
          font-size: 0.875rem;
          color: #0B0F0E;
        }
        .campo-input::placeholder {
          color: rgba(107, 114, 128, 0.7);
        }
        .campo-input:focus {
          outline: none;
          border-color: #32bcad;
        }
        :is(.dark) .campo-input {
          border-color: #212b28;
          background-color: #171f1d;
          color: #f6f7f4;
        }
        :is(.dark) .campo-input::placeholder {
          color: rgba(246, 247, 244, 0.3);
        }
      `}</style>
    </div>
  );
}

function Campo({ label, obrigatorio, children }: { label: string; obrigatorio?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-paper-100/60">
        {label} {obrigatorio && <span className="text-coral-500">*</span>}
      </span>
      {children}
    </label>
  );
}
