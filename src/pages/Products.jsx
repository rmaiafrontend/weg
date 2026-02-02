import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import ProductCard from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';

export default function Products() {
  const [cartCount, setCartCount] = useState(0);
  const [addingProduct, setAddingProduct] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [showExpressOnly, setShowExpressOnly] = useState(false);
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('category');

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products', categoryId],
    queryFn: async () => {
      if (categoryId) {
        return base44.entities.Product.filter({ category_id: categoryId });
      }
      return base44.entities.Product.list();
    },
  });

  const { data: category } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      const categories = await base44.entities.Category.filter({ id: categoryId });
      return categories[0];
    },
    enabled: !!categoryId,
  });

  const { data: cartItems = [], refetch: refetchCart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => base44.entities.CartItem.list(),
  });

  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(total);
  }, [cartItems]);

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

  let filteredProducts = [...products];
  
  if (showExpressOnly) {
    filteredProducts = filteredProducts.filter(p => p.express_delivery);
  }
  
  if (showInStockOnly) {
    filteredProducts = filteredProducts.filter(p => p.stock > 0);
  }

  if (sortBy === 'price_asc') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price_desc') {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  const sortLabels = {
    relevance: 'Relevância',
    price_asc: 'Menor Preço',
    price_desc: 'Maior Preço'
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header 
        title={category?.name || 'Produtos'} 
        showBack 
        showCart 
        cartCount={cartCount} 
      />
      
      <main className="pt-14 max-w-lg mx-auto">
        {/* Filters Bar */}
        <div className="sticky top-14 z-40 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  {sortLabels[sortBy]}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setSortBy('relevance')}>
                  Relevância
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('price_asc')}>
                  Menor Preço
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('price_desc')}>
                  Maior Preço
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="py-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="express" 
                      checked={showExpressOnly}
                      onCheckedChange={setShowExpressOnly}
                    />
                    <label htmlFor="express" className="text-sm font-medium">
                      Apenas Entrega Express
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="instock" 
                      checked={showInStockOnly}
                      onCheckedChange={setShowInStockOnly}
                    />
                    <label htmlFor="instock" className="text-sm font-medium">
                      Apenas em Estoque
                    </label>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          <p className="text-sm text-gray-500 mt-2">
            {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Products Grid */}
        <div className="p-4">
          {loadingProducts ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-72 rounded-xl" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
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
            <div className="text-center py-16">
              <p className="text-gray-500 mb-2">Nenhum produto encontrado</p>
              <p className="text-sm text-gray-400">Tente ajustar os filtros</p>
            </div>
          )}
        </div>
      </main>
      
      <BottomNav cartCount={cartCount} />
    </div>
  );
}