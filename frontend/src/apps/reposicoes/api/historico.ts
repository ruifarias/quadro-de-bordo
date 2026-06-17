import api from './client'
import type { HistoricoResponse } from '../types'

export async function getHistorico(
  data_inicio?: string,
  data_fim?: string,
  vendedor?: string
): Promise<HistoricoResponse> {
  const params: Record<string, string> = {}
  if (data_inicio) params.data_inicio = data_inicio
  if (data_fim)    params.data_fim    = data_fim
  if (vendedor)    params.vendedor    = vendedor
  const res = await api.get<HistoricoResponse>('/reposicoes/historico', { params })
  return res.data
}
