import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Grid3X3, ShoppingCart, Package, User } from 'lucide-react';

const navItems = [
  { name: 'Home', icon: Home, page: 'Home' },
  { name: 'Categorias', icon: Grid3X3, page: 'Categories' },
  { name: 'Carrinho', icon: ShoppingCart, page: 'Cart' },
  { name: 'Pedidos', icon: Package, page: 'Orders' },
  { name: 'Perfil', icon: User, page: 'Profile' },
];

export default function BottomNav({ cartCount = 0 }) {
  const location = useLocation();
  
  const isActive = (page) => {
    const pageUrl = createPageUrl(page);
    return location.pathname === pageUrl || location.pathname === pageUrl + '/';
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-50 safe-area-bottom">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.page);
          const isCart = item.page === 'Cart';
          
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`flex flex-col items-center justify-center py-2 px-3 relative transition-all duration-200 ${
                active ? 'text-primary' : 'text-gray-400'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? 'stroke-[1.5]' : 'stroke-[1.25]'}`} strokeLinecap="round" strokeLinejoin="round" />
                {isCart && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground text-[10px] font-semibold min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center shadow-sm">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>
              <span className={`text-xs mt-1.5 font-normal tracking-wide ${active ? 'font-medium' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}