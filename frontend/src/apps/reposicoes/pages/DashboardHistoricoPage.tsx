import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Search, RefreshCw, ShoppingCart, CheckCircle, Clock, Euro, TrendingUp, User } from 'lucide-react'
import { getDashboardHistorico } from '../api/dashboardHistorico'
import { todayISO, formatCurrency } from '../types'


export default function DashboardHistoricoPage() {
  const [dataInicio, setDataInicio] = useState(todayISO())
  const [dataFim, setDataFim]       = useState(todayISO())
  const [applied, setApplied]       = useState({ dataInicio: todayISO(), dataFim: todayISO() })

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['dashboard-historico', applied],
    queryFn: () => getDashboardHistorico(applied.dataInicio, applied.dataFim),
  })

  const applyFilters = () => setApplied({ dataInicio, dataFim })

  const repostoPct = data && data.total > 0
    ? Math.round((data.repostos / data.total) * 100)
    : 0

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Dashboard do Histórico</h1>
        <p className="text-sm text-slate-500">Totais de reposições por vendedor num intervalo de datas</p>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Data início</label>
            <div className="relative">
              <CalendarDays size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                className="input pl-8"
                value={dataInicio}
                max={dataFim}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Data fim</label>
            <div className="relative">
              <CalendarDays size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                className="input pl-8"
                value={dataFim}
                min={dataInicio}
                max={todayISO()}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <button className="btn-primary gap-2" onClick={applyFilters} disabled={isFetching}>
            <Search size={14} />
            {isFetching ? 'A pesquisar...' : 'Pesquisar'}
            {isFetching && <RefreshCw size={13} className="animate-spin" />}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="card p-6 text-center text-slate-400 animate-pulse">A carregar...</div>
      )}

      {isError && (
        <div className="card p-6 text-center text-red-600">
          Erro ao carregar dados. Verifique a ligação ao servidor.
        </div>
      )}

      {data && (
        <>
          {/* KPIs globais */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="card p-3.5 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-brand-50 shrink-0">
                <ShoppingCart size={20} className="text-brand-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 leading-tight">Total reposições</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">{data.total}</p>
              </div>
            </div>
            <div className="card p-3.5 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 shrink-0">
                <CheckCircle size={20} className="text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 leading-tight">Repostos</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">{data.repostos}</p>
                <p className="text-xs text-slate-400">{repostoPct}% do total</p>
              </div>
            </div>
            <div className="card p-3.5 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-50 shrink-0">
                <Clock size={20} className="text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 leading-tight">Pendentes</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">{data.pendentes}</p>
              </div>
            </div>
            <div className="card p-3.5 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-50 shrink-0">
                <Euro size={20} className="text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 leading-tight">Valor total</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5 truncate">{formatCurrency(data.valor_total)}</p>
                <p className="text-xs text-slate-400 mt-0.5">Vendas com IVA = {formatCurrency(data.valor_total * 1.23)}</p>
              </div>
            </div>
            <div className="card p-3.5 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-50 shrink-0">
                <TrendingUp size={20} className="text-indigo-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 leading-tight">Lucro total</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5 truncate">{formatCurrency(data.lucro_total)}</p>
              </div>
            </div>
          </div>

          {/* Barra de progresso global */}
          {data.total > 0 && (
            <div className="card p-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-700">Progresso global de reposições</span>
                <span className="text-slate-500">{data.repostos} / {data.total}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${repostoPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1.5 text-slate-400">
                <span>{data.pendentes} pendentes</span>
                <span>{repostoPct}% concluído</span>
              </div>
            </div>
          )}

          {/* Por vendedor */}
          {data.por_vendedor.length > 0 ? (
            <div className="card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
                <User size={15} className="text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">Vendas por vendedor</span>
              </div>
              <div className="divide-y divide-slate-100">
                {data.por_vendedor.map((v) => {
                  const pct = v.total > 0 ? Math.round((v.repostos / v.total) * 100) : 0
                  return (
                    <div key={v.codigo} className="px-5 py-3 flex items-center gap-4">
                      <div className="w-32 shrink-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{v.nome}</p>
                        <p className="text-xs text-slate-400">{formatCurrency(v.valor_total)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-1 text-slate-400">
                          <span>{v.repostos} repostos · {v.pendentes} pendentes</span>
                          <span>{pct}%</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-slate-800">{v.total}</p>
                        <p className="text-xs text-slate-400">total</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="card p-10 text-center text-slate-400 text-sm">
              Nenhum registo encontrado para o período selecionado.
            </div>
          )}
        </>
      )}
    </div>
  )
}
