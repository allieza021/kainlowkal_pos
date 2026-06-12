export type Role = 'admin';
export type OrderType = 'Dine In' | 'Take Out' | 'Pick Up' | 'Delivery';
export type PaymentMethod = 'Cash' | 'GCash' | 'Maya' | 'MariBank' | 'Bank Transfer' | 'Other';
export type PaymentStatus = 'Paid' | 'Unpaid';

export interface StaffProfile {
  id: string;
  display_name: string;
  role: Role;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  created_at?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price_modifier: number;
  sort_order: number;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  price: number;
  is_sold_out: boolean;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  variants?: ProductVariant[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
  created_at?: string;
}

export interface Order {
  id: string;
  order_number: number;
  order_type: OrderType;
  customer_name: string;
  customer_contact: string | null;
  delivery_address: string | null;
  delivery_fee: number;
  subtotal: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  cashier_id: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  items?: OrderItem[];
}

export interface AppSettings {
  id: string;
  key: string;
  value: string | null;
  updated_at?: string;
}

export interface BusinessSettings {
  business_name: string;
  tagline: string;
  logo_url: string;
  receipt_footer: string;
}

export interface ReceiptOrder extends Order {
  cashier_name?: string;
  business_name?: string;
  logo_url?: string | null;
  tagline?: string | null;
  receipt_footer?: string | null;
}

export interface CartItem {
  temp_id: string;
  product_id: string;
  product_name: string;
  variant_name?: string | null;
  quantity: number;
  unit_price: number;
  notes?: string;
}
