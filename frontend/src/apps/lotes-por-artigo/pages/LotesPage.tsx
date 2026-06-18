import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, RefreshCw, Package2 } from 'lucide-react'
import { getLotes } from '../api/lotes'
import { formatCurrency } from '../types'

export default function LotesPage() {
  const [codigo, setCodigo] = useState('')
  const [applied, setApplied] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { data, isError, isFetching } = useQuery({
    queryKey: ['lotes', applied],
    queryFn: () => getLotes(applied),
    enabled: applied.trim() !== '',
  })

  const search = () => {
    if (codigo.trim()) setApplied(codigo.trim())
  }

  return (
    <div className="space-y-5">
      {/* Pesquisa + info do artigo na mesma linha */}
      <div className="card p-3">
        <div className="flex items-end gap-3">
          <div>
            <label className="label">Código do artigo</label>
            <input
              ref={inputRef}
              autoFocus
              type="text"
              maxLength={10}
              className="input uppercase input-artigo"
              placeholder="Ex: 40956"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  search()
                  inputRef.current?.select()
                }
              }}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
          </div>
          <div className="flex items-end">
            <button
              className="btn-primary gap-2"
              onClick={() => {
                search()
                inputRef.current?.select()
              }}
              disabled={isFetching || !codigo.trim()}
            >
              <Search size={14} />
              {isFetching ? 'A pesquisar...' : 'Pesquisar'}
              {isFetching && <RefreshCw size={13} className="animate-spin" />}
            </button>
          </div>

          {/* Info do artigo à direita */}
          {data && data.lotes.length > 0 && (() => {
            const stockTotal = data.lotes.reduce((s, l) => s + l.Qtd_Disponivel, 0)
            return (
              <div className="flex items-center gap-3 flex-1 info-inline">
                <Package2 size={18} className="text-blue-600 shrink-0" />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-blue-600 font-mono">{data.codigo_artigo}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-sm font-semibold text-slate-800">{data.lotes[0].Descritivo_Artigo}</span>
                  {data.lotes[0].Preco != null && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-sm font-bold text-emerald-600">{formatCurrency(data.lotes[0].Preco)}</span>
                    </>
                  )}
                  {stockTotal === 0 && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold bg-red-100 text-red-600">
                        ESGOTADO
                      </span>
                    </>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-3 shrink-0">
                  <span className="text-sm text-slate-500">
                    {data.total} {data.total === 1 ? 'lote' : 'lotes'}
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    Stock total:{' '}
                    <span className={stockTotal > 0 ? 'text-emerald-600' : 'text-red-600'}>{stockTotal}</span>
                  </span>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {isError && (
        <div className="card p-6 text-center text-red-600">
          Erro ao carregar lotes. Verifique a ligação ao servidor.
        </div>
      )}

      {data && (
        <>
          {data.lotes.length === 0 ? (
            <div className="card p-10 text-center text-slate-400 text-sm">
              Nenhum lote encontrado para o artigo <span className="font-mono font-bold">{data.codigo_artigo}</span>.
            </div>
          ) : (
            <div className="card overflow-hidden flex">
              {/* Imagem do artigo */}
              <div className="shrink-0 p-3 flex items-start border-r border-slate-100">
                {data.imagem_base64 ? (
                  <img
                    src={`data:image/jpeg;base64,${data.imagem_base64}`}
                    alt={data.codigo_artigo}
                    className="w-32 h-32 object-cover rounded-2xl border border-slate-100"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Package2 size={40} className="text-slate-400" />
                  </div>
                )}
              </div>

              {/* Tabela de lotes */}
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                      <th className="text-left px-3 py-1.5 font-medium w-24">Cód. Lote</th>
                      <th className="text-left px-3 py-1.5 font-medium">Descrição Lote</th>
                      <th className="text-right px-3 py-1.5 font-medium w-20">Existência</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.lotes.map((lote) => (
                      <tr key={lote.Codigo_Lote} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-0.5 font-mono text-xs text-blue-600 font-bold w-24">
                          {lote.Codigo_Lote}
                        </td>
                        <td className={`px-3 py-0.5 font-bold ${
                          lote.Qtd_Disponivel > 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {lote.Descricao_Lote || '—'}
                        </td>
                        <td className={`px-3 py-0.5 text-right font-bold w-20 ${
                          lote.Qtd_Disponivel < 0
                            ? 'text-red-700 bg-red-100'
                            : lote.Qtd_Disponivel === 0
                              ? 'text-red-600'
                              : 'text-emerald-600'
                        }`}>
                          {lote.Qtd_Disponivel}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!applied && (
        <div className="card p-10 text-center text-slate-400 text-sm">
          Introduza o código do artigo para consultar os lotes disponíveis.
        </div>
      )}
    </div>
  )
}
