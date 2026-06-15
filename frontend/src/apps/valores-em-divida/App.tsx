import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

interface Valor {
  codigo_conta: string
  fornecedor: string
  total_vencido: number
  total_nao_vencido: number
  total_divida: number
}

interface Resumo {
  total_vencido: number
  total_nao_vencido: number
  total_divida: number
  quantidade_fornecedores: number
}

function ValoresEmDivida() {
  const [valores, setValores] = useState<Valor[]>([])
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [valoresRes, resumoRes] = await Promise.all([
        axios.get('/api/valores/lista'),
        axios.get('/api/valores/resumo'),
      ])

      setValores(valoresRes.data.valores)
      setResumo(resumoRes.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  }

  if (loading) {
    return (
      <div className="valores-container">
        <div className="loading">Carregando dados...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="valores-container">
        <div className="error">Erro: {error}</div>
        <button onClick={fetchData} className="btn-refresh">
          Tentar Novamente
        </button>
      </div>
    )
  }

  return (
    <div className="valores-container">
      <div className="header">
        <h1>Valores em Divida - Documentos em aberto de fornecedores em: {formatDate(new Date())}</h1>
      </div>

      {resumo && (
        <div className="resumo-section">
          <div className="resumo-card">
            <div className="resumo-label">Total Vencido</div>
            <div className="resumo-value vencido">
              {formatCurrency(resumo.total_vencido)}
            </div>
          </div>
          <div className="resumo-card">
            <div className="resumo-label">Total Não Vencido</div>
            <div className="resumo-value nao-vencido">
              {formatCurrency(resumo.total_nao_vencido)}
            </div>
          </div>
          <div className="resumo-card">
            <div className="resumo-label">Total Divida</div>
            <div className="resumo-value total">
              {formatCurrency(resumo.total_divida)}
            </div>
          </div>
          <div className="resumo-card">
            <div className="resumo-label">Fornecedores</div>
            <div className="resumo-value info">
              {resumo.quantidade_fornecedores}
            </div>
          </div>
        </div>
      )}

      <div className="table-section">
        <table className="valores-table">
          <thead>
            <tr>
              <th className="col-codigo"><strong>Forn. Nº</strong></th>
              <th className="col-fornecedor"><strong>Fornecedor</strong></th>
              <th className="col-vencido"><strong>Total Vencido</strong></th>
              <th className="col-nao-vencido"><strong>Total Não Vencido</strong></th>
              <th className="col-total"><strong>Total Divida</strong></th>
            </tr>
          </thead>
          <tbody>
            {valores.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-message">
                  Sem dados disponíveis
                </td>
              </tr>
            ) : (
              <>
                {valores
                  .sort((a, b) => {
                    const numA = parseInt(a.codigo_conta.slice(-4), 10)
                    const numB = parseInt(b.codigo_conta.slice(-4), 10)
                    return numA - numB
                  })
                  .map((valor, idx) => {
                    const numFornecedor = valor.codigo_conta.slice(-4)
                    return (
                      <tr key={idx} className={idx % 2 === 0 ? 'even-row' : 'odd-row'}>
                        <td className="col-codigo">{numFornecedor}</td>
                        <td className="col-fornecedor">{valor.fornecedor}</td>
                        <td className="col-vencido amount">
                          {formatCurrency(valor.total_vencido)}
                        </td>
                        <td className="col-nao-vencido amount">
                          {formatCurrency(valor.total_nao_vencido)}
                        </td>
                        <td className="col-total amount">
                          {formatCurrency(valor.total_divida)}
                        </td>
                      </tr>
                    )
                  })}
                {resumo && (
                  <tr className="totals-row">
                    <td className="col-codigo"><strong>TOTAL</strong></td>
                    <td className="col-fornecedor"><strong>TOTAL</strong></td>
                    <td className="col-vencido amount">
                      <strong>{formatCurrency(resumo.total_vencido)}</strong>
                    </td>
                    <td className="col-nao-vencido amount">
                      <strong>{formatCurrency(resumo.total_nao_vencido)}</strong>
                    </td>
                    <td className="col-total amount">
                      <strong>{formatCurrency(resumo.total_divida)}</strong>
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="footer">
        <button onClick={fetchData} className="btn-refresh">
          Atualizar
        </button>
      </div>
    </div>
  )
}

export default ValoresEmDivida
