import api from './client'
import type { Venda } from '../types'

function toNum(v: unknown): number | null {
  if (v == null) return null
  if (typeof v === 'number') return isNaN(v) ? null : v
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(',', '.'))
    return isNaN(n) ? null : n
  }
  return null
}

export async function criarReposicao(venda: Venda): Promise<{ id: number; message: string }> {
  const { data } = await api.post('/reposicoes', {
    codigo_artigo:       venda.Codigo_Artigo,
    codigo_lote:         venda.Codigo_Lote,
    codigo_entidade:     venda.Codigo_Entidade,
    data_venda:          venda.Data_hora,
    numero_doc:          venda.Numero_Doc,
    codigo_serie:        venda.Codigo_Serie,
    codigo_documento:    venda.Codigo_Documento,
    qtd_vendida:         toNum(venda.Qtd_Vendida) ?? 0,
    artigo:              venda.Artigo,
    pr_unit_doc:         toNum(venda.Pr_Unit_Doc),
    desconto:            toNum(venda.Desconto),
    valor_liquido_s_iva: toNum(venda.Valor_Liquido_S_Iva),
    valor_custo:         toNum(venda.Valor_Custo),
    lucro:               toNum(venda.Lucro),
    descricao_lote:      venda.Descricao_Lote,
  })
  return data
}

export async function marcarReposto(id: number, observacoes?: string): Promise<void> {
  await api.patch(`/reposicoes/${id}/repor`, { observacoes: observacoes || null })
}

export async function cancelarReposicao(id: number): Promise<void> {
  await api.patch(`/reposicoes/${id}/cancelar`)
}
