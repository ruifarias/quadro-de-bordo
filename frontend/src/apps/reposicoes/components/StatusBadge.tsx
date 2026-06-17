import type { VendaStatus } from '../types'

const config: Record<VendaStatus, { label: string; className: string }> = {
  sem_reposicao: { label: 'Não Reposto!',  className: 'bg-red-100 text-red-700' },
  pendente:      { label: 'Pendente',        className: 'bg-red-100 text-red-700' },
  reposto:       { label: 'Reposto',         className: 'bg-emerald-100 text-emerald-700' },
}

export default function StatusBadge({ status }: { status: VendaStatus }) {
  const { label, className } = config[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {label}
    </span>
  )
}
