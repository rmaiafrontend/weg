import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Clock, ChevronRight, Zap, Truck, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import CategoryCard from '@/components/product/CategoryCard';
import ProductCard from '@/components/product/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [cartCount, setCartCount] = useState(0);
  const [addingProduct, setAddingProduct] = useState(null);

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('order'),
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-created_date', 200),
  });

  const { data: cartItems = [], refetch: refetchCart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => base44.entities.CartItem.list(),
  });

  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(total);
  }, [cartItems]);

  const featuredProducts = products
    .filter(p => p.stock > 0 && p.express_delivery)
    .slice(0, 4);

  const productCountByCategory = products.reduce((acc, product) => {
    if (product.category_id) {
      acc[product.category_id] = (acc[product.category_id] || 0) + 1;
    }
    return acc;
  }, {});

  const categoriesByProductCount = [...categories].sort(
    (a, b) => (productCountByCategory[b.id] || 0) - (productCountByCategory[a.id] || 0)
  );

  const handleAddToCart = async (product) => {
    setAddingProduct(product.id);
    try {
      const existingItem = cartItems.find(item => item.product_id === product.id);
      if (existingItem) {
        await base44.entities.CartItem.update(existingItem.id, {
          quantity: existingItem.quantity + 1
        });
      } else {
        await base44.entities.CartItem.create({
          product_id: product.id,
          quantity: 1
        });
      }
      refetchCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
    setAddingProduct(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header showSearch showCart cartCount={cartCount} />
      
      <main className="pt-14 max-w-lg mx-auto">
        {/* Hero Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden mx-4 mt-4 rounded-2xl bg-gradient-to-br from-primary via-[hsl(207,100%,30%)] to-[hsl(210,100%,22%)] p-6 shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-white/25 backdrop-blur-sm rounded-full px-3 py-1.5 mb-3 border border-white/20">
              <Clock className="w-3.5 h-3.5 text-white" />
              <span className="font-bold text-white text-xs tracking-wide">ENTREGA EM 1 HORA</span>
            </div>
            <h2 className="text-2xl font-bold mb-2 leading-tight text-white drop-shadow-sm">
              Automação WEG<br/>na sua porta
            </h2>
            <p className="text-white/95 text-sm mb-5 leading-relaxed font-medium">
              Produtos originais com garantia
            </p>
            <Link 
              to={createPageUrl('Products')}
              className="inline-flex items-center gap-2 bg-white hover:bg-white/95 text-primary px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl border-0"
            >
              Ver Ofertas
              <Zap className="w-4 h-4" fill="currentColor" />
            </Link>
          </div>

          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute top-1/2 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl" />
        </motion.div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-3 px-4 mt-6">
          {[
            { icon: Truck, text: 'Entrega 1h', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
            { icon: Shield, text: 'Garantia WEG', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
            { icon: Zap, text: 'Original', iconBg: 'bg-green-500/10', iconColor: 'text-green-600' },
          ].map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="group bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-200"
            >
              <div className={`w-12 h-12 rounded-xl ${benefit.iconBg} flex items-center justify-center mx-auto mb-2.5 group-hover:scale-105 transition-transform duration-200`}>
                <benefit.icon className={`w-6 h-6 ${benefit.iconColor}`} strokeWidth={1.75} />
              </div>
              <span className="text-sm font-medium text-gray-800 block leading-tight">{benefit.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Categories */}
        <section className="px-4 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Categorias</h2>
            <Link 
              to={createPageUrl('Categories')}
              className="text-primary text-sm font-medium flex items-center"
            >
              Ver todas
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loadingCategories ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {categoriesByProductCount.slice(0, 5).map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CategoryCard 
                    category={category} 
                    productCount={productCountByCategory[category.id]}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Featured Products */}
        <section className="px-4 mt-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Entrega Express</h2>
            <Link 
              to={createPageUrl('Products')}
              className="text-primary text-sm font-medium flex items-center"
            >
              Ver todos
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loadingProducts ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-72 rounded-xl" />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCard 
                    product={product}
                    onAddToCart={handleAddToCart}
                    isAdding={addingProduct === product.id}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum produto disponível no momento</p>
            </div>
          )}
        </section>
      </main>
      
      <BottomNav cartCount={cartCount} />
    </div>
  );
}