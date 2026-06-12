import { useEffect, useRef } from 'react';
import type { OrderType, PaymentMethod, PaymentStatus } from '../types';

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

export function formatDate(value?: string | number | Date | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium'
  }).format(new Date(value));
}

export function formatDateTime(value?: string | number | Date | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function getDateRange(period: 'today' | 'week' | 'month') {
  const now = new Date();
  const start = new Date(now);
  if (period === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  return { start: start.toISOString(), end: now.toISOString() };
}

export function exportCsv(rows: Record<string, string | number | null | undefined>[]) {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [keys.join(','), ...rows.map((row) => keys.map((key) => quote(row[key])).join(','))].join('\n');
}

export function orderTypeTone(type: OrderType) {
  switch (type) {
    case 'Delivery':
      return 'bg-green-50 text-green-600';
    case 'Pickup':
      return 'bg-purple-50 text-purple-600';
    case 'Take Out':
      return 'bg-amber-50 text-amber-600';
    default:
      return 'bg-blue-50 text-blue-600';
  }
}

export function statusTone(status: PaymentStatus) {
  return status === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500';
}

export function methodTone(method: PaymentMethod) {
  return method === 'Cash' ? 'bg-gray-100 text-gray-700' : 'bg-blue-50 text-blue-600';
}

export function useDebounce<T>(value: T, delay: number, callback: (val: T) => void) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      callback(value);
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, delay, callback]);
}

export function toDbOrderType(type: string): string {
  if (type === 'Dine In') return 'dine_in';
  if (type === 'Take Out') return 'take_out';
  if (type === 'Pickup' || type === 'Pick Up') return 'pick_up';
  if (type === 'Delivery') return 'delivery';
  return String(type || '').toLowerCase().replace(' ', '_');
}

export function fromDbOrderType(type: string): OrderType {
  if (type === 'dine_in') return 'Dine In';
  if (type === 'take_out') return 'Take Out';
  if (type === 'pick_up') return 'Pickup';
  if (type === 'delivery') return 'Delivery';
  return 'Dine In';
}

export function toDbPaymentMethod(method: string): string {
  return String(method || '').toLowerCase().replace(' ', '_');
}

export function fromDbPaymentMethod(method: string): PaymentMethod {
  if (method === 'cash') return 'Cash';
  if (method === 'gcash') return 'GCash';
  if (method === 'maya') return 'Maya';
  if (method === 'maribank') return 'MariBank';
  if (method === 'bank_transfer') return 'Bank Transfer';
  if (method === 'other') return 'Other';
  return 'Cash';
}

export function toDbPaymentStatus(status: string): string {
  return String(status || '').toLowerCase();
}

export function fromDbPaymentStatus(status: string): PaymentStatus {
  if (status === 'paid') return 'Paid';
  return 'Unpaid';
}