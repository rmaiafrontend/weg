import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Bell, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExpressBadge from '@/components/ui/ExpressBadge';
import UnavailableBadge from '@/components/ui/UnavailableBadge';

export default function ProductCard({ product, onAddToCart, isAdding }) {
  const isAvailable = product.stock > 0;
  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div
      className={`group bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-200 h-full flex flex-col hover:shadow-lg hover:border-gray-200 hover:-translate-y-0.5 ${!isAvailable ? 'opacity-70' : ''}`}
    >
      <Link to={createPageUrl(`ProductDetail?id=${product.id}`)} className="block">
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
          <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
            {isAvailable && product.express_delivery && (
              <span className="bg-accent text-accent-foreground text-xs font-semibold px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                <Truck className="w-3 h-3" />
                1h
              </span>
            )}
            {!isAvailable && (
              <UnavailableBadge />
            )}
            {hasDiscount && isAvailable && (
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm ml-auto">
                -{discountPercent}%
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-3.5 flex flex-col flex-1 min-h-0">
        <Link
          to={createPageUrl(`ProductDetail?id=${product.id}`)}
          className="flex-1 flex flex-col min-h-0 hover:no-underline"
        >
          <h3 className="text-base font-medium text-gray-900 line-clamp-2 leading-snug mb-1">
            {product.name}
          </h3>
          <p className="text-sm text-gray-400 mb-3">SKU: {product.sku}</p>
        </Link>

        <div className="mt-auto pt-2">
          <div className="rounded-xl bg-gray-50/80 border border-gray-100 px-3 py-3 flex flex-col gap-2.5">
            <div className="flex flex-col items-start gap-0.5">
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.original_price)}
                </span>
              )}
              <span className="text-base font-bold text-primary tabular-nums leading-none">
                {formatPrice(product.price)}
              </span>
            </div>
            {isAvailable ? (
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  onAddToCart(product);
                }}
                disabled={isAdding}
                size="sm"
                className="w-full h-9 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" strokeWidth={2} />
                {isAdding ? 'Adicionando...' : 'Adicionar'}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-9 rounded-xl text-sm font-medium border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
              >
                <Bell className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.75} />
                Avise-me
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}