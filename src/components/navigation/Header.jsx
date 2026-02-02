import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, ShoppingCart, ArrowLeft, Share2, Heart } from 'lucide-react';

export default function Header({ 
  title,
  showBack = false,
  showSearch = false,
  showCart = false,
  showShare = false,
  showFavorite = false,
  cartCount = 0,
  onBack,
  onSearch,
  onShare,
  onFavorite,
  isFavorite = false
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white z-50 safe-area-top">
      <div className="max-w-lg mx-auto flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <button 
              onClick={handleBack}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
          )}
          
          {title ? (
            <h1 className="text-lg font-medium text-gray-900 truncate">{title}</h1>
          ) : (
            <Link to={createPageUrl('Home')} className="flex items-center">
              <span className="text-xl font-bold">
                <span className="text-foreground">WEG</span>
                <span className="text-accent">X</span>
              </span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1">
          {showSearch && (
            <button 
              onClick={onSearch}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Search className="w-6 h-6 text-gray-700" />
            </button>
          )}
          
          {showShare && (
            <button 
              onClick={onShare}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Share2 className="w-5 h-5 text-gray-700" />
            </button>
          )}
          
          {showFavorite && (
            <button 
              onClick={onFavorite}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Heart 
                className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} 
              />
            </button>
          )}
          
          {showCart && (
            <Link 
              to={createPageUrl('Cart')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
            >
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-accent text-accent-foreground text-xs font-bold min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}