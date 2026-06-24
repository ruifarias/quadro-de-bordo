import api from './client'
import type { LotesResponse, LotesPorNomeResponse } from '../types'

export async function getLotes(codigo_artigo: string): Promise<LotesResponse> {
  const res = await api.get<LotesResponse>('/api/lotes/lista', { params: { codigo_artigo } })
  return res.data
}

export async function getLotesPorNome(q: string): Promise<LotesPorNomeResponse> {
  const res = await api.get<LotesPorNomeResponse>('/api/lotes/por-nome', { params: { q } })
  return res.data
}
