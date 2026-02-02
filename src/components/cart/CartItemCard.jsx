import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CartItemCard({ 
  item, 
  product, 
  onUpdateQuantity, 
  onRemove,
  isUpdating 
}) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const subtotal = (product?.price || 0) * item.quantity;
  const maxStock = product?.stock || 99;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={product?.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop'}
            alt={product?.name}
            className="w-full h-full object-contain"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-normal text-gray-900 text-xs line-clamp-2">
            {product?.name || 'Produto'}
          </h3>
          <p className="text-[10px] text-gray-500 mt-1">SKU: {product?.sku}</p>
          <p className="font-medium text-foreground mt-2 text-sm">
            {formatPrice(product?.price || 0)}
          </p>
        </div>
        
        <button
          onClick={() => onRemove(item.id)}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1 || isUpdating}
          >
            <Minus className="w-4 h-4" />
          </Button>
          
          <span className="w-8 text-center font-medium">{item.quantity}</span>
          
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            disabled={item.quantity >= maxStock || isUpdating}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-gray-500">Subtotal</p>
          <p className="font-bold text-foreground">{formatPrice(subtotal)}</p>
        </div>
      </div>
    </div>
  );
}