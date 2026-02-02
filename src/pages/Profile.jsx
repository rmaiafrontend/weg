import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  User, 
  MapPin, 
  Bell, 
  FileText, 
  Shield, 
  MessageCircle, 
  HelpCircle,
  ChevronRight,
  LogOut,
  Edit2
} from 'lucide-react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

const menuSections = [
  {
    title: 'Conta',
    items: [
      { icon: User, label: 'Dados Pessoais', page: 'EditProfile' },
      { icon: MapPin, label: 'Endereços Salvos', page: 'Addresses' },
    ]
  },
  {
    title: 'Configurações',
    items: [
      { icon: Bell, label: 'Notificações', toggle: true },
    ]
  },
  {
    title: 'Legal',
    items: [
      { icon: FileText, label: 'Termos de Uso', external: true },
      { icon: Shield, label: 'Política de Privacidade', external: true },
    ]
  },
  {
    title: 'Suporte',
    items: [
      { icon: MessageCircle, label: 'Falar no WhatsApp', whatsapp: true },
      { icon: HelpCircle, label: 'FAQ', page: 'FAQ' },
    ]
  },
];

export default function Profile() {
  const [cartCount, setCartCount] = useState(0);
  const [notifications, setNotifications] = useState(true);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
  });

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart'],
    queryFn: () => base44.entities.CartItem.list(),
  });

  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(total);
  }, [cartItems]);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/5511999999999?text=Olá, preciso de ajuda com a WEGX', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Minha Conta" showCart cartCount={cartCount} />
      
      <main className="pt-14 max-w-lg mx-auto">
        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white m-4 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center text-white text-xl font-medium">
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-base font-medium text-gray-900">
                {user?.full_name || 'Usuário'}
              </h2>
              <p className="text-sm text-gray-500 font-light">{user?.email || ''}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit2 className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
            </Button>
          </div>
        </motion.div>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
            className="bg-white mx-4 mb-4 rounded-xl overflow-hidden"
          >
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider px-4 pt-3 pb-2">
              {section.title}
            </h3>
            
            <div>
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                
                if (item.toggle) {
                  return (
                    <div
                      key={item.label}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                        <span className="text-sm text-gray-900 font-normal">{item.label}</span>
                      </div>
                      <Switch 
                        checked={notifications} 
                        onCheckedChange={setNotifications}
                      />
                    </div>
                  );
                }

                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (item.whatsapp) handleWhatsApp();
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                      <span className="text-sm text-gray-900 font-normal">{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mx-4 mb-6"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full h-9 text-sm font-normal text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Sair da Conta
          </Button>
        </motion.div>

        {/* Version */}
        <p className="text-center text-xs text-gray-400 font-light mb-4">
          WEGX v1.0.0
        </p>
      </main>
      
      <BottomNav cartCount={cartCount} />
    </div>
  );
}