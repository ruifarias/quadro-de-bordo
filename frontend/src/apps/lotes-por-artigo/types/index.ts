export interface AuthUser {
  token: string
  role: 'gestor' | 'vendedor'
  nome: string
}

export interface Venda {
  Artigo: string
  Qtd_Vendida: number
  Pr_Unit_Doc: number
  Desconto: number
  Valor_Liquido_S_Iva: number
  Valor_Custo: number
  Lucro: number
  Preco_Liquido: number
  Data_hora: string
  Codigo_Artigo: string
  Codigo_Lote: string
  Codigo_Serie: string
  Numero_Doc: number
  Codigo_Documento: string
  Descricao_Lote: string | null
  Qtd_Stock_Lote: number
  Qtd_Stock_Artigo: number
  Codigo_Entidade: string
  nome_vendedor: string
  imagem_base64: string | null
  Reposicao_Id: number | null
  Reposto: boolean | null
  Data_Reposicao: string | null
  Observacoes: string | null
}

export interface VendasResponse {
  data: string
  total: number
  vendas: Venda[]
}

export interface VendedorHistoricoStats {
  codigo: string
  nome: string
  total: number
  repostos: number
  pendentes: number
  valor_total: number
  lucro_total: number
}

export interface DashboardHistoricoData {
  data_inicio: string
  data_fim: string
  total: number
  repostos: number
  pendentes: number
  valor_total: number
  lucro_total: number
  por_vendedor: VendedorHistoricoStats[]
}

export interface VendedorStats {
  codigo: string
  nome: string
  total_vendas: number
  repostos: number
  pendentes: number
  valor_total: number
  lucro_total: number
}

export interface DashboardData {
  data: string
  total_vendas: number
  repostos: number
  pendentes: number
  valor_total: number
  lucro_total: number
  por_vendedor: VendedorStats[]
}

export interface HistoricoRecord {
  Id: number
  Codigo_Artigo: string
  Codigo_Lote: string
  Descricao_Lote: string | null
  Codigo_Entidade: string
  Data_Venda: string
  Numero_Doc: number
  Codigo_Serie: string
  Qtd_Vendida: number
  Pr_Unit_Doc: number | null
  Desconto: number | null
  preco_liquido: number | null
  Reposto: boolean
  Data_Reposicao: string | null
  Observacoes: string | null
  Descritivo_Artigo: string
}

export interface HistoricoResponse {
  total: number
  registos: HistoricoRecord[]
}

export interface Lote {
  Codigo_Artigo: string
  Descritivo_Artigo: string
  Codigo_Lote: string
  Descricao_Lote: string | null
  Qtd_Disponivel: number
  Preco: number | null
}

export interface LotesResponse {
  codigo_artigo: string
  total: number
  imagem_base64: string | null
  lotes: Lote[]
}

export type VendaStatus = 'sem_reposicao' | 'pendente' | 'reposto'

export function getVendaStatus(venda: Venda): VendaStatus {
  if (venda.Reposicao_Id === null) return 'sem_reposicao'
  if (venda.Reposto) return 'reposto'
  return 'pendente'
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}
