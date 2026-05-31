import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function getStatusColor(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'confirmed':
    case 'preparing':
    case 'ready':
    case 'assigned':
    case 'picked_up':
      return 'info';
    case 'delivered':
    case 'completed':
      return 'success';
    case 'cancelled':
    case 'rejected':
    case 'failed':
      return 'danger';
    default:
      return 'default';
  }
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    ready: 'Pronto',
    delivering: 'Em entrega',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
    assigned: 'Atribuído',
    picked_up: 'Coletado',
    processing: 'Processando',
    completed: 'Concluído',
    rejected: 'Rejeitado',
  };
  return labels[status] || status;
}
