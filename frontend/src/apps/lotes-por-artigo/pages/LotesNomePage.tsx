import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, RefreshCw, Package2, EyeOff, Eye } from 'lucide-react'
import { getLotesPorNome } from '../api/lotes'
import { formatCurrency } from '../types'
import type { ArtigoLotes } from '../types'

function ArtigoCard({ artigo, ocultarNegativos }: { artigo: ArtigoLotes; ocultarNegativos: boolean }) {
  const stockTotal = artigo.lotes.reduce((s, l) => s + l.Qtd_Disponivel, 0)
  const lotes = ocultarNegativos ? artigo.lotes.filter((l) => l.Qtd_Disponivel > 0) : artigo.lotes

  return (
    <div className="card overflow-hidden flex">
      {/* Imagem do artigo */}
      <div className="shrink-0 p-3 flex items-start border-r border-slate-100">
        {artigo.imagem_base64 ? (
          <img
            src={`data:image/jpeg;base64,${artigo.imagem_base64}`}
            alt={artigo.Codigo_Artigo}
            className="img-artigo object-cover rounded-2xl border border-slate-100"
          />
        ) : (
          <div className="img-artigo rounded-2xl bg-slate-100 flex items-center justify-center">
            <Package2 size={40} className="text-slate-400" />
          </div>
        )}
      </div>

      {/* Cabeçalho + tabela de lotes */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-2 flex-wrap px-3 py-2 border-b border-slate-100 bg-slate-50">
          <Package2 size={16} className="text-blue-600 shrink-0" />
          <span className="text-sm font-bold text-blue-600 font-mono">{artigo.Codigo_Artigo}</span>
          <span className="text-slate-300">·</span>
          <span className="text-sm font-semibold text-slate-800">{artigo.Descritivo_Artigo}</span>
          {artigo.Preco != null && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-sm font-bold text-blue-600">PVP {formatCurrency(artigo.Preco)}</span>
            </>
          )}
          {artigo.Desconto > 0 && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-sm font-bold text-amber-600">−{artigo.Desconto}%</span>
            </>
          )}
          {artigo.Preco_Liquido != null && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-sm font-bold text-emerald-600">Líquido {formatCurrency(artigo.Preco_Liquido)}</span>
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
          <div className="ml-auto flex items-center gap-3 shrink-0">
            <span className="text-sm text-slate-500">
              {lotes.length} {lotes.length === 1 ? 'lote' : 'lotes'}
            </span>
            <span className="text-sm font-bold text-slate-700">
              Stock:{' '}
              <span className={stockTotal > 0 ? 'text-emerald-600' : 'text-red-600'}>{stockTotal}</span>
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-white text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left px-3 py-1.5 font-medium w-24">Cód. Lote</th>
                <th className="text-left px-3 py-1.5 font-medium">Descrição Lote</th>
                <th className="text-right px-3 py-1.5 font-medium w-20">Existência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lotes.map((lote) => (
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
    </div>
  )
}

export default function LotesNomePage() {
  const [termo, setTermo] = useState('')
  const [marca, setMarca] = useState('')
  const [cor, setCor] = useState('')
  const [tamanho, setTamanho] = useState('')
  const [applied, setApplied] = useState('')
  const [appliedMarca, setAppliedMarca] = useState('')
  const [appliedCor, setAppliedCor] = useState('')
  const [appliedTamanho, setAppliedTamanho] = useState('')
  const [ocultarNegativos, setOcultarNegativos] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data, isError, isFetching } = useQuery({
    queryKey: ['lotes-por-nome', applied, appliedMarca, appliedCor, appliedTamanho],
    queryFn: () => getLotesPorNome(applied, appliedMarca, appliedCor, appliedTamanho),
    enabled: applied.trim() !== '',
  })

  const search = () => {
    if (termo.trim()) {
      setApplied(termo.trim())
      setAppliedMarca(marca.trim())
      setAppliedCor(cor.trim())
      setAppliedTamanho(tamanho.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') search()
  }

  return (
    <div className="space-y-5">
      {/* Pesquisa */}
      <div className="card p-3">
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="label">Código ou nome do artigo</label>
            <input
              ref={inputRef}
              autoFocus
              type="text"
              className="input input-nome"
              placeholder="Ex: PUMA, 40956, ténis..."
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
          </div>
          <div>
            <label className="label">Marca</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: PUMA, Nike..."
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
          </div>
          <div>
            <label className="label">Cor</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: Azul, Preto..."
              value={cor}
              onChange={(e) => setCor(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
          </div>
          <div>
            <label className="label">Tamanho</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: 42, M, XL..."
              value={tamanho}
              onChange={(e) => setTamanho(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
          </div>
          <button
            className="btn-primary gap-2"
            onClick={search}
            disabled={isFetching || !termo.trim()}
          >
            <Search size={14} />
            {isFetching ? 'A pesquisar...' : 'Pesquisar'}
            {isFetching && <RefreshCw size={13} className="animate-spin" />}
          </button>

          {data && (
            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={() => setOcultarNegativos((v) => !v)}
                className="btn-primary gap-2"
              >
                {ocultarNegativos ? <EyeOff size={14} /> : <Eye size={14} />}
                {ocultarNegativos ? 'Mostrar negativos' : 'Ocultar negativos'}
              </button>
              <span className="text-sm text-slate-500">
                {data.total_artigos} {data.total_artigos === 1 ? 'artigo' : 'artigos'}
              </span>
              {data.truncado && (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-700">
                  Limitado a 40 — refine a procura
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {isError && (
        <div className="card p-6 text-center text-red-600">
          Erro ao carregar lotes. Verifique a ligação ao servidor.
        </div>
      )}

      {data && data.artigos.length === 0 && (
        <div className="card p-10 text-center text-slate-400 text-sm">
          Nenhum artigo encontrado para <span className="font-bold">{data.query}</span>.
        </div>
      )}

      {data && data.artigos.length > 0 && (
        <div className="space-y-4">
          {data.artigos.map((artigo) => (
            <ArtigoCard key={artigo.Codigo_Artigo} artigo={artigo} ocultarNegativos={ocultarNegativos} />
          ))}
          <div className="flex justify-center pt-2 pb-4">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="btn-primary gap-2"
            >
              ↑ Voltar ao topo
            </button>
          </div>
        </div>
      )}

      {!applied && (
        <div className="card p-10 text-center text-slate-400 text-sm">
          Escreva um código ou parte do nome do artigo para consultar os lotes disponíveis.
        </div>
      )}
    </div>
  )
}
