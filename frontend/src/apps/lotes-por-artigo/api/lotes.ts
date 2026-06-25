import api from './client'
import type { LotesResponse, LotesPorNomeResponse } from '../types'

export async function getLotes(codigo_artigo: string): Promise<LotesResponse> {
  const res = await api.get<LotesResponse>('/api/lotes/lista', { params: { codigo_artigo } })
  return res.data
}

export async function getLotesPorNome(q: string, marca?: string, cor?: string, tamanho?: string): Promise<LotesPorNomeResponse> {
  const params: Record<string, string> = { q }
  if (marca?.trim()) params.marca = marca.trim()
  if (cor?.trim()) params.cor = cor.trim()
  if (tamanho?.trim()) params.tamanho = tamanho.trim()
  const res = await api.get<LotesPorNomeResponse>('/api/lotes/por-nome', { params })
  return res.data
}
