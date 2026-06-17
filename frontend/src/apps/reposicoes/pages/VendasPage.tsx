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
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Vendas</h1>
          <p className="text-base text-slate-600 capitalize mt-1">{formatDateDisplay(date)}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <CalendarDays size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              className="input pl-10 py-2 w-48 border border-slate-300 rounded-lg"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={todayISO()}
            />
          </div>
          <button
            className="btn-secondary px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Atualizar"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Total</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{data.total}</p>
          </div>
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Sem ação</p>
            <p className="text-3xl font-bold text-slate-500 mt-2">{semAcao}</p>
          </div>
          <button
            type="button"
            className={`rounded-lg p-4 border-l-4 transition cursor-pointer text-left ${showPendentesOnly ? 'bg-amber-50 border-amber-500 shadow-md' : 'bg-white border-amber-300 hover:shadow-sm'}`}
            onClick={() => {
              setShowPendentesOnly((prev) => {
                if (!prev) { setShowRepostosOnly(false); setShowUltimosOnly(false); setShowTrocasOnly(false) }
                return !prev
              })
            }}
            aria-pressed={showPendentesOnly}
          >
            <p className={`text-xs font-semibold uppercase tracking-wide ${showPendentesOnly ? 'text-amber-700' : 'text-amber-600'}`}>Pendente</p>
            <p className={`text-3xl font-bold mt-2 ${showPendentesOnly ? 'text-amber-700' : 'text-amber-600'}`}>{pendentes}</p>
          </button>
          <button
            type="button"
            className={`rounded-lg p-4 border-l-4 transition cursor-pointer text-left ${showRepostosOnly ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-white border-emerald-300 hover:shadow-sm'}`}
            onClick={() => {
              setShowRepostosOnly((prev) => {
                if (!prev) { setShowPendentesOnly(false); setShowUltimosOnly(false); setShowTrocasOnly(false) }
                return !prev
              })
            }}
            aria-pressed={showRepostosOnly}
          >
            <p className={`text-xs font-semibold uppercase tracking-wide ${showRepostosOnly ? 'text-emerald-700' : 'text-emerald-600'}`}>Reposto</p>
            <p className={`text-3xl font-bold mt-2 ${showRepostosOnly ? 'text-emerald-700' : 'text-emerald-600'}`}>{repostos}</p>
          </button>
          <button
            type="button"
            className={`rounded-lg p-4 border-l-4 transition cursor-pointer text-left ${showUltimosOnly ? 'bg-red-50 border-red-500 shadow-md' : 'bg-white border-red-300 hover:shadow-sm'}`}
            onClick={() => {
              setShowUltimosOnly((prev) => {
                if (!prev) { setShowPendentesOnly(false); setShowRepostosOnly(false); setShowTrocasOnly(false) }
                return !prev
              })
            }}
            aria-pressed={showUltimosOnly}
          >
            <p className={`text-xs font-semibold uppercase tracking-wide ${showUltimosOnly ? 'text-red-700' : 'text-red-600'}`}>Esgotados</p>
            <p className={`text-3xl font-bold mt-2 ${showUltimosOnly ? 'text-red-700' : 'text-red-600'}`}>{ultimos}</p>
          </button>
          <button
            type="button"
            className={`rounded-lg p-4 border-l-4 transition cursor-pointer text-left ${showTrocasOnly ? 'bg-pink-50 border-pink-500 shadow-md' : 'bg-white border-pink-300 hover:shadow-sm'}`}
            onClick={() => {
              setShowTrocasOnly((prev) => {
                if (!prev) { setShowPendentesOnly(false); setShowRepostosOnly(false); setShowUltimosOnly(false) }
                return !prev
              })
            }}
            aria-pressed={showTrocasOnly}
          >
            <p className={`text-xs font-semibold uppercase tracking-wide ${showTrocasOnly ? 'text-pink-700' : 'text-pink-600'}`}>Trocados</p>
            <p className={`text-3xl font-bold mt-2 ${showTrocasOnly ? 'text-pink-700' : 'text-pink-600'}`}>{trocas}</p>
          </button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 h-32 animate-pulse border border-slate-200" />
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-700">
          <p className="font-semibold">Erro ao carregar vendas</p>
          <p className="text-sm mt-1">Verifique a ligação ao servidor.</p>
        </div>
      )}

      {!isLoading && !isError && vendas.length === 0 && (
        <div className="bg-white rounded-lg p-12 text-center text-slate-500 border border-slate-200">
          <p className="font-semibold">Nenhuma venda encontrada para esta data</p>
        </div>
      )}

      {!isLoading && vendasToRender.length > 0 && (
        <div className="space-y-4">
          {vendasToRender.map((venda, idx) => (
            <VendaCard key={`${venda.Codigo_Artigo}-${venda.Codigo_Lote}-${venda.Numero_Doc}-${idx}`} venda={venda} queryKey={queryKey} />
          ))}
        </div>
      )}
      {!isLoading && vendasToRender.length === 0 && vendas.length > 0 && (
        <div className="bg-white rounded-lg p-12 text-center text-slate-500 border border-slate-200">
          <p className="font-semibold">
            {showTrocasOnly
              ? 'Nenhum artigo trocado encontrado'
              : showUltimosOnly
                ? 'Nenhum artigo esgotado encontrado'
                : showRepostosOnly
                  ? 'Nenhuma venda reposta encontrada'
                  : 'Nenhuma venda pendente encontrada'}
          </p>
        </div>
      )}
    </div>
  )
}
