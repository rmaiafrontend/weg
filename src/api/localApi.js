/**
 * API local: produtos e categorias do JSON estático,
 * carrinho e pedidos no localStorage.
 */

const CART_KEY = 'weg_cart';
const ORDERS_KEY = 'weg_orders';

let dataCache = null;

async function loadData() {
  if (dataCache) return dataCache;
  const res = await fetch('/data/products.json');
  if (!res.ok) throw new Error('Falha ao carregar produtos');
  dataCache = await res.json();
  return dataCache;
}

function getCart() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setCart(items) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch (_) {}
}

function getOrders() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setOrders(orders) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (_) {}
}

export const localApi = {
  Category: {
    list: async (sort) => {
      const { categories } = await loadData();
      const out = [...(categories || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      return Promise.resolve(out);
    },
    filter: async (query) => {
      const { categories } = await loadData();
      if (query.id) {
        const cat = (categories || []).find((c) => c.id === query.id);
        return Promise.resolve(cat ? [cat] : []);
      }
      return Promise.resolve([]);
    },
  },

  Product: {
    list: async (sort, limit = 100) => {
      const { products } = await loadData();
      let out = [...(products || [])];
      const desc = sort && String(sort).startsWith('-');
      const field = (sort && String(sort).replace(/^-/, '')) || 'created_date';
      out.sort((a, b) => {
        const va = a[field] || a.id || '';
        const vb = b[field] || b.id || '';
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return desc ? -cmp : cmp;
      });
      if (limit != null && limit > 0) out = out.slice(0, limit);
      return Promise.resolve(out);
    },
    filter: async (query) => {
      const { products } = await loadData();
      const list = products || [];
      if (query.id) {
        const p = list.find((x) => x.id === query.id);
        return Promise.resolve(p ? [p] : []);
      }
      if (query.category_id != null) {
        return Promise.resolve(list.filter((x) => x.category_id === query.category_id));
      }
      return Promise.resolve([]);
    },
  },

  CartItem: {
    list: async () => Promise.resolve(getCart()),

    create: async (body) => {
      const items = getCart();
      const id = crypto.randomUUID?.() || `cart-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const item = { id, product_id: body.product_id, quantity: body.quantity ?? 1 };
      items.push(item);
      setCart(items);
      return Promise.resolve(item);
    },

    update: async (id, body) => {
      const items = getCart();
      const i = items.findIndex((x) => x.id === id);
      if (i === -1) return Promise.resolve();
      if (body.quantity != null) items[i].quantity = body.quantity;
      setCart(items);
      return Promise.resolve();
    },

    delete: async (id) => {
      const items = getCart().filter((x) => x.id !== id);
      setCart(items);
      return Promise.resolve();
    },
  },

  Order: {
    list: async (sort) => {
      const orders = getOrders();
      const desc = sort && String(sort).startsWith('-');
      const out = [...orders].sort((a, b) => {
        const da = a.created_at || a.estimated_delivery || '';
        const db = b.created_at || b.estimated_delivery || '';
        const cmp = da < db ? -1 : da > db ? 1 : 0;
        return desc ? -cmp : cmp;
      });
      return Promise.resolve(out);
    },

    filter: async (query) => {
      const orders = getOrders();
      if (query.id != null) {
        const o = orders.find((x) => x.id === query.id);
        return Promise.resolve(o ? [o] : []);
      }
      if (query.order_number != null) {
        const o = orders.find((x) => x.order_number === query.order_number);
        return Promise.resolve(o ? [o] : []);
      }
      return Promise.resolve([]);
    },

    create: async (payload) => {
      const orders = getOrders();
      const id = crypto.randomUUID?.() || `ord-${Date.now()}`;
      const order_number = payload.order_number || `ORD-${Date.now()}`;
      const created_at = new Date().toISOString();
      const order = {
        id,
        order_number,
        created_at,
        ...payload,
      };
      orders.push(order);
      setOrders(orders);
      return Promise.resolve({ id, order_number, ...order });
    },

    update: async (id, body) => {
      const orders = getOrders();
      const i = orders.findIndex((x) => x.id === id);
      if (i === -1) return Promise.resolve();
      orders[i] = { ...orders[i], ...body };
      setOrders(orders);
      return Promise.resolve();
    },
  },
};
