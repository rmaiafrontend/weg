import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Trash2, Clock, Truck } from 'lucide-react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import CartItemCard from '@/components/cart/CartItemCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Cart() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cartCount, setCartCount] = useState(0);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [updatingItem, setUpdatingItem] = useState(null);

  const { data: cartItems = [], isLoading: loadingCart, refetch: refetchCart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => base44.entities.CartItem.list(),
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(total);
  }, [cartItems]);

  const productMap = products.reduce((acc, product) => {
    acc[product.id] = product;
    return acc;
  }, {});

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }) => {
      if (quantity < 1) return;
      await base44.entities.CartItem.update(itemId, { quantity });
    },
    onSuccess: () => {
      refetchCart();
      setUpdatingItem(null);
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId) => {
      await base44.entities.CartItem.delete(itemId);
    },
    onSuccess: () => {
      refetchCart();
      setItemToRemove(null);
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(cartItems.map(item => 
        base44.entities.CartItem.delete(item.id)
      ));
    },
    onSuccess: () => {
      refetchCart();
    },
  });

  const handleUpdateQuantity = (itemId, quantity) => {
    setUpdatingItem(itemId);
    updateQuantityMutation.mutate({ itemId, quantity });
  };

  const handleRemove = (itemId) => {
    setItemToRemove(itemId);
  };

  const confirmRemove = () => {
    if (itemToRemove) {
      removeItemMutation.mutate(itemToRemove);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const product = productMap[item.product_id];
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  const shipping = subtotal >= 299 ? 0 : 19.90;
  const total = subtotal + shipping;

  const allExpressDelivery = cartItems.every(item => {
    const product = productMap[item.product_id];
    return product?.express_delivery && product?.stock > 0;
  });

  const isLoading = loadingCart || loadingProducts;
  const isEmpty = cartItems.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-48">
      <Header 
        title="Meu Carrinho" 
        showBack
      />
      
      <main className="pt-14 max-w-lg mx-auto">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : isEmpty ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh] px-4"
          >
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Seu carrinho está vazio
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Explore nossos produtos e encontre o que você precisa
            </p>
            <Button
              onClick={() => navigate(createPageUrl('Home'))}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Explorar Produtos
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Clear Cart Button */}
            <div className="flex justify-end px-4 pt-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => clearCartMutation.mutate()}
                disabled={clearCartMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            </div>

            {/* Cart Items */}
            <div className="p-4 space-y-4">
              <AnimatePresence>
                {cartItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <CartItemCard
                      item={item}
                      product={productMap[item.product_id]}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemove={handleRemove}
                      isUpdating={updatingItem === item.id}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Add More Products */}
            <div className="px-4 pb-4">
              <Button
                variant="outline"
                className="w-full border-primary text-primary"
                onClick={() => navigate(createPageUrl('Home'))}
              >
                <Plus className="w-4 h-4 mr-2" />
                Continuar Comprando
              </Button>
            </div>

            {/* Delivery Info */}
            {allExpressDelivery && cartItems.length > 0 && (
              <div className="mx-4 p-4 bg-gradient-to-r from-accent/10 to-accent/5 rounded-xl border border-accent/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-accent">Entrega Express Disponível!</p>
                    <p className="text-sm text-gray-600">Receba em até 1 hora</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Fixed Bottom Summary */}
      {!isEmpty && !isLoading && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-3 z-40">
          <div className="max-w-lg mx-auto space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Frete</span>
              <span className={shipping === 0 ? 'text-green-500 font-medium' : 'font-medium'}>
                {shipping === 0 ? 'Grátis' : formatPrice(shipping)}
              </span>
            </div>
            {subtotal < 299 && (
              <p className="text-xs text-gray-500">
                Faltam {formatPrice(299 - subtotal)} para frete grátis
              </p>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="font-semibold text-base">Total</span>
              <span className="font-bold text-lg text-foreground">{formatPrice(total)}</span>
            </div>
            
            <Button
              onClick={() => navigate(createPageUrl('Checkout'))}
              className="w-full h-9 bg-accent hover:bg-accent/90 text-accent-foreground text-sm font-semibold"
            >
              Ir para Pagamento
            </Button>
          </div>
        </div>
      )}

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!itemToRemove} onOpenChange={() => setItemToRemove(null)}>
        <AlertDialogContent className="max-w-sm mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover item?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este item do carrinho?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-red-500 hover:bg-red-600"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <BottomNav cartCount={cartCount} />
    </div>
  );
}