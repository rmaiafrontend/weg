import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, MapPin, CreditCard, Package, Home, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const orderNumber = urlParams.get('order');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: async () => {
      const orders = await base44.entities.Order.filter({ order_number: orderNumber });
      return orders[0];
    },
    enabled: !!orderNumber,
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Pedido não encontrado</p>
          <Button onClick={() => navigate(createPageUrl('Home'))}>
            Voltar para Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header with logo only */}
      <header className="bg-white py-4 px-4 text-center border-b">
        <span className="text-2xl font-bold">
          <span className="text-foreground">WEG</span>
          <span className="text-accent">X</span>
        </span>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-8">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <CheckCircle className="w-14 h-14 text-green-500" />
            </motion.div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pedido Confirmado!</h1>
          <p className="text-primary font-medium text-lg">#{order.order_number}</p>
          <p className="text-gray-500 text-sm mt-2">
            Você receberá atualizações pelo WhatsApp
          </p>
        </motion.div>

        {/* Delivery Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`p-6 rounded-xl mb-4 ${
            order.express_delivery 
              ? 'bg-gradient-to-r from-accent to-accent/90 text-white'
              : 'bg-white border border-gray-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              order.express_delivery ? 'bg-white/20' : 'bg-primary/10'
            }`}>
              <Clock className={`w-6 h-6 ${order.express_delivery ? 'text-white' : 'text-primary'}`} />
            </div>
            <div>
              <p className={`text-sm ${order.express_delivery ? 'text-white/80' : 'text-gray-500'}`}>
                Previsão de Entrega
              </p>
              <p className={`text-lg font-bold ${order.express_delivery ? '' : 'text-gray-900'}`}>
                {order.express_delivery ? 'Em até 1 hora' : formatDate(order.estimated_delivery)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-4 mb-4"
        >
          <h2 className="font-semibold text-gray-900 mb-4">Resumo do Pedido</h2>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total pago</span>
              <span className="font-bold text-foreground">{formatPrice(order.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Forma de pagamento</span>
              <span className="font-medium">{getPaymentMethodLabel(order.payment_method)}</span>
            </div>
          </div>

          {order.address && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <p>{order.address.street}, {order.address.number}</p>
                  {order.address.complement && <p>{order.address.complement}</p>}
                  <p>{order.address.neighborhood}</p>
                  <p>{order.address.city} - {order.address.state}</p>
                  <p>CEP: {order.address.cep}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-4 mb-4"
        >
          <h2 className="font-semibold text-gray-900 mb-4">
            {order.items?.length} {order.items?.length === 1 ? 'item' : 'itens'}
          </h2>
          
          <div className="space-y-3">
            {order.items?.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={item.product_image} 
                    alt={item.product_name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product_name}</p>
                  <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                </div>
                <p className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* NF-e Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-blue-50 rounded-xl p-4 mb-6"
        >
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-primary mt-0.5" />
            <p className="text-sm text-primary">
              A Nota Fiscal será enviada para seu e-mail e WhatsApp após a confirmação do pagamento.
            </p>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-3"
        >
          <Button
            onClick={() => navigate(createPageUrl(`OrderDetail?id=${order.id}`))}
            className="w-full h-12 bg-accent hover:bg-accent/90 text-base font-semibold text-accent-foreground"
          >
            <Package className="w-5 h-5 mr-2" />
            Acompanhar Pedido
          </Button>
          
          <Button
            onClick={() => navigate(createPageUrl('Home'))}
            variant="outline"
            className="w-full h-12 text-base font-semibold"
          >
            <Home className="w-5 h-5 mr-2" />
            Voltar para Home
          </Button>
        </motion.div>
      </main>
    </div>
  );
}