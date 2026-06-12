import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  EyeOff,
  FilePenLine,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  UserPlus
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout, type PageKey } from './components/Layout';
import { buildReceiptHtml, printReceipt } from './components/Receipt';
import { validateLogoFile, getLogoFileName } from './lib/logoUtils';
import type {
  BusinessSettings,
  CartItem,
  Category,
  Order,
  OrderItem,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  Product,
  ProductVariant,
  ReceiptOrder,
  StaffProfile
} from './types';
import { exportCsv, formatCurrency, formatDateTime, getDateRange } from './lib/utils';

type AppSettingsRow = { key: string; value: string | null };

const defaultSettings: BusinessSettings = {
  business_name: 'KAINLOWKAL',
  tagline: 'Since 2019',
  logo_url: '',
  receipt_footer: 'This is an order slip only and not an official receipt.'
};

function settingsFromRows(rows: AppSettingsRow[]): BusinessSettings {
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value || '']));
  return {
    business_name: map.business_name || defaultSettings.business_name,
    tagline: map.tagline || defaultSettings.tagline,
    logo_url: map.logo_url || defaultSettings.logo_url,
    receipt_footer: map.receipt_footer || defaultSettings.receipt_footer
  };
}

function useSupabaseData() {
  const { supabase } = useAuth();
  const [settings, setSettings] = useState<BusinessSettings>(defaultSettings);
  const [settingsLoading, setSettingsLoading] = useState(true);

  async function refreshSettings() {
    if (!supabase) return;
    const { data } = await supabase.from('app_settings').select('key,value');
    setSettings(settingsFromRows((data || []) as AppSettingsRow[]));
    setSettingsLoading(false);
  }

  useEffect(() => {
    refreshSettings();
  }, [supabase]);

  return { settings, refreshSettings, settingsLoading, setSettings };
}

function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${className}`}>{children}</span>;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{children}</div>;
}

function Modal({
  title,
  children,
  onClose,
  widthClass = 'max-w-md'
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  widthClass?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className={`w-full ${widthClass} rounded-2xl bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button className="rounded-xl border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const { supabase, session, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) onSignedIn();
  }, [session, onSignedIn]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setMessage('Supabase is not configured.');
      return;
    }
    setBusy(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    setBusy(false);
  }

  async function setupDefaultAdmin() {
    if (!supabase) {
      setMessage('Supabase is not configured.');
      return;
    }
    setBusy(true);
    setMessage('');
    const adminEmail = 'admin@kainlowkal.pos';
    const adminPassword = 'password123';
    const { data, error } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: { data: { display_name: 'Admin' } }
    });
    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }
    const userId = data.user?.id;
    if (userId) {
      await supabase.from('staff_profiles').upsert({
        id: userId,
        display_name: 'Admin',
        role: 'admin'
      });
    }
    setMessage(`Default admin created: ${adminEmail} / ${adminPassword}`);
    setBusy(false);
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6">Loading session...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <form onSubmit={signIn} className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6">
          <SectionLabel>Login</SectionLabel>
          <h2 className="mt-3 text-2xl font-semibold text-gray-900">Admin Login</h2>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-orange-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kainlowkal.pos or setup a new account"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 pr-10 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-orange-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {message ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{message}</div> : null}

            <button
              disabled={busy}
              className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-gray-800 disabled:opacity-50"
            >
              {busy ? 'Working...' : 'Sign In'}
            </button>
          </div>

          <div className="my-6 border-t border-gray-100" />

          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-900">Setup Default Admin Account</div>
            <p className="text-sm text-gray-600">
              Creates <span className="font-medium">admin@kainlowkal.pos</span> with password{' '}
              <span className="font-medium">password123</span> and a matching admin profile.
            </p>
            <button
              type="button"
              onClick={setupDefaultAdmin}
              disabled={busy}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
            >
              Setup Default Admin Account
            </button>
          </div>
        </form>
    </div>
  );
}

