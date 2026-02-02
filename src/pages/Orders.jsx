import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Package, ChevronRight, Clock, Truck, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_CONFIG = {
  AGUARDANDO_PAGAMENTO: {
    label: 'Aguardando Pagamento',
    color: 'bg-yellow-100 text-yellow-800',
    icon: CreditCard,
  },
  PAGAMENTO_CONFIRMADO: {
    label: 'Pagamento Confirmado',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle,
  },
  EM_SEPARACAO: {
    label: 'Em Separação',
    color: 'bg-blue-100 text-blue-800',
    icon: Package,
  },
  SAIU_PARA_ENTREGA: {
    label: 'Saiu para Entrega',
    color: 'bg-primary/10 text-primary',
    icon: Truck,
  },
  ENTREGUE: {
    label: 'Entregue',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
  CANCELADO: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
};

export default function Orders() {
  const [filter, setFilter] = useState('all');
  const [cartCount, setCartCount] = useState(0);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart'],
    queryFn: () => base44.entities.CartItem.list(),
  });

  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(total);
  }, [cartItems]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'active') {
      return !['ENTREGUE', 'CANCELADO'].includes(order.status);
    }
    if (filter === 'delivered') {
      return order.status === 'ENTREGUE';
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Meus Pedidos" showBack showCart cartCount={cartCount} />
      
      <main className="pt-14 max-w-lg mx-auto">
        {/* Tabs */}
        <div className="sticky top-14 bg-white border-b z-30">
          <div className="px-4 py-2">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="w-full grid grid-cols-3 h-8">
                <TabsTrigger value="all" className="text-sm font-normal">Todos</TabsTrigger>
                <TabsTrigger value="active" className="text-sm font-normal">Em Andamento</TabsTrigger>
                <TabsTrigger value="delivered" className="text-sm font-normal">Entregues</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Package className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
              </div>
              <h2 className="text-base font-medium text-gray-900 mb-2">
                Nenhum pedido encontrado
              </h2>
              <p className="text-sm text-gray-500 mb-6 font-light">
                {filter === 'all' 
                  ? 'Você ainda não fez nenhum pedido' 
                  : 'Nenhum pedido nesta categoria'}
              </p>
              <Link
                to={createPageUrl('Home')}
                className="text-primary text-sm font-normal hover:underline"
              >
                Explorar produtos
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order, index) => {
                const statusConfig = STATUS_CONFIG[order.status];
                const StatusIcon = statusConfig?.icon || Package;
                const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={createPageUrl(`OrderDetail?id=${order.id}`)}
                      className="block bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2.5">
                        <div>
                          <p className="font-medium text-base text-gray-900">#{order.order_number}</p>
                          <p className="text-xs text-gray-500 font-light">{formatDate(order.created_date)}</p>
                        </div>
                        <Badge className={`${statusConfig?.color} border-0 text-xs px-2 py-0.5`}>
                          <StatusIcon className="w-2.5 h-2.5 mr-1" strokeWidth={1.5} />
                          {statusConfig?.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="flex -space-x-2">
                          {order.items?.slice(0, 3).map((item, i) => (
                            <div 
                              key={i}
                              className="w-9 h-9 rounded-lg bg-gray-100 border-2 border-white overflow-hidden"
                            >
                              <img 
                                src={item.product_image} 
                                alt=""
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ))}
                          {(order.items?.length || 0) > 3 && (
                            <div className="w-9 h-9 rounded-lg bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-normal text-gray-600">
                              +{(order.items?.length || 0) - 3}
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <p className="text-sm text-gray-600 font-light">
                            {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-medium text-base text-foreground">{formatPrice(order.total)}</p>
                        </div>

                        <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <BottomNav cartCount={cartCount} />
    </div>
  );
}