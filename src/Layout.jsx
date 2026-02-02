import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Splash page should not have any layout wrapper
  if (currentPageName === 'Splash') {
    return children;
  }

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        :root {
          --weg-blue: hsl(207, 100%, 35%);
          --weg-dark: hsl(240, 28%, 14%);
          --weg-gray-dark: #333333;
          --weg-gray-medium: #666666;
          --weg-gray-light: #F5F5F5;
          --weg-success: #10B981;
          --weg-error: #EF4444;
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }
        
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
      {children}
    </div>
  );
}