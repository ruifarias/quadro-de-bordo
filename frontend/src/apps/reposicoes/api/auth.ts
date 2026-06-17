import api from './client'
import type { AuthUser } from '../types'

export async function login(username: string, password: string): Promise<AuthUser> {
  const { data } = await api.post<AuthUser>('/auth/login', { username, password })
  return data
}
