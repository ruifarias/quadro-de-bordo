import api from './client'
import type { VendasResponse } from '../types'

export async function getVendas(data?: string): Promise<VendasResponse> {
  const params = data ? { data } : {}
  const res = await api.get<VendasResponse>('/vendas', { params })
  return res.data
}
