import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, RefreshCw } from 'lucide-react'
import { getVendas } from '../api/vendas'
import { getVendaStatus, todayISO } from '../types'
import VendaCard from '../components/VendaCard'

export default function VendasPage() {
  const [date, setDate] = useState(todayISO())
  const [showPendentesOnly, setShowPendentesOnly] = useState(false)
  const [showRepostosOnly, setShowRepostosOnly] = useState(false)
  const [showUltimosOnly, setShowUltimosOnly] = useState(false)
  const [showTrocasOnly, setShowTrocasOnly] = useState(false)

  const queryKey = ['vendas', date]

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () => getVendas(date),
  })

  const vendas = data?.vendas ?? []
  const pendentes   = vendas.filter((v) => getVendaStatus(v) !== 'reposto').length
  const repostos    = vendas.filter((v) => getVendaStatus(v) === 'reposto').length
  const ultimos     = vendas.filter((v) => v.Qtd_Stock_Artigo === 0).length
  const semAcao     = vendas.filter((v) => getVendaStatus(v) === 'sem_reposicao').length
  const trocas      = vendas.filter((v) => Number(v.Qtd_Vendida) < 0).length
  const vendasToRender = showPendentesOnly
    ? vendas.filter((v) => getVendaStatus(v) !== 'reposto')
    : showRepostosOnly
      ? vendas.filter((v) => getVendaStatus(v) === 'reposto')
      : showUltimosOnly
        ? vendas.filter((v) => v.Qtd_Stock_Artigo === 0)
        : showTrocasOnly
          ? vendas.filter((v) => Number(v.Qtd_Vendida) < 0)
          : vendas

  const formatDateDisplay = (iso: string) =>
    new Intl.DateTimeFormat('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      .format(new Date(iso + 'T12:00:00'))

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Vendas</h1>
          <p className="text-sm text-slate-500 capitalize">{formatDateDisplay(date)}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <CalendarDays size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              className="input pl-8 w-44"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={todayISO()}
            />
          </div>
          <button
            className="btn-secondary px-2.5 py-2"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Atualizar"
          >
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="card px-4 py-3">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-2xl font-bold text-slate-800">{data.total}</p>
          </div>
          <div className="card px-4 py-3">
            <p className="text-xs text-slate-500">Sem ação</p>
            <p className="text-2xl font-bold text-slate-500">{semAcao}</p>
          </div>
          <button
            type="button"
            className={`card px-4 py-3 border-l-4 ${showPendentesOnly ? 'border-red-500 bg-red-50' : 'border-amber-400'} text-left`}
            onClick={() => {
              setShowPendentesOnly((prev) => {
                if (!prev) { setShowRepostosOnly(false); setShowUltimosOnly(false); setShowTrocasOnly(false) }
                return !prev
              })
            }}
            aria-pressed={showPendentesOnly}
          >
            <p className={`text-xs ${showPendentesOnly ? 'text-red-700' : 'text-amber-600'}`}>Pendente</p>
            <p className={`text-2xl font-bold ${showPendentesOnly ? 'text-red-700' : 'text-amber-600'}`}>{pendentes}</p>
          </button>
          <button
            type="button"
            className={`card px-4 py-3 border-l-4 ${showRepostosOnly ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-400'} text-left`}
            onClick={() => {
              setShowRepostosOnly((prev) => {
                if (!prev) { setShowPendentesOnly(false); setShowUltimosOnly(false); setShowTrocasOnly(false) }
                return !prev
              })
            }}
            aria-pressed={showRepostosOnly}
          >
            <p className={`text-xs ${showRepostosOnly ? 'text-emerald-700' : 'text-emerald-600'}`}>Reposto</p>
            <p className={`text-2xl font-bold ${showRepostosOnly ? 'text-emerald-700' : 'text-emerald-600'}`}>{repostos}</p>
          </button>
          <button
            type="button"
            className={`card px-4 py-3 border-l-4 ${showUltimosOnly ? 'border-red-500 bg-red-50' : 'border-red-400'} text-left`}
            onClick={() => {
              setShowUltimosOnly((prev) => {
                if (!prev) { setShowPendentesOnly(false); setShowRepostosOnly(false); setShowTrocasOnly(false) }
                return !prev
              })
            }}
            aria-pressed={showUltimosOnly}
          >
            <p className={`text-xs ${showUltimosOnly ? 'text-red-700' : 'text-red-600'}`}>Artigos Esgotados</p>
            <p className={`text-2xl font-bold ${showUltimosOnly ? 'text-red-700' : 'text-red-600'}`}>{ultimos}</p>
          </button>
          <button
            type="button"
            className={`card px-4 py-3 border-l-4 ${showTrocasOnly ? 'border-pink-500 bg-pink-50' : 'border-pink-400'} text-left`}
            onClick={() => {
              setShowTrocasOnly((prev) => {
                if (!prev) { setShowPendentesOnly(false); setShowRepostosOnly(false); setShowUltimosOnly(false) }
                return !prev
              })
            }}
            aria-pressed={showTrocasOnly}
          >
            <p className={`text-xs ${showTrocasOnly ? 'text-pink-700' : 'text-pink-600'}`}>Artigos Trocados</p>
            <p className={`text-2xl font-bold ${showTrocasOnly ? 'text-pink-700' : 'text-pink-600'}`}>{trocas}</p>
          </button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 h-28 animate-pulse bg-slate-100" />
          ))}
        </div>
      )}

      {isError && (
        <div className="card p-6 text-center text-red-600">
          Erro ao carregar vendas. Verifique a ligação ao servidor.
        </div>
      )}

      {!isLoading && !isError && vendas.length === 0 && (
        <div className="card p-10 text-center text-slate-400">
          Nenhuma venda encontrada para esta data.
        </div>
      )}

      {!isLoading && vendasToRender.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {vendasToRender.map((venda, idx) => (
            <VendaCard key={`${venda.Codigo_Artigo}-${venda.Codigo_Lote}-${venda.Numero_Doc}-${idx}`} venda={venda} queryKey={queryKey} />
          ))}
        </div>
      )}
      {!isLoading && vendasToRender.length === 0 && vendas.length > 0 && (
        <div className="card p-10 text-center text-slate-400">
          {showTrocasOnly
            ? 'Nenhum artigo trocado encontrado para esta data.'
            : showUltimosOnly
              ? 'Nenhum artigo esgotado encontrado para esta data.'
              : showRepostosOnly
                ? 'Nenhuma venda reposta encontrada para esta data.'
                : 'Nenhuma venda pendente encontrada para esta data.'}
        </div>
      )}
    </div>
  )
}
