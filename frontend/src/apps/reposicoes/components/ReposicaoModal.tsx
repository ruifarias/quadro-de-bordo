import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { Venda } from '../types'

interface Props {
  venda: Venda
  loading?: boolean
  onConfirm: (observacoes?: string) => void
  onClose: () => void
}

export default function ReposicaoModal({ venda, loading, onConfirm, onClose }: Props) {
  const [obs, setObs] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onConfirm(obs || undefined)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">Marcar como Reposto</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm space-y-1">
            <p className="font-medium text-slate-800 truncate">{venda.Artigo}</p>
            <p className="text-slate-500">
              Código: <span className="font-mono text-slate-700">{venda.Codigo_Artigo}</span>
              {' · '}
              Lote: <span className="font-mono text-slate-700">{venda.Codigo_Lote}</span>
            </p>
            <p className="text-slate-500">
              Qtd vendida: <span className="font-medium text-slate-700">{venda.Qtd_Vendida}</span>
            </p>
          </div>

          <div>
            <label className="label">Observações (opcional)</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Ex: Artigo recolocado na prateleira A3"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              maxLength={255}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-success flex-1" disabled={loading}>
              {loading ? 'A processar...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