function ReceiptModal({
  order,
  settings,
  onClose
}: {
  order: ReceiptOrder;
  settings: BusinessSettings;
  onClose: () => void;
}) {
  return (
    <Modal title="Receipt Preview" onClose={onClose} widthClass="max-w-md">
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-100 p-4 text-sm text-gray-600">
          Receipt ready for print. Use the button below to open the thermal print window.
        </div>
        <button
          className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-orange-600"
          onClick={() => printReceipt({ ...order, ...settings })}
        >
          Print Receipt
        </button>
        <button
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

function POSPage({
  settings,
  onSavedReceipt,
  onRefreshSettings
}: {
  settings: BusinessSettings;
  onSavedReceipt: (order: ReceiptOrder) => void;
  onRefreshSettings: () => Promise<void>;
}) {
  const { supabase, profile } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<(Product & { variants?: ProductVariant[] })[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [variantProduct, setVariantProduct] = useState<(Product & { variants?: ProductVariant[] }) | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('Dine In');
  const [customerName, setCustomerName] = useState('Walk-in');
  const [customerContact, setCustomerContact] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Unpaid');
  const [notes, setNotes] = useState('');
  const [receiptOrder, setReceiptOrder] = useState<ReceiptOrder | null>(null);

  async function loadCatalog() {
    if (!supabase) return;
    const [catRes, prodRes, varRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('products').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      supabase.from('product_variants').select('*').order('sort_order', { ascending: true })
    ]);
    const productRows = (prodRes.data || []) as Product[];
    const variants = (varRes.data || []) as ProductVariant[];
    setCategories((catRes.data || []) as Category[]);
    setProducts(
      productRows.map((product) => ({
        ...product,
        variants: variants.filter((variant) => variant.product_id === product.id)
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    loadCatalog();
  }, [supabase]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0), [cart]);
  const total = subtotal + (orderType === 'Delivery' ? Number(deliveryFee || 0) : 0);

  function addProduct(product: Product & { variants?: ProductVariant[] }) {
    if (product.is_sold_out) return;
    if (product.variants?.length) {
      setVariantProduct(product);
      return;
    }
    setCart((current) => {
      const existing = current.find((item) => item.product_id === product.id && !item.variant_name);
      if (existing) {
        return current.map((item) => (item.temp_id === existing.temp_id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [
        { temp_id: crypto.randomUUID(), product_id: product.id, product_name: product.name, quantity: 1, unit_price: Number(product.price), notes: '' },
        ...current
      ];
    });
  }

  function placeOrder() {
    if (!supabase) return;
    (async () => {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_type: orderType,
          customer_name: customerName || 'Walk-in',
          customer_contact: customerContact || null,
          delivery_address: orderType === 'Delivery' ? deliveryAddress || null : null,
          delivery_fee: orderType === 'Delivery' ? deliveryFee : 0,
          subtotal,
          total,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          cashier_id: profile?.id ?? null,
          notes: notes || null
        })
        .select('*')
        .single();
      if (orderError || !orderData) return;
      const createdOrder = orderData as Order;
      if (cart.length) {
        await supabase.from('order_items').insert(
          cart.map((item) => ({
            order_id: createdOrder.id,
            product_id: item.product_id,
            product_name: item.product_name,
            variant_name: item.variant_name || null,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.quantity * item.unit_price,
            notes: item.notes || null
          }))
        );
      }
      const receipt: ReceiptOrder = {
        ...createdOrder,
        items: cart.map((item) => ({
          id: crypto.randomUUID(),
          order_id: createdOrder.id,
          product_id: item.product_id,
          product_name: item.product_name,
          variant_name: item.variant_name || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
          notes: item.notes || null
        })),
        cashier_name: profile?.display_name || 'Cashier',
        business_name: settings.business_name,
        logo_url: settings.logo_url,
        tagline: settings.tagline,
        receipt_footer: settings.receipt_footer
      };
      setReceiptOrder(receipt);
      onSavedReceipt(receipt);
      setCart([]);
      setCustomerName('Walk-in');
      setCustomerContact('');
      setDeliveryAddress('');
      setDeliveryFee(0);
      setNotes('');
      await onRefreshSettings();
    })();
  }

  const visibleProducts = products.filter((product) => activeCategory === 'all' || product.category_id === activeCategory);

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Loading products...</div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-gray-200 bg-white px-4 py-3 lg:px-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${activeCategory === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${activeCategory === category.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="grid h-full gap-0 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-h-0 overflow-y-auto p-4 lg:p-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addProduct(product)}
                  className="animate-fadeIn rounded-xl border border-gray-100 bg-white p-4 text-left transition-all hover:-translate-y-px hover:shadow-sm disabled:opacity-50"
                  disabled={product.is_sold_out}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-900">{product.name}</div>
                      <div className="text-lg font-semibold text-orange-500">{formatCurrency(Number(product.price))}</div>
                    </div>
                    <div className="rounded-full bg-gray-900 p-2 text-white">
                      <Plus size={16} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    {product.is_sold_out ? <Badge className="bg-red-50 text-red-500">Sold Out</Badge> : null}
                    {product.variants?.length ? <Badge className="bg-amber-50 text-amber-600">Variants</Badge> : null}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <aside className="flex min-h-0 flex-col border-l border-gray-200 bg-white">
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.temp_id} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{item.product_name}</div>
                        {item.variant_name ? <div className="text-xs text-gray-500">{item.variant_name}</div> : null}
                      </div>
                      <button
                        onClick={() => setCart((current) => current.filter((x) => x.temp_id !== item.temp_id))}
                        className="rounded-full p-1 text-red-500 transition hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
                          onClick={() =>
                            setCart((current) =>
                              current.map((x) => (x.temp_id === item.temp_id ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x))
                            )
                          }
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
                          onClick={() =>
                            setCart((current) =>
                              current.map((x) => (x.temp_id === item.temp_id ? { ...x, quantity: x.quantity + 1 } : x))
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{formatCurrency(item.quantity * item.unit_price)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {(['Dine In', 'Take Out', 'Pick Up', 'Delivery'] as OrderType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setOrderType(type)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                        orderType === type ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Customer Name *</label>
                  <input
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-orange-400"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Contact (Optional)</label>
                  <input
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-orange-400"
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                  />
                </div>

                {orderType === 'Delivery' ? (
                  <>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Delivery Address</label>
                      <textarea
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-orange-400"
                        rows={3}
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Delivery Fee</label>
                      <input
                        type="number"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-orange-400"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(Number(e.target.value || 0))}
                      />
                    </div>
                  </>
                ) : null}

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Payment Method</label>
                  <select
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-orange-400"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  >
                    {(['Cash', 'GCash', 'Maya', 'MariBank', 'Bank Transfer', 'Other'] as PaymentMethod[]).map((method) => (
                      <option key={method}>{method}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {(['Paid', 'Unpaid'] as PaymentStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => setPaymentStatus(status)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                        paymentStatus === status ? (status === 'Paid' ? 'border-green-600 bg-green-600 text-white' : 'border-red-500 bg-red-500 text-white') : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Notes (Optional)</label>
                  <textarea
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-orange-400"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 bg-white p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-lg font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
              <button
                onClick={placeOrder}
                className="mt-4 w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-orange-600"
              >
                Place Order
              </button>
            </div>
          </aside>
        </div>
      </div>

      {variantProduct ? (
        <VariantModal
          product={variantProduct}
          onClose={() => setVariantProduct(null)}
          onAdd={(item) => {
            setCart((current) => {
              const existing = current.find((i) => i.product_id === item.product_id && i.variant_name === item.variant_name);
              if (existing) {
                return current.map((i) => (i.temp_id === existing.temp_id ? { ...i, quantity: i.quantity + 1 } : i));
              }
              return [item, ...current];
            });
            setVariantProduct(null);
          }}
        />
      ) : null}

      {receiptOrder ? <ReceiptModal order={receiptOrder} settings={settings} onClose={() => setReceiptOrder(null)} /> : null}
    </div>
  );
}

function VariantModal({
  product,
  onClose,
  onAdd
}: {
  product: Product & { variants?: ProductVariant[] };
  onClose: () => void;
  onAdd: (item: CartItem) => void;
}) {
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id || '');
  const chosenVariant = product.variants?.find((variant) => variant.id === variantId) || product.variants?.[0];

  return (
    <Modal title={product.name} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid gap-2">
          {(product.variants || []).map((variant) => (
            <button
              key={variant.id}
              onClick={() => setVariantId(variant.id)}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                variantId === variant.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{variant.name}</span>
                <span>{variant.price_modifier ? `+${formatCurrency(Number(variant.price_modifier))}` : 'Included'}</span>
              </div>
            </button>
          ))}
        </div>
        <button
          className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-orange-600"
          onClick={() =>
            onAdd({
              temp_id: crypto.randomUUID(),
              product_id: product.id,
              product_name: product.name,
              variant_name: chosenVariant?.name || '',
              quantity: 1,
              unit_price: Number(product.price) + Number(chosenVariant?.price_modifier || 0),
              notes: ''
            })
          }
        >
          Add to Cart
        </button>
      </div>
    </Modal>
  );
}

function orderTypeTone(type: OrderType): string {
  const tones: Record<OrderType, string> = {
    'Dine In': 'bg-blue-50 text-blue-600',
    'Take Out': 'bg-purple-50 text-purple-600',
    'Pick Up': 'bg-green-50 text-green-600',
    'Delivery': 'bg-orange-50 text-orange-600'
  };
  return tones[type];
}

function statusTone(status: PaymentStatus): string {
  return status === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600';
}

function AppFrame() {
  const { session, profile, signOut, supabase } = useAuth();
  const { settings, refreshSettings, setSettings } = useSupabaseData();
  const [page, setPage] = useState<PageKey>(() => {
    const saved = localStorage.getItem('lastPage') as PageKey | null;
    return saved && ['pos', 'orders', 'dashboard', 'menu', 'settings'].includes(saved) ? saved : 'pos';
  });
  const [receiptPreview, setReceiptPreview] = useState<ReceiptOrder | null>(null);

  useEffect(() => {
    localStorage.setItem('lastPage', page);
  }, [page]);

  if (!session) {
    return (
      <div className="h-full">
        <LoginScreen onSignedIn={() => setPage('pos')} />
      </div>
    );
  }

  if (!supabase) {
    return (
      <Layout
        active={page}
        onNavigate={setPage}
        profileName={profile?.display_name || 'Cashier'}
        role={profile?.role || 'guest'}
        businessName={settings.business_name}
        logoUrl={settings.logo_url}
        signOut={signOut}
      >
        <div className="p-6 text-sm text-gray-600">Supabase not configured. Check .env.local for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</div>
      </Layout>
    );
  }

  return (
    <Layout
      active={page}
      onNavigate={setPage}
      profileName={profile?.display_name || 'Cashier'}
      role={profile?.role || 'guest'}
      businessName={settings.business_name}
      logoUrl={settings.logo_url}
      signOut={signOut}
    >
      {page === 'pos' ? (
        <POSPage
          settings={settings}
          onSavedReceipt={(order) => setReceiptPreview(order)}
          onRefreshSettings={refreshSettings}
        />
      ) : null}
      {page === 'dashboard' ? (
        <DashboardPage settings={settings} supabase={supabase} />
      ) : null}
      {page === 'orders' ? (
        <OrdersPage settings={settings} supabase={supabase} onEditToPos={() => setPage('pos')} onPreviewReceipt={(order) => setReceiptPreview(order)} />
      ) : null}
      {page === 'menu' ? (
        <MenuManagementPage settings={settings} supabase={supabase} onReload={refreshSettings} />
      ) : null}
      {page === 'settings' ? (
        <SettingsPage settings={settings} setSettings={setSettings} supabase={supabase} profile={profile || null} onReload={refreshSettings} />
      ) : null}

      {receiptPreview ? <ReceiptModal order={receiptPreview} settings={settings} onClose={() => setReceiptPreview(null)} /> : null}
    </Layout>
  );
}

function DashboardPage({ settings, supabase }: { settings: BusinessSettings; supabase: NonNullable<ReturnType<typeof useAuth>['supabase']> }) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const range = getDateRange(period);
    const { data } = await supabase.from('orders').select('*, order_items(*)').gte('created_at', range.start).order('created_at', { ascending: false });
    setOrders(((data || []) as any[]).map((row) => ({ ...row, items: row.order_items || row.items })) as Order[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [period, supabase]);

  const paidOrders = orders.filter((order) => order.payment_status === 'Paid');
  const unpaidOrders = orders.filter((order) => order.payment_status === 'Unpaid');
  const salesForPeriod = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);

  const today = useMemo(() => getDateRange('today'), []);
  const week = useMemo(() => getDateRange('week'), []);
  const month = useMemo(() => getDateRange('month'), []);

  const summary = {
    today: paidOrders.filter((order) => order.created_at && order.created_at >= today.start).reduce((sum, order) => sum + Number(order.total), 0),
    week: paidOrders.filter((order) => order.created_at && order.created_at >= week.start).reduce((sum, order) => sum + Number(order.total), 0),
    month: paidOrders.filter((order) => order.created_at && order.created_at >= month.start).reduce((sum, order) => sum + Number(order.total), 0)
  };

  const paymentTotals = orders.reduce<Record<string, number>>((acc, order) => {
    acc[order.payment_method] = (acc[order.payment_method] || 0) + Number(order.total);
    return acc;
  }, {});

  const topProducts = new Map<string, { qty: number; revenue: number }>();
  orders.forEach((order) => {
    (order.items || []).forEach((item: OrderItem) => {
      const current = topProducts.get(item.product_name) || { qty: 0, revenue: 0 };
      current.qty += Number(item.quantity);
      current.revenue += Number(item.total_price);
      topProducts.set(item.product_name, current);
    });
  });

  const sevenDays = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const amount = paidOrders.filter((order) => order.created_at && order.created_at >= dayStart.toISOString() && order.created_at < dayEnd.toISOString()).reduce((sum, order) => sum + Number(order.total), 0);
    return { label: date.toLocaleDateString('en-US', { weekday: 'short' }), amount };
  });
  const maxDay = Math.max(...sevenDays.map((day) => day.amount), 1);

  function downloadAll() {
    const rows = orders.flatMap((order) =>
      (order.items || []).map((item) => ({
        order_number: order.order_number,
        order_type: order.order_type,
        customer_name: order.customer_name,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        product_name: item.product_name,
        variant_name: item.variant_name || '',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        created_at: order.created_at || ''
      }))
    );
    const blob = new Blob([exportCsv(rows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kainlowkal-sales.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="p-6 text-sm text-gray-600">Loading dashboard...</div>;

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6">
      <div className="flex flex-wrap items-center gap-2">
        {(['today', 'week', 'month'] as const).map((item) => (
          <button
            key={item}
            onClick={() => setPeriod(item)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${period === item ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
          >
            {item === 'today' ? 'Today' : item === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
        <button onClick={downloadAll} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
          Export CSV
        </button>
        <button onClick={load} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
          <RefreshCw size={16} className="mr-2 inline" />
          Refresh
        </button>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-4">
        <StatCard label="Sales for period" value={formatCurrency(salesForPeriod)} />
        <StatCard label="Orders Today" value={String(orders.filter((o) => o.created_at && o.created_at >= today.start).length)} />
        <StatCard label="Paid Orders" value={String(paidOrders.length)} />
        <StatCard label="Unpaid Orders" value={String(unpaidOrders.length)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="7-Day Sales">
          <div className="flex h-48 items-end gap-2">
            {sevenDays.map((day) => (
              <div key={day.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-36 w-full items-end rounded-xl bg-gray-50 p-1">
                  <div className="w-full rounded-lg bg-orange-500" style={{ height: `${(day.amount / maxDay) * 100}%` }} />
                </div>
                <div className="text-xs text-gray-500">{day.label}</div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Payment Methods">
          <div className="space-y-3">
            {Object.entries(paymentTotals).map(([method, amount]) => {
              const percent = salesForPeriod ? (amount / salesForPeriod) * 100 : 0;
              return (
                <div key={method}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-700">{method}</span>
                    <span className="text-gray-500">{formatCurrency(amount)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-orange-500" style={{ width: `${Math.min(percent, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Best Selling Products">
          <div className="space-y-3">
            {[...topProducts.entries()]
              .sort((a, b) => b[1].qty - a[1].qty)
              .slice(0, 8)
              .map(([name, stats], index) => (
                <div key={name} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-gray-100 text-gray-700">#{index + 1}</Badge>
                    <div>
                      <div className="font-medium text-gray-900">{name}</div>
                      <div className="text-xs text-gray-500">{stats.qty} sold</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-orange-500">{formatCurrency(stats.revenue)}</div>
                </div>
              ))}
          </div>
        </Panel>
        <Panel title="Summary">
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard label="Today" value={formatCurrency(summary.today)} />
            <SummaryCard label="Week" value={formatCurrency(summary.week)} />
            <SummaryCard label="Month" value={formatCurrency(summary.month)} />
          </div>
        </Panel>
      </div>

      <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4">
        <SectionLabel>Recent Orders</SectionLabel>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="py-2">#</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Method</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 8).map((order) => (
                <tr key={order.id} className="border-t border-gray-100">
                  <td className="py-2 font-medium">{order.order_number}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.order_type}</td>
                  <td>{order.payment_method}</td>
                  <td>{order.payment_status}</td>
                  <td>{formatCurrency(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <SectionLabel>{title}</SectionLabel>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function OrdersPage({
  settings,
  supabase,
  onEditToPos,
  onPreviewReceipt
}: {
  settings: BusinessSettings;
  supabase: NonNullable<ReturnType<typeof useAuth>['supabase']>;
  onEditToPos: () => void;
  onPreviewReceipt: (order: ReceiptOrder) => void;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | PaymentStatus>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | OrderType>('All');
  const [editOrder, setEditOrder] = useState<Order | null>(null);

  async function load() {
    const { data } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
    setOrders(((data || []) as any[]).map((row) => ({ ...row, items: row.order_items || row.items })) as Order[]);
  }

  useEffect(() => {
    load();
  }, [supabase]);

  const filtered = orders.filter((order) => {
    const term = search.trim().toLowerCase();
    const matchesTerm =
      !term ||
      [String(order.order_number), order.customer_name, order.payment_method, order.payment_status, order.order_type]
        .join(' ')
        .toLowerCase()
        .includes(term);
    const matchesStatus = statusFilter === 'All' || order.payment_status === statusFilter;
    const matchesType = typeFilter === 'All' || order.order_type === typeFilter;
    return matchesTerm && matchesStatus && matchesType;
  });

  async function toggleStatus(order: Order) {
    const next = order.payment_status === 'Paid' ? 'Unpaid' : 'Paid';
    await supabase.from('orders').update({ payment_status: next }).eq('id', order.id);
    await load();
  }

  async function saveEdit(updated: Partial<Order> & { items?: OrderItem[] }) {
    if (!editOrder) return;
    const { items, ...orderUpdate } = updated;

    const payload = {
      ...orderUpdate,
      delivery_fee: parseFloat(String(orderUpdate.delivery_fee ?? 0)),
      subtotal: parseFloat(String(orderUpdate.subtotal ?? 0)),
      total: parseFloat(String(orderUpdate.total ?? 0))
    };

    const { error } = await supabase.from('orders').update(payload).eq('id', editOrder.id);
    if (error) throw error;

    if (items && items.length > 0) {
      await supabase.from('order_items').delete().eq('order_id', editOrder.id);
      await supabase.from('order_items').insert(
        items.map((item) => ({
          order_id: editOrder.id,
          product_id: item.product_id,
          product_name: item.product_name,
          variant_name: item.variant_name || null,
          quantity: item.quantity,
          unit_price: parseFloat(String(item.unit_price)),
          total_price: parseFloat(String(item.quantity * item.unit_price)),
          notes: item.notes || null
        }))
      );
    }

    setEditOrder(null);
    await load();
  }

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="Search orders"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
          {(['All', 'Paid', 'Unpaid'] as const).map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}>
          {(['All', 'Dine In', 'Take Out', 'Pick Up', 'Delivery'] as const).map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <button
          onClick={load}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <RefreshCw size={16} className="mr-2 inline" />
          Refresh
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {filtered.map((order) => {
          const receipt: ReceiptOrder = {
            ...order,
            cashier_name: 'Cashier',
            business_name: settings.business_name,
            logo_url: settings.logo_url,
            tagline: settings.tagline,
            receipt_footer: settings.receipt_footer
          };
          return (
            <div key={order.id} className="rounded-2xl border border-gray-100 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-semibold text-gray-900">#{order.order_number}</div>
                    <Badge className={orderTypeTone(order.order_type)}>{order.order_type}</Badge>
                    <button onClick={() => toggleStatus(order)} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusTone(order.payment_status)} transition`}>
                      {order.payment_status}
                    </button>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {order.customer_name} • {order.payment_method} • {formatDateTime(order.created_at || '')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditOrder(order)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                    <FilePenLine size={16} className="mr-2 inline" />
                    Edit
                  </button>
                  <button onClick={() => onPreviewReceipt(receipt)} className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800">
                    <Printer size={16} className="mr-2 inline" />
                    Print
                  </button>
                </div>
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {(order.items || []).map((item) => (
                  <div key={item.id} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-700">
                    {item.product_name} x{item.quantity}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {editOrder ? (
        <Modal title={`Edit Order #${editOrder.order_number}`} onClose={() => setEditOrder(null)} widthClass="max-w-lg">
          <EditOrderForm order={editOrder} onSave={saveEdit} />
        </Modal>
      ) : null}
    </div>
  );
}

function EditOrderForm({ order, onSave }: { order: Order; onSave: (updated: Partial<Order> & { items?: OrderItem[] }) => Promise<void> }) {
  const [form, setForm] = useState({
    order_type: order.order_type,
    customer_name: order.customer_name,
    customer_contact: order.customer_contact || '',
    delivery_address: order.delivery_address || '',
    delivery_fee: order.delivery_fee,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    notes: order.notes || ''
  });
  const [items, setItems] = useState<OrderItem[]>(order.items || []);
  const [showItems, setShowItems] = useState(false);
  const [saving, setSaving] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const total = subtotal + (form.order_type === 'Delivery' ? Number(form.delivery_fee || 0) : 0);

  async function handleSave() {
    setSaving(true);
    await onSave({
      order_type: form.order_type,
      customer_name: form.customer_name,
      customer_contact: form.customer_contact || null,
      delivery_address: form.order_type === 'Delivery' ? form.delivery_address || null : null,
      delivery_fee: form.order_type === 'Delivery' ? form.delivery_fee : 0,
      payment_method: form.payment_method,
      payment_status: form.payment_status,
      notes: form.notes || null,
      subtotal,
      total,
      items
    });
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Customer Name</label>
          <input className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Contact</label>
          <input className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" value={form.customer_contact} onChange={(e) => setForm({ ...form, customer_contact: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Order Type</label>
          <select className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" value={form.order_type} onChange={(e) => setForm({ ...form, order_type: e.target.value as OrderType })}>
            {(['Dine In', 'Take Out', 'Pick Up', 'Delivery'] as OrderType[]).map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Delivery Fee</label>
          <input className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" type="number" value={String(form.delivery_fee)} onChange={(e) => setForm({ ...form, delivery_fee: Number(e.target.value || 0) })} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Payment Method</label>
          <select className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value as PaymentMethod })}>
            {(['Cash', 'GCash', 'Maya', 'MariBank', 'Bank Transfer', 'Other'] as PaymentMethod[]).map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Payment Status</label>
          <select className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value as PaymentStatus })}>
            {(['Paid', 'Unpaid'] as PaymentStatus[]).map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Delivery Address</label>
        <textarea className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" rows={2} value={form.delivery_address} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Order Notes</label>
        <textarea className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>

      <button
        onClick={() => setShowItems(!showItems)}
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
      >
        {showItems ? '▼' : '▶'} Edit Items ({items.length})
      </button>

      {showItems ? (
        <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
          {items.map((item, index) => (
            <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-medium text-gray-900">{item.product_name}</div>
                <button
                  onClick={() => setItems(items.filter((_, i) => i !== index))}
                  className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
              {item.variant_name ? <div className="mb-2 text-xs text-gray-600">{item.variant_name}</div> : null}
              <div className="grid gap-2 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-600">Quantity</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                    value={item.quantity}
                    onChange={(e) => setItems(items.map((i, idx) => (idx === index ? { ...i, quantity: Math.max(1, Number(e.target.value)) } : i)))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-600">Unit Price</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                    value={item.unit_price}
                    onChange={(e) => setItems(items.map((i, idx) => (idx === index ? { ...i, unit_price: Number(e.target.value) } : i)))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-600">Total</label>
                  <div className="rounded-lg border border-gray-200 bg-gray-100 px-2 py-1.5 text-sm font-semibold text-gray-900">
                    {formatCurrency(item.quantity * item.unit_price)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex justify-between text-sm font-semibold text-gray-900">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {form.order_type === 'Delivery' ? (
              <div className="mt-1 flex justify-between text-sm font-semibold text-gray-900">
                <span>Delivery Fee:</span>
                <span>{formatCurrency(form.delivery_fee)}</span>
              </div>
            ) : null}
            <div className="mt-2 border-t border-gray-200 pt-2 flex justify-between text-sm font-bold text-gray-900">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      ) : null}

      <button
        disabled={saving}
        className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
        onClick={handleSave}
      >
        {saving ? 'Saving...' : 'Save All Changes'}
      </button>
    </div>
  );
}

function MenuManagementPage({
  settings,
  supabase,
  onReload
}: {
  settings: BusinessSettings;
  supabase: NonNullable<ReturnType<typeof useAuth>['supabase']>;
  onReload: () => Promise<void>;
}) {
  const { profile } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<(Product & { variants?: ProductVariant[] })[]>([]);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [categoryModal, setCategoryModal] = useState<Category | null>(null);
  const [productModal, setProductModal] = useState<(Product & { variants?: ProductVariant[] }) | null>(null);

  async function load() {
    const [catRes, prodRes, varRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('products').select('*').order('sort_order', { ascending: true }),
      supabase.from('product_variants').select('*').order('sort_order', { ascending: true })
    ]);
    const variants = (varRes.data || []) as ProductVariant[];
    setCategories((catRes.data || []) as Category[]);
    setProducts((prodRes.data || []).map((product) => ({ ...product, variants: variants.filter((variant) => variant.product_id === product.id) })));
  }

  useEffect(() => {
    load();
  }, [supabase]);

  async function saveCategory(category: Partial<Category>) {
    const payload = { name: category.name, sort_order: parseFloat(String(category.sort_order ?? 0)) };
    if (category.id) await supabase.from('categories').update(payload).eq('id', category.id);
    else await supabase.from('categories').insert(payload);
    setCategoryModal(null);
    await load();
  }

  async function saveProduct(product: Partial<Product> & { variants?: ProductVariant[] }) {
    const payload = {
      category_id: product.category_id,
      name: product.name,
      price: parseFloat(String(product.price ?? 0)),
      is_sold_out: !!product.is_sold_out,
      is_active: product.is_active ?? true,
      sort_order: product.sort_order ?? 0
    };
    let productId = product.id;
    if (product.id) {
      const { error } = await supabase.from('products').update(payload).eq('id', product.id);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('products').insert(payload).select('id').single();
      if (error) throw error;
      productId = (data as { id: string }).id;
    }
    if (productId) {
      await supabase.from('product_variants').delete().eq('product_id', productId);
      const variants = (product.variants || []).filter((variant) => variant.name.trim());
      if (variants.length) {
        await supabase.from('product_variants').insert(
          variants.map((variant, index) => ({
            product_id: productId,
            name: variant.name,
            price_modifier: parseFloat(String(variant.price_modifier || 0)),
            sort_order: variant.sort_order ?? index
          }))
        );
      }
    }
    setProductModal(null);
    await load();
  }

  async function toggleSoldOut(product: Product) {
    await supabase.from('products').update({ is_sold_out: !product.is_sold_out }).eq('id', product.id);
    await load();
  }

  async function removeProduct(product: Product) {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', product.id);
    await load();
  }

  async function removeCategory(category: Category) {
    if (!confirm('Delete this category and all its products?')) return;
    await supabase.from('categories').delete().eq('id', category.id);
    await load();
  }

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6">
      <div className="mb-4 flex flex-wrap gap-3">
        <button onClick={() => setCategoryModal({ id: '', name: '', sort_order: 0 })} className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white">
          New Category
        </button>
        <button onClick={() => setProductModal({ id: '', category_id: categories[0]?.id || null, name: '', price: 0, is_sold_out: false, is_active: true, sort_order: 0, variants: [] })} className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white">
          New Product
        </button>
      </div>

      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="rounded-2xl border border-gray-100 bg-white">
            <button
              onClick={() => setOpenCategory((current) => (current === category.id ? null : category.id))}
              className="flex w-full items-center justify-between px-4 py-4 text-left"
            >
              <div>
                <div className="font-semibold text-gray-900">{category.name}</div>
                <div className="text-sm text-gray-500">Sort order: {category.sort_order}</div>
              </div>
              {openCategory === category.id ? <ChevronUp /> : <ChevronDown />}
            </button>
            {openCategory === category.id ? (
              <div className="border-t border-gray-100 p-4">
                <div className="space-y-2">
                  {products
                    .filter((product) => product.category_id === category.id)
                    .map((product) => (
                      <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(Number(product.price))} · {product.variants?.length || 0} variants
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => toggleSoldOut(product)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                            {product.is_sold_out ? 'Mark Available' : 'Mark Sold Out'}
                          </button>
                          <button onClick={() => setProductModal(product)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                            Edit
                          </button>
                          <button onClick={() => removeProduct(product)} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
                <button onClick={() => setProductModal({ id: '', category_id: category.id, name: '', price: 0, is_sold_out: false, is_active: true, sort_order: 0, variants: [] })} className="mt-3 text-sm font-semibold text-orange-500">
                  Add product to {category.name}
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {categoryModal ? (
        <Modal title={categoryModal.id ? 'Edit Category' : 'New Category'} onClose={() => setCategoryModal(null)}>
          <CategoryForm category={categoryModal} onSave={saveCategory} />
        </Modal>
      ) : null}

      {productModal ? (
        <Modal title={productModal.id ? 'Edit Product' : 'New Product'} onClose={() => setProductModal(null)} widthClass="max-w-2xl">
          <ProductForm categories={categories} product={productModal} onSave={saveProduct} />
        </Modal>
      ) : null}
    </div>
  );
}

function CategoryForm({
  category,
  onSave
}: {
  category: Partial<Category>;
  onSave: (category: Partial<Category>) => Promise<void>;
}) {
  const [name, setName] = useState(category.name || '');
  const [sortOrder, setSortOrder] = useState(category.sort_order || 0);
  return (
    <div className="space-y-4">
      <input className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" />
      <input className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
      <button className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white" onClick={() => onSave({ ...category, name, sort_order: sortOrder })}>
        Save Category
      </button>
    </div>
  );
}

function ProductForm({
  categories,
  product,
  onSave
}: {
  categories: Category[];
  product: Partial<Product> & { variants?: ProductVariant[] };
  onSave: (product: Partial<Product> & { variants?: ProductVariant[] }) => Promise<void>;
}) {
  const [name, setName] = useState(product.name || '');
  const [categoryId, setCategoryId] = useState(product.category_id || categories[0]?.id || '');
  const [price, setPrice] = useState(product.price || 0);
  const [sortOrder, setSortOrder] = useState(product.sort_order || 0);
  const [isActive, setIsActive] = useState(product.is_active ?? true);
  const [isSoldOut, setIsSoldOut] = useState(product.is_sold_out ?? false);
  const [variants, setVariants] = useState<ProductVariant[]>(product.variants || []);

  function addVariant() {
    setVariants((current) => [
      ...current,
      { id: crypto.randomUUID(), product_id: product.id || '', name: '', price_modifier: 0, sort_order: current.length }
    ]);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <select className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm" value={categoryId || ''} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" />
        <input className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Price" />
        <input className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm" type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} placeholder="Sort order" />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setIsActive((value) => !value)} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${isActive ? 'border-green-600 bg-green-600 text-white' : 'border-gray-200 text-gray-700'}`}>
          Active
        </button>
        <button type="button" onClick={() => setIsSoldOut((value) => !value)} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${isSoldOut ? 'border-red-500 bg-red-500 text-white' : 'border-gray-200 text-gray-700'}`}>
          Sold Out
        </button>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <SectionLabel>Variants</SectionLabel>
          <button type="button" onClick={addVariant} className="text-sm font-semibold text-orange-500">
            Add Variant
          </button>
        </div>
        <div className="space-y-2">
          {variants.map((variant, index) => (
            <div key={variant.id} className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
              <input
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                value={variant.name}
                onChange={(e) =>
                  setVariants((current) => current.map((item, i) => (i === index ? { ...item, name: e.target.value } : item)))
                }
                placeholder="Variant name"
              />
              <input
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                type="number"
                value={variant.price_modifier}
                onChange={(e) =>
                  setVariants((current) => current.map((item, i) => (i === index ? { ...item, price_modifier: Number(e.target.value) } : item)))
                }
                placeholder="Modifier"
              />
              <button
                type="button"
                onClick={() => setVariants((current) => current.filter((_, i) => i !== index))}
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
      <button
        className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white"
        onClick={() =>
          onSave({
            ...product,
            category_id: categoryId,
            name,
            price,
            sort_order: sortOrder,
            is_active: isActive,
            is_sold_out: isSoldOut,
            variants
          })
        }
      >
        Save Changes
      </button>
    </div>
  );
}

function SettingsPage({
  settings,
  setSettings,
  supabase,
  profile,
  onReload
}: {
  settings: BusinessSettings;
  setSettings: (settings: BusinessSettings) => void;
  supabase: NonNullable<ReturnType<typeof useAuth>['supabase']>;
  profile: StaffProfile | null;
  onReload: () => Promise<void>;
}) {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showPassword, setShowPassword] = useState(false);
  const [addStaff, setAddStaff] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [initialSettings, setInitialSettings] = useState<BusinessSettings>(settings);
  const [form, setForm] = useState({
    display_name: '',
    email: '',
    password: '',
    role: 'admin' as StaffProfile['role']
  });

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  async function loadStaff() {
    const { data } = await supabase.from('staff_profiles').select('*').order('created_at', { ascending: true });
    setStaff((data || []) as StaffProfile[]);
  }

  useEffect(() => {
    loadStaff();
    setInitialSettings(settings);
  }, [supabase, settings]);

  async function handleSaveSettings() {
    setSaving(true);
    setMessage('');
    try {
      const rows = [
        { key: 'business_name', value: settings.business_name },
        { key: 'tagline', value: settings.tagline },
        { key: 'logo_url', value: settings.logo_url },
        { key: 'receipt_footer', value: settings.receipt_footer }
      ];
      await supabase.from('app_settings').upsert(rows, { onConflict: 'key' });
      setInitialSettings(settings);
      setMessage('✓ Settings saved successfully');
      setMessageType('success');
      await onReload();
    } catch (err) {
      setMessage(`✗ Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setMessageType('error');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 4000);
    }
  }

  function handleCancel() {
    setSettings(initialSettings);
    setMessage('Changes discarded');
    setMessageType('success');
    setTimeout(() => setMessage(''), 2000);
  }

  async function uploadLogo(file: File | null) {
    if (!file) return;

    const validation = validateLogoFile(file);
    if (!validation.valid) {
      setMessage(`✗ ${validation.error}`);
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setUploadingLogo(true);
    setMessage('');

    try {
      const fileName = getLogoFileName(file);
      const { data, error } = await supabase.storage.from('logos').upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(fileName);
      const publicUrl = urlData?.publicUrl;

      if (publicUrl) {
        setSettings({ ...settings, logo_url: publicUrl });
        setMessage('✓ Logo uploaded (click Save Changes to persist)');
        setMessageType('success');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setMessage(`✗ Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setUploadingLogo(false);
    }
  }

  async function createStaff() {
    setBusy(true);
    setMessage('');
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { display_name: form.display_name, role: form.role } }
    });
    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }
    const userId = data.user?.id;
    if (userId) {
      await supabase.from('staff_profiles').upsert({ id: userId, display_name: form.display_name, role: form.role });
    }
    setAddStaff(false);
    setBusy(false);
    await loadStaff();
  }

  async function deleteStaff(member: StaffProfile) {
    if (!confirm('Delete this staff profile?')) return;
    await supabase.from('staff_profiles').delete().eq('id', member.id);
    await loadStaff();
  }

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6">
      {hasChanges ? (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex-1">
            <div className="text-sm font-semibold text-amber-900">Unsaved Changes</div>
            <div className="text-xs text-amber-700">You have unsaved settings changes.</div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="mb-4 border-b border-gray-100 pb-3">
            <SectionLabel>Business Information</SectionLabel>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600">Business Name</label>
              <input className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400" value={settings.business_name} onChange={(e) => setSettings({ ...settings, business_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600">Tagline/Subtitle</label>
              <input className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400" value={settings.tagline} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600">Receipt Footer</label>
              <textarea className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400" rows={3} value={settings.receipt_footer} onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="mb-4 border-b border-gray-100 pb-3">
            <SectionLabel>Logo Upload</SectionLabel>
          </div>
          <div className="space-y-4">
            {settings.logo_url ? (
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-3">
                <img src={settings.logo_url} alt="Logo" className="h-12 w-12 object-contain" />
                <div className="flex-1">
                  <div className="text-xs font-semibold text-green-900">Logo Added</div>
                  <div className="text-xs text-green-700">Ready to save</div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, logo_url: '' })}
                  className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ) : null}
            <label className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-6 transition hover:border-orange-500 hover:bg-orange-50">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => uploadLogo(e.target.files?.[0] || null)}
                disabled={uploadingLogo}
                className="hidden"
              />
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-700">{uploadingLogo ? 'Uploading...' : 'Click to upload logo'}</div>
                <div className="text-xs text-gray-500">PNG, JPG, or WEBP • Max 5MB</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-6">
        <div className="mb-4 border-b border-gray-100 pb-3">
          <SectionLabel>Staff Accounts</SectionLabel>
        </div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="text-sm text-gray-600">Manage cashiers and staff</div>
          <button onClick={() => { setAddStaff(true); setMessage(''); }} className="rounded-xl bg-orange-500 px-3 py-2 text-sm font-semibold text-white">
            <UserPlus size={16} className="mr-2 inline" />
            Add Staff
          </button>
        </div>
        <div className="space-y-2">
          {staff.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
              <div>
                <div className="font-medium text-gray-900">{member.display_name}</div>
                <div className="text-sm text-gray-500">{member.role}</div>
              </div>
              <div>
                {profile?.id !== member.id ? (
                  <button onClick={() => deleteStaff(member)} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50">
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-6">
        <div className="mb-4 border-b border-gray-100 pb-3">
          <SectionLabel>My Account</SectionLabel>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 font-semibold text-white">{profile?.display_name?.[0] || 'A'}</div>
          <div>
            <div className="font-medium text-gray-900">{profile?.display_name || 'Admin'}</div>
            <div className="text-sm text-gray-500">{profile?.role}</div>
          </div>
        </div>
      </div>

      {message ? (
        <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${messageType === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {message}
        </div>
      ) : null}

      <div className="sticky bottom-0 mt-6 flex gap-3 border-t border-gray-200 bg-gray-50 p-4 -mx-4 -mb-4 rounded-b-2xl">
        <button
          disabled={!hasChanges || saving}
          onClick={handleCancel}
          className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
        >
          Cancel Changes
        </button>
        <button
          disabled={!hasChanges || saving}
          onClick={handleSaveSettings}
          className="flex-1 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {addStaff ? (
        <Modal title="Add Staff" onClose={() => setAddStaff(false)} widthClass="max-w-md">
          <div className="space-y-3">
            <input className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" placeholder="Display name" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
            <input className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <div className="relative">
              <input className="w-full rounded-xl border border-gray-200 px-3 py-2.5 pr-10 text-sm" type={showPassword ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 px-3 text-gray-400">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <select className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as StaffProfile['role'] })}>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="cashier">Cashier</option>
            </select>
            {message ? <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{message}</div> : null}
            <button onClick={createStaff} disabled={busy} className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
              {busy ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppFrame />
    </AuthProvider>
  );
}
