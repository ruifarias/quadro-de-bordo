import { useState } from 'react'
import { Package2, Info } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { criarReposicao, marcarReposto, cancelarReposicao } from '../api/reposicoes'
import { useAuth } from '../contexts/AuthContext'
import StatusBadge from './StatusBadge'
import type { Venda } from '../types'
import { getVendaStatus, formatDateTime, formatCurrency } from '../types'

interface Props {
  venda: Venda
  queryKey: unknown[]
}

export default function VendaCard({ venda, queryKey }: Props) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const status = getVendaStatus(venda)
  const descontoValue = Number(String(venda.Desconto).replace(',', '.')) || 0
  const descontoPercent = new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(descontoValue) + '%'
  const invalidate = () => qc.invalidateQueries({ queryKey })

  const mutRepor = useMutation({
    mutationFn: async () => {
      const id = venda.Reposicao_Id ?? (await criarReposicao(venda)).id
      const obs = isExchange ? 'Troca' : stockCritical ? 'Esgotado' : undefined
      return marcarReposto(id, obs)
    },
    onSuccess: () => invalidate(),
    onError:   () => invalidate(),
  })

  const mutCancelar = useMutation({
    mutationFn: () => cancelarReposicao(venda.Reposicao_Id!),
    onSuccess: () => invalidate(),
  })

  const [showImg, setShowImg] = useState(false)
  const stockCritical = venda.Qtd_Stock_Artigo <= 0
  const isExchange = Number(venda.Qtd_Vendida) < 0

  return (
    <>
      <div className="card p-3 flex flex-col gap-2 bg-white border border-slate-200 shadow-sm rounded-3xl">

        {/* Linha superior: imagem + info + badge + botão */}
        <div className="flex gap-3">
          <div className="shrink-0">
            {venda.imagem_base64 ? (
              <img
                src={`data:image/jpeg;base64,${venda.imagem_base64}`}
                alt={venda.Artigo}
                className="w-20 h-20 object-cover rounded-2xl border border-slate-100 cursor-zoom-in"
                onClick={() => setShowImg(true)}
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Package2 size={26} className="text-slate-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-4 text-sm uppercase tracking-[0.14em] text-slate-900 font-semibold mb-1">
                  <span className="text-blue-600">{venda.Codigo_Artigo}</span>
                  <span className="normal-case text-slate-900">Vendedor: <span className="text-blue-600">{venda.Codigo_Entidade}</span> <span className="text-blue-600">{venda.nome_vendedor ? venda.nome_vendedor.split(' ')[0] : '—'}</span></span>
                  <span>{formatDateTime(venda.Data_hora)}</span>
                </div>
                <p className="text-sm font-semibold leading-tight truncate text-slate-900" title={venda.Artigo}>
                  {venda.Artigo}
                </p>
                {venda.Descricao_Lote && (
                  <p className="mt-0.5 text-sm font-semibold text-blue-600">
                    {venda.Descricao_Lote}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={status} />
                {isExchange && (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold bg-pink-100 text-pink-600 tracking-wide">
                    TROCA
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(status === 'sem_reposicao' || status === 'pendente') && (
                <button
                  className="btn-success text-xs py-1.5"
                  onClick={() => mutRepor.mutate()}
                  disabled={mutRepor.isPending}
                >
                  {mutRepor.isPending ? 'A processar...' : 'Marcar como Reposto'}
                </button>
              )}
              {status === 'reposto' && (
                <button
                  className="btn-secondary text-xs py-1.5"
                  onClick={() => mutCancelar.mutate()}
                  disabled={mutCancelar.isPending}
                >
                  {mutCancelar.isPending ? 'A reverter...' : 'Cancelar Reposição'}
                </button>
              )}
              {stockCritical && (
                <span className="inline-flex items-center rounded-lg border border-red-400 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 tracking-wide">
                  ESGOTADO
                </span>
              )}
              {status === 'reposto' && venda.Data_Reposicao && (
                <p className="text-xs text-emerald-600 self-center">
                  Reposto em {formatDateTime(venda.Data_Reposicao)}
                  {venda.Observacoes && ` · ${venda.Observacoes}`}
                </p>
              )}
            </div>

            {(mutRepor.isError || mutCancelar.isError) && (
              <p className="text-xs text-red-600">Erro ao processar. Tente novamente.</p>
            )}
          </div>
        </div>

        {/* Linha inferior: métricas em igual largura, texto centrado */}
        <div className={`grid gap-1.5 ${user?.role === 'gestor' ? 'grid-cols-7' : 'grid-cols-6'}`}>
          <div className="rounded-xl bg-slate-50 px-2 py-1.5 text-center">
            <p className="text-[9px] uppercase tracking-[0.15em] text-slate-400">Qtd vendida</p>
            <p className={`mt-0.5 text-sm font-semibold ${isExchange ? 'text-pink-600' : 'text-slate-900'}`}>{venda.Qtd_Vendida}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-2 py-1.5 text-center">
            <p className="text-[9px] uppercase tracking-[0.15em] text-slate-400">Stock lote</p>
            <p className="mt-0.5 text-sm font-bold text-slate-950">{venda.Qtd_Stock_Lote}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-2 py-1.5 text-center">
            <p className="text-[9px] uppercase tracking-[0.15em] text-slate-400">Stock Total</p>
            <p className="mt-0.5 text-sm font-semibold text-orange-500">
              {venda.Qtd_Stock_Artigo}{stockCritical && ' ⚠'}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-2 py-1.5 text-center">
            <p className="text-[9px] uppercase tracking-[0.15em] text-slate-400">Preço unit.</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">{formatCurrency(venda.Pr_Unit_Doc)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-1.5 py-1.5 text-center">
            <p className="text-[8px] uppercase tracking-[0.1em] text-slate-400">Desc.</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-900">{descontoPercent}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-2 py-1.5 text-center">
            <p className="text-[9px] uppercase tracking-[0.15em] text-slate-400">Preço Líquido</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">{formatCurrency(venda.Preco_Liquido)}</p>
          </div>
          {user?.role === 'gestor' && (
            <div className="relative group rounded-xl bg-slate-50 px-2 py-1.5 text-center">
              <div className="flex items-center justify-center gap-1">
                <p className="text-[9px] uppercase tracking-[0.15em] text-slate-400">Lucro</p>
                <Info size={12} className="text-slate-400 cursor-help" />
              </div>
              <p className={`mt-0.5 text-sm font-semibold ${venda.Lucro >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(venda.Lucro)}
              </p>

              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col bg-slate-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 pointer-events-none">
                <span className="font-semibold mb-1">Fórmula do Lucro:</span>
                <span>Qtd × (Valor Liq - Custo)</span>
                <span className="text-slate-300 mt-1">
                  {isExchange ? '⚠ Troca: Lucro será negativo' : '✓ Venda normal'}
                </span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
              </div>
            </div>
          )}
        </div>

      </div>

      {showImg && venda.imagem_base64 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowImg(false)}
        >
          <img
            src={`data:image/jpeg;base64,${venda.imagem_base64}`}
            alt={venda.Artigo}
            className="w-[480px] h-[480px] object-cover rounded-3xl shadow-2xl border-2 border-white"
            onClick={() => setShowImg(false)}
          />
        </div>
      )}
    </>
  )
}
