/**
 * Cliente de API: backend local (JSON + localStorage).
 * Produtos e categorias em public/data/products.json; carrinho e pedidos em localStorage.
 */

import { localApi } from './localApi';

export const base44 = {
  entities: {
    Category: localApi.Category,
    Product: localApi.Product,
    CartItem: localApi.CartItem,
    Order: localApi.Order,
  },
  auth: {
    me: () => Promise.reject(Object.assign(new Error('Não autenticado'), { status: 401 })),
    logout: (redirectUrl) => {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem('app_access_token');
          window.localStorage.removeItem('access_token');
        } catch (_) {}
        if (redirectUrl) window.location.href = redirectUrl;
      }
    },
    redirectToLogin: () => {
      // No-op: evita loop de reload quando não há página de login (mock/local).
    },
  },
  appLogs: {
    logUserInApp: () => Promise.resolve(),
  },
};
