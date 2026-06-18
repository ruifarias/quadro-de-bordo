import api from './client'
import type { LotesResponse } from '../types'

export async function getLotes(codigo_artigo: string): Promise<LotesResponse> {
  const res = await api.get<LotesResponse>('/lotes', { params: { codigo_artigo } })
  return res.data
}
