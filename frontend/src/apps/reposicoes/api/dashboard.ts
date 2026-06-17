import api from './client'
import type { DashboardData } from '../types'

export async function getDashboard(data?: string): Promise<DashboardData> {
  const params = data ? { data } : {}
  const res = await api.get<DashboardData>('/dashboard', { params })
  return res.data
}
