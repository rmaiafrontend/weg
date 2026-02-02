import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, ShoppingCart, FileText, ChevronDown, ChevronUp, Bell, Check } from 'lucide-react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import ExpressBadge from '@/components/ui/ExpressBadge';
import UnavailableBadge from '@/components/ui/UnavailableBadge';
import ProductCard from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export default function ProductDetail() {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [showSpecs, setShowSpecs] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const products = await base44.entities.Product.filter({ id: productId });
      return products[0];
    },
    enabled: !!productId,
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['relatedProducts', product?.category_id],
    queryFn: async () => {
      if (!product?.category_id) return [];
      const products = await base44.entities.Product.filter({ category_id: product.category_id });
      return products.filter(p => p.id !== productId).slice(0, 6);
    },
    enabled: !!product?.category_id,
  });

  const { data: cartItems = [], refetch: refetchCart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => base44.entities.CartItem.list(),
  });

  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(total);
  }, [cartItems]);

  const isAvailable = product?.stock > 0;
  const maxQuantity = product?.stock || 1;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleAddToCart = async () => {
    if (!product || !isAvailable) return;
    
    setIsAdding(true);
    try {
      const existingItem = cartItems.find(item => item.product_id === product.id);
      if (existingItem) {
        await base44.entities.CartItem.update(existingItem.id, {
          quantity: existingItem.quantity + quantity
        });
      } else {
        await base44.entities.CartItem.create({
          product_id: product.id,
          quantity: quantity
        });
      }
      refetchCart();
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
    setIsAdding(false);
  };

  const images = product?.images?.length > 0 
    ? product.images 
    : ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop'];

  const hasDiscount = product?.original_price && product.original_price > product.price;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <Header showBack title="Detalhes" showCart cartCount={cartCount} />
        <main className="pt-14 pb-28 w-full max-w-lg mx-auto px-4 space-y-4">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </main>
        <BottomNav cartCount={cartCount} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header showBack title="Detalhes" showCart cartCount={cartCount} />
        <main className="pt-14 w-full max-w-lg mx-auto px-4 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Produto não encontrado</p>
            <Button onClick={() => navigate(createPageUrl('Home'))}>
              Voltar para Home
            </Button>
          </div>
        </main>
        <BottomNav cartCount={cartCount} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header 
        showBack 
        title="Detalhes" 
        showCart 
        showShare 
        showFavorite
        cartCount={cartCount}
      />
      
      <main className="pt-14 pb-28 w-full max-w-lg mx-auto px-4 space-y-4">
        {/* Image Gallery - card */}
        <div className="mt-5 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div className="relative aspect-square bg-gray-50 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                src={images[currentImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </AnimatePresence>
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {isAvailable && product.express_delivery && <ExpressBadge />}
              {!isAvailable && <UnavailableBadge />}
              {hasDiscount && isAvailable && (
                <span className="bg-green-500 text-white text-sm font-bold px-2.5 py-1 rounded-lg">
                  -{Math.round((1 - product.price / product.original_price) * 100)}%
                </span>
              )}
            </div>
          </div>
          {images.length > 1 && (
            <div className="flex justify-center gap-2 py-3">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImage(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    currentImage === index ? 'bg-primary' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info - card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5">
            <h1 className="text-xl font-semibold text-gray-900 leading-tight mb-1">{product.name}</h1>
            <p className="text-base text-gray-500 mb-4">SKU: {product.sku}</p>
            <div className="flex flex-wrap items-baseline gap-2 mb-1">
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(product.original_price)}
                </span>
              )}
              <span className="text-2xl font-bold text-primary tabular-nums">
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span className="bg-green-500 text-white text-sm font-bold px-2 py-0.5 rounded-md">
                  -{Math.round((1 - product.price / product.original_price) * 100)}%
                </span>
              )}
            </div>
            <p className="text-base text-gray-600 mb-5">
              ou <span className="font-semibold">12x de {formatPrice(product.price / 12)}</span> sem juros
            </p>

            {/* Quantity Selector */}
            {isAvailable && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-semibold text-gray-900">Quantidade</span>
                  <span className="text-sm text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-100">
                    {product.stock} em estoque
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-xl border-gray-200 hover:bg-white shrink-0"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 bg-white rounded-xl border border-gray-200 h-10 flex items-center justify-center">
                    <span className="font-bold text-lg text-gray-900 tabular-nums">{quantity}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-xl border-gray-200 hover:bg-white shrink-0"
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 mb-2">Descrição</h2>
            <p className="text-base text-gray-700 leading-relaxed">
              {product.description}
            </p>
          </div>
        )}

        {/* Specifications */}
        {product.specs && product.specs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <Collapsible open={showSpecs} onOpenChange={setShowSpecs}>
              <CollapsibleTrigger className="w-full p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <h2 className="font-semibold text-gray-900 text-base">Especificações Técnicas</h2>
                {showSpecs ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-5 pb-5 pt-0 space-y-0 border-t border-gray-100">
                  {product.specs.map((spec, index) => (
                    <div key={index} className="flex justify-between py-3 border-b border-gray-50 last:border-0">
                      <span className="text-base text-gray-500">{spec.label}</span>
                      <span className="text-base font-medium text-gray-900">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Datasheet */}
        {product.datasheet_url && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <a
              href={product.datasheet_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-primary hover:underline font-medium text-base"
            >
              <FileText className="w-5 h-5 shrink-0" />
              Download Datasheet (PDF)
            </a>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="pt-2">
            <h2 className="font-semibold text-gray-900 text-base mb-3 px-1">Produtos Relacionados</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide snap-x snap-mandatory">
              {relatedProducts.map((relProduct) => (
                <div key={relProduct.id} className="w-44 flex-shrink-0 snap-start min-w-0">
                  <ProductCard 
                    product={relProduct}
                    onAddToCart={() => {}}
                    isAdding={false}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Fixed Bottom CTA - flutuante */}
      <div className="fixed bottom-20 left-0 right-0 z-40 flex justify-center px-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-gray-100 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Total</span>
            <span className="text-xl font-bold text-foreground tabular-nums leading-tight">
              {formatPrice(product.price * quantity)}
            </span>
          </div>
          {isAvailable ? (
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={isAdding}
              className={`shrink-0 h-9 px-5 rounded-xl text-xs font-medium transition-all ${
                addedToCart 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-accent hover:bg-accent/90 text-accent-foreground'
              }`}
            >
              {addedToCart ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" strokeWidth={2} />
                  Adicionado
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.75} />
                  {isAdding ? 'Adicionando...' : 'Adicionar ao carrinho'}
                </>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 h-9 px-5 rounded-xl text-sm font-medium border-gray-300 text-gray-600"
            >
              <Bell className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.75} />
              Avise-me
            </Button>
          )}
        </div>
      </div>
      
      <BottomNav cartCount={cartCount} />
    </div>
  );
}