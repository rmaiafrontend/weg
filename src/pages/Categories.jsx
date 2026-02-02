import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import CategoryCard from '@/components/product/CategoryCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function Categories() {
  const [cartCount, setCartCount] = useState(0);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('order'),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart'],
    queryFn: () => base44.entities.CartItem.list(),
  });

  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(total);
  }, [cartItems]);

  const productCountByCategory = products.reduce((acc, product) => {
    if (product.category_id) {
      acc[product.category_id] = (acc[product.category_id] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Categorias" showBack showCart cartCount={cartCount} />
      
      <main className="pt-14 px-4 max-w-lg mx-auto">
        <div className="py-6">
          <p className="text-gray-600 mb-6">
            Explore nossa linha completa de automação WEG
          </p>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <CategoryCard 
                    category={category}
                    productCount={productCountByCategory[category.id]}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <BottomNav cartCount={cartCount} />
    </div>
  );
}