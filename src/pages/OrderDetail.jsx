import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { 
  Package, 
  Clock, 
  MapPin, 
  CreditCard, 
  Truck, 
  CheckCircle, 
  XCircle, 
  FileText,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const STATUS_STEPS = [
  { key: 'AGUARDANDO_PAGAMENTO', label: 'Aguardando Pagamento', icon: CreditCard },
  { key: 'PAGAMENTO_CONFIRMADO', label: 'Pagamento Confirmado', icon: CheckCircle },
  { key: 'EM_SEPARACAO', label: 'Em Separação', icon: Package },
  { key: 'SAIU_PARA_ENTREGA', label: 'Saiu para Entrega', icon: Truck },
  { key: 'ENTREGUE', label: 'Entregue', icon: CheckCircle },
];

export default function OrderDetail() {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const orders = await base44.entities.Order.filter({ id: orderId });
      return orders[0];
    },
    enabled: !!orderId,
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

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      pix: 'PIX',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      boleto: 'Boleto Bancário'
    };
    return labels[method] || method;
  };

  const getCurrentStepIndex = () => {
    if (order?.status === 'CANCELADO') return -1;
    return STATUS_STEPS.findIndex(step => step.key === order?.status);
  };

  const canCancel = () => {
    return ['AGUARDANDO_PAGAMENTO', 'PAGAMENTO_CONFIRMADO'].includes(order?.status);
  };

  const handleCancel = async () => {
    await base44.entities.Order.update(order.id, {
      status: 'CANCELADO',
      status_history: [
        ...(order.status_history || []),
        {
          status: 'CANCELADO',
          timestamp: new Date().toISOString(),
          message: 'Pedido cancelado pelo cliente'
        }
      ]
    });
    refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header title="Carregando..." showBack />
        <main className="pt-14 max-w-lg mx-auto p-4 space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </main>
        <BottomNav cartCount={cartCount} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header title="Pedido" showBack />
        <main className="pt-14 max-w-lg mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Pedido não encontrado</p>
            <Button onClick={() => navigate(createPageUrl('Orders'))}>
              Ver meus pedidos
            </Button>
          </div>
        </main>
        <BottomNav cartCount={cartCount} />
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex();
  const isCancelled = order.status === 'CANCELADO';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title={`Pedido ${order.order_number}`} showBack />
      
      <main className="pt-14 max-w-lg mx-auto">
        {/* Delivery Estimate */}
        {!isCancelled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`m-4 p-3 rounded-xl ${
              order.express_delivery 
                ? 'bg-gradient-to-r from-accent to-accent/90 text-white'
                : 'bg-white border'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                order.express_delivery ? 'bg-white/20' : 'bg-primary/10'
              }`}>
                <Clock className={`w-4 h-4 ${order.express_delivery ? 'text-white' : 'text-primary'}`} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className={`text-xs ${order.express_delivery ? 'text-white/80' : 'text-gray-500'} font-normal`}>
                  Previsão de Entrega
                </p>
                <p className={`text-base font-medium ${order.express_delivery ? '' : 'text-gray-900'}`}>
                  {order.express_delivery && order.status !== 'ENTREGUE' 
                    ? 'Em até 1 hora' 
                    : formatDateTime(order.estimated_delivery)}
                </p>
              </div>
              {order.status === 'SAIU_PARA_ENTREGA' && (
                <Button 
                  size="sm" 
                  variant={order.express_delivery ? 'secondary' : 'default'}
                  className={`h-8 text-sm ${order.express_delivery ? 'bg-white text-accent' : ''}`}
                >
                  Rastrear
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Status Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white mx-4 rounded-xl p-3"
        >
          <h2 className="font-medium text-base text-gray-900 mb-3">Status do Pedido</h2>
          
          {isCancelled ? (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-lg">
              <XCircle className="w-5 h-5 text-red-500" strokeWidth={1.5} />
              <div>
                <p className="font-medium text-sm text-red-700">Pedido Cancelado</p>
                <p className="text-xs text-red-600">
                  {order.status_history?.find(h => h.status === 'CANCELADO')?.message}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const StepIcon = step.icon;
                
                return (
                  <div key={step.key} className="flex items-start gap-2.5">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-gray-100 text-gray-400'
                      } ${isCurrent ? 'ring-2 ring-primary/20' : ''}`}>
                        <StepIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </div>
                      {index < STATUS_STEPS.length - 1 && (
                        <div className={`w-0.5 h-6 mt-1 ${
                          index < currentStepIndex ? 'bg-primary' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <p className={`text-sm font-normal ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      {isCurrent && order.status_history?.find(h => h.status === step.key) && (
                        <p className="text-xs text-gray-500 mt-0.5 font-light">
                          {formatDateTime(order.status_history.find(h => h.status === step.key)?.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white mx-4 mt-4 rounded-xl p-3"
        >
          <h2 className="font-medium text-base text-gray-900 mb-3">
            Itens do Pedido ({order.items?.length})
          </h2>
          
          <div className="space-y-2.5">
            {order.items?.map((item, index) => (
              <div key={index} className="flex items-center gap-2.5">
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={item.product_image} 
                    alt={item.product_name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-normal truncate">{item.product_name}</p>
                  <p className="text-xs text-gray-500 font-light">Qtd: {item.quantity}</p>
                </div>
                <p className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-light">Subtotal</span>
              <span className="font-normal">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-light">Frete</span>
              <span className={`font-normal ${order.shipping === 0 ? 'text-green-600' : ''}`}>
                {order.shipping === 0 ? 'Grátis' : formatPrice(order.shipping)}
              </span>
            </div>
            <div className="flex justify-between text-base font-medium pt-1.5 border-t">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </motion.div>

        {/* Delivery Address */}
        {order.address && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white mx-4 mt-4 rounded-xl p-3"
          >
            <h2 className="font-medium text-base text-gray-900 mb-2">Endereço de Entrega</h2>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" strokeWidth={1.5} />
              <div className="text-sm text-gray-600 font-light leading-relaxed">
                <p>{order.address.street}, {order.address.number}</p>
                {order.address.complement && <p>{order.address.complement}</p>}
                <p>{order.address.neighborhood}</p>
                <p>{order.address.city} - {order.address.state}</p>
                <p>CEP: {order.address.cep}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Payment Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white mx-4 mt-4 rounded-xl p-3"
        >
          <h2 className="font-medium text-base text-gray-900 mb-2">Pagamento</h2>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            <span className="text-sm text-gray-600 font-light">
              {getPaymentMethodLabel(order.payment_method)}
            </span>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mx-4 mt-6 mb-4 space-y-2"
        >
          <Button
            variant="outline"
            size="sm"
            className="w-full h-9 text-sm font-normal"
            onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
          >
            <MessageCircle className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Preciso de Ajuda
          </Button>

          {canCancel() && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-9 text-sm font-normal text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <XCircle className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  Cancelar Pedido
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-sm mx-4">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-base">Cancelar pedido?</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm">
                    Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="text-sm">Voltar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    className="bg-red-500 hover:bg-red-600 text-sm"
                  >
                    Cancelar Pedido
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </motion.div>
      </main>
      
      <BottomNav cartCount={cartCount} />
    </div>
  );
}