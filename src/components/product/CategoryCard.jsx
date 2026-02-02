import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Home, 
  ScanFace, 
  Camera, 
  Plug, 
  Shield, 
  Zap,
  ChevronRight 
} from 'lucide-react';

const iconMap = {
  'home-wifi': Home,
  'Home': Home,
  'scan-face': ScanFace,
  'ScanFace': ScanFace,
  'camera': Camera,
  'Camera': Camera,
  'plug': Plug,
  'Plug': Plug,
  'shield': Shield,
  'Shield': Shield,
  'zap': Zap,
  'Zap': Zap,
};

export default function CategoryCard({ category, productCount }) {
  const Icon = iconMap[category.icon] || Home;
  const isPromotion = category.is_promotion;

  return (
    <Link 
      to={createPageUrl(`Products?category=${category.id}`)}
      className={`block bg-white rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md ${
        isPromotion ? 'border-2 border-accent' : ''
      }`}
    >
      <div className="p-4 flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isPromotion 
            ? 'bg-gradient-to-br from-accent to-accent/90' 
            : 'bg-gradient-to-br from-primary to-primary/90'
        }`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-base font-medium text-foreground ${isPromotion ? 'text-accent' : ''}`}>
            {category.name}
          </h3>
          <p className="text-sm text-gray-500">
            {productCount || 0} produtos
          </p>
        </div>
        
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>
    </Link>
  );
}