import { useState, type ReactNode } from 'react';
import { Menu, LayoutDashboard, ShoppingCart, ClipboardList, Settings, LogOut, UtensilsCrossed } from 'lucide-react';
import type { Role } from '../types';

export type PageKey = 'pos' | 'orders' | 'dashboard' | 'menu' | 'settings';

const navItems: Array<{ key: PageKey; label: string; icon: ReactNode }> = [
  { key: 'pos', label: 'New Order', icon: <ShoppingCart size={18} /> },
  { key: 'orders', label: 'Orders', icon: <ClipboardList size={18} /> },
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { key: 'menu', label: 'Menu', icon: <UtensilsCrossed size={18} /> },
  { key: 'settings', label: 'Settings', icon: <Settings size={18} /> }
];

type LayoutProps = {
  active: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
  profileName: string;
  role: Role | 'guest';
  businessName: string;
  logoUrl?: string | null;
  signOut: () => Promise<void>;
};

export function Layout({ active, onNavigate, children, profileName, role, businessName, logoUrl, signOut }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-[#f5f3f0] text-gray-900">
      <div className="flex h-full">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-56 border-r border-gray-800 bg-[#1a1a1a] text-white transition-transform lg:static lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        >
          <div className="flex h-full flex-col">
            <div className="flex h-40 items-center justify-center border-b border-white/10 px-4">
              {logoUrl ? (
                <img src={logoUrl} alt={businessName} className="max-h-24 max-w-[140px] object-contain invert" />
              ) : (
                <div className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold tracking-[0.25em] text-gray-900">
                  {businessName}
                </div>
              )}
            </div>

            <nav className="flex-1 space-y-1 p-3">
              {navItems.map((item) => {
                const isActive = active === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      onNavigate(item.key);
                      setMobileOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    <span className="opacity-90">{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    <span className="text-xs opacity-70">{isActive ? '•' : ''}</span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-white/10 p-3">
              <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                  {profileName?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{profileName || 'Admin'}</div>
                  <div className="text-xs text-white/60">Admin</div>
                </div>
              </div>
              <button
                onClick={signOut}
                className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-all hover:bg-white/8 hover:text-white"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {mobileOpen ? (
          <button aria-label="Close sidebar" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-black/50 lg:hidden" />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:px-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">KAINLOWKAL POS</div>
              <div className="text-lg font-semibold text-gray-900">Point of Sale</div>
            </div>
            <button
              onClick={() => setMobileOpen((value) => !value)}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white p-2 text-gray-700 transition hover:bg-gray-50 lg:hidden"
            >
              <Menu size={20} />
            </button>
          </header>

          <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </div>
  );
}

