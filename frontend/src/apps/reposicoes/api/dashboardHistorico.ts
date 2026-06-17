import api from './client'
import type { DashboardHistoricoData } from '../types'

export async function getDashboardHistorico(
  data_inicio?: string,
  data_fim?: string
): Promise<DashboardHistoricoData> {
  const params: Record<string, string> = {}
  if (data_inicio) params.data_inicio = data_inicio
  if (data_fim)    params.data_fim    = data_fim
  const res = await api.get<DashboardHistoricoData>('/dashboard/historico', { params })
  return res.data
}
