import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { MapPin, CreditCard, Check, ChevronDown, ChevronUp, Clock, QrCode, FileText, Banknote, Loader2 } from 'lucide-react';
import Header from '@/components/navigation/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';

const STEPS = [
  { id: 1, name: 'Endereço', icon: MapPin },
  { id: 2, name: 'Pagamento', icon: CreditCard },
  { id: 3, name: 'Confirmação', icon: Check },
];

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function Checkout() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  
  const [address, setAddress] = useState({
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });
  
  const [payment, setPayment] = useState({
    method: 'pix',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
    installments: '1',
    document: '',
    documentType: 'cpf',
  });

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart'],
    queryFn: () => base44.entities.CartItem.list(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const productMap = products.reduce((acc, product) => {
    acc[product.id] = product;
    return acc;
  }, {});

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
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const allExpressDelivery = cartItems.every(item => {
    const product = productMap[item.product_id];
    return product?.express_delivery && product?.stock > 0;
  });

  const fetchCep = async (cep) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    
    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setAddress(prev => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
        }));
      }
    } catch (error) {
      console.error('Error fetching CEP:', error);
    }
    setLoadingCep(false);
  };

  const handleCepChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
    const formatted = value.replace(/(\d{5})(\d{3})/, '$1-$2');
    setAddress(prev => ({ ...prev, cep: formatted }));
    
    if (value.length === 8) {
      fetchCep(value);
    }
  };

  const isAddressValid = () => {
    return address.cep && address.street && address.number && 
           address.neighborhood && address.city && address.state;
  };

  const isPaymentValid = () => {
    if (!payment.document) return false;
    
    if (payment.method === 'credit_card' || payment.method === 'debit_card') {
      return payment.cardNumber && payment.cardName && 
             payment.cardExpiry && payment.cardCvv;
    }
    return true;
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    
    try {
      const orderNumber = `WEGX-${Date.now().toString().slice(-5)}`;
      const estimatedDelivery = new Date();
      
      if (allExpressDelivery) {
        estimatedDelivery.setHours(estimatedDelivery.getHours() + 1);
      } else {
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);
      }

      const orderItems = cartItems.map(item => {
        const product = productMap[item.product_id];
        return {
          product_id: item.product_id,
          product_name: product?.name,
          product_image: product?.images?.[0],
          quantity: item.quantity,
          price: product?.price || 0,
        };
      });

      await base44.entities.Order.create({
        order_number: orderNumber,
        status: payment.method === 'pix' ? 'AGUARDANDO_PAGAMENTO' : 'PAGAMENTO_CONFIRMADO',
        items: orderItems,
        subtotal,
        shipping,
        total,
        payment_method: payment.method,
        address,
        customer_document: payment.document,
        express_delivery: allExpressDelivery,
        estimated_delivery: estimatedDelivery.toISOString(),
        status_history: [{
          status: 'AGUARDANDO_PAGAMENTO',
          timestamp: new Date().toISOString(),
          message: 'Pedido realizado'
        }]
      });

      // Clear cart
      await Promise.all(cartItems.map(item => 
        base44.entities.CartItem.delete(item.id)
      ));

      navigate(createPageUrl(`OrderConfirmation?order=${orderNumber}`));
    } catch (error) {
      console.error('Error creating order:', error);
    }
    
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header title="Checkout" showBack />
      
      <main className="pt-14 max-w-lg mx-auto">
        {/* Step Indicator */}
        <div className="px-4 py-6 bg-white border-b">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    currentStep >= step.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-sm mt-2 ${
                    currentStep >= step.id ? 'text-primary font-medium' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${
                    currentStep > step.id ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Order Summary (Collapsible) */}
        <Collapsible open={showOrderSummary} onOpenChange={setShowOrderSummary}>
          <CollapsibleTrigger className="w-full p-4 bg-white border-b flex items-center justify-between">
            <span className="font-medium">
              {itemCount} {itemCount === 1 ? 'item' : 'itens'} - {formatPrice(total)}
            </span>
            <div className="flex items-center gap-2 text-primary">
              <span className="text-sm">Ver detalhes</span>
              {showOrderSummary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="bg-white px-4 pb-4 space-y-3">
              {cartItems.map(item => {
                const product = productMap[item.product_id];
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                      <img 
                        src={product?.images?.[0]} 
                        alt={product?.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product?.name}</p>
                      <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium">
                      {formatPrice((product?.price || 0) * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Step Content */}
        <div className="p-4">
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-semibold mb-4">Endereço de Entrega</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      value={address.cep}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {loadingCep && (
                      <Loader2 className="w-4 h-4 absolute right-3 top-3 animate-spin text-gray-400" />
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    value={address.street}
                    onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))}
                    placeholder="Nome da rua"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      value={address.number}
                      onChange={(e) => setAddress(prev => ({ ...prev, number: e.target.value }))}
                      placeholder="123"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={address.complement}
                      onChange={(e) => setAddress(prev => ({ ...prev, complement: e.target.value }))}
                      placeholder="Apto, bloco (opcional)"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={address.neighborhood}
                    onChange={(e) => setAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
                    placeholder="Bairro"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={address.city}
                      onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Cidade"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">UF</Label>
                    <Select
                      value={address.state}
                      onValueChange={(value) => setAddress(prev => ({ ...prev, state: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATES.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-semibold">Forma de Pagamento</h2>
              
              <RadioGroup
                value={payment.method}
                onValueChange={(value) => setPayment(prev => ({ ...prev, method: value }))}
                className="space-y-3"
              >
                {/* PIX */}
                <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  payment.method === 'pix' ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}>
                  <RadioGroupItem value="pix" className="sr-only" />
                  <div className="w-10 h-10 rounded-full bg-[#00B8A9] flex items-center justify-center mr-4">
                    <QrCode className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">PIX</span>
                      <span className="text-sm bg-accent text-accent-foreground px-2 py-0.5 rounded">Mais Rápido</span>
                    </div>
                    <p className="text-sm text-gray-500">Aprovação instantânea • Garante entrega em 1h</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    payment.method === 'pix' ? 'border-primary' : 'border-gray-300'
                  }`}>
                    {payment.method === 'pix' && <div className="w-3 h-3 rounded-full bg-primary" />}
                  </div>
                </label>

                {/* Credit Card */}
                <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  payment.method === 'credit_card' ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}>
                  <RadioGroupItem value="credit_card" className="sr-only" />
                  <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center mr-4">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">Cartão de Crédito</span>
                    <p className="text-sm text-gray-500">Parcele em até 12x</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    payment.method === 'credit_card' ? 'border-primary' : 'border-gray-300'
                  }`}>
                    {payment.method === 'credit_card' && <div className="w-3 h-3 rounded-full bg-primary" />}
                  </div>
                </label>

                {/* Boleto */}
                <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  payment.method === 'boleto' ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}>
                  <RadioGroupItem value="boleto" className="sr-only" />
                  <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center mr-4">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">Boleto Bancário</span>
                    <p className="text-sm text-gray-500">Vencimento em 3 dias</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    payment.method === 'boleto' ? 'border-primary' : 'border-gray-300'
                  }`}>
                    {payment.method === 'boleto' && <div className="w-3 h-3 rounded-full bg-primary" />}
                  </div>
                </label>
              </RadioGroup>

              {/* Credit Card Form */}
              {payment.method === 'credit_card' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 pt-4 border-t"
                >
                  <div>
                    <Label>Número do Cartão</Label>
                    <Input
                      value={payment.cardNumber}
                      onChange={(e) => setPayment(prev => ({ ...prev, cardNumber: e.target.value }))}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                    />
                  </div>
                  <div>
                    <Label>Nome no Cartão</Label>
                    <Input
                      value={payment.cardName}
                      onChange={(e) => setPayment(prev => ({ ...prev, cardName: e.target.value }))}
                      placeholder="Como está no cartão"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Validade</Label>
                      <Input
                        value={payment.cardExpiry}
                        onChange={(e) => setPayment(prev => ({ ...prev, cardExpiry: e.target.value }))}
                        placeholder="MM/AA"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <Label>CVV</Label>
                      <Input
                        value={payment.cardCvv}
                        onChange={(e) => setPayment(prev => ({ ...prev, cardCvv: e.target.value }))}
                        placeholder="123"
                        maxLength={4}
                        type="password"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Parcelas</Label>
                    <Select
                      value={payment.installments}
                      onValueChange={(value) => setPayment(prev => ({ ...prev, installments: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                          <SelectItem key={n} value={n.toString()}>
                            {n}x de {formatPrice(total / n)} {n === 1 ? '(à vista)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}

              {/* Document for Invoice */}
              <div className="pt-4 border-t">
                <Label>CPF/CNPJ para Nota Fiscal</Label>
                <div className="flex gap-2 mt-2">
                  <Select
                    value={payment.documentType}
                    onValueChange={(value) => setPayment(prev => ({ ...prev, documentType: value }))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={payment.document}
                    onChange={(e) => setPayment(prev => ({ ...prev, document: e.target.value }))}
                    placeholder={payment.documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                    className="flex-1"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <div className="max-w-lg mx-auto space-y-3">
          <div className="flex justify-between text-lg">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-foreground">{formatPrice(total)}</span>
          </div>
          
          {currentStep === 1 ? (
            <Button
              onClick={() => setCurrentStep(2)}
              disabled={!isAddressValid()}
              className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground text-base font-semibold"
            >
              Continuar
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isPaymentValid() || isProcessing}
              className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground text-base font-semibold"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Finalizar Pedido'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}