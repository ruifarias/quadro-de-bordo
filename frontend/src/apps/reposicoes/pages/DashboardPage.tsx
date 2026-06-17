import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, ShoppingCart, CheckCircle, Clock, Euro, TrendingUp, RefreshCw, User } from 'lucide-react'
import { getDashboard } from '../api/dashboard'
import { todayISO, formatCurrency } from '../types'

interface KpiCardProps {
  label: string
  value: string
  icon: React.ReactNode
  colorClass: string
  subtext?: string
}

function KpiCard({ label, value, icon, colorClass, subtext }: KpiCardProps) {
  return (
    <div className="card p-3.5 flex items-start gap-3">
      <div className={`p-2 rounded-xl ${colorClass} shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 leading-tight">{label}</p>
        <p className="text-xl font-bold text-slate-800 mt-0.5 truncate">{value}</p>
        {subtext && <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [date, setDate] = useState(todayISO())

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['dashboard', date],
    queryFn: () => getDashboard(date),
  })

  const formatDateDisplay = (iso: string) =>
    new Intl.DateTimeFormat('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      .format(new Date(iso + 'T12:00:00'))

  const repostoPct = data && data.total_vendas > 0
    ? Math.round((data.repostos / data.total_vendas) * 100)
    : 0

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Dashboard</h1>
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

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card p-5 h-24 animate-pulse bg-slate-100" />
          ))}
        </div>
      )}

      {isError && (
        <div className="card p-6 text-center text-red-600">
          Erro ao carregar dashboard. Verifique a ligação ao servidor.
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KpiCard
              label="Total de vendas"
              value={String(data.total_vendas)}
              icon={<ShoppingCart size={20} className="text-brand-600" />}
              colorClass="bg-brand-50"
            />
            <KpiCard
              label="Repostos"
              value={String(data.repostos)}
              icon={<CheckCircle size={20} className="text-emerald-600" />}
              colorClass="bg-emerald-50"
              subtext={`${repostoPct}% do total`}
            />
            <KpiCard
              label="Pendentes"
              value={String(data.pendentes)}
              icon={<Clock size={20} className="text-amber-600" />}
              colorClass="bg-amber-50"
            />
            <KpiCard
              label="Valor total"
              value={formatCurrency(data.valor_total)}
              icon={<Euro size={20} className="text-purple-600" />}
              colorClass="bg-purple-50"
              subtext={`Vendas com IVA = ${formatCurrency(data.valor_total * 1.23)}`}
            />
            <KpiCard
              label="Lucro total"
              value={formatCurrency(data.lucro_total)}
              icon={<TrendingUp size={20} className="text-indigo-600" />}
              colorClass="bg-indigo-50"
            />
          </div>

          {data.total_vendas > 0 && (
            <div className="card p-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-700">Progresso de reposições</span>
                <span className="text-slate-500">
                  {data.repostos} / {data.total_vendas}
                </span>
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

          {data.por_vendedor.length > 0 && (
            <div className="card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
                <User size={15} className="text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">Vendas por vendedor</span>
              </div>
              <div className="divide-y divide-slate-100">
                {data.por_vendedor.map((v) => {
                  const pct = v.total_vendas > 0 ? Math.round((v.repostos / v.total_vendas) * 100) : 0
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
                        <p className="text-lg font-bold text-slate-800">{v.total_vendas}</p>
                        <p className="text-xs text-slate-400">vendas</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
