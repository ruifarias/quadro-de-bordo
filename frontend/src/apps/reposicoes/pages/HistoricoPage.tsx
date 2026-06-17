import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, RefreshCw } from 'lucide-react'
import { getHistorico } from '../api/historico'
import { formatDateTime, formatCurrency, todayISO } from '../types'


export default function HistoricoPage() {
  const [dataInicio, setDataInicio] = useState(todayISO())
  const [dataFim, setDataFim]       = useState(todayISO())
  const [vendedor, setVendedor]     = useState('')
  const [applied, setApplied]       = useState({ dataInicio: todayISO(), dataFim: todayISO(), vendedor: '' })

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['historico', applied],
    queryFn: () => getHistorico(applied.dataInicio, applied.dataFim, applied.vendedor || undefined),
  })

  const applyFilters = () => setApplied({ dataInicio, dataFim, vendedor })

  const registos = data?.registos ?? []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Histórico de Reposições</h1>
        <p className="text-sm text-slate-500">Consulta e filtros de registos de reposição</p>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Data início</label>
            <input
              type="date"
              className="input"
              value={dataInicio}
              max={dataFim}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Data fim</label>
            <input
              type="date"
              className="input"
              value={dataFim}
              min={dataInicio}
              max={todayISO()}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Código vendedor</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: 0, 1, 2"
              value={vendedor}
              onChange={(e) => setVendedor(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
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
          Erro ao carregar histórico.
        </div>
      )}

      {data && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              {data.total} {data.total === 1 ? 'registo' : 'registos'}
            </span>
          </div>

          {registos.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              Nenhum registo encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-medium">Artigo</th>
                    <th className="text-left px-2 py-3 font-medium hidden md:table-cell w-16">Vend.</th>
                    <th className="text-left px-4 py-3 font-medium">Data Venda</th>
                    <th className="text-right px-2 py-3 font-medium hidden sm:table-cell w-12">Qtd</th>
                    <th className="text-right px-2 py-3 font-medium hidden md:table-cell">Preço Unit.</th>
                    <th className="text-right px-2 py-3 font-medium hidden md:table-cell w-16">Desc.</th>
                    <th className="text-right px-2 py-3 font-medium hidden md:table-cell">Preço Líquido</th>
                    <th className="text-center px-4 py-3 font-medium">Estado</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Data Reposição</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {registos.map((r) => (
                    <tr key={r.Id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-1">
                        <p className="font-medium text-slate-800 truncate max-w-[400px]" title={r.Descritivo_Artigo}>
                          {r.Descritivo_Artigo}
                        </p>
                        <p className="font-bold font-mono mt-0.5 flex items-center gap-2">
                          <span className="text-blue-600">{r.Codigo_Artigo}</span>
                          {r.Descricao_Lote && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="text-blue-600 font-bold text-sm">{r.Descricao_Lote}</span>
                            </>
                          )}
                        </p>
                      </td>
                      <td className="px-2 py-1 text-xs text-slate-600 hidden md:table-cell w-16 text-center">
                        {r.Codigo_Entidade}
                      </td>
                      <td className="px-4 py-1 text-slate-600 whitespace-nowrap text-xs">
                        {formatDateTime(r.Data_Venda)}
                      </td>
                      <td className="px-2 py-1 text-right text-xs text-slate-700 hidden sm:table-cell w-12">
                        <span className={Number(r.Qtd_Vendida) < 0 ? 'text-pink-600 font-semibold' : ''}>
                          {r.Qtd_Vendida}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-right text-xs text-slate-700 hidden md:table-cell">
                        {r.Pr_Unit_Doc ? formatCurrency(r.Pr_Unit_Doc) : '—'}
                      </td>
                      <td className="px-2 py-1 text-right text-xs text-slate-700 hidden md:table-cell w-16">
                        {r.Desconto ? `${r.Desconto}%` : '—'}
                      </td>
                      <td className="px-2 py-1 text-right text-xs text-slate-700 hidden md:table-cell">
                        {r.preco_liquido ? formatCurrency(r.preco_liquido) : '—'}
                      </td>
                      <td className="px-4 py-1 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            r.Reposto
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {r.Reposto ? 'Reposto' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-4 py-1 text-slate-500 text-xs whitespace-nowrap hidden lg:table-cell">
                        {r.Data_Reposicao ? formatDateTime(r.Data_Reposicao) : '—'}
                      </td>
                      <td className="px-4 py-1 text-slate-500 text-xs hidden lg:table-cell max-w-[160px] truncate">
                        <span className={
                          r.Observacoes === 'Troca'    ? 'text-pink-600 font-semibold' :
                          r.Observacoes === 'Esgotado' ? 'text-red-600 font-semibold'  : ''
                        }>
                          {r.Observacoes || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
